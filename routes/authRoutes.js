const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ✅ Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.get('/isLoggedIn', authController.isLoggedIn); // Changed to GET
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// 🔒 Protect all routes below this middleware
router.use(authController.protect);

// ✅ Protected route
router.get('/me', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

module.exports = router;
