// routes/salesRoutes.js
const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const admin = require('../middlewares/restrictToAdmin'); // ✅ correct
console.log('admin middleware:', admin);

const salesController = require('../controllers/salesController');
console.log('salesController:', salesController);


router.get('/analytics', protect, admin, salesController.getSalesAnalytics);

module.exports = router;
