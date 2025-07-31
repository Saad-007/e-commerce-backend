// ✅ CORRECT: middlewares/restrictToAdmin.js
module.exports = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'fail',
      message: 'You do not have permission to perform this action (Admin only)',
    });
  }
  next();
};
