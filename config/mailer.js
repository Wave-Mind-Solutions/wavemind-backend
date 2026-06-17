/**
 * Nodemailer transporter configuration
 */
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10 * 60 * 1000, // 10 minutes
  socketTimeout: 10 * 60 * 1000,     // 10 minutes
  pool: {
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certs (Gmail compatibility)
  },
});

module.exports = transporter;
