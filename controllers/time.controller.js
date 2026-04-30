const TimeEntry = require("../models/TimeEntry.model");
const Task = require("../models/Task.model");

const logTime = async (req, res) => {
  const { taskId, hours, description, date, billable } = req.body;
  const task = await Task.findById(taskId).populate("projectId");
  if (!task) return res.status(404).json({ success: false, message: "Task not found" });

  const timeEntry = await TimeEntry.create({
    userId: req.user._id,
    taskId,
    projectId: task.projectId._id,
    hours,
    description,
    date: date || new Date(),
    billable: billable !== undefined ? billable : true,
  });

  res.status(201).json({ success: true, data: timeEntry });
};

const getMyTimeEntries = async (req, res) => {
  const entries = await TimeEntry.find({ userId: req.user._id })
    .populate("taskId", "title")
    .populate("projectId", "title")
    .sort({ date: -1 });
  res.status(200).json({ success: true, data: entries });
};

const approveTimeEntry = async (req, res) => {
  const { status } = req.body; // Approved or Rejected
  const entry = await TimeEntry.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!entry) return res.status(404).json({ success: false, message: "Entry not found" });
  res.status(200).json({ success: true, data: entry });
};

const getAllTimeEntries = async (req, res) => {
  const entries = await TimeEntry.find()
    .populate("userId", "fullName")
    .populate("taskId", "title")
    .populate("projectId", "title")
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: entries });
};

module.exports = { logTime, getMyTimeEntries, approveTimeEntry, getAllTimeEntries };
