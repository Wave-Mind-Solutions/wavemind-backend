const express = require("express");
const router = express.Router();
const { exportProjectsCSV, downloadProjectPDF } = require("../controllers/export.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

router.get("/projects/csv", authMiddleware, roleMiddleware("admin"), exportProjectsCSV);
router.get("/project/:id/pdf", authMiddleware, downloadProjectPDF);

module.exports = router;
