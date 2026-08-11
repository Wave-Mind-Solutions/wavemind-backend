/**
 * Client Controller
 * Submit requirements, view projects, view payment vouchers
 */
const Requirement = require("../models/Requirement.model");
const Project = require("../models/Project.model");

const submitRequirement = async (req, res) => {
  const {
    title,
    name,
    projectType,
    businessIndustry,
    businessType,
    projectGoal,
    requiredFeatures,
    designRequirement,
    budget,
    timeline,
    additionalServices,
    description,
    priority,
    techStack,
    email,
    phone,
  } = req.body;

  if (!phone || !phone.trim() || phone.trim().length < 8) {
    return res.status(400).json({
      success: false,
      message: "A valid contact mobile number is required.",
    });
  }

  const numBudget = Number(budget) || 0;
  const cleanTitle = title || projectType || "Project Requirement Request";
  const cleanDescription = description || `Project Type: ${projectType || 'Web App'} | Budget: ₹${numBudget}`;

  const requirement = await Requirement.create({
    clientId: req.user._id,
    title: cleanTitle,
    description: cleanDescription,
    budget: numBudget,
    priority: priority || "Medium",
    techStack: Array.isArray(requiredFeatures) ? requiredFeatures : (techStack || []),
    email: email || req.user.email,
    phone: phone || req.user.phone,
    status: "Pending",
  });

  const cleanPhone = phone || req.user.phone || "";
  if (cleanPhone) {
    const User = require("../models/User.model");
    User.findByIdAndUpdate(req.user._id, { phone: cleanPhone }).catch(() => {});
  }

  // Also create Project record so it appears in Project Portfolio & Admin Dashboard
  const project = await Project.create({
    clientId: req.user._id,
    requirementId: requirement._id,
    name: name || req.user.fullName || "",
    title: cleanTitle,
    projectType: projectType || "Web Application",
    businessIndustry: businessIndustry || businessType || "",
    projectGoal: projectGoal || "",
    requiredFeatures: Array.isArray(requiredFeatures) ? requiredFeatures : [],
    designRequirement: designRequirement || "Custom Design",
    budget: numBudget,
    timeline: timeline || "Within 1 month",
    additionalServices: Array.isArray(additionalServices) ? additionalServices : [],
    description: cleanDescription,
    email: email || req.user.email,
    phone: phone || req.user.phone,
    status: "In Review",
    progress: 0,
  }).catch((err) => console.warn("[DB] Project auto-creation notice:", err.message));

  res.status(201).json({
    success: true,
    message: "Project request submitted successfully. Our team will review it shortly.",
    data: requirement,
    project: project || requirement,
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
