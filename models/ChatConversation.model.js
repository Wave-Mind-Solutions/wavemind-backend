/**
 * ChatConversation Model
 * Stores authenticated user chatbot conversations for WaveMind Sales Assistant
 */
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const chatConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "Sales Assistant Chat",
      trim: true,
    },
    messages: [messageSchema],
    metadata: {
      websiteType: { type: String, default: "" },
      businessType: { type: String, default: "" },
      budget: { type: String, default: "" },
      features: [{ type: String }],
      timeline: { type: String, default: "" },
      additionalServices: [{ type: String }],
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index for fast user conversation retrieval sorted by recency
chatConversationSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("ChatConversation", chatConversationSchema);
