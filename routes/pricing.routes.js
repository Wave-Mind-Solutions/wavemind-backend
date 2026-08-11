/**
 * Pricing Routes – /api/pricing
 */
const express = require("express");
const router = express.Router();
const { getPricing, updatePricing } = require("../controllers/pricing.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// Public or Authenticated GET route
router.get("/", getPricing);

// Admin-only PUT route to modify baseline pricing rules
router.put("/", authMiddleware, roleMiddleware("admin"), updatePricing);

module.exports = router;
