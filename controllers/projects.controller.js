/**
 * Projects Controller
 * Standard REST Endpoints for Project Requests & Management
 *
 * Security:
 *   - Authentication enforced at route level
 *   - clientId is ALWAYS taken from req.user._id (never from req.body)
 *   - IDOR protection on all per-project endpoints
 *   - Input sanitized against XSS
 *   - Budget validated against centralized pricing matrix
 */
const Project = require("../models/Project.model");
const Requirement = require("../models/Requirement.model");
const PricingConfig = require("../models/PricingConfig.model");
const { validateBudget, OFFICIAL_WEBSITE_PRICING } = require("../config/pricing.config");

// ── Helper: sanitize strings to prevent XSS ──────────────────────────────
const sanitizeString = (str) => {
  if (typeof str !== "string") return str;
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
};

// ── Helper: load active pricing matrix (DB override or fallback to default)
const getActivePricingMatrix = async () => {
  try {
    const config = await PricingConfig.findOne({ isGlobal: true });
    if (config && config.matrix) return config.matrix;
  } catch (err) {
    console.warn("[PRICING DB WARN] Using default pricing baseline:", err.message);
  }
  return OFFICIAL_WEBSITE_PRICING;
};

// ── POST /api/projects ──────────────────────────────────────────────────────
const createProject = async (req, res) => {
  // SECURITY: clientId ALWAYS comes from authenticated JWT, never from body
  const userId = req.user._id;

  const {
    title,
    name,
    projectType,
    businessIndustry,
    projectGoal,
    requiredFeatures,
    designRequirement,
    budget,
    timeline,
    additionalServices,
    description,
    email,
    phone,
  } = req.body;

  // Build clean fields
  const cleanTitle = sanitizeString(title || projectType || "Custom Project Request");
  const cleanDescription = sanitizeString(description || "Project Requirement Request");
  const numBudget = Number(budget) || 0;

  // ── Budget validation against centralized pricing matrix ─────────────────
  const activeMatrix = await getActivePricingMatrix();
  const validation = validateBudget(projectType || "Business Website", numBudget, activeMatrix);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: validation.message,
      minRequired: validation.minRequired,
      categoryLabel: validation.category?.label,
    });
  }

  // ── Duplicate submission prevention (15-second idempotency window) ────────
  const fifteenSecondsAgo = new Date(Date.now() - 15000);
  const existingRecent = await Project.findOne({
    clientId: userId,
    title: cleanTitle,
    createdAt: { $gte: fifteenSecondsAgo },
  });

  if (existingRecent) {
    console.log(`[PROJECT IDEMPOTENT] Duplicate suppressed for User: ${req.user.email}`);
    return res.status(200).json({
      success: true,
      message: "Project request already submitted (idempotent response)",
      project: existingRecent,
    });
  }

  // ── Create Project in MongoDB ─────────────────────────────────────────────
  const project = await Project.create({
    clientId: userId,
    name: sanitizeString(name || req.user.fullName || ""),
    title: cleanTitle,
    projectType: sanitizeString(projectType || "Web Application"),
    businessIndustry: sanitizeString(businessIndustry || ""),
    projectGoal: sanitizeString(projectGoal || ""),
    requiredFeatures: Array.isArray(requiredFeatures)
      ? requiredFeatures.map(sanitizeString)
      : [],
    designRequirement: sanitizeString(designRequirement || "Custom Design"),
    budget: numBudget,
    timeline: sanitizeString(timeline || "Within 1 month"),
    additionalServices: Array.isArray(additionalServices)
      ? additionalServices.map(sanitizeString)
      : [],
    description: cleanDescription,
    email: sanitizeString(email || req.user.email || ""),
    phone: sanitizeString(phone || req.user.phone || ""),
    status: "In Review",   // ALWAYS set by backend — never trusted from client
    progress: 0,           // ALWAYS set by backend — never trusted from client
  });

  const cleanPhone = sanitizeString(phone || req.user.phone || "");

  // ── Also create a Requirement record for admin review queue compatibility
  Requirement.create({
    clientId: userId,
    title: cleanTitle,
    description: cleanDescription,
    budget: numBudget,
    priority: "Medium",
    techStack: Array.isArray(requiredFeatures) ? requiredFeatures : [],
    email: sanitizeString(email || req.user.email || ""),
    phone: cleanPhone,
    status: "Pending",
  }).catch((err) => console.warn("[DB] Requirement sync notice:", err.message));

  // ── Sync phone to User profile in MongoDB if present
  if (cleanPhone) {
    User.findByIdAndUpdate(userId, { phone: cleanPhone }).catch(() => {});
  }

  console.log(`[PROJECT CREATED] ID: ${project._id} | User: ${req.user.email} | Type: ${project.projectType}`);

  return res.status(201).json({
    success: true,
    message: "Project request submitted successfully",
    project: {
      _id: project._id,
      id: project._id,
      clientId: project.clientId,
      name: project.name,
      title: project.title,
      projectType: project.projectType,
      businessIndustry: project.businessIndustry,
      projectGoal: project.projectGoal,
      requiredFeatures: project.requiredFeatures,
      designRequirement: project.designRequirement,
      budget: project.budget,
      timeline: project.timeline,
      additionalServices: project.additionalServices,
      description: project.description,
      status: project.status,
      progress: project.progress,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
  });
};

