/**
 * Developer Controller
 * Task management and file deliverable uploads
 */
const Task = require("../models/Task.model");
const Deliverable = require("../models/Deliverable.model");
const Project = require("../models/Project.model");

// ── GET /api/dev/tasks ─────────────────────────────────────────────────────
const getMyTasks = async (req, res) => {
  const { status, priority } = req.query;
  const filter = { developerId: req.user._id };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const tasks = await Task.find(filter)
    .populate("projectId", "title status deadline")
    .sort({ deadline: 1 });

  res.status(200).json({ success: true, data: tasks });
};

// ── PATCH /api/dev/tasks/:id ───────────────────────────────────────────────
const updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const task = await Task.findOne({ _id: id, developerId: req.user._id });
  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found or you are not assigned to it.",
    });
  }

  task.status = status;
  await task.save();

  // Auto-update project progress based on completed tasks
  const allTasks = await Task.find({ projectId: task.projectId });
  const completed = allTasks.filter((t) => t.status === "Completed").length;
  const progress = Math.round((completed / allTasks.length) * 100);

  await Project.findByIdAndUpdate(task.projectId, { progress });

  res.status(200).json({
    success: true,
    message: "Task status updated.",
    data: task,
    projectProgress: progress,
  });
};

// ── POST /api/dev/deliverables ─────────────────────────────────────────────
const uploadDeliverable = async (req, res) => {
  const { taskId, projectId, fileType } = req.body;

  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file was uploaded." });
  }

  const deliverable = await Deliverable.create({
    taskId,
    projectId,
    fileName: req.file.originalname,
    fileUrl: req.file.path,         // Cloudinary secure URL
    publicId: req.file.filename,    // Cloudinary public_id
    fileType: fileType || "code",
    uploadedBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: "Deliverable uploaded successfully.",
    data: deliverable,
  });
};

// ── GET /api/dev/deliverables ──────────────────────────────────────────────
const getMyDeliverables = async (req, res) => {
  const deliverables = await Deliverable.find({ uploadedBy: req.user._id })
    .populate("taskId", "title")
    .populate("projectId", "title")
    .populate("uploadedBy", "fullName avatar")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: deliverables });
};

// ── GET /api/dev/projects ──────────────────────────────────────────────────
const getMyProjects = async (req, res) => {
  const projects = await Project.find({ assignedTeam: req.user._id })
    .populate("clientId", "fullName email avatar")
    .sort({ updatedAt: -1 });

  res.status(200).json({ success: true, data: projects });
};

module.exports = {
  getMyTasks,
  updateTaskStatus,
  uploadDeliverable,
  getMyDeliverables,
  getMyProjects,
};
