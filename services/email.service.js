/**
 * Email Service using Resend API
 * Replaces Nodemailer SMTP with Resend for reliable email delivery
 */
const resend = require("../config/mailer");

/**
 * Test Resend API connection
 */
const testResendConnection = async () => {
  try {
    console.log("🔍 Testing Resend API Connection...");
    console.log(`API Key configured: ${!!process.env.RESEND_API_KEY}`);
    console.log(`Email From: ${process.env.EMAIL_FROM}`);
    
    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY not configured");
      return false;
    }
    
    console.log("✅ Resend API Configuration verified!");
    return true;
  } catch (err) {
    console.error("❌ Resend Connection Error!");
    console.error("Error:", err.message);
    return false;
  }
};

/**
 * Send a password reset email
 * @param {string} toEmail
 * @param {string} resetUrl
 */
const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  try {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #6c47ff; margin: 0;">🔐 Reset Your Password</h2>
        </div>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          You requested a password reset for your WaveMind Solutions account.
        </p>
        
        <p style="color: #555; font-size: 14px;">
          Click the button below to reset your password. This link is valid for <strong>15 minutes</strong>.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="display: inline-block; padding: 12px 30px; background: #6c47ff; color: white; 
                    text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #888; font-size: 13px; text-align: center;">
          If you didn't request this, you can safely ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #aaa; font-size: 12px; text-align: center;">
          © WaveMind Solutions. All rights reserved.
        </p>
      </div>
    `;

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: toEmail,
      subject: "🔐 Reset Your WaveMind Password",
      html: emailContent,
    });

    console.log(`✅ Password reset email sent to ${toEmail}:`, result.id);
    return result;
  } catch (err) {
    console.error(`❌ Failed to send password reset email to ${toEmail}:`);
    console.error("Error Code:", err.code);
    console.error("Error Message:", err.message);
    throw err;
  }
};

/**
 * Send a welcome email after registration
 * @param {string} toEmail
 * @param {string} fullName
 */
const sendWelcomeEmail = async (toEmail, fullName) => {
  try {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #6c47ff; margin: 0;">Welcome, ${fullName}! 🎉</h2>
        </div>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          We're thrilled to have you join <strong>WaveMind Solutions</strong>!
        </p>
        
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          Your account is all set. Log in to your dashboard to get started and explore all the amazing features we have for you.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/login"
             style="display: inline-block; padding: 12px 30px; background: #6c47ff; color: white; 
                    text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            Go to Dashboard
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #aaa; font-size: 12px; text-align: center;">
          © WaveMind Solutions. All rights reserved.
        </p>
      </div>
    `;

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: toEmail,
      subject: "🎉 Welcome to WaveMind Solutions!",
      html: emailContent,
    });

    console.log(`✅ Welcome email sent to ${toEmail}:`, result.id);
    return result;
  } catch (err) {
    console.error(`❌ Failed to send welcome email to ${toEmail}:`);
    console.error("Error Code:", err.code);
    console.error("Error Message:", err.message);
    throw err;
  }
};

/**
 * Send a project status update email
 * @param {string} toEmail
 * @param {string} projectName
 * @param {string} status
 */
const sendProjectStatusUpdateEmail = async (toEmail, projectName, status) => {
  try {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #6c47ff; margin: 0;">📊 Project Status Updated</h2>
        </div>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          The status of your project <strong>${projectName}</strong> has been updated.
        </p>
        
        <div style="background: #f7f7f7; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #888; font-size: 14px;">Current Status</p>
          <p style="margin: 10px 0 0 0; color: #6c47ff; font-size: 24px; font-weight: bold;">${status}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/dashboard"
             style="display: inline-block; padding: 12px 30px; background: #6c47ff; color: white; 
                    text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            View Project
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #aaa; font-size: 12px; text-align: center;">
          © WaveMind Solutions. All rights reserved.
        </p>
      </div>
    `;

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: toEmail,
      subject: `📊 Project Update: ${projectName}`,
      html: emailContent,
    });

    console.log(`✅ Project status email sent to ${toEmail}:`, result.id);
    return result;
  } catch (err) {
    console.error(`❌ Failed to send project status email to ${toEmail}:`);
    console.error("Error Code:", err.code);
    console.error("Error Message:", err.message);
    throw err;
  }
};

/**
 * Send a task assignment alert email
 * @param {string} toEmail
 * @param {string} taskTitle
 * @param {string} projectName
 */
const sendTaskAssignmentEmail = async (toEmail, taskTitle, projectName) => {
  try {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #6c47ff; margin: 0;">📋 New Task Assigned</h2>
        </div>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          You have been assigned a new task: <strong>${taskTitle}</strong>
        </p>
        
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          Project: <strong>${projectName}</strong>
        </p>
        
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          Please review the task details and start working on it.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/dashboard"
             style="display: inline-block; padding: 12px 30px; background: #6c47ff; color: white; 
                    text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            View Task
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #aaa; font-size: 12px; text-align: center;">
          © WaveMind Solutions. All rights reserved.
        </p>
      </div>
    `;

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: toEmail,
      subject: `📋 New Task: ${taskTitle}`,
      html: emailContent,
    });

    console.log(`✅ Task assignment email sent to ${toEmail}:`, result.id);
    return result;
  } catch (err) {
    console.error(`❌ Failed to send task assignment email to ${toEmail}:`);
    console.error("Error Code:", err.code);
    console.error("Error Message:", err.message);
    throw err;
  }
};

