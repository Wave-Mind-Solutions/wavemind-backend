/**
 * Client Routes – /api/client
 * All routes require authentication + client role
 */
const express = require("express");
const router = express.Router();

const {
  submitRequirement,
  getMyRequirements,
  getMyProjects,
  getPayments,
} = require("../controllers/client.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const {
  validate,
  requirementSchema,
} = require("../middleware/validate.middleware");

router.use(authMiddleware, roleMiddleware("client"));

router.post("/requirements", validate(requirementSchema), submitRequirement);
router.get("/requirements", getMyRequirements);
router.get("/projects", getMyProjects);
router.get("/payments", getPayments);

module.exports = router;
