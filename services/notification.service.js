const cron = require("node-cron");
const appEventEmitter = require("../utils/eventEmitter");
const emailService = require("./email.service");
const User = require("../models/User.model");
const Project = require("../models/Project.model");
const Task = require("../models/Task.model");

/**
 * Notification Service
 * Handles event-driven notifications and scheduled tasks
 */

// --- Event Listeners ---

// Listen for Welcome Email event
appEventEmitter.on("user:registered", async ({ email, fullName }) => {
  try {
    await emailService.sendWelcomeEmail(email, fullName);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending welcome email to ${email}:`, error);
  }
});

// Listen for Project Status Update event
appEventEmitter.on("project:statusUpdated", async ({ projectId, status }) => {
  try {
    const project = await Project.findById(projectId).populate("client");
    if (project && project.client && project.client.email) {
      const client = project.client;
      // Respect user settings
      if (client.notificationSettings?.projectUpdates === false) {
        console.log(`Notification skipped: User ${client.email} disabled project updates.`);
        return;
      }

      await emailService.sendProjectStatusUpdateEmail(
        client.email,
        project.title,
        status
      );
      console.log(`Status update email sent for project ${project.title}`);
    }
  } catch (error) {
    console.error("Error sending project status update email:", error);
  }
});

// Listen for Task Assignment event
appEventEmitter.on("task:assigned", async ({ taskId, userId }) => {
  try {
    const task = await Task.findById(taskId).populate("projectId");
    const user = await User.findById(userId);
    
    if (task && user && user.email) {
      // Respect user settings
      if (user.notificationSettings?.taskAssignments === false) {
        console.log(`Notification skipped: User ${user.email} disabled task alerts.`);
        return;
      }

      await emailService.sendTaskAssignmentEmail(
        user.email,
        task.title,
        task.projectId.title
      );
      console.log(`Task assignment email sent to ${user.email}`);
    }
  } catch (error) {
    console.error("Error sending task assignment email:", error);
  }
});

// --- Scheduled Jobs (Job Queue) ---

// Cron job to send meeting reminders (runs every hour for demo purposes)
// In a real app, this would check for meetings happening in the next hour
cron.schedule("0 * * * *", async () => {
  console.log("Running scheduled meeting reminders job...");
  // Logic to find upcoming meetings and send emails
  // For now, this is a placeholder for the enterprise feature
});

module.exports = {
  // Methods to trigger events manually if needed
  notifyUserRegistered: (userData) => appEventEmitter.emit("user:registered", userData),
  notifyProjectStatusUpdated: (data) => appEventEmitter.emit("project:statusUpdated", data),
  notifyTaskAssigned: (data) => appEventEmitter.emit("task:assigned", data),
};
