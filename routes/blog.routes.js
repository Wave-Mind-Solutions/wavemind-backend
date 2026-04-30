const express = require("express");
const router = express.Router();
const { getAllPosts, createPost } = require("../controllers/blog.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

router.get("/", getAllPosts);
router.post("/", authMiddleware, roleMiddleware("admin"), createPost);

module.exports = router;
