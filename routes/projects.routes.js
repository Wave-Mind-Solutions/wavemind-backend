/**
 * Projects Routes – /api/projects
 * Fully authenticated & role-authorized REST API for Project Requests
 *
 * IMPORTANT: Static routes (/stats) MUST be declared BEFORE parameterized
 * routes (/:id) to prevent Express from treating "stats" as an ObjectId.
 */
const express = require("express");
const router = express.Router();
const {
  createProject,
  getProjectStats,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  updateProjectStatus,
} = require("../controllers/projects.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// All project routes require a valid JWT
router.use(authMiddleware);

// ── Static routes FIRST ──────────────────────────────────────────────────────
// GET /api/projects/stats — client/admin stats (role-filtered inside controller)
router.get("/stats", getProjectStats);

// ── Collection routes ────────────────────────────────────────────────────────
router.post("/", createProject);
router.get("/", getProjects);

// ── Parameterized routes LAST ────────────────────────────────────────────────
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

// Admin & Developer only — status/progress update
router.patch(
  "/:id/status",
  roleMiddleware("admin", "developer"),
  updateProjectStatus
);

module.exports = router;
