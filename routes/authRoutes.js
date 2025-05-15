const express = require("express");
const router = express.Router();
const { loginUser, changePassword, getMe } = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/isAdmin");

router.post("/login", loginUser);
router.post("/change-password", protect, changePassword);
router.get("/me", protect, getMe);

module.exports = router;
