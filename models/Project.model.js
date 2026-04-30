/**
 * Project Model
 * Created by admins from approved requirements
 */
const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requirementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requirement",
    },
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 5000,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Planning", "In Progress", "In Review", "Completed", "Paused"],
      default: "Planning",
    },
    assignedTeam: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Payment voucher references / IDs
    vouchers: {
      type: [String],
      default: [],
    },
    budget: {
      type: Number,
      default: 0,
    },
    email: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
