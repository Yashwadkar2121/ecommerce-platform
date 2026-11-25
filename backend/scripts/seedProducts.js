// backend/scripts/seedProducts.js
//
// Fills the database with demo products (with images and a few reviews) so you
// can see how the app behaves with a big catalogue.
//
// Run it from the backend folder:
//   npm run seed                              add 10,000 products
//   node scripts/seedProducts.js --count=5000 choose how many
//   npm run seed:reset                        first delete products from an earlier seed run
//
// Other options:
//   --reviews=300     how many products get sample reviews (default 300, 0 = none)
//   --skip-verify     do not check the image links before using them
//
// Seeded products are tagged "seed-data", so --reset never touches products you
// added yourself. The data comes from a fixed random seed, so every run
// produces the same products (only the "created" dates move with today). Prices are in US dollars.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });

const SEED_TAG = "seed-data";
const BATCH_SIZE = 1000;

// Demo images are Unsplash photos. The "w=600&q=70" parameters make Unsplash
// serve a small thumbnail instead of the multi-megabyte original - the biggest
// single win for page load speed. Before seeding, the links are checked and any
// photo that no longer exists is dropped (see verifyImagePools).
const IMAGE_PARAMS = "auto=format&fit=crop&w=600&q=70";

const IMAGE_IDS = {
  "Electronics": [
    "photo-1695048133142-1a20484d2569",
    "photo-1695048133025-c6c45ea7ac73",
    "photo-1610945265064-0e34e5519bbf",
    "photo-1610945264803-c22b62d2a7b3",
    "photo-1505740420928-5e560c06d30e",
    "photo-1484704849700-f032a568e944",
    "photo-1544244015-0df4b3ffc6b0",
    "photo-1496181133206-80ce9b88a853",
    "photo-1517336714731-489689fd1ca8",
  ],
  "Fashion": [
    "photo-1596755094514-f87e34085b2c",
    "photo-1593032464235-6d1e5d511b3c",
    "photo-1566174053879-31528523f8ae",
    "photo-1551028719-00167b16eac5",
    "photo-1542291026-7eec264c27ff",
    "photo-1549298916-b41d501d3772",
    "photo-1584917865442-de89df76afd3",
  ],
  "Home": [
    "photo-1593359677879-a4bb92f829d1",
    "photo-1591798454113-023d737c15b9",
    "photo-1584568694244-6b1d6c1537d5",
    "photo-1555041469-a586c61ea9bc",
    "photo-1505693416388-ac5ce068fe85",
    "photo-1581094794329-c8112a89af12",
  ],
  "Health": [
    "photo-1559757148-5c350d0d3c56",
    "photo-1556228578-9c360e1d8d34",
    "photo-1593095948071-474c5cc2989d",
    "photo-1599901860904-17e6ed7083a0",
    "photo-162179148a2b46d4c1e7b2f8b",
  ],
  "Books": [
    "photo-1544947950-fa07a98d237f",
    "photo-1589829085413-56de8ae18c73",
    "photo-1497636577773-f1231844b336",
    "photo-1592496431122-2349e0fbc666",
    "photo-1541961017774-22349e4a1262",
  ],
  "Sports": [
    "photo-1575361204480-aadea25e6e68",
    "photo-1622279457486-62dcc4a4314c",
    "photo-1626224583764-f87db24ac4ea",
    "photo-1599901860904-17e6ed7083a0",
  ],
  "Groceries": [
    "photo-1586201375761-83865001e31c",
    "photo-1533050487297-09b450131914",
    "photo-1587049352846-4a222e784d38",
    "photo-1623334044303-241021148842",
    "photo-1561047029-3000c68339ca",
  ],
  "Automotive": [
    "photo-1555212697-194d092e3b8f",
    "photo-1593941707882-a5bba5338fe2",
    "photo-1549399542-7e3f8b79c341",
    "photo-1629734710239-d70d61b5c5b5",
    "photo-1565689221354-d87f85d4aee2",
  ],
  "Entertainment": [
    "photo-1606144042614-b2417e99c4e3",
    "photo-1608043152269-423dbba4e7e1",
    "photo-1516035069371-29a1b244cc32",
    "photo-1563297007-0686b7003af7",
    "photo-1511671782779-c97d3d27a1d4",
  ],
  "Toys": [
    "photo-1587654780298-8c6d6b2c8b2a",
    "photo-1553452118-621e1f860f43",
    "photo-1593990965216-9c6a6c6b6b6b",
    "photo-1581094794329-c8112a89af12",
    "photo-1589244159943-4601a3f51c8c",
  ],
};

