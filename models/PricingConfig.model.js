/**
 * PricingConfig Model
 * Stores dynamic admin-managed website pricing baseline matrix
 */
const mongoose = require("mongoose");

const websiteCategorySchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  min: { type: Number, required: true, min: 0 },
  recommended: { type: Number, required: true, min: 0 },
  max: { type: Number, required: true, min: 0 },
  description: { type: String, default: "" }
});

const pricingConfigSchema = new mongoose.Schema(
  {
    isGlobal: { type: Boolean, default: true, unique: true },
    matrix: {
      business: websiteCategorySchema,
      ecommerce: websiteCategorySchema,
      portfolio: websiteCategorySchema,
      blog: websiteCategorySchema,
      education: websiteCategorySchema,
      booking: websiteCategorySchema,
      custom: websiteCategorySchema
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PricingConfig", pricingConfigSchema);
