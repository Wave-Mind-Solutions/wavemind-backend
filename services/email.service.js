/**
 * Email Service
 * Sends transactional emails via Nodemailer
 */
const transporter = require("../config/mailer");

/**
 * Send a password reset email
 * @param {string} toEmail
 * @param {string} resetUrl
 */
const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  const mailOptions = {
    from: `"WaveMind Solutions" <${process.env.EMAIL_FROM}>`,
    to: toEmail,
    subject: "Reset Your WaveMind Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #6c47ff;">WaveMind Solutions</h2>
        <p>You requested a password reset. Click the button below to reset your password.</p>
        <p>This link is valid for <strong>15 minutes</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;background:#6c47ff;
                  color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">
          Reset Password
        </a>
        <p>If you didn't request this, please ignore this email.</p>
        <hr/>
        <small style="color: #888;">WaveMind Solutions | support@wavemind.com</small>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send a welcome email after registration
 * @param {string} toEmail
 * @param {string} fullName
 */
const sendWelcomeEmail = async (toEmail, fullName) => {
  const mailOptions = {
    from: `"WaveMind Solutions" <${process.env.EMAIL_FROM}>`,
    to: toEmail,
    subject: "Welcome to WaveMind Solutions 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #6c47ff;">Welcome, ${fullName}!</h2>
        <p>We're thrilled to have you on board at <strong>WaveMind Solutions</strong>.</p>
        <p>Log in to your dashboard to get started.</p>
        <a href="${process.env.CLIENT_URL}/login"
           style="display:inline-block;padding:12px 24px;background:#6c47ff;
                  color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">
          Go to Dashboard
        </a>
        <hr/>
        <small style="color: #888;">WaveMind Solutions | support@wavemind.com</small>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send a project status update email
 * @param {string} toEmail
 * @param {string} projectName
 * @param {string} status
 */
const sendProjectStatusUpdateEmail = async (toEmail, projectName, status) => {
  const mailOptions = {
    from: `"WaveMind Solutions" <${process.env.EMAIL_FROM}>`,
    to: toEmail,
    subject: `Project Update: ${projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #6c47ff;">Project Status Updated</h2>
        <p>The status of your project <strong>${projectName}</strong> has been updated to: <strong>${status}</strong>.</p>
        <p>Log in to view the latest progress.</p>
        <a href="${process.env.CLIENT_URL}/dashboard"
           style="display:inline-block;padding:12px 24px;background:#6c47ff;
                  color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">
          View Project
        </a>
        <hr/>
        <small style="color: #888;">WaveMind Solutions | support@wavemind.com</small>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send a task assignment alert email
 * @param {string} toEmail
 * @param {string} taskTitle
 * @param {string} projectName
 */
const sendTaskAssignmentEmail = async (toEmail, taskTitle, projectName) => {
  const mailOptions = {
    from: `"WaveMind Solutions" <${process.env.EMAIL_FROM}>`,
    to: toEmail,
    subject: "New Task Assigned 📋",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #6c47ff;">New Task Assigned</h2>
        <p>You have been assigned a new task: <strong>${taskTitle}</strong> in project <strong>${projectName}</strong>.</p>
        <p>Please review the details and start working on it.</p>
        <a href="${process.env.CLIENT_URL}/dashboard"
           style="display:inline-block;padding:12px 24px;background:#6c47ff;
                  color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">
          View Task
        </a>
        <hr/>
        <small style="color: #888;">WaveMind Solutions | support@wavemind.com</small>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send a meeting reminder email
 * @param {string} toEmail
 * @param {string} meetingTitle
 * @param {string} time
 */
const sendMeetingReminderEmail = async (toEmail, meetingTitle, time) => {
  const mailOptions = {
    from: `"WaveMind Solutions" <${process.env.EMAIL_FROM}>`,
    to: toEmail,
    subject: "Meeting Reminder ⏰",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #6c47ff;">Upcoming Meeting Reminder</h2>
        <p>This is a reminder for your meeting: <strong>${meetingTitle}</strong>.</p>
        <p>Scheduled for: <strong>${time}</strong></p>
        <p>Don't forget to join on time!</p>
        <hr/>
        <small style="color: #888;">WaveMind Solutions | support@wavemind.com</small>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send an OTP verification email
 * @param {string} toEmail
 * @param {string} otp
 */
const sendOTPEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: `"WaveMind Solutions" <${process.env.EMAIL_FROM}>`,
    to: toEmail,
    subject: "Verify Your WaveMind Account 🛡️",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 20px;">
        <h2 style="color: #6c47ff; text-align: center;">Account Verification</h2>
        <p style="text-align: center; color: #555;">Please use the following One-Time Password (OTP) to verify your account.</p>
        <div style="background: #f7f7f7; padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0;">
          <h1 style="font-size: 40px; letter-spacing: 10px; color: #111; margin: 0;">${otp}</h1>
        </div>
        <p style="text-align: center; color: #888; font-size: 14px;">This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
        <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 30px 0;" />
        <p style="text-align: center; color: #aaa; font-size: 12px;">WaveMind Solutions | support@wavemind.com</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendProjectStatusUpdateEmail,
  sendTaskAssignmentEmail,
  sendMeetingReminderEmail,
  sendOTPEmail,
};