// category -> subcategory -> { nouns, brands }
const CATALOG = {
  Electronics: {
    price: [18, 1800],
    subs: {
      Smartphones: { nouns: ["Smartphone", "5G Smartphone", "Android Phone"], brands: ["Apple", "Samsung", "OnePlus", "Xiaomi", "Realme"] },
      Headphones: { nouns: ["Wireless Headphones", "Over-Ear Headphones", "Earbuds", "Neckband"], brands: ["Sony", "boAt", "JBL", "Bose", "Sennheiser"] },
      Tablets: { nouns: ["Tablet", "Android Tablet"], brands: ["Apple", "Samsung", "Lenovo", "Xiaomi"] },
      Laptops: { nouns: ["Laptop", "Gaming Laptop", "Ultrabook"], brands: ["HP", "Dell", "Lenovo", "Asus", "Apple"] },
      Smartwatches: { nouns: ["Smartwatch", "Fitness Band"], brands: ["Noise", "boAt", "Fire-Boltt", "Amazfit"] },
    },
  },
  Fashion: {
    price: [5, 300],
    subs: {
      "Men's Clothing": { nouns: ["T-Shirt", "Casual Shirt", "Jeans", "Chinos"], brands: ["Levi's", "H&M", "Zara", "Peter England", "Allen Solly"] },
      "Women's Clothing": { nouns: ["Kurti", "Dress", "Top", "Palazzo Set"], brands: ["Zara", "H&M", "W", "Biba", "Fabindia"] },
      Outerwear: { nouns: ["Jacket", "Hoodie", "Sweater"], brands: ["Zara", "H&M", "Puma", "The North Face"] },
      Footwear: { nouns: ["Running Shoes", "Sneakers", "Sandals", "Formal Shoes"], brands: ["Nike", "Adidas", "Puma", "Bata", "Skechers"] },
      Accessories: { nouns: ["Backpack", "Wallet", "Sunglasses", "Belt"], brands: ["Fossil", "Ray-Ban", "Wildcraft", "Gucci"] },
    },
  },
  Home: {
    price: [6, 1100],
    subs: {
      Furniture: { nouns: ["Sofa", "Study Table", "Bookshelf", "Office Chair"], brands: ["IKEA", "Wakefit", "Godrej Interio", "Nilkamal"] },
      Appliances: { nouns: ["Air Fryer", "Mixer Grinder", "Microwave Oven", "Water Purifier"], brands: ["Philips", "Preethi", "LG", "Prestige", "Bajaj"] },
      Kitchen: { nouns: ["Cookware Set", "Dinner Set", "Lunch Box"], brands: ["Prestige", "Milton", "Borosil", "Tupperware"] },
      Decor: { nouns: ["Wall Clock", "Table Lamp", "Photo Frame", "Cushion Cover"], brands: ["Philips", "Wipro", "Home Centre", "Urban Ladder"] },
      Bedding: { nouns: ["Bedsheet", "Comforter", "Pillow", "Mattress"], brands: ["Wakefit", "Sleepwell", "Bombay Dyeing", "Raymond"] },
    },
  },
  Health: {
    price: [3, 85],
    subs: {
      Monitoring: { nouns: ["Blood Pressure Monitor", "Digital Thermometer", "Pulse Oximeter", "Glucometer"], brands: ["Omron", "Dr Morepen", "Accu-Chek", "Beurer"] },
      Skincare: { nouns: ["Face Serum", "Moisturizer", "Sunscreen", "Face Wash"], brands: ["The Ordinary", "Cetaphil", "Minimalist", "Neutrogena", "Lakmé"] },
      Nutrition: { nouns: ["Whey Protein", "Multivitamin", "Omega-3 Capsules", "Protein Bar"], brands: ["MuscleBlaze", "HealthKart", "Optimum Nutrition", "Himalaya"] },
      Fitness: { nouns: ["Yoga Mat", "Resistance Bands", "Dumbbell Set", "Skipping Rope"], brands: ["Adidas", "Decathlon", "Cosco", "Boldfit"] },
      "Oral Care": { nouns: ["Electric Toothbrush", "Toothpaste", "Mouthwash", "Water Flosser"], brands: ["Oral-B", "Colgate", "Sensodyne", "Philips"] },
    },
  },
  Books: {
    price: [2, 48],
    subs: {
      "Self-Help": { nouns: ["Self-Help Book", "Habit Building Guide", "Productivity Handbook"], brands: ["Penguin", "HarperCollins", "Jaico", "Hay House"] },
      Finance: { nouns: ["Investing Guide", "Personal Finance Book", "Stock Market Handbook"], brands: ["Harriman House", "Penguin", "Wiley", "Jaico"] },
      Technology: { nouns: ["Programming Handbook", "Data Structures Guide", "Web Development Book", "AI Primer"], brands: ["O'Reilly", "Manning", "Packt", "Pearson"] },
      Fiction: { nouns: ["Novel", "Thriller", "Fantasy Novel", "Short Story Collection"], brands: ["Bloomsbury", "Penguin", "HarperCollins", "Rupa"] },
      Reference: { nouns: ["Atlas", "Encyclopedia", "Dictionary", "Almanac"], brands: ["National Geographic", "Oxford", "Collins", "DK"] },
    },
  },
  Sports: {
    price: [4, 180],
    subs: {
      Football: { nouns: ["Football", "Football Boots", "Goalkeeper Gloves"], brands: ["Nike", "Adidas", "Puma", "Nivia"] },
      Cricket: { nouns: ["Cricket Bat", "Cricket Ball Set", "Batting Gloves", "Cricket Kit Bag"], brands: ["SG", "SS", "MRF", "Kookaburra"] },
      Badminton: { nouns: ["Badminton Racket", "Shuttlecock Pack", "Badminton Shoes"], brands: ["Yonex", "Li-Ning", "Victor", "Cosco"] },
      Yoga: { nouns: ["Yoga Block", "Yoga Wheel", "Yoga Strap"], brands: ["Decathlon", "Boldfit", "Reebok", "Strauss"] },
      Tennis: { nouns: ["Tennis Racket", "Tennis Balls", "Grip Tape"], brands: ["Wilson", "Head", "Babolat", "Yonex"] },
    },
  },
  Groceries: {
    price: [1, 24],
    subs: {
      Grains: { nouns: ["Basmati Rice", "Whole Wheat Atta", "Quinoa", "Millet Flour"], brands: ["India Gate", "Aashirvaad", "Fortune", "Tata Sampann"] },
      Oils: { nouns: ["Olive Oil", "Sunflower Oil", "Mustard Oil", "Coconut Oil"], brands: ["Bertolli", "Fortune", "Saffola", "Dhara"] },
      Sweeteners: { nouns: ["Organic Honey", "Jaggery", "Brown Sugar", "Maple Syrup"], brands: ["Dabur", "Zandu", "Organic India", "Tata"] },
      Nuts: { nouns: ["Almonds", "Cashews", "Pistachios", "Walnuts"], brands: ["Wonderful", "Happilo", "Nutraj", "Tata Sampann"] },
      Beverages: { nouns: ["Green Tea", "Filter Coffee", "Masala Chai", "Cold Brew"], brands: ["Taj Mahal", "Tetley", "Nescafé", "Bru"] },
    },
  },
  Automotive: {
    price: [2, 120],
    subs: {
      Tyres: { nouns: ["Car Tyre", "Bike Tyre", "Tubeless Tyre"], brands: ["MRF", "CEAT", "Apollo", "Bridgestone"] },
      Batteries: { nouns: ["Car Battery", "Bike Battery", "Inverter Battery"], brands: ["Exide", "Amaron", "Luminous", "SF Sonic"] },
      Accessories: { nouns: ["Seat Cover", "Phone Holder", "Dash Camera", "Steering Cover"], brands: ["Autofy", "Bosch", "Michelin", "3M"] },
      Lubricants: { nouns: ["Engine Oil", "Gear Oil", "Brake Fluid"], brands: ["Castrol", "Shell", "Mobil", "Valvoline"] },
      Cleaning: { nouns: ["Car Shampoo", "Microfiber Cloth Set", "Dashboard Polish", "Tyre Shine"], brands: ["3M", "Turtle Wax", "Meguiar's", "Sonax"] },
    },
  },
  Entertainment: {
    price: [4, 720],
    subs: {
      Gaming: { nouns: ["Gaming Controller", "Gaming Headset", "Gaming Mouse", "Console"], brands: ["Sony", "Logitech", "Razer", "Microsoft"] },
      Audio: { nouns: ["Bluetooth Speaker", "Soundbar", "Home Theatre"], brands: ["JBL", "boAt", "Bose", "Marshall"] },
      Cameras: { nouns: ["Action Camera", "Mirrorless Camera", "Instant Camera"], brands: ["GoPro", "Canon", "Fujifilm", "Sony"] },
      Projectors: { nouns: ["Portable Projector", "Smart Projector"], brands: ["XGIMI", "Epson", "BenQ", "Wanbo"] },
      Karaoke: { nouns: ["Wireless Microphone", "Karaoke Speaker", "Condenser Mic"], brands: ["Boya", "Shure", "Rode", "Ahuja"] },
    },
  },
  Toys: {
    price: [3, 96],
    subs: {
      "Building Blocks": { nouns: ["Building Set", "Brick Box", "Castle Set"], brands: ["LEGO", "Mega Bloks", "Funskool", "Playmobil"] },
      "Remote Control": { nouns: ["RC Car", "RC Helicopter", "Stunt Drone"], brands: ["Hot Wheels", "Hubsan", "Maisto", "Syma"] },
      Dolls: { nouns: ["Fashion Doll", "Doll House", "Plush Toy"], brands: ["Barbie", "Funskool", "Mattel", "Disney"] },
      Educational: { nouns: ["Learning Tablet", "Alphabet Puzzle", "Science Kit"], brands: ["LeapFrog", "Skillmatics", "Kidzlet", "Fisher-Price"] },
      Puzzles: { nouns: ["Jigsaw Puzzle", "Brain Teaser", "Rubik's Cube"], brands: ["Ravensburger", "Funskool", "Cubelelo", "Mudpuddle"] },
    },
  },
};

