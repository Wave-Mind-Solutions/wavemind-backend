/**
 * Project Model
 * Created directly by clients from the requirement form or AI chatbot.
 * Source of truth: MongoDB. localStorage is NEVER the authority.
 */
const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Client ID is required"],
    },
    requirementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requirement",
    },
    // Client's submitted full name (from form, independent of user.fullName)
    name: {
      type: String,
      trim: true,
      default: "",
    },
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      maxlength: 200,
    },
    projectType: {
      type: String,
      default: "Web Application",
      trim: true,
    },
    businessIndustry: {
      type: String,
      default: "",
      trim: true,
    },
    projectGoal: {
      type: String,
      default: "",
      trim: true,
    },
    requiredFeatures: {
      type: [String],
      default: [],
    },
    designRequirement: {
      type: String,
      default: "Custom Design",
      trim: true,
    },
    budget: {
      type: Number,
      default: 0,
      min: [0, "Budget cannot be negative"],
    },
    timeline: {
      type: String,
      default: "Within 1 month",
      trim: true,
    },
    additionalServices: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      maxlength: 5000,
      default: "",
    },
    status: {
      type: String,
      enum: {
        values: ["In Review", "Approved", "In Progress", "On Hold", "Completed", "Rejected"],
        message: "Invalid status value",
      },
      default: "In Review",
    },
    progress: {
      type: Number,
      default: 0,
      min: [0, "Progress cannot be below 0"],
      max: [100, "Progress cannot exceed 100"],
    },
    assignedTeam: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    vouchers: {
      type: [String],
      default: [],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    adminNotes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// ── Indexes for performance ──────────────────────────────────────────────────
// clientId: used in every client dashboard query (most critical)
projectSchema.index({ clientId: 1, createdAt: -1 });
// status: used for admin filtering
projectSchema.index({ status: 1 });
// assignedTeam: used for developer dashboard queries
projectSchema.index({ assignedTeam: 1 });
// createdAt: used for admin sorting
projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Project", projectSchema);
