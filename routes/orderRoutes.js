const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrderStats,
  getOrders,
  cancelOrder,
  updateOrderStatus,
} = require('../controllers/orderController');
const protect = require('../middlewares/authMiddleware');
const restrictToAdmin = require('../middlewares/restrictToAdmin');

// Add explicit OPTIONS handler for PATCH
router.options('/:id', (req, res) => {
  res.setHeader('Access-Control-Allow-Methods', 'PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});
router.get('/my-orders', protect, getUserOrders);
router.patch('/:id/cancel', protect, cancelOrder);

// routes/orderRoutes.js or wherever you define routes
router.get('/stats', restrictToAdmin, getOrderStats); 

router.post('/', protect, (req, res, next) => {
  console.log("✅ Received POST /api/orders");
  createOrder(req, res, next);
});

router.get('/', protect, restrictToAdmin, getOrders);
router.patch('/:id', protect, restrictToAdmin, updateOrderStatus);

module.exports = router;