const Review = require("../models/Review");

exports.getReviewsByProductId = async (req, res) => {
  try {
    const { productId } = req.query; // ✅ fix here

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const reviews = await Review.find({ productId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};


exports.createReview = async (req, res) => {
  console.log("🔔 [POST /api/reviews] Request received!");
  console.log("📦 Payload:", req.body); // Log payload

  const { productId, productName, rating, comment, name, email } = req.body;

  if (!productId || !rating || !comment || !name || !email) {
    console.log("❌ Missing required fields");
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const review = new Review({
      productId,
      productName,
      rating,
      comment,
      name,
      email
    });

    const savedReview = await review.save();
    console.log("✅ Review saved:", savedReview); // Confirm save
    res.status(201).json(savedReview);
  } catch (err) {
    console.error("🔥 Error saving review:", err);
    res.status(500).json({ error: "Failed to submit review" });
  }
};
