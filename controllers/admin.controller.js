/**
 * Admin Controller
 * Requirements review, project management, team assignment, stats
 *
 * Security: All routes require admin role (enforced at route level).
 * Field updates are whitelisted — no arbitrary field injection allowed.
 */
const Requirement = require("../models/Requirement.model");
const Project = require("../models/Project.model");
const User = require("../models/User.model");
const Task = require("../models/Task.model");
const Deliverable = require("../models/Deliverable.model");
const { getIO } = require("../sockets/socket");
const notificationService = require("../services/notification.service");

// ── GET /api/admin/requirements ────────────────────────────────────────────
const getAllRequirements = async (req, res) => {
  const { status, priority, page = 1, limit = 10 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const skip = (Number(page) - 1) * Number(limit);
  const [requirements, total] = await Promise.all([
    Requirement.find(filter)
      .populate("clientId", "fullName email phone avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Requirement.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    data: requirements,
  });
};

// ── POST /api/admin/projects/convert ──────────────────────────────────────
const convertRequirement = async (req, res) => {
  const { requirementId, title, description, deadline, budget } = req.body;

  const requirement = await Requirement.findById(requirementId);
  if (!requirement) {
    return res
      .status(404)
      .json({ success: false, message: "Requirement not found." });
  }

  if (requirement.status === "Converted") {
    return res.status(409).json({
      success: false,
      message: "This requirement has already been converted.",
    });
  }

  const project = await Project.create({
    clientId: requirement.clientId,
    requirementId,
    title: title || requirement.title,
    description: description || requirement.description,
    deadline,
    budget: budget || requirement.budget,
    email: requirement.email,
    phone: requirement.phone,
    status: "In Review",
    progress: 0,
  });

  // Mark requirement as converted
  requirement.status = "Converted";
  await requirement.save();

  // Notify the client in real-time
  const io = getIO();
  io.to(`user_${requirement.clientId}`).emit("project_created", {
    message: `Your requirement "${requirement.title}" has been converted to a project!`,
    project,
  });

  res.status(201).json({
    success: true,
    message: "Requirement converted to project.",
    data: project,
  });
};

// ── POST /api/admin/projects/assign ───────────────────────────────────────
const assignTeam = async (req, res) => {
  const { projectId, developerIds } = req.body;

  if (!projectId || !Array.isArray(developerIds) || developerIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "projectId and developerIds array are required.",
    });
  }

  const project = await Project.findByIdAndUpdate(
    projectId,
    { $addToSet: { assignedTeam: { $each: developerIds } } },
    { new: true }
  ).populate("assignedTeam", "fullName email developerType avatar");

  if (!project) {
    return res
      .status(404)
      .json({ success: false, message: "Project not found." });
  }

  // Notify each assigned developer
  const io = getIO();
  developerIds.forEach((devId) => {
    io.to(`user_${devId}`).emit("task_assigned", {
      message: `You have been assigned to project: ${project.title}`,
      projectId,
    });
  });

  res
    .status(200)
    .json({ success: true, message: "Team assigned successfully.", data: project });
};

// ── GET /api/admin/projects/stats ─────────────────────────────────────────
// IMPORTANT: This route MUST be registered BEFORE /api/admin/projects/:id
// to prevent Express from treating "stats" as a Mongo ObjectId
const getProjectStats = async (req, res) => {
  const [statusCounts, budgetAgg] = await Promise.all([
    Project.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Project.aggregate([
      { $group: { _id: null, totalBudget: { $sum: "$budget" }, totalProjects: { $sum: 1 } } },
    ]),
  ]);

  // Build a flat stats object from aggregation
  const statusMap = {};
  for (const s of statusCounts) {
    statusMap[s._id] = s.count;
  }

  const totals = budgetAgg[0] || { totalBudget: 0, totalProjects: 0 };

  res.status(200).json({
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
    },
  });
};

// ── GET /api/admin/projects ────────────────────────────────────────────────
const getAllProjects = async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate("clientId", "fullName email phone avatar")
      .populate("assignedTeam", "fullName email developerType avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Project.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, total, data: projects });
};

// ── GET /api/admin/projects/:id ───────────────────────────────────────────
const getProjectById = async (req, res) => {
  const { id } = req.params;

  const project = await Project.findById(id)
    .populate("clientId", "fullName email phone avatar createdAt")
    .populate("assignedTeam", "fullName email developerType avatar")
    .populate("requirementId", "title description priority techStack");

  if (!project) {
    return res.status(404).json({ success: false, message: "Project not found." });
  }

  res.status(200).json({ success: true, data: project });
};

