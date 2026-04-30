const mongoose = require("mongoose");

const experimentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: String,
    variants: [{
      name: String,
      percentage: Number, // 0-100
    }],
    isActive: { type: Boolean, default: false },
    featureFlag: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Experiment", experimentSchema);
