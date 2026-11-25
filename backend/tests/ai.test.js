const test = require("node:test");
const assert = require("node:assert");
const { sanitizeFilters, buildProductQuery, parseJson } = require("../services/aiService");

const info = { categories: ["Electronics", "Fashion", "Toys"], brands: ["Nike", "Sony", "boAt"] };

test("only known categories and sort values are accepted", () => {
  const f = sanitizeFilters({ category: "electronics", sortBy: "DROP TABLE" }, info);
  assert.strictEqual(f.category, "Electronics");
  assert.strictEqual(f.sortBy, "relevance");
  assert.strictEqual(sanitizeFilters({ category: "Weapons" }, info).category, undefined);
});

test("prices are numbers in range and min/max are put in order", () => {
  const f = sanitizeFilters({ minPrice: 500, maxPrice: 50 }, info);
  assert.deepStrictEqual([f.minPrice, f.maxPrice], [50, 500]);
  const bad = sanitizeFilters({ minPrice: "abc", maxPrice: -5 }, info);
  assert.strictEqual(bad.minPrice, undefined);
  assert.strictEqual(bad.maxPrice, undefined);
});

test("brand matches ignoring case, unknown brands become search words", () => {
  assert.strictEqual(sanitizeFilters({ brand: "SONY" }, info).brand, "Sony");
  const f = sanitizeFilters({ brand: "Acme", search: "speaker" }, info);
  assert.strictEqual(f.brand, undefined);
  assert.strictEqual(f.search, "speaker acme");
});

test("garbage from the model never throws", () => {
  assert.deepStrictEqual(sanitizeFilters(null, info), { sortBy: "relevance" });
  assert.deepStrictEqual(sanitizeFilters("hello", info), { sortBy: "relevance" });
  assert.ok(sanitizeFilters({ search: "x".repeat(500) }, info).search.length <= 60);
});

test("search words become an AND of escaped regexes (no regex injection)", () => {
  const q = buildProductQuery({ search: "c++ (shoes)", sortBy: "relevance" });
  assert.strictEqual(q.$and.length, 2);
  assert.ok(q.$and[0].$or[0].name.test("C++ Runner"));
  assert.ok(!q.$and[0].$or[0].name.test("Cxx"));
  assert.strictEqual(q.isActive, true);
  assert.deepStrictEqual(q.inventory, { $gt: 0 });
});

test("JSON from the model may arrive in code fences", () => {
  assert.deepStrictEqual(parseJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.throws(() => parseJson("not json"));
});
