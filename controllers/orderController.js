const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private

// Status transition validation
const validTransitions = {
  pending: ['processing', 'shipped', 'cancelled', 'completed'],
  processing: ['shipped', 'delivered', 'cancelled'],
  shipped: ['delivered', 'completed'],
  delivered: ['completed'],
  completed: [],
  cancelled: []
};

const createOrder = async (req, res) => {
   console.log('req.user:', req.user.id);
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    console.log('User making order:', req.user.id);
    console.log('Raw order data:', req.body);

    const { items, shippingAddress, paymentMethod } = req.body;
    
    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    // Validate shipping address
    const requiredAddressFields = ['name', 'email', 'street', 'city', 'zip'];
    for (const field of requiredAddressFields) {
      if (!shippingAddress?.[field]) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Missing shipping address field: ${field}`
        });
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingAddress.email)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format'
      });
    }

    // Process items and calculate total
    let total = 0;
    const orderItems = [];
    const stockUpdates = [];
    
    for (const item of items) {
      // Validate item structure
      if (!item.product && !item._id) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Each item must have a product ID'
        });
      }

      const productId = item.product || item._id;
      const product = await Product.findById(productId).session(session);
      
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: `Product not found: ${productId}`
        });
      }

      // Validate quantity
      if (item.quantity <= 0) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for ${product.name}`
        });
      }

      if (item.quantity > product.quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.name}. Available: ${product.quantity}`
        });
      }

      // Calculate item total
      const itemPrice = item.price || product.price;
      total += itemPrice * item.quantity;
      
      orderItems.push({
        product: productId,
        name: product.name,
        price: itemPrice,
        quantity: item.quantity,
        image: product.image
      });

      // Prepare stock and sales updates
      stockUpdates.push({
        updateOne: {
          filter: { _id: productId },
          update: { 
            $inc: { 
              quantity: -item.quantity,
              sold: item.quantity,
              salesCount: item.quantity
            }
          }
        }
      });
    }

    // Create order
    const order = new Order({
user: new mongoose.Types.ObjectId(req.user.id),
      items: orderItems,
      shippingAddress,
      paymentMethod,
      total,
      status: 'pending'
    });

    // Execute all updates
    await Product.bulkWrite(stockUpdates, { session });
    const savedOrder = await order.save({ session });
    
    // Update user's orders list
    await User.updateOne(
      { _id: req.user.id },
      { $push: { orders: savedOrder._id } },
      { session }
    );

    await session.commitTransaction();
    
    console.log('Order successfully saved:', savedOrder._id);
    
    res.status(201).json({
      success: true,
      order: savedOrder
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Order creation failed:', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  try {
    console.log('Fetching orders for admin:', req.user.id);
    
    // Basic query without any filters
    const query = {};
    console.log('Query conditions:', query);

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name price')
      .sort({ createdAt: -1 });

    console.log('Found orders:', orders.length);
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error'
    });
  }
};
// @desc    Update order status
// @route   PATCH /api/orders/:id
// @access  Private/Admin
// @desc    Update order status
// @route   PATCH /api/orders/:id
// In orderController.js - updateOrderStatus
// In your orderController.js
const updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { status, changedBy } = req.body;

    // Enhanced validation
    if (!status || !changedBy) {
      return res.status(400).json({
        success: false,
        message: 'Status and changedBy are required',
        received: req.body
      });
    }

    const order = await Order.findById(id).session(session);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order ${id} not found`
      });
    }

    // Validate status transition
    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${order.status} to ${status}`,
        allowedTransitions: validTransitions[order.status]
      });
    }

    // Set the updatedBy field for the pre-save hook
    order._updatedBy = changedBy;
order._originalStatus = order.status; // Store current status before updating
order.status = status;

    // Save with session
    const updatedOrder = await order.save({ session });
    await session.commitTransaction();

    res.json({
      success: true,
      data: updatedOrder
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Order status update failed:', error);
    
    res.status(400).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    session.endSession();
  }
};

const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id; // assuming you use protect middleware to get req.user
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json({ orders });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (
      !order.user ||
      !req.user ||
      order.user.toString() !== req.user.id?.toString()
    ) {
      return res.status(403).json({ message: "You are not authorized to cancel this order" });
    }

   if (order.status === "cancelled") {
  return res.status(400).json({ message: "Order already cancelled" });
}

// Only update and save if the status is NOT cancelled
if (order.status !== "cancelled") {
  order.status = "cancelled";
  await order.save();
}


    res.status(200).json({ message: "Order cancelled successfully" });

  } catch (error) {
    console.error("❌ Cancel order error:", error);
    res.status(500).json({ message: "Error canceling order" });
  }
};
const getOrderStats = async (req, res) => {
  try {
    const totalRevenueResult = await Order.aggregate([
      {
        $match: {
          status: { $nin: ['cancelled'] },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$total' }
        }
      }
    ]);

    const totalRevenue = totalRevenueResult[0]?.revenue || 0;

    const totalOrders = await Order.countDocuments();
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
    const paidOrders = await Order.countDocuments({ paymentStatus: 'paid' });

    res.json({
      totalRevenue,
      totalOrders,
      cancelledOrders,
      paidOrders,
      // Add more stats if needed
    });
  } catch (err) {
    console.error('❌ Failed to get stats:', err);
    res.status(500).json({ message: 'Failed to get order stats' });
  }
};



module.exports = {
  createOrder,
  cancelOrder,
  getOrders,
  getOrderStats,
  getUserOrders,
  updateOrderStatus,
};