/**
 * Auth Controller
 * Handles register, login, forgot-password, profile
 */
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User.model");
const emailService = require("../services/email.service");
const notificationService = require("../services/notification.service");
const activityService = require("../services/activity.service");
const twoFactorService = require("../services/twoFactor.service");

// ── Helper: generate signed JWT ────────────────────────────────────────────
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// ── POST /api/auth/register ────────────────────────────────────────────────
const register = async (req, res) => {
  const { fullName, email, password, role, developerType } = req.body;

  // Prevent self-creating admin accounts via API
  if (role === "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin accounts cannot be self-registered.",
    });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res
      .status(409)
      .json({ success: false, message: "Email already in use." });
  }

  // Generate 6-digit OTP
  const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(rawOtp, 10);
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const user = await User.create({
    fullName,
    email,
    password,
    role: role || "client",
    developerType: developerType || "",
    isVerified: false,
    otp: hashedOtp,
    otpExpires,
  });

  // Send OTP Email
  try {
    console.log(`\n📧 OTP for ${user.email}: ${rawOtp}\n`);
    await emailService.sendOTPEmail(user.email, rawOtp);
  } catch (err) {
    console.error("OTP Email Error:", err);
  }

  res.status(201).json({
    success: true,
    message: "Registration successful. Please verify your email with the OTP sent.",
    email: user.email,
  });
};

// ── POST /api/auth/verify-otp ──────────────────────────────────────────────
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email }).select("+otp +otpExpires");
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  if (user.isVerified) {
    return res.status(400).json({ success: false, message: "Account already verified." });
  }

  if (new Date() > user.otpExpires) {
    return res.status(400).json({ success: false, message: "OTP has expired." });
  }

  const isMatch = await bcrypt.compare(otp, user.otp);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: "Invalid OTP code." });
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  // Record verification activity
  await activityService.recordActivity({
    userId: user._id,
    actionType: "UPDATE",
    entityType: "User",
    description: "Email verified successfully via OTP",
  });

  // Send Welcome Email
  notificationService.notifyUserRegistered({
    email: user.email,
    fullName: user.fullName,
  });

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: "Account verified successfully!",
    token,
    user,
  });
};

// ── POST /api/auth/resend-otp ──────────────────────────────────────────────
const resendOTP = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  if (user.isVerified) {
    return res.status(400).json({ success: false, message: "Account already verified." });
  }

  const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = await bcrypt.hash(rawOtp, 10);
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  try {
    await emailService.sendOTPEmail(user.email, rawOtp);
    res.status(200).json({ success: true, message: "New OTP sent to your email." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to send OTP." });
  }
};

// ── POST /api/auth/login ───────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  // Select password explicitly (it's hidden by default with `select: false`)
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password." });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password." });
  }

  if (!user.isActive) {
    return res
      .status(403)
      .json({ success: false, message: "Your account is deactivated." });
  }

  // Check if account is verified (Exclude admins from this check)
  if (!user.isVerified && user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Your account is not verified. Please verify your email.",
      requiresVerification: true,
      email: user.email,
    });
  }

  // Check if 2FA is enabled
  if (user.isTwoFactorEnabled) {
    return res.status(200).json({
      success: true,
      requires2FA: true,
      userId: user._id,
      message: "Two-factor authentication required."
    });
  }

  const token = generateToken(user._id);

  // Record Login Activity
  await activityService.recordActivity({
    userId: user._id,
    actionType: "LOGIN",
    entityType: "Auth",
    description: `User logged in from ${req.ip}`,
  });

  // Remove password from returned object
  user.password = undefined;

  res.status(200).json({ success: true, token, user });
};

// ── POST /api/auth/forgot-password ────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required." });
  }

  const user = await User.findOne({ email });
  // Always respond with success to prevent user enumeration
  if (!user) {
    return res.status(200).json({
      success: true,
      message:
        "If this email is registered, a reset link has been sent.",
    });
  }

  // Generate a secure random token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await emailService.sendPasswordResetEmail(user.email, resetUrl);
    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email.",
    });
  } catch {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    res
      .status(500)
      .json({ success: false, message: "Failed to send reset email." });
  }
};

// ── GET /api/auth/profile ───────────────────────────────────────────────────
const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }
  res.status(200).json({ success: true, user });
};

// ── PATCH /api/auth/settings ────────────────────────────────────────────────
const updateSettings = async (req, res) => {
  const { fullName, notificationSettings, avatar, theme } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  if (fullName) user.fullName = fullName;
  if (avatar) user.avatar = avatar;
  if (theme) user.theme = theme;
  if (notificationSettings) {
    user.notificationSettings = {
      ...user.notificationSettings,
      ...notificationSettings,
    };
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Settings updated successfully.",
    user,
  });
};

// ── 2FA Methods ────────────────────────────────────────────────────────────

const setup2FA = async (req, res) => {
  const secret = twoFactorService.generateSecret();
  const qrCode = await twoFactorService.generateQRCode(req.user.email, secret);

  const user = await User.findById(req.user._id);
  user.twoFactorSecret = secret;
  await user.save();

  res.status(200).json({ success: true, qrCode, secret });
};

const verify2FA = async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.user._id).select("+twoFactorSecret");

  const isVerified = twoFactorService.verifyToken(token, user.twoFactorSecret);
  if (!isVerified) {
    return res.status(400).json({ success: false, message: "Invalid 2FA token." });
  }

  res.status(200).json({ success: true, message: "2FA verified." });
};

const enable2FA = async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.user._id).select("+twoFactorSecret");

  const isVerified = twoFactorService.verifyToken(token, user.twoFactorSecret);
  if (!isVerified) {
    return res.status(400).json({ success: false, message: "Invalid token. Verification failed." });
  }

  user.isTwoFactorEnabled = true;
  await user.save();

  res.status(200).json({ success: true, message: "2FA enabled successfully.", user });
};

const verify2FALogin = async (req, res) => {
  const { userId, token } = req.body;
  
  const user = await User.findById(userId).select("+twoFactorSecret");
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  const isVerified = twoFactorService.verifyToken(token, user.twoFactorSecret);
  if (!isVerified) {
    return res.status(400).json({ success: false, message: "Invalid 2FA token." });
  }

  const jwtToken = generateToken(user._id);

  // Record Login Activity
  await activityService.recordActivity({
    userId: user._id,
    actionType: "LOGIN",
    entityType: "Auth",
    description: `User logged in with 2FA from ${req.ip}`,
  });

  user.password = undefined;
  user.twoFactorSecret = undefined;

  res.status(200).json({ success: true, token: jwtToken, user });
};

module.exports = { 
  register, 
  login, 
  verifyOTP,
  resendOTP,
  forgotPassword, 
  getProfile, 
  updateSettings,
  setup2FA,
  verify2FA,
  enable2FA,
  verify2FALogin
};
