const exportService = require("../services/export.service");
const Project = require("../models/Project.model");
const Task = require("../models/Task.model");

const exportProjectsCSV = async (req, res) => {
  const projects = await Project.find().populate("clientId", "fullName");
  const fields = ["title", "status", "deadline", "budget", "clientId.fullName"];
  const csv = exportService.generateCSV(projects, fields);
  
  res.header("Content-Type", "text/csv");
  res.attachment("projects_export.csv");
  res.send(csv);
};

const downloadProjectPDF = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: "Project not found" });

  res.header("Content-Type", "application/pdf");
  res.attachment(`${project.title}_Report.pdf`);
  exportService.generateProjectPDF(project, res);
};

module.exports = { exportProjectsCSV, downloadProjectPDF };
