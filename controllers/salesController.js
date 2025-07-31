// controllers/salesController.js
const Product = require("../models/Product");
const Order = require("../models/Order");

// Helper function to record sales
const recordSale = async (orderId) => {
  try {
    const order = await Order.findById(orderId).populate('items.product');
    if (!order) throw new Error('Order not found');

    const bulkOps = order.items.map(item => ({
      updateOne: {
        filter: { _id: item.product._id },
        update: {
          $inc: {
            sold: item.quantity,
            salesCount: item.quantity,
            quantity: -item.quantity
          },
          $push: {
            salesHistory: {
              date: order.createdAt,
              quantity: item.quantity,
              revenue: item.price * item.quantity,
              orderId: order._id
            }
          }
        }
      }
    }));

    await Product.bulkWrite(bulkOps);
    return true;
  } catch (error) {
    console.error('Error recording sale:', error);
    throw error;
  }
};

// Get sales analytics
const getSalesAnalytics = async (req, res) => {
  try {
    const period = ['day', 'week', 'month', 'year'].includes(req.query.period) 
      ? req.query.period 
      : 'month';
    
    const limit = parseInt(req.query.limit) || 10;

    const dateFormat = {
      day: "%Y-%m-%d",
      week: "%Y-%U", 
      month: "%Y-%m",
      year: "%Y"
    }[period];

    const topProducts = await Product.aggregate([
      { $sort: { salesCount: -1 } },
      { $limit: limit },
      { $project: { 
        name: 1,
        price: 1,
        image: 1,
        salesCount: 1,
        revenue: { $multiply: ["$price", "$salesCount"] }
      }}
    ]);

    const salesTrends = await Order.aggregate([
      { 
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          totalRevenue: { $sum: "$total" },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: "$total" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const recentSales = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .lean();

    res.json({
      success: true,
      period,
      analytics: {
        topProducts,
        salesTrends,
        recentSales
      }
    });

  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export as named exports
module.exports = {
  getSalesAnalytics,
  recordSale,
};