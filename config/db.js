/**
 * MongoDB connection using Mongoose
 *
 * ✅ Compatible with:
 *   - Local MongoDB  (mongodb://127.0.0.1:27017/...)
 *   - MongoDB Atlas  (mongodb+srv://...)
 *   - Vercel Serverless functions (connection caching via `cached`)
 *
 * No deprecated options needed for Mongoose v7+.
 */
const mongoose = require("mongoose");

// ── Connection cache (critical for Vercel / serverless cold-starts) ──────────
// Each serverless invocation may spin up a new Node process. Caching the
// promise ensures we reuse an open connection instead of opening a new one.
let cached = global._mongooseCache;

if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
  // Already connected – return immediately (handles hot reloads & serverless)
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error(
      "MONGO_URI is not defined. " +
        "Add it to server/.env for local dev, " +
        "or to Vercel Environment Variables for production."
    );
  }

  if (!cached.promise) {
    // Mongoose v7+ – NO deprecated options (useNewUrlParser / useUnifiedTopology removed)
    cached.promise = mongoose.connect(uri, {
      dbName: "wavemind",          // explicit db name (safe to keep even if db is in URI)
      serverSelectionTimeoutMS: 10000, // fail fast if Atlas is unreachable (10 s)
      socketTimeoutMS: 45000,          // close sockets after 45 s of inactivity
      maxPoolSize: 10,                 // maintain up to 10 socket connections
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log(`✅ MongoDB connected: ${cached.conn.connection.host}`);
  } catch (error) {
    // Reset promise so the next call can retry
    cached.promise = null;
    console.error(`❌ MongoDB connection error: ${error.message}`);
    throw error; // let server.js decide whether to exit
  }

  return cached.conn;
};

module.exports = connectDB;
