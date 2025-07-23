const Product = require("../models/Product");

// CREATE
const createProduct = async (req, res) => {
  try {
    console.log("Creating product with data:", req.body);

    // Ensure salesCount is initialized from sold if not provided
    if (typeof req.body.sold === "number" && typeof req.body.salesCount !== "number") {
      req.body.salesCount = req.body.sold;
    }

    // Set default featured status if not provided
    if (typeof req.body.featured !== "boolean") {
      req.body.featured = false;
    }

    // Validate maximum featured products (optional)
    if (req.body.featured) {
      const featuredCount = await Product.countDocuments({ featured: true });
      if (featuredCount >= 10) { // Adjust limit as needed
        return res.status(400).json({ 
          message: "Maximum 10 featured products allowed" 
        });
      }
    }

    const product = new Product(req.body);
    await product.save();

    // Convert to plain JS object to ensure all fields serialize correctly
    const plainProduct = product.toObject();

    res.status(201).json({ message: "Product created", product: plainProduct });
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ message: err.message });
  }
};

// READ ALL
const getAllProducts = async (req, res) => {
  try {
    // Add featured filter if requested
    const filter = {};
    if (req.query.featured === "true") {
      filter.featured = true;
    }
    if (req.query.status === "true") {
      filter.status = true;
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET FEATURED PRODUCTS
const getFeaturedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const featuredProducts = await Product.find({ 
      featured: true,
      status: true 
    })
    .sort({ createdAt: -1 })
    .limit(limit);

    res.json(featuredProducts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// READ ONE
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    console.error("Error in getProductById:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE
const updateProduct = async (req, res) => {
  try {
    console.log("🛠 PATCH Request ID:", req.params.id);
    console.log("🔧 Payload:", req.body);

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      console.log("❌ Product not found for ID:", req.params.id);
      return res.status(404).json({ message: "Product not found" });
    }

    console.log("✅ Product updated:", updated);
    res.json(updated);
  } catch (error) {
    console.error("🚨 Update error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// TOGGLE FEATURED STATUS
const toggleFeatured = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if we're about to feature and limit is reached
    if (!product.featured) {
      const featuredCount = await Product.countDocuments({ featured: true });
      if (featuredCount >= 10) { // Adjust limit as needed
        return res.status(400).json({ 
          message: "Maximum 10 featured products allowed" 
        });
      }
    }

    product.featured = !product.featured;
    await product.save();

    res.json({
      message: `Product ${product.featured ? 'added to' : 'removed from'} featured`,
      product
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json({
      message: "Product deleted",
      deletedId: req.params.id
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
      error: "Failed to delete product. Please check the ID format."
    });
  }
};

// UPDATE SALES
const updateProductSales = async (req, res) => {
  try {
    const items = req.body.items; // [{ productId, quantity }]

    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            sold: item.quantity,
            salesCount: item.quantity,
            quantity: -item.quantity
          }
        }
      );
    }

    res.status(200).json({ message: "Sales updated successfully." });
  } catch (err) {
    console.error("Error updating sales:", err);
    res.status(500).json({ message: "Failed to update sales." });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getFeaturedProducts, // Add this
  getProductById,
  updateProduct,
  toggleFeatured, // Add this
  deleteProduct,
  updateProductSales,
};