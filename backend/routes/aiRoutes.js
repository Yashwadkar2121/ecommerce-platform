const express = require("express");
const { assistant } = require("../controllers/aiController");
const { aiGuard } = require("../middleware/rateLimit");

const router = express.Router();

router.post("/assistant", aiGuard("chat"), assistant);

module.exports = router;
