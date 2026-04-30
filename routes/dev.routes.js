/**
 * Developer Routes – /api/dev
 * All routes require authentication + developer role
 */
const express = require("express");
const router = express.Router();

const {
  getMyTasks,
  updateTaskStatus,
  uploadDeliverable,
  getMyDeliverables,
  getMyProjects,
} = require("../controllers/dev.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const {
  validate,
  taskUpdateSchema,
} = require("../middleware/validate.middleware");
const { upload } = require("../config/cloudinary");

router.use(authMiddleware, roleMiddleware("developer"));

router.get("/tasks", getMyTasks);
router.patch("/tasks/:id", validate(taskUpdateSchema), updateTaskStatus);

// File upload: single file, field name "file"
router.post(
  "/deliverables",
  upload.single("file"),
  uploadDeliverable
);
router.get("/deliverables", getMyDeliverables);
router.get("/projects", getMyProjects);

module.exports = router;
