// routes/cartRoutes.js
const express = require("express");
const router = express.Router();
const { getCart, addToCart } = require("../controllers/cartController");
const protect = require("../middlewares/authMiddleware");

router.get("/", protect, getCart);
router.post("/", protect, addToCart);

module.exports = router;
