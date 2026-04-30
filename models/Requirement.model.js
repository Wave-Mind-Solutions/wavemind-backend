/**
 * Requirement Model
 * Submitted by clients; reviewed and converted to Projects by admin
 */
const mongoose = require("mongoose");

const requirementSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Client ID is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: 5000,
    },
    budget: {
      type: Number,
      required: [true, "Budget is required"],
      min: 0,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Extreme"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "In Review", "Converted", "Rejected"],
      default: "Pending",
    },
    techStack: {
      type: [String],
      default: [],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    adminNotes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Requirement", requirementSchema);
