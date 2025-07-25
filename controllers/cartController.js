const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");

// Enhanced cart controller with better security and validation
exports.getCart = async (req, res) => {
  try {
    // Strict user verification
    if (!req.user || !mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(401).json({ message: "Invalid user authentication" });
    }

    if (req.user.role === "admin") {
      return res.status(403).json({ 
        message: "Admin accounts don't have shopping carts"
      });
    }

    const user = await User.findById(req.user.id)
      .select("cart")
      .populate({
        path: "cart.productId",
        select: "name price offerPrice image stock status"
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter out any invalid cart items
    const validCart = user.cart.filter(item => item.productId);
    
    // Update user's cart if any invalid items were filtered
    if (validCart.length !== user.cart.length) {
      user.cart = validCart;
      await user.save();
    }

    res.status(200).json({ 
      success: true,
      cart: validCart,
      userId: user._id
    });
  } catch (err) {
    console.error("Cart fetch error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch cart",
      error: err.message
    });
  }
};

// Secure cart update with additional validation
exports.addToCart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Validate user
    if (!req.user || !mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(401).json({ message: "Invalid user authentication" });
    }

    if (req.user.role === "admin") {
      return res.status(403).json({ 
        message: "Admin accounts cannot modify carts"
      });
    }

    const { cart } = req.body;

    // Validate cart structure
    if (!Array.isArray(cart)) {
      return res.status(400).json({ 
        success: false,
        message: "Cart must be an array of items" 
      });
    }

    // Validate each cart item
    const validatedCart = [];
    const productIds = [];
    
    for (const item of cart) {
      if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
        continue; // Skip invalid items
      }
      
      if (typeof item.quantity !== "number" || item.quantity < 1) {
        continue; // Skip invalid quantities
      }

      productIds.push(item.productId);
      validatedCart.push({
        productId: item.productId,
        quantity: Math.min(item.quantity, 10) // Limit max quantity
      });
    }

    // Verify products exist and are available
    const products = await Product.find({
      _id: { $in: productIds },
      status: "active"
    }).session(session);

    if (products.length !== productIds.length) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Some products are unavailable",
        invalidProducts: productIds.filter(id => 
          !products.some(p => p._id.equals(id))
        )
      });
    }

    // Check product stock
    const stockIssues = [];
    for (const item of validatedCart) {
      const product = products.find(p => p._id.equals(item.productId));
      if (product.stock < item.quantity) {
        stockIssues.push({
          productId: item.productId,
          available: product.stock,
          requested: item.quantity
        });
      }
    }

    if (stockIssues.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Some products don't have enough stock",
        stockIssues
      });
    }

    // Update user's cart atomically
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { cart: validatedCart } },
      { new: true, session }
    ).populate({
      path: "cart.productId",
      select: "name price offerPrice image"
    });

    await session.commitTransaction();
    
    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      cart: user.cart
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("Cart update error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to update cart",
      error: err.message
    });
  } finally {
    session.endSession();
  }
};

// Enhanced cart merging with conflict resolution
exports.mergeCarts = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { guestCart } = req.body;

    if (!Array.isArray(guestCart)) {
      return res.status(400).json({
        success: false,
        message: "Guest cart must be an array"
      });
    }

    // Get current user with cart
    const user = await User.findById(req.user.id)
      .select("cart")
      .session(session);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Validate and normalize guest cart items
    const validGuestItems = guestCart
      .filter(item => 
        item.productId && 
        mongoose.Types.ObjectId.isValid(item.productId) &&
        typeof item.quantity === "number" &&
        item.quantity > 0
      )
      .map(item => ({
        productId: new mongoose.Types.ObjectId(item.productId),
        quantity: Math.min(item.quantity, 10) // Limit quantity
      }));

    // Merge carts with quantity accumulation
    const mergedCartMap = new Map();

    // Add existing user cart items
    user.cart.forEach(item => {
      mergedCartMap.set(item.productId.toString(), {
        productId: item.productId,
        quantity: item.quantity
      });
    });

    // Merge with guest cart items
    validGuestItems.forEach(guestItem => {
      const key = guestItem.productId.toString();
      if (mergedCartMap.has(key)) {
        // Sum quantities if product exists in both carts
        const existing = mergedCartMap.get(key);
        mergedCartMap.set(key, {
          productId: existing.productId,
          quantity: Math.min(existing.quantity + guestItem.quantity, 10)
        });
      } else {
        // Add new item from guest cart
        mergedCartMap.set(key, guestItem);
      }
    });

    // Convert back to array
    const mergedCart = Array.from(mergedCartMap.values());

    // Verify products exist
    const productIds = mergedCart.map(item => item.productId);
    const existingProducts = await Product.countDocuments({
      _id: { $in: productIds },
      status: "active"
    }).session(session);

    if (existingProducts !== productIds.length) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Some products in the merged cart are unavailable"
      });
    }

    // Update user's cart
    user.cart = mergedCart;
    await user.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Carts merged successfully",
      cart: user.cart
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("Cart merge error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to merge carts",
      error: err.message
    });
  } finally {
    session.endSession();
  }
};