// routes/review.js
const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");

router.get("/", reviewController.getReviewsByProductId);
router.post("/", reviewController.createReview);

module.exports = router;
