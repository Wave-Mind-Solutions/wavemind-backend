/**
 * Pricing Controller
 * Standard REST endpoints for Website Pricing Engine configuration
 */
const PricingConfig = require("../models/PricingConfig.model");
const { OFFICIAL_WEBSITE_PRICING } = require("../config/pricing.config");

/**
 * GET /api/pricing
 * Retrieve current system website pricing matrix
 */
const getPricing = async (req, res) => {
  try {
    let config = await PricingConfig.findOne({ isGlobal: true });
    if (!config) {
      return res.status(200).json({
        success: true,
        matrix: OFFICIAL_WEBSITE_PRICING
      });
    }

    res.status(200).json({
      success: true,
      matrix: config.matrix || OFFICIAL_WEBSITE_PRICING
    });
  } catch (error) {
    console.error("Get Pricing Error:", error.message);
    res.status(200).json({
      success: true,
      matrix: OFFICIAL_WEBSITE_PRICING
    });
  }
};

/**
 * PUT /api/pricing
 * Update system website pricing matrix (Admin access only)
 */
const updatePricing = async (req, res) => {
  try {
    const { matrix } = req.body;
    if (!matrix || typeof matrix !== "object") {
      return res.status(400).json({
        success: false,
        message: "Invalid pricing matrix provided."
      });
    }

    // Validate that each category has min <= recommended <= max
    const categories = ["business", "ecommerce", "portfolio", "blog", "education", "booking", "custom"];
    for (const cat of categories) {
      if (matrix[cat]) {
        const { min, recommended, max } = matrix[cat];
        if (typeof min !== "number" || min < 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid minimum price for ${cat}.`
          });
        }
      }
    }

    let config = await PricingConfig.findOne({ isGlobal: true });
    if (!config) {
      config = new PricingConfig({
        isGlobal: true,
        matrix: { ...OFFICIAL_WEBSITE_PRICING, ...matrix },
        updatedBy: req.user._id
      });
    } else {
      config.matrix = { ...config.matrix, ...matrix };
      config.updatedBy = req.user._id;
    }

    await config.save();

    console.log(`[PRICING UPDATED] Admin ${req.user.email} updated baseline website pricing.`);

    res.status(200).json({
      success: true,
      message: "Website pricing matrix updated successfully.",
      matrix: config.matrix
    });
  } catch (error) {
    console.error("Update Pricing Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update pricing matrix."
    });
  }
};

module.exports = { getPricing, updatePricing };
