/**
 * AI Routes
 * POST /api/ai/analyze-project
 */
const express = require("express");
const router = express.Router();
const { analyzeProject } = require("../controllers/ai.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Require user authentication for AI estimations to protect API limits
router.post("/analyze-project", authMiddleware, analyzeProject);

module.exports = router;