// ── GET /api/projects/stats ─────────────────────────────────────────────────
// IMPORTANT: must be registered BEFORE GET /api/projects/:id in routes
const getProjectStats = async (req, res) => {
  const user = req.user;

  // Build filter based on role
  let matchFilter = {};
  if (user.role === "client") {
    matchFilter.clientId = user._id;
  } else if (user.role === "developer") {
    matchFilter.assignedTeam = user._id;
  }
  // Admin: no filter = all projects

  const [statusCounts, budgetAgg] = await Promise.all([
    Project.aggregate([
      { $match: matchFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Project.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalBudget: { $sum: "$budget" },
          totalProjects: { $sum: 1 },
        },
      },
    ]),
  ]);

  const statusMap = {};
  for (const s of statusCounts) statusMap[s._id] = s.count;

  const totals = budgetAgg[0] || { totalBudget: 0, totalProjects: 0 };

  return res.status(200).json({
    success: true,
    stats: {
      totalProjects: totals.totalProjects,
      totalBudget: totals.totalBudget,
      inReview: statusMap["In Review"] || 0,
      approved: statusMap["Approved"] || 0,
      inProgress: statusMap["In Progress"] || 0,
      onHold: statusMap["On Hold"] || 0,
      completed: statusMap["Completed"] || 0,
      rejected: statusMap["Rejected"] || 0,
      activeProjects: (statusMap["In Review"] || 0) + (statusMap["Approved"] || 0) + (statusMap["In Progress"] || 0),
    },
  });
};

// ── GET /api/projects ────────────────────────────────────────────────────────
const getProjects = async (req, res) => {
  const user = req.user;
  let filter = {};

  if (user.role === "client") {
    // Clients ONLY see their own projects — strict IDOR protection
    filter.clientId = user._id;
  } else if (user.role === "developer") {
    // Developers see only projects assigned to them
    filter.assignedTeam = user._id;
  }
  // Admin: no filter — sees all projects
  // Optional status filter for non-client roles
  if (user.role !== "client" && req.query.status) {
    filter.status = req.query.status;
  }

  const projects = await Project.find(filter)
    .populate("clientId", "fullName email avatar")
    .populate("assignedTeam", "fullName email developerType avatar")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    count: projects.length,
    projects,
    data: projects,
  });
};

// ── GET /api/projects/:id ────────────────────────────────────────────────────
const getProjectById = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const project = await Project.findById(id)
    .populate("clientId", "fullName email avatar phone")
    .populate("assignedTeam", "fullName email developerType avatar");

  if (!project) {
    return res.status(404).json({
      success: false,
      message: "Project not found.",
    });
  }

  // IDOR Protection: Client can only view their own project
  if (
    user.role === "client" &&
    project.clientId._id.toString() !== user._id.toString()
  ) {
    console.warn(
      `[UNAUTHORIZED ACCESS] User ${user.email} tried accessing project ${id}`
    );
    return res.status(403).json({
      success: false,
      message: "Access denied. You do not have permission to view this project.",
    });
  }

  // Developer can only view their assigned projects
  if (user.role === "developer") {
    const isAssigned = project.assignedTeam.some(
      (dev) => (dev._id || dev).toString() === user._id.toString()
    );
    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not assigned to this project.",
      });
    }
  }

  return res.status(200).json({
    success: true,
    project,
    data: project,
  });
};

