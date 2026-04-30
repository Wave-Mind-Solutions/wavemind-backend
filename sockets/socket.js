/**
 * Socket.io Initialisation & Event Handlers
 * Supports: real-time messaging, project updates, task notifications
 */
const { Server } = require("socket.io");

let io; // singleton

/**
 * Initialise Socket.io on the HTTP server
 * @param {import("http").Server} httpServer
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ── Join user's personal room ──────────────────────────────────────────
    // Frontend must emit this right after connecting with { userId }
    socket.on("join", ({ userId }) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`👤 User ${userId} joined room user_${userId}`);
      }
    });

    // ── Join a conversation room ───────────────────────────────────────────
    socket.on("join_conversation", ({ conversationId }) => {
      if (conversationId) {
        socket.join(`conv_${conversationId}`);
        console.log(`💬 Socket joined conversation: conv_${conversationId}`);
      }
    });

    // ── Leave a conversation room ──────────────────────────────────────────
    socket.on("leave_conversation", ({ conversationId }) => {
      socket.leave(`conv_${conversationId}`);
    });

    // ── Typing indicator ───────────────────────────────────────────────────
    socket.on("typing", ({ conversationId, userId }) => {
      socket.to(`conv_${conversationId}`).emit("user_typing", { userId });
    });

    socket.on("stop_typing", ({ conversationId, userId }) => {
      socket.to(`conv_${conversationId}`).emit("user_stop_typing", { userId });
    });

    // ── Disconnect ─────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Get the initialised Socket.io instance
 * Call this from controllers to emit events
 */
const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialised. Call initSocket() first.");
  }
  return io;
};

module.exports = { initSocket, getIO };
