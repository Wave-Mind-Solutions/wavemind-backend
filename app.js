/**
 * WaveMind Solutions – Express App Configuration
 * Registers middleware, routes, and global error handler
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const helmet = require("helmet");
const { errorHandler } = require("./middleware/errorHandler");
const activityLogger = require("./middleware/activityLogger");

// ── Route imports ──────────────────────────────────────────────────────────
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const devRoutes = require("./routes/dev.routes");
const clientRoutes = require("./routes/client.routes");
const chatRoutes = require("./routes/chat.routes");
const activityRoutes = require("./routes/activity.routes");
const timeRoutes = require("./routes/time.routes");
const exportRoutes = require("./routes/export.routes");
const feedbackRoutes = require("./routes/feedback.routes");
const blogRoutes = require("./routes/blog.routes");
const leadRoutes = require("./routes/lead.routes");

const app = express();

// ── Global Middleware ──────────────────────────────────────────────────────
app.use(helmet()); // Security headers
app.use(compression()); // Gzip/Brotli compression

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" })); // Reduced limit for better performance
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(activityLogger);

// ── Health Check ───────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "WaveMind API" });
});

// ── API Routes ─────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dev", devRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/time", timeRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/lead", leadRoutes);

// ── 404 Fallback ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