const ADJECTIVES = ["Premium", "Classic", "Essential", "Ultra", "Smart", "Pro", "Eco", "Compact", "Deluxe", "Everyday", "Advanced", "Lite"];
const COLORS = ["Black", "White", "Blue", "Red", "Green", "Grey", "Silver", "Navy", "Beige", "Maroon"];
const WARRANTIES = ["No warranty", "6 Months", "1 Year", "2 Years"];
const BENEFITS = [
  "Built for everyday use.",
  "Crafted from quality materials.",
  "Designed for lasting performance.",
  "Great value for money.",
  "Trusted by thousands of customers.",
  "Easy to use and maintain.",
  "Lightweight and durable.",
  "Backed by manufacturer support.",
];

// Small, fast, seedable random number generator (same seed -> same catalogue)
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Price that looks like a real shop price in dollars (e.g. 0.99, 13.99, 249.99)
function shopPrice(raw) {
  const rounded = raw >= 100 ? Math.round(raw / 5) * 5 : Math.round(raw);
  return Math.max(0.99, Math.round((rounded - 0.01) * 100) / 100);
}

// Image pools hold Unsplash photo ids, or full URLs (used as a fallback)
const imageUrl = (entry) =>
  /^https?:\/\//.test(entry) ? entry : `https://images.unsplash.com/${entry}?${IMAGE_PARAMS}`;

