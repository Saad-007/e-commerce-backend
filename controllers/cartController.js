const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");

// ✅ Get logged-in user's cart
exports.getCart = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      return res.status(403).json({ 
        message: "Admins cannot have shopping carts. Please use a customer account."
      });
    }

    const user = await User.findById(req.user.id).populate("cart.productId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ 
      cart: user.cart,
      userId: user._id
    });
  } catch (err) {
    console.error("Cart fetch error:", err);
    res.status(500).json({ message: "Failed to fetch cart" });
  }
};

// ✅ Add or update cart
exports.addToCart = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      return res.status(403).json({ 
        message: "Admin accounts cannot modify carts. Switch to a customer account."
      });
    }

    const { cart } = req.body;

    if (!Array.isArray(cart)) {
      return res.status(400).json({ message: "Invalid cart format. Must be an array." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Filter & validate product IDs
    const productIds = cart
      .map(item => item.productId)
      .filter(id => id && mongoose.Types.ObjectId.isValid(id));

    if (productIds.length !== cart.length) {
      return res.status(400).json({ message: "One or more product IDs are invalid" });
    }

    const existingCount = await Product.countDocuments({ _id: { $in: productIds } });
    if (existingCount !== productIds.length) {
      return res.status(400).json({ message: "Some products do not exist" });
    }

    // ✅ Perform atomic cart update
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { cart } },
      { new: true, runValidators: true }
    ).populate("cart.productId");

    res.status(200).json({ 
      message: "Cart updated successfully",
      cart: updatedUser.cart
    });
  } catch (err) {
    console.error("Cart update error:", err);
    res.status(500).json({ 
      message: "Failed to update cart",
      error: err.message
    });
  }
};
