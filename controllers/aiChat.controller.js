/**
 * AI Chat Controller
 * Manages Sales Assistant AI conversations:
 * - Guest mode: Stateless Gemini API proxy (0 MongoDB records)
 * - Authenticated mode: Stored in ChatConversation collection bound strictly to req.user._id
 */
const ChatConversation = require("../models/ChatConversation.model");
const aiService = require("../services/ai.service");

// ── POST /api/chat/guest/message ──────────────────────────────────────────
// Stateless Guest AI chat endpoint. Key stays on backend, ZERO MongoDB records created.
const chatGuestMessage = async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Messages array is required.",
    });
  }

  const aiReply = await aiService.generateSalesAssistantResponse(messages);

  return res.status(200).json({
    success: true,
    message: {
      role: "assistant",
      content: aiReply,
      timestamp: new Date(),
    },
  });
};

// ── POST /api/chat/conversations ──────────────────────────────────────────
// Create or fetch active AI Sales Conversation for authenticated user
const createOrGetConversation = async (req, res) => {
  const userId = req.user._id;
  const { title, metadata } = req.body || {};

  let conversation = await ChatConversation.findOne({
    userId,
    isArchived: false,
  }).sort({ updatedAt: -1 });

  if (!conversation) {
    conversation = await ChatConversation.create({
      userId,
      title: title || "Sales Assistant Chat",
      messages: [],
      metadata: metadata || {},
    });
  }

  return res.status(200).json({
    success: true,
    data: conversation,
  });
};

// ── GET /api/chat/conversations ───────────────────────────────────────────
// Get all AI Sales Conversations for authenticated user (IDOR Protected)
const getUserConversations = async (req, res) => {
  const userId = req.user._id;

  const conversations = await ChatConversation.find({ userId })
    .sort({ updatedAt: -1 })
    .lean();

  return res.status(200).json({
    success: true,
    count: conversations.length,
    data: conversations,
  });
};

// ── GET /api/chat/conversations/:id ──────────────────────────────────────
// Get single conversation by ID with strict IDOR protection
const getConversationById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const conversation = await ChatConversation.findById(id);

  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: "Conversation not found.",
    });
  }

  // IDOR Protection Check
  if (conversation.userId.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You can only view your own conversations.",
    });
  }

  return res.status(200).json({
    success: true,
    data: conversation,
  });
};

// ── POST /api/chat/conversations/:id/messages ────────────────────────────
// Append user message, generate AI response, save to MongoDB (IDOR Protected)
const appendMessage = async (req, res) => {
  const { id } = req.params;
  const { content, metadata } = req.body;
  const userId = req.user._id;

  if (!content || typeof content !== "string" || !content.trim()) {
    return res.status(400).json({
      success: false,
      message: "Message content is required.",
    });
  }

  const conversation = await ChatConversation.findById(id);

  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: "Conversation not found.",
    });
  }

  // IDOR Protection Check
  if (conversation.userId.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You can only modify your own conversation.",
    });
  }

  // Append User message
  const userMsg = {
    role: "user",
    content: content.trim(),
    timestamp: new Date(),
  };
  conversation.messages.push(userMsg);

  // Update metadata if provided
  if (metadata && typeof metadata === "object") {
    conversation.metadata = {
      ...conversation.metadata,
      ...metadata,
    };
  }

  // Generate AI Response using backend AI service
  const aiReply = await aiService.generateSalesAssistantResponse(
    conversation.messages
  );

  const assistantMsg = {
    role: "assistant",
    content: aiReply,
    timestamp: new Date(),
  };
  conversation.messages.push(assistantMsg);

  await conversation.save();

  return res.status(200).json({
    success: true,
    userMessage: userMsg,
    assistantMessage: assistantMsg,
    data: conversation,
  });
};

// ── DELETE /api/chat/conversations/:id ────────────────────────────────────
// Delete conversation by ID (IDOR Protected)
const deleteConversation = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const conversation = await ChatConversation.findById(id);

  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: "Conversation not found.",
    });
  }

  // IDOR Protection Check
  if (conversation.userId.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You can only delete your own conversations.",
    });
  }

  await conversation.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Conversation deleted successfully.",
  });
};

module.exports = {
  chatGuestMessage,
  createOrGetConversation,
  getUserConversations,
  getConversationById,
  appendMessage,
  deleteConversation,
};
