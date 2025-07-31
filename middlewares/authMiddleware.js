const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { promisify } = require('util');

// Middleware to protect routes (requires login)
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in! Please log in to get access.'
      });
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // ✅ Fix here: only assign essential info
req.user = {
  id: currentUser._id.toString(),
  role: currentUser.role,
  email: currentUser.email,
  isAdmin: currentUser.role === 'admin',
};


    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({
      status: 'fail',
      message: 'Unauthorized or invalid token'
    });
  }
};

module.exports = protect;