function generateProducts(count, seed = 20260101, imagePools = IMAGE_IDS) {
  const rand = mulberry32(seed);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const categories = Object.keys(CATALOG);
  const now = Date.now();
  const TWO_YEARS = 730 * 24 * 60 * 60 * 1000;
  const products = [];

  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length]; // even split across categories
    const { price: [min, max], subs } = CATALOG[category];
    const subcategory = pick(Object.keys(subs));
    const { nouns, brands } = subs[subcategory];
    const brand = pick(brands);
    const noun = pick(nouns);

    const code =
      String.fromCharCode(65 + Math.floor(rand() * 26)) +
      String.fromCharCode(65 + Math.floor(rand() * 26)) +
      "-" +
      String(1000 + Math.floor(rand() * 9000));
    const name = `${brand} ${pick(ADJECTIVES)} ${noun} ${code}`;

    // log-uniform price: many cheap items, fewer expensive ones (like a real shop)
    const price = shopPrice(min * Math.pow(max / min, rand()));

    // two different images from the category's pool, resized to thumbnails
    const pool = imagePools[category];
    const first = Math.floor(rand() * pool.length);
    const second = pool.length > 1 ? (first + 1 + Math.floor(rand() * (pool.length - 1))) % pool.length : first;
    const images = [...new Set([first, second])].map((n) => imageUrl(pool[n]));

    const createdAt = new Date(now - Math.floor(rand() * TWO_YEARS));

    products.push({
      name,
      description: `${brand} ${noun} for ${subcategory.toLowerCase()}. ${pick(BENEFITS)} ${pick(BENEFITS)}`,
      price,
      category,
      subcategory,
      brand,
      images,
      inventory: rand() < 0.03 ? 0 : 5 + Math.floor(rand() * 296), // ~3% out of stock
      attributes: { color: pick(COLORS), warranty: pick(WARRANTIES), model: code },
      tags: [category.toLowerCase(), subcategory.toLowerCase(), brand.toLowerCase(), SEED_TAG],
      isActive: rand() < 0.98, // ~2% hidden, so the isActive filter is exercised
      ratings: {
        average: Math.round((3.2 + rand() * 1.8) * 10) / 10,
        count: Math.floor(Math.pow(rand(), 2) * 2000),
      },
      createdAt,
      updatedAt: createdAt,
      __v: 0,
    });
  }
  return products;
}

