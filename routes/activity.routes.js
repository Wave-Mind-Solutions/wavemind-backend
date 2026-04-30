const express = require("express");
const router = express.Router();
const { getAllLogs, getProjectTimeline } = require("../controllers/activity.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// Admin only: view all logs
router.get("/", authMiddleware, roleMiddleware("admin"), getAllLogs);

// Project specific timeline (accessible by involved parties)
router.get("/project/:projectId", authMiddleware, getProjectTimeline);

module.exports = router;