// ── PUT /api/projects/:id ────────────────────────────────────────────────────
const updateProject = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const project = await Project.findById(id);
  if (!project) {
    return res.status(404).json({
      success: false,
      message: "Project not found.",
    });
  }

  // IDOR & Authorization Protection
  if (user.role === "client") {
    if (project.clientId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not own this project.",
      });
    }

    if (project.status !== "In Review") {
      return res.status(403).json({
        success: false,
        message: "Project is already in progress and cannot be edited directly. Contact support.",
      });
    }

    // CLIENT field whitelist — cannot modify status, progress, assignedTeam, adminNotes
    const { title, description, budget, timeline, requiredFeatures, businessIndustry, designRequirement } = req.body;

    if (budget !== undefined) {
      const newBudget = Number(budget) || project.budget;
      const validation = validateBudget(project.projectType || "Business Website", newBudget);
      if (!validation.isValid) {
        return res.status(400).json({ success: false, message: validation.message });
      }
      project.budget = newBudget;
    }
    if (title) project.title = sanitizeString(title);
    if (description) project.description = sanitizeString(description);
    if (timeline) project.timeline = sanitizeString(timeline);
    if (businessIndustry) project.businessIndustry = sanitizeString(businessIndustry);
    if (designRequirement) project.designRequirement = sanitizeString(designRequirement);
    if (Array.isArray(requiredFeatures)) {
      project.requiredFeatures = requiredFeatures.map(sanitizeString);
    }
  } else {
    // Admin / Developer: whitelisted set of fields only
    const adminAllowed = ["title", "description", "status", "progress", "budget", "timeline", "deadline", "assignedTeam", "adminNotes"];
    adminAllowed.forEach((field) => {
      if (req.body[field] !== undefined) project[field] = req.body[field];
    });

    // Business rules on status change
    if (req.body.status === "Completed") project.progress = 100;
    if (req.body.status === "In Review" && req.body.progress === undefined) project.progress = 0;
    if (typeof project.progress === "number") {
      project.progress = Math.min(100, Math.max(0, project.progress));
    }
  }

  await project.save();

  return res.status(200).json({
    success: true,
    message: "Project updated successfully",
    project,
    data: project,
  });
};

// ── DELETE /api/projects/:id ─────────────────────────────────────────────────
const deleteProject = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const project = await Project.findById(id);
  if (!project) {
    return res.status(404).json({ success: false, message: "Project not found." });
  }

  if (user.role === "client") {
    if (project.clientId.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    if (project.status !== "In Review") {
      return res.status(403).json({
        success: false,
        message: "Only 'In Review' projects can be deleted. Contact support for other changes.",
      });
    }
  }

  await project.deleteOne();

  return res.status(200).json({ success: true, message: "Project deleted successfully." });
};

// ── PATCH /api/projects/:id/status (Admin / Developer only) ─────────────────
const updateProjectStatus = async (req, res) => {
  const { id } = req.params;
  const { status, progress, adminNotes } = req.body;

  const validStatuses = ["In Review", "Approved", "In Progress", "On Hold", "Completed", "Rejected"];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    });
  }

  const project = await Project.findById(id);
  if (!project) {
    return res.status(404).json({ success: false, message: "Project not found." });
  }

  if (status) project.status = status;
  if (adminNotes) project.adminNotes = sanitizeString(adminNotes);

  // Auto-set progress based on status if not explicitly provided
  if (typeof progress === "number") {
    project.progress = Math.min(100, Math.max(0, progress));
  } else if (status === "Approved") {
    project.progress = 10;
  } else if (status === "Completed") {
    project.progress = 100;
  } else if (status === "In Review") {
    project.progress = 0;
  }

  await project.save();

  return res.status(200).json({
    success: true,
    message: "Project status updated successfully",
    project,
  });
};

module.exports = {
  createProject,
  getProjectStats,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  updateProjectStatus,
};
