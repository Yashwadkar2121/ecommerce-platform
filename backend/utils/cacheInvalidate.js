// backend/utils/cacheInvalidate.js
//
// Product pages are cached in Redis (5 minutes - 1 hour). When an admin adds,
// edits or deletes a product the cached lists must be dropped, otherwise the
// change would not show up for minutes. Carts ("cart:*") are never touched.
const { client } = require("./redis");

const PATTERNS = ["cache:*", "products:*", "product:*"];

const clearProductCache = async () => {
  if (!client.isOpen) return 0;

  let removed = 0;
  try {
    for (const pattern of PATTERNS) {
      for await (const keys of client.scanIterator({ MATCH: pattern, COUNT: 200 })) {
        const list = Array.isArray(keys) ? keys : [keys];
        if (list.length > 0) {
          await client.del(list);
          removed += list.length;
        }
      }
    }
  } catch (error) {
    // A cache problem must never make a product save fail
    console.error("Could not clear product cache:", error.message);
  }
  return removed;
};

module.exports = { clearProductCache };
