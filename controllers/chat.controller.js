/**
 * Chat Controller
 * Conversations and message management
 */
const Message = require("../models/Message.model");
const User = require("../models/User.model");
const { getIO } = require("../sockets/socket");

/**
 * Helper: build a deterministic conversationId from two user IDs
 * so the same two users always get the same conversation thread
 */
const buildConversationId = (idA, idB) =>
  [idA.toString(), idB.toString()].sort().join("_");

// ── GET /api/chat/conversations ────────────────────────────────────────────
const getConversations = async (req, res) => {
  const userId = req.user._id;

  // Find all unique conversations involving this user
  const messages = await Message.aggregate([
    {
      $match: {
        $or: [{ senderId: userId }, { receiverId: userId }],
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$conversationId",
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ["$receiverId", userId] }, { $eq: ["$isRead", false] }] },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { "lastMessage.createdAt": -1 } },
  ]);

  // Populate the other participant's info
  const populatedConversations = await Promise.all(
    messages.map(async (conv) => {
      const otherId =
        conv.lastMessage.senderId.toString() === userId.toString()
          ? conv.lastMessage.receiverId
          : conv.lastMessage.senderId;

      const otherUser = await User.findById(otherId).select(
        "fullName email avatar role"
      );
      return {
        conversationId: conv._id,
        lastMessage: conv.lastMessage.content,
        lastMessageAt: conv.lastMessage.createdAt,
        unreadCount: conv.unreadCount,
        participant: otherUser,
      };
    })
  );

  res.status(200).json({ success: true, data: populatedConversations });
};

// ── POST /api/chat/messages ────────────────────────────────────────────────
const sendMessage = async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user._id;

  // Validate receiver exists
  const receiverExists = await User.findById(receiverId);
  if (!receiverExists) {
    return res
      .status(404)
      .json({ success: false, message: "Receiver not found." });
  }

  const conversationId = buildConversationId(senderId, receiverId);

  const message = await Message.create({
    conversationId,
    senderId,
    receiverId,
    content,
  });

  await message.populate("senderId", "fullName avatar");

  // Emit to receiver via Socket.io
  const io = getIO();
  io.to(`user_${receiverId}`).emit("new_message", {
    message,
    conversationId,
  });

  res
    .status(201)
    .json({ success: true, message: "Message sent.", data: message });
};

// ── GET /api/chat/messages/:conversationId ────────────────────────────────
const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;
  const { page = 1, limit = 50 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const messages = await Message.find({ conversationId })
    .populate("senderId", "fullName avatar")
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(Number(limit));

  // Mark unread messages as read
  await Message.updateMany(
    { conversationId, receiverId: userId, isRead: false },
    { isRead: true }
  );

  res.status(200).json({ success: true, data: messages });
};

module.exports = { getConversations, sendMessage, getMessages };
