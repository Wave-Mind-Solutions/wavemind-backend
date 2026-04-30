/**
 * Chat Routes – /api/chat
 * All routes require authentication; any role can chat
 */
const express = require("express");
const router = express.Router();

const {
  getConversations,
  sendMessage,
  getMessages,
} = require("../controllers/chat.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { validate, messageSchema } = require("../middleware/validate.middleware");

router.use(authMiddleware);

router.get("/conversations", getConversations);
router.post("/messages", validate(messageSchema), sendMessage);
router.get("/messages/:conversationId", getMessages);

module.exports = router;
