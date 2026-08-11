/**
 * User Model
 * Roles: client | admin | developer
 */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // never returned in queries by default
    },
    role: {
      type: String,
      enum: ["client", "admin", "developer"],
      default: "client",
    },
    avatar: {
      type: String,
      default: "",
    },
    // Only relevant when role === 'developer'
    developerType: {
      type: String,
      enum: ["web", "app", "ai", "designer", ""],
      default: "",
    },
    // For password reset flow
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    isActive: {
      type: Boolean,
      default: true,
    },
    notificationSettings: {
      projectUpdates: { type: Boolean, default: true },
      taskAssignments: { type: Boolean, default: true },
      meetingReminders: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false },
    },
    theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
    twoFactorSecret: { type: String, select: false },
    isTwoFactorEnabled: { type: Boolean, default: false },
    // OTP Verification for Registration
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

// ── Hash password before save ──────────────────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method: compare passwords ────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Remove sensitive fields from JSON output ───────────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