// ── PATCH /api/admin/projects/:id ─────────────────────────────────────────
const updateProject = async (req, res) => {
  const { id } = req.params;

  // SECURITY: Strict field whitelist — admin cannot inject arbitrary fields
  const ADMIN_ALLOWED_FIELDS = [
    "status",
    "progress",
    "assignedTeam",
    "adminNotes",
    "timeline",
    "deadline",
    "title",
    "description",
  ];

  const safeUpdates = {};
  for (const field of ADMIN_ALLOWED_FIELDS) {
    if (req.body[field] !== undefined) {
      safeUpdates[field] = req.body[field];
    }
  }

  if (Object.keys(safeUpdates).length === 0) {
    return res.status(400).json({ success: false, message: "No valid fields to update." });
  }

  // Enforce business rules
  if (safeUpdates.status === "Completed") {
    safeUpdates.progress = 100;
  } else if (safeUpdates.status === "In Review") {
    // Don't force reset progress if admin explicitly provided one
    if (safeUpdates.progress === undefined) {
      safeUpdates.progress = 0;
    }
  }

  // Clamp progress to 0-100
  if (typeof safeUpdates.progress === "number") {
    safeUpdates.progress = Math.min(100, Math.max(0, safeUpdates.progress));
  }

  const project = await Project.findByIdAndUpdate(id, safeUpdates, {
    new: true,
    runValidators: true,
  })
    .populate("clientId", "fullName email phone")
    .populate("assignedTeam", "fullName email developerType");

  if (!project) {
    return res
      .status(404)
      .json({ success: false, message: "Project not found." });
  }

  // Notify the client about project update via Socket.io
  try {
    const io = getIO();
    io.to(`user_${project.clientId._id || project.clientId}`).emit("project_updated", {
      message: `Your project "${project.title}" has been updated to: ${project.status}`,
      project: {
        _id: project._id,
        status: project.status,
        progress: project.progress,
        adminNotes: project.adminNotes,
      },
    });

    // Notify assigned developers
    if (project.assignedTeam && project.assignedTeam.length > 0) {
      project.assignedTeam.forEach((dev) => {
        io.to(`user_${dev._id || dev}`).emit("project_updated", {
          message: `Project "${project.title}" updated to ${project.status}`,
        });
      });
    }
  } catch (socketErr) {
    // Socket notification is non-critical — don't fail the response
    console.warn("[SOCKET] Notification failed:", socketErr.message);
  }

  // Email notification if status changed
  if (safeUpdates.status) {
    try {
      notificationService.notifyProjectStatusUpdated({
        projectId: project._id,
        status: project.status,
      });
    } catch (notifErr) {
      console.warn("[NOTIFICATION] Email notification failed:", notifErr.message);
    }
  }

  res.status(200).json({ success: true, message: "Project updated successfully.", data: project });
};

// ── GET /api/admin/specialists ────────────────────────────────────────────
const getDevelopers = async (req, res) => {
  const { developerType } = req.query;
  const filter = { role: "developer" };
  if (developerType) filter.developerType = developerType;

  const developers = await User.find(filter).select(
    "fullName email avatar developerType createdAt"
  );

  res.status(200).json({ success: true, data: developers });
};

// ── POST /api/admin/tasks ──────────────────────────────────────────────────
const createTask = async (req, res) => {
  const { projectId, developerId, title, description, priority, deadline } =
    req.body;

  const task = await Task.create({
    projectId,
    developerId,
    title,
    description,
    priority,
    deadline,
  });

  const io = getIO();
  io.to(`user_${developerId}`).emit("task_assigned", {
    message: `New task assigned: "${title}"`,
    task,
  });

  // Trigger Email Notification for Task Assignment
  notificationService.notifyTaskAssigned({
    taskId: task._id,
    userId: developerId,
  });

  res
    .status(201)
    .json({ success: true, message: "Task created.", data: task });
};

// ── GET /api/admin/admins ─────────────────────────────────────────────────
const getAdmins = async (req, res) => {
  const admins = await User.find({ role: "admin" }).select(
    "fullName email avatar role"
  );
  res.status(200).json({ success: true, data: admins });
};

// ── GET /api/admin/clients ──────────────────────────────────────────────────
const getClients = async (req, res) => {
  const clients = await User.find({ role: "client" }).select(
    "fullName email avatar role createdAt"
  );
  res.status(200).json({ success: true, data: clients });
};

// ── GET /api/admin/deliverables ──────────────────────────────────────────
const getAllDeliverables = async (req, res) => {
  const deliverables = await Deliverable.find()
    .populate("projectId", "title")
    .populate("uploadedBy", "fullName email")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: deliverables });
};

module.exports = {
  getAllRequirements,
  convertRequirement,
  assignTeam,
  updateProject,
  getProjectStats,
  getAllProjects,
  getProjectById,
  createTask,
  getAdmins,
  getClients,
  getAllDeliverables,
  getDevelopers,
};
