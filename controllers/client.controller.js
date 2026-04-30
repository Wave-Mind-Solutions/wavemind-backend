/**
 * Client Controller
 * Submit requirements, view projects, view payment vouchers
 */
const Requirement = require("../models/Requirement.model");
const Project = require("../models/Project.model");

// ── POST /api/client/requirements ─────────────────────────────────────────
const submitRequirement = async (req, res) => {
  const { title, description, budget, priority, techStack, email, phone } = req.body;

  const requirement = await Requirement.create({
    clientId: req.user._id,
    title,
    description,
    budget,
    priority: priority || "Medium",
    techStack: techStack || [],
    email,
    phone,
  });

  res.status(201).json({
    success: true,
    message:
      "Requirement submitted successfully. Our team will review it shortly.",
    data: requirement,
  });
};

// ── GET /api/client/requirements ──────────────────────────────────────────
const getMyRequirements = async (req, res) => {
  const requirements = await Requirement.find({ clientId: req.user._id }).sort({
    createdAt: -1,
  });
  res.status(200).json({ success: true, data: requirements });
};

// ── GET /api/client/projects ───────────────────────────────────────────────
const getMyProjects = async (req, res) => {
  const projects = await Project.find({ clientId: req.user._id })
    .populate("assignedTeam", "fullName email developerType avatar")
    .populate("requirementId", "title priority techStack")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: projects });
};

// ── GET /api/client/payments ───────────────────────────────────────────────
const getPayments = async (req, res) => {
  // Returns all projects with their voucher list
  const projects = await Project.find({ clientId: req.user._id }).select(
    "title vouchers budget status"
  );

  const paymentSummary = projects.map((p) => ({
    projectId: p._id,
    title: p.title,
    budget: p.budget,
    status: p.status,
    vouchers: p.vouchers,
    voucherCount: p.vouchers.length,
  }));

  res.status(200).json({ success: true, data: paymentSummary });
};

module.exports = {
  submitRequirement,
  getMyRequirements,
  getMyProjects,
  getPayments,
};
