/**
 * Admin Routes – /api/admin
 * All routes require authentication + admin role
 *
 * IMPORTANT: Static routes (e.g. /projects/stats, /projects/convert)
 * MUST be declared BEFORE parameterized routes (/projects/:id)
 * to prevent Express from matching "stats" as a MongoDB ObjectId.
 */
const express = require("express");
const router = express.Router();

const {
  getAllRequirements,
  convertRequirement,
  assignTeam,
  updateProject,
  getProjectStats,
  getAllProjects,
  getProjectById,
  createTask,
  getClients,
  getAllDeliverables,
  getDevelopers,
} = require("../controllers/admin.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// Apply auth + admin role to ALL admin routes
router.use(authMiddleware, roleMiddleware("admin"));

// ── Requirements ──────────────────────────────────────────────────────────
router.get("/requirements", getAllRequirements);

// ── Projects (static routes FIRST, then parameterized) ───────────────────
router.get("/projects/stats", getProjectStats);       // MUST be before /:id
router.post("/projects/convert", convertRequirement); // MUST be before /:id
router.post("/projects/assign", assignTeam);

router.get("/projects", getAllProjects);
router.get("/projects/:id", getProjectById);          // parameterized last
router.patch("/projects/:id", updateProject);

// ── Team & Tasks ──────────────────────────────────────────────────────────
router.get("/specialists", getDevelopers);
router.get("/clients", getClients);
router.post("/tasks", createTask);

// ── Deliverables ──────────────────────────────────────────────────────────
router.get("/deliverables", getAllDeliverables);

module.exports = router;
