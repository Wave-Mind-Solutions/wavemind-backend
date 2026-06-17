/**
 * WaveMind Solutions – Main Server Entry Point
 * Initialises Express, connects MongoDB, attaches Socket.io
 */

// ── Load environment variables FIRST (must be before all other requires) ────
require("dotenv").config({ path: __dirname + "/.env" });

// ── DNS Override (must be FIRST – before ALL other requires) ────────────────
// Forces Node.js to use Google/Cloudflare DNS so MongoDB Atlas SRV records
// resolve correctly even when the system/ISP DNS blocks them.
const dns = require("dns");
const { Resolver } = require("dns");
const resolver = new Resolver();
resolver.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
// ─────────────────────────────────────────────────────────────────────────────

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
