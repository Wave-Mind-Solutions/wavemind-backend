/**
 * WaveMind Solutions – Main Server Entry Point
 * Initialises Express, connects MongoDB, attaches Socket.io
 */

require("dotenv").config();
require("express-async-errors"); // patches async route errors globally

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { initSocket } = require("./sockets/socket");

const PORT = process.env.PORT || 5000;

// ── Bootstrap ──────────────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();

  const httpServer = http.createServer(app);

  // Attach Socket.io
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(
      `\n🚀 WaveMind Server running in [${process.env.NODE_ENV}] mode on port ${PORT}\n`
    );
  });
};

startServer().catch((err) => {
  console.error("❌ Failed to start server:", err.message);
  process.exit(1);
});
