require('dotenv').config();
console.log('MONGODB_URI:', process.env.MONGODB_URI);  // Add this debug line
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const cmsRoutes = require("./routes/cmsRoutes");
const reviewRoutes = require("./routes/review");
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cartRoutes = require('./routes/cartRoutes'); // ✅ FIX: Added missing import
const heroRoutes = require('./routes/heroRoutes')
const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://ecommerce-client-woad.vercel.app',
  process.env.FRONTEND_URL     
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));


// ✅ Handle JSON and large payloads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cookieParser());
app.use(morgan("dev"));

// ✅ Mount routes
app.use("/api/hero-slides", heroRoutes);
app.use("/api/cms", cmsRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes); // ✅ Now this will not throw error

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS origin not allowed' });
  }
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)

  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
