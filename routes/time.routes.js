const express = require("express");
const router = express.Router();
const { logTime, getMyTimeEntries, approveTimeEntry, getAllTimeEntries } = require("../controllers/time.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

router.post("/log", authMiddleware, logTime);
router.get("/my", authMiddleware, getMyTimeEntries);
router.get("/all", authMiddleware, roleMiddleware("admin"), getAllTimeEntries);
router.patch("/approve/:id", authMiddleware, roleMiddleware("admin"), approveTimeEntry);

module.exports = router;
