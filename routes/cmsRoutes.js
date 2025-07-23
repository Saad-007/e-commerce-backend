const express = require('express');
const router = express.Router();
const { getHomeContent, updateHomeContent } = require('../controllers/cmsController');
const protect = require('../middlewares/authMiddleware');
const restrictToAdmin = require('../middlewares/restrictToAdmin');

// Public route for all users
router.get('/', getHomeContent);

// Admin-only update route
router.put('/', protect, restrictToAdmin, updateHomeContent);

module.exports = router;
