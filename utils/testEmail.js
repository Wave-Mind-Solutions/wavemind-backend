/**
 * Email Diagnostic Test Script
 * Usage: node server/utils/testEmail.js (from project root)
 * 
 * This script tests if your SMTP configuration works
 * and helps diagnose email sending issues
 */

require("dotenv").config({ path: __dirname + "/../.env" });
const nodemailer = require("nodemailer");

console.log("🔍 Email Configuration Test\n");
console.log("Configuration:");
console.log("  SMTP Host:", process.env.SMTP_HOST);
console.log("  SMTP Port:", process.env.SMTP_PORT);
console.log("  SMTP User:", process.env.SMTP_USER);
console.log("  Email From:", process.env.EMAIL_FROM);
console.log("");

// Create transporter with same config as mailer.js
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10 * 60 * 1000,
  socketTimeout: 10 * 60 * 1000,
  pool: {
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function testEmail() {
  try {
    console.log("📡 Step 1: Testing SMTP Connection...");
    await transporter.verify();
    console.log("✅ SMTP Connection: OK\n");

    console.log("📧 Step 2: Sending Test Email...");
    const testEmail = process.env.SMTP_USER; // Send to same email
    const info = await transporter.sendMail({
      from: `"WaveMind Test" <${process.env.EMAIL_FROM}>`,
      to: testEmail,
      subject: "WaveMind SMTP Test 🧪",
      html: `
        <h2>SMTP Configuration Test</h2>
        <p>If you received this email, your SMTP setup is working correctly!</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `,
    });

    console.log("✅ Email Sent Successfully!");
    console.log("  Message ID:", info.messageId);
    console.log("  Response:", info.response);
    console.log("\n📬 Check your email for the test message!");
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:");
    console.error("  Code:", err.code);
    console.error("  Message:", err.message);
    console.error("  Response:", err.response);
    
    if (err.code === "EAUTH") {
      console.error("\n💡 Hint: SMTP authentication failed!");
      console.error("   - Check SMTP_USER and SMTP_PASS in .env");
      console.error("   - For Gmail, use an App Password (not regular password)");
      console.error("   - Enable 'Less secure app access' if using Gmail");
    } else if (err.code === "ECONNREFUSED") {
      console.error("\n💡 Hint: Connection refused!");
      console.error("   - Check if SMTP_HOST and SMTP_PORT are correct");
      console.error("   - Check your firewall/network settings");
    } else if (err.code === "ETIMEDOUT") {
      console.error("\n💡 Hint: Connection timeout!");
      console.error("   - Firewall may be blocking SMTP port");
      console.error("   - Try port 465 instead of 587");
    }
    
    process.exit(1);
  }
}

testEmail();
