/**
 * WaveMind Solutions – Main Server Entry Point
 * Initialises Express, connects MongoDB, attaches Socket.io
 */

// ── DNS Override (must be FIRST) ─────────────────────────────────────────────
// Forces Node.js to use Google/Cloudflare DNS instead of the system/ISP DNS
// which often blocks MongoDB Atlas SRV (_mongodb._tcp) lookups.
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
// ─────────────────────────────────────────────────────────────────────────────

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
  console.error("   ↳ Check your MONGO_URI in server/.env or Vercel env vars.");
  process.exit(1);
});