function parseArgs(argv) {
  const args = { count: 10000, reset: false, force: false, reviews: 300, verify: true };
  for (const arg of argv) {
    if (arg === "--reset") args.reset = true;
    else if (arg === "--force") args.force = true;
    else if (arg === "--skip-verify") args.verify = false;
    else if (arg.startsWith("--count=")) args.count = Number(arg.slice(8));
    else if (arg.startsWith("--reviews=")) args.reviews = Number(arg.slice(10));
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (!Number.isInteger(args.reviews) || args.reviews < 0) {
    throw new Error("--reviews must be a whole number (0 or more)");
  }
  if (!Number.isInteger(args.count) || args.count < 1 || args.count > 200000) {
    throw new Error("--count must be a whole number between 1 and 200000");
  }
  return args;
}


// ---------- sample reviews (so the AI review summary has something to read) ----------
const REVIEW_TEXT = {
  positive: [
    ["Great quality", "Really happy with this {noun}. Feels well made and works exactly as described."],
    ["Worth the money", "Good value for the price. I have been using it daily and it still looks new."],
    ["Fast delivery, nice product", "Arrived earlier than expected and well packed. The {noun} is better than I hoped."],
    ["Highly recommend", "Easy to use and very reliable. I would happily buy this again."],
    ["Exactly what I needed", "Does the job perfectly. Setup was simple and the finish looks premium."],
  ],
  neutral: [
    ["Decent but not perfect", "The {noun} is fine for the price, though the packaging could be better."],
    ["Okay overall", "Works as expected. Nothing special, but no major complaints either."],
    ["Average", "Good enough for occasional use. I expected slightly better build quality."],
  ],
  negative: [
    ["Not as expected", "The {noun} feels cheaper than the photos suggest and the finish wore out quickly."],
    ["Disappointed", "Stopped working the way it should after a couple of weeks. Support was slow to reply."],
    ["Too expensive for what it is", "Quality is average and the price is high compared to similar products."],
  ],
};

// products: [{ _id, name, createdAt }]. Returns { reviews, ratingUpdates }.
function generateReviews(products, seed = 20260102) {
  const rand = mulberry32(seed);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const now = Date.now();
  const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;
  const reviews = [];
  const ratingUpdates = [];

  for (const product of products) {
    const noun = product.name.split(" ").slice(-3, -1).join(" ").toLowerCase() || "product";
    const total = 3 + Math.floor(rand() * 4); // 3-6 reviews
    let sum = 0;

    for (let k = 0; k < total; k++) {
      const roll = rand();
      const mood = roll < 0.65 ? "positive" : roll < 0.85 ? "neutral" : "negative";
      const rating =
        mood === "positive" ? (rand() < 0.6 ? 5 : 4) : mood === "neutral" ? 3 : rand() < 0.5 ? 2 : 1;
      const [title, comment] = pick(REVIEW_TEXT[mood]);
      const createdAt = new Date(now - Math.floor(rand() * ONE_YEAR));
      sum += rating;
      reviews.push({
        productId: product._id,
        userId: 1000 + k, // demo reviewers, not real accounts
        rating,
        title,
        comment: comment.replace("{noun}", noun),
        isVerified: rand() < 0.7,
        createdAt,
        updatedAt: createdAt,
        __v: 0,
      });
    }
    ratingUpdates.push({
      updateOne: {
        filter: { _id: product._id },
        update: { $set: { "ratings.average": Math.round((sum / total) * 10) / 10, "ratings.count": total } },
      },
    });
  }
  return { reviews, ratingUpdates };
}

// ---------- image verification ----------
// Checks every demo photo (HTTP HEAD) and removes the ones that are gone, so
// the shop never shows broken images. A category with no working photo left
// falls back to generated placeholder photos.
async function verifyImagePools(pools) {
  const entries = [];
  for (const [category, ids] of Object.entries(pools)) {
    for (const id of ids) entries.push({ category, id });
  }

  let answered = 0;
  const results = new Map();
  const queue = [...entries];
  const worker = async () => {
    while (queue.length) {
      const { category, id } = queue.shift();
      try {
        const response = await fetch(imageUrl(id), { method: "HEAD", signal: AbortSignal.timeout(8000) });
        answered++;
        results.set(`${category}|${id}`, response.ok);
      } catch {
        results.set(`${category}|${id}`, null); // network problem, not a verdict
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));

  if (answered === 0) {
    console.warn("⚠️  Could not reach Unsplash to check the images - using them unchecked.");
    return pools;
  }

  const verified = {};
  let removed = 0;
  for (const [category, ids] of Object.entries(pools)) {
    const keep = ids.filter((id) => results.get(`${category}|${id}`) !== false);
    removed += ids.length - keep.length;
    verified[category] =
      keep.length > 0
        ? keep
        : Array.from({ length: 6 }, (_, n) => `https://picsum.photos/seed/${category.toLowerCase()}-${n}/600/600`);
  }
  console.log(`🖼️  Checked ${entries.length} images, removed ${removed} broken ones`);
  return verified;
}

// Cached product lists/categories live in Redis for minutes to an hour, so
// without this the new products would not show up straight away.
async function clearProductCache() {
  const { client, connectRedis } = require("../utils/redis");
  try {
    await Promise.race([
      connectRedis(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timed out")), 4000)),
    ]);
  } catch (error) {
    console.warn(`⚠️  Redis not reachable (${error.message}) - cache not cleared; cached lists expire on their own within an hour.`);
    return;
  }

  let removed = 0;
  // NOTE: "cart:*" is deliberately NOT cleared - those are your users' carts.
  for (const pattern of ["cache:*", "products:*", "product:*"]) {
    for await (const keys of client.scanIterator({ MATCH: pattern, COUNT: 500 })) {
      const list = Array.isArray(keys) ? keys : [keys];
      if (list.length > 0) {
        await client.del(list);
        removed += list.length;
      }
    }
  }
  console.log(`🧹 Cleared ${removed} cached product responses from Redis`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (process.env.NODE_ENV === "production" && !args.force) {
    throw new Error("NODE_ENV is production - refusing to add demo products. Use --force if you really mean it.");
  }

  const connectMongoDB = require("../config/mongodb");
  const Product = require("../models/mongodb/Product");
  const Review = require("../models/mongodb/Review");
  await connectMongoDB();

  if (args.reset) {
    const old = await Product.find({ tags: SEED_TAG }).select("_id").lean();
    const ids = old.map((p) => p._id);
    let removedReviews = 0;
    for (let i = 0; i < ids.length; i += 1000) {
      const { deletedCount } = await Review.deleteMany({ productId: { $in: ids.slice(i, i + 1000) } });
      removedReviews += deletedCount;
    }
    const { deletedCount } = await Product.deleteMany({ tags: SEED_TAG });
    console.log(`🗑️  Removed ${deletedCount} products and ${removedReviews} reviews from the previous seed run`);
  }

  const pools = args.verify ? await verifyImagePools(IMAGE_IDS) : IMAGE_IDS;

  console.log(`🌱 Generating ${args.count} products...`);
  const products = generateProducts(args.count, undefined, pools);

  const started = Date.now();
  let inserted = 0;
  const insertedIds = [];
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    // The raw collection is used on purpose: it is much faster than Mongoose
    // for bulk inserts and keeps the createdAt dates generated above.
    const result = await Product.collection.insertMany(batch, { ordered: false });
    batch.forEach((_, index) => insertedIds.push(result.insertedIds[index]));
    inserted += batch.length;
    console.log(`   inserted ${inserted}/${products.length}`);
  }
  console.log(`✅ Inserted ${inserted} products in ${((Date.now() - started) / 1000).toFixed(1)}s`);

  if (args.reviews > 0) {
    const reviewed = products
      .map((p, index) => ({ _id: insertedIds[index], name: p.name, isActive: p.isActive }))
      .filter((p) => p.isActive)
      .slice(0, args.reviews);
    const { reviews, ratingUpdates } = generateReviews(reviewed);
    await Review.collection.insertMany(reviews, { ordered: false });
    await Product.collection.bulkWrite(ratingUpdates, { ordered: false });
    console.log(`💬 Added ${reviews.length} sample reviews to ${reviewed.length} products`);
  }

  console.log("🔧 Making sure indexes exist (first run can take a few seconds)...");
  await Product.createIndexes();
  await Review.createIndexes();

  await clearProductCache();

  const total = await Product.countDocuments({ isActive: true });
  console.log(`📦 Active products in the database now: ${total}`);
}

module.exports = { generateProducts, generateReviews, parseArgs, shopPrice, SEED_TAG, IMAGE_IDS };

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Seeding failed:", error.message);
      process.exit(1);
    });
}
