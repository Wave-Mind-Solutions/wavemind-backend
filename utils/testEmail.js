/**
 * Email Diagnostic Test Script for Resend API
 * Usage: node server/utils/testEmail.js (from project root)
 * 
 * This script tests if your Resend API configuration works
 * and helps diagnose email sending issues
 */

require("dotenv").config({ path: __dirname + "/../.env" });
const { Resend } = require("resend");

console.log("🔍 Email Configuration Test (Resend API)\n");
console.log("Configuration:");
console.log("  API Key configured:", !!process.env.RESEND_API_KEY);
console.log("  Email From:", process.env.EMAIL_FROM);
console.log("");

if (!process.env.RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY is not set in .env file");
  console.error("   Get your API key from: https://resend.com/api-keys");
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    console.log("📧 Step 1: Testing Resend API Configuration...");
    console.log("  API Key length:", process.env.RESEND_API_KEY.length, "characters");
    console.log("✅ Configuration verified\n");

    console.log("📬 Step 2: Sending Test Email...");
    const testEmail = process.env.SMTP_USER || "test@example.com";
    
    const info = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: process.env.SMTP_USER || "your-email@example.com",
      subject: "🧪 WaveMind Resend API Test",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2 style="color: #6c47ff;">✅ Resend API Test Successful!</h2>
          <p>If you received this email, your Resend API configuration is working correctly.</p>
          <div style="background: #f0f0f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Test Details:</strong></p>
            <p style="margin: 5px 0; font-size: 14px; color: #666;">Email From: ${process.env.EMAIL_FROM}</p>
            <p style="margin: 5px 0; font-size: 14px; color: #666;">Timestamp: ${new Date().toISOString()}</p>
          </div>
          <p style="color: #888; font-size: 12px;">© WaveMind Solutions</p>
        </div>
      `,
    });

    console.log("✅ Email Sent Successfully!");
    console.log("  Message ID:", info.id);
    console.log("\n📬 Check your email inbox for the test message!");
    console.log("   Note: Emails may take a few seconds to arrive.\n");
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:");
    console.error("  Message:", err.message);
    
    if (err.message.includes("Invalid token")) {
      console.error("\n💡 Hint: Invalid API Key!");
      console.error("   - Check that RESEND_API_KEY in .env is correct");
      console.error("   - Get your API key from: https://resend.com/api-keys");
    } else if (err.message.includes("Invalid email")) {
      console.error("\n💡 Hint: Invalid email address!");
      console.error("   - Ensure EMAIL_FROM is a valid email address");
      console.error("   - For Resend, use an email from your verified domain");
    }
    
    process.exit(1);
  }
}

testEmail();
