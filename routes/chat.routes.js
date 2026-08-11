/**
 * Chat Routes – /api/chat
 * Handles both Peer-to-Peer messaging and AI Sales Assistant conversations
 */
const express = require("express");
const router = express.Router();

const {
  getConversations: getPeerConversations,
  sendMessage: sendPeerMessage,
  getMessages: getPeerMessages,
} = require("../controllers/chat.controller");

const {
  chatGuestMessage,
  createOrGetConversation,
  getUserConversations,
  getConversationById,
  appendMessage,
  deleteConversation,
} = require("../controllers/aiChat.controller");

const authMiddleware = require("../middleware/auth.middleware");
const { validate, messageSchema } = require("../middleware/validate.middleware");

// ── Public Unauthenticated Endpoint (Guest AI Chat Mode) ────────────────
// Stateless Gemini call. Zero MongoDB records created.
router.post("/guest/message", chatGuestMessage);

// ── Authenticated Endpoints ─────────────────────────────────────────────
router.use(authMiddleware);

// AI Sales Assistant Conversation APIs (MongoDB Persisted, IDOR Protected)
router.post("/conversations", createOrGetConversation);
router.get("/conversations", getUserConversations);
router.get("/conversations/:id", getConversationById);
router.post("/conversations/:id/messages", appendMessage);
router.delete("/conversations/:id", deleteConversation);

// Peer-to-Peer Direct Messaging APIs
router.get("/p2p/conversations", getPeerConversations);
router.post("/p2p/messages", validate(messageSchema), sendPeerMessage);
router.get("/p2p/messages/:conversationId", getPeerMessages);

module.exports = router;
