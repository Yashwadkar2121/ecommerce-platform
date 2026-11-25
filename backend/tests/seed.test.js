const test = require("node:test");
const assert = require("node:assert");
const { generateProducts, generateReviews, parseArgs, shopPrice, SEED_TAG } = require("../scripts/seedProducts");

const strip = ({ createdAt, updatedAt, ...rest }) => JSON.stringify(rest);

test("seed data is deterministic (apart from dates)", () => {
  const a = generateProducts(500);
  const b = generateProducts(500);
  assert.ok(a.every((p, i) => strip(p) === strip(b[i])));
});

test("every product is valid for the Product schema", () => {
  for (const p of generateProducts(2000)) {
    assert.ok(p.name.length >= 3 && p.description.length >= 10);
    assert.ok(p.price > 0 && Number.isFinite(p.price));
    assert.ok(p.images.length >= 1 && p.images.every((u) => u.startsWith("https://")));
    assert.ok(p.inventory >= 0 && Number.isInteger(p.inventory));
    assert.ok(p.tags.includes(SEED_TAG));
    assert.ok(typeof p.attributes.color === "string"); // Map of strings
  }
});

test("products are spread evenly over all categories", () => {
  const counts = {};
  generateProducts(1000).forEach((p) => (counts[p.category] = (counts[p.category] || 0) + 1));
  assert.strictEqual(Object.keys(counts).length, 10);
  assert.ok(Object.values(counts).every((n) => n === 100));
});

test("prices look like shop prices", () => {
  assert.strictEqual(shopPrice(14.3), 13.99);
  assert.strictEqual(shopPrice(0.4), 0.99);
  assert.strictEqual(shopPrice(1234), 1234.99); // rounds to the nearest $5, minus a cent
  assert.strictEqual(shopPrice(117.5), 119.99);
});

test("sample reviews: unique reviewer per product and ratings in range", () => {
  const products = generateProducts(50).map((p, i) => ({ _id: `p${i}`, name: p.name }));
  const { reviews, ratingUpdates } = generateReviews(products);
  assert.strictEqual(ratingUpdates.length, 50);
  const seen = new Set();
  for (const r of reviews) {
    assert.ok(r.rating >= 1 && r.rating <= 5);
    const key = `${r.productId}|${r.userId}`;
    assert.ok(!seen.has(key), "duplicate reviewer");
    seen.add(key);
  }
});

test("command line options", () => {
  assert.strictEqual(parseArgs([]).count, 10000);
  assert.strictEqual(parseArgs(["--count=50", "--reset"]).reset, true);
  assert.throws(() => parseArgs(["--count=0"]));
  assert.throws(() => parseArgs(["--nope"]));
});
