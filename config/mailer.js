/**
 * Resend Email API Configuration
 * Replace Nodemailer with Resend for reliable email delivery on Render
 */
const { Resend } = require("resend");

if (!process.env.RESEND_API_KEY) {
  console.warn("⚠️ Warning: RESEND_API_KEY not set in environment variables");
}

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = resend;