/**
 * Send a meeting reminder email
 * @param {string} toEmail
 * @param {string} meetingTitle
 * @param {string} time
 */
const sendMeetingReminderEmail = async (toEmail, meetingTitle, time) => {
  try {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #6c47ff; margin: 0;">⏰ Meeting Reminder</h2>
        </div>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          This is a reminder for your upcoming meeting:
        </p>
        
        <div style="background: #f7f7f7; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; color: #888; font-size: 14px;">Meeting Title</p>
          <p style="margin: 0 0 15px 0; color: #333; font-size: 18px; font-weight: bold;">${meetingTitle}</p>
          <p style="margin: 0 0 5px 0; color: #888; font-size: 14px;">Scheduled Time</p>
          <p style="margin: 0; color: #6c47ff; font-size: 16px; font-weight: bold;">${time}</p>
        </div>
        
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          Don't forget to join on time!
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #aaa; font-size: 12px; text-align: center;">
          © WaveMind Solutions. All rights reserved.
        </p>
      </div>
    `;

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: toEmail,
      subject: `⏰ Meeting Reminder: ${meetingTitle}`,
      html: emailContent,
    });

    console.log(`✅ Meeting reminder email sent to ${toEmail}:`, result.id);
    return result;
  } catch (err) {
    console.error(`❌ Failed to send meeting reminder email to ${toEmail}:`);
    console.error("Error Code:", err.code);
    console.error("Error Message:", err.message);
    throw err;
  }
};

/**
 * Send an OTP verification email
 * @param {string} toEmail
 * @param {string} otp
 */
const sendOTPEmail = async (toEmail, otp) => {
  try {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h2 style="color: #6c47ff; margin: 0;">🛡️ Verify Your Account</h2>
        </div>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6; text-align: center; margin: 0 0 30px 0;">
          Please use the following One-Time Password (OTP) to verify your account.
        </p>
        
        <div style="background: linear-gradient(135deg, #6c47ff 0%, #8b63ff 100%); padding: 40px; 
                    border-radius: 12px; text-align: center; margin: 40px 0;">
          <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 2px;">
            Your OTP Code
          </p>
          <div style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 8px; backdrop-filter: blur(10px);">
            <h1 style="font-size: 48px; font-weight: bold; color: white; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${otp}
            </h1>
          </div>
        </div>
        
        <p style="color: #666; font-size: 14px; line-height: 1.6; text-align: center; margin: 0 0 10px 0;">
          <strong>⏱️ This OTP will expire in 10 minutes</strong>
        </p>
        
        <p style="color: #999; font-size: 13px; text-align: center; margin: 0;">
          Do not share this code with anyone. WaveMind Solutions will never ask for your OTP.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />
        
        <p style="color: #aaa; font-size: 12px; text-align: center;">
          © WaveMind Solutions. All rights reserved.
        </p>
      </div>
    `;

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: toEmail,
      subject: "🛡️ Verify Your WaveMind Account",
      html: emailContent,
    });

    console.log(`✅ OTP email sent to ${toEmail}:`, result.id);
    return result;
  } catch (err) {
    console.error(`❌ Failed to send OTP email to ${toEmail}:`);
    console.error("Error Code:", err.code);
    console.error("Error Message:", err.message);
    throw err;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendProjectStatusUpdateEmail,
  sendTaskAssignmentEmail,
  sendMeetingReminderEmail,
  sendOTPEmail,
  testResendConnection,
};
