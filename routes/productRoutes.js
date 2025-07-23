const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductSales,
  getFeaturedProducts,  // Add the new controller
  toggleFeatured       // Add the new controller
} = require("../controllers/productController");

// Public routes
router.get("/", getAllProducts);
router.get("/featured", getFeaturedProducts);  // New featured products endpoint
router.get("/:id", getProductById);

// Protected routes (should add authentication middleware in production)
router.post("/sales", updateProductSales);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.patch("/:id/featured", toggleFeatured);  // New featured toggle endpoint
router.delete("/:id", deleteProduct);

module.exports = router;