const express = require("express");
const router = express.Router();
const { submitFeedback, getProjectFeedback } = require("../controllers/feedback.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/submit", authMiddleware, submitFeedback);
router.get("/project/:projectId", getProjectFeedback);

module.exports = router;
