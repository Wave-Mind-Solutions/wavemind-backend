/**
 * Auth Routes – /api/auth
 */
const express = require("express");
const router = express.Router();

const {
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
  verify2FALogin,
} = require("../controllers/auth.controller");
const { getAdmins } = require("../controllers/admin.controller");
const authMiddleware = require("../middleware/auth.middleware");
const {
  validate,
  registerSchema,
  loginSchema,
} = require("../middleware/validate.middleware");

// Public routes
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/verify-2fa-login", verify2FALogin);
router.post("/forgot-password", forgotPassword);

// Protected routes
router.get("/profile", authMiddleware, getProfile);
router.patch("/settings", authMiddleware, updateSettings);
router.get("/admins", authMiddleware, getAdmins);

// 2FA Routes
router.get("/2fa-setup", authMiddleware, setup2FA);
router.post("/2fa-verify", authMiddleware, verify2FA);
router.post("/2fa-enable", authMiddleware, enable2FA);

module.exports = router;
