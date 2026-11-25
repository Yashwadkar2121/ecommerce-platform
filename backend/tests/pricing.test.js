const test = require("node:test");
const assert = require("node:assert");
const { computeTotals, round2 } = require("../config/pricing");

test("tax and total are rounded to cents", () => {
  assert.deepStrictEqual(computeTotals(50), { subtotal: 50, tax: 5, shipping: 0, total: 55 });
  assert.deepStrictEqual(computeTotals(259.97), { subtotal: 259.97, tax: 26, shipping: 0, total: 285.97 });
});

test("floating point noise does not leak into prices", () => {
  assert.strictEqual(computeTotals(0.1 + 0.2).subtotal, 0.3);
  assert.strictEqual(round2(1.005 + 1.005), 2.01);
});
