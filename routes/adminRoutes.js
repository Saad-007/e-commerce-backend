const express = require('express');
const router = express.Router();

// Dummy admin route for now
router.get('/', (req, res) => {
  res.send('Admin route working!');
});

module.exports = router;

