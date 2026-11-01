// tax is calculated here, the frontend only shows an estimate
const TAX_RATE = Number(process.env.TAX_RATE ?? 0.1);

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const computeTotals = (subtotal) => {
  const sub = round2(subtotal);
  const tax = round2(sub * TAX_RATE);
  return { subtotal: sub, tax, shipping: 0, total: round2(sub + tax) };
};

module.exports = { TAX_RATE, computeTotals, round2 };
