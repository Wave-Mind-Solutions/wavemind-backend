/**
 * Admin Controller
 * Requirements review, project creation, team assignment, developer listing
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
      .populate("clientId", "fullName email avatar")
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

// ── PATCH /api/admin/projects/:id ─────────────────────────────────────────
const updateProject = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const project = await Project.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!project) {
    return res
      .status(404)
      .json({ success: false, message: "Project not found." });
  }

  // Notify the client about project update
  const io = getIO();
  io.to(`user_${project.clientId}`).emit("project_updated", {
    message: `Project "${project.title}" has been updated.`,
    project,
  });

  // Notify assigned developers
  project.assignedTeam.forEach((devId) => {
    io.to(`user_${devId}`).emit("project_updated", {
      message: `Project "${project.title}" status changed to ${project.status}.`,
    });
  });

  // Trigger Email Notification for Status Update
  if (updates.status) {
    notificationService.notifyProjectStatusUpdated({
      projectId: project._id,
      status: project.status,
    });
  }

  res.status(200).json({ success: true, data: project });
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

// ── GET /api/admin/projects ────────────────────────────────────────────────
const getAllProjects = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate("clientId", "fullName email")
      .populate("assignedTeam", "fullName email developerType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Project.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, total, data: projects });
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
  getDevelopers,
  getAllProjects,
  createTask,
  getAdmins,
  getClients,
  getAllDeliverables,
};
