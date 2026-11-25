// backend/controllers/aiController.js
const aiService = require("../services/aiService");

const handleError = (res, error, fallback) => {
  if (error instanceof aiService.AIError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error(fallback, error);
  return res.status(500).json({ error: fallback });
};

// POST /api/ai/assistant  { message, history: [{ role, text }] }
const assistant = async (req, res) => {
  try {
    const { message, history } = req.body || {};
    if (typeof message !== "string" || message.trim().length === 0 || message.length > 300) {
      return res.status(400).json({ error: "Please send a message of up to 300 characters." });
    }
    const safeHistory = Array.isArray(history)
      ? history
          .filter((t) => t && typeof t.text === "string" && ["user", "assistant"].includes(t.role))
          .slice(-6)
      : [];

    res.json(await aiService.shoppingAssistant({ message, history: safeHistory }));
  } catch (error) {
    handleError(res, error, "The assistant could not answer right now.");
  }
};

// POST /api/admin/ai/description  { name, category, subcategory?, brand?, attributes? }
const description = async (req, res) => {
  try {
    const { name, category } = req.body || {};
    if (!name || !String(name).trim() || !category || !String(category).trim()) {
      return res.status(400).json({ error: "Enter a product name and category first." });
    }
    const text = await aiService.generateDescription(req.body);
    res.json({ description: text });
  } catch (error) {
    handleError(res, error, "Could not generate a description.");
  }
};

// GET /api/products/:productId/review-summary
const reviewSummary = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!/^[a-f\d]{24}$/i.test(productId)) {
      return res.status(400).json({ error: "Invalid product id" });
    }
    const summary = await aiService.summarizeReviews(productId);
    res.json({ summary }); // null when the product has fewer than 3 reviews
  } catch (error) {
    handleError(res, error, "Could not summarise the reviews.");
  }
};

module.exports = { assistant, description, reviewSummary };
