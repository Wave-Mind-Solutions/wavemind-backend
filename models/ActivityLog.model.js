const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actionType: {
      type: String,
      required: true,
      enum: [
        "CREATE",
        "UPDATE",
        "DELETE",
        "LOGIN",
        "LOGOUT",
        "ASSIGN",
        "STATUS_CHANGE",
        "COMMENT",
        "UPLOAD",
      ],
    },
    entityType: {
      type: String,
      required: true,
      enum: ["Project", "Task", "Requirement", "User", "Deliverable", "Auth"],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false, // Optional, e.g., for LOGIN action
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: Object, // For storing extra info like status from/to
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);
