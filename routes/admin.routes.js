/**
 * Admin Routes – /api/admin
 * All routes require authentication + admin role
 */
const express = require("express");
const router = express.Router();

const {
  getAllRequirements,
  convertRequirement,
  assignTeam,
  updateProject,
  getDevelopers,
  getAllProjects,
  createTask,
  getClients,
  getAllDeliverables,
} = require("../controllers/admin.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// Apply auth + admin role to all admin routes
router.use(authMiddleware, roleMiddleware("admin"));

router.get("/requirements", getAllRequirements);
router.get("/projects", getAllProjects);
router.post("/projects/convert", convertRequirement);
router.post("/projects/assign", assignTeam);
router.patch("/projects/:id", updateProject);
router.get("/specialists", getDevelopers);
router.get("/clients", getClients);
router.post("/tasks", createTask);
router.get("/deliverables", getAllDeliverables);

module.exports = router;
