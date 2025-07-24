if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}


// Debugging environment variables
console.log('All ENV variables:', process.env);
console.log('MONGODB_URI exists?', !!process.env.MONGODB_URI);
console.log('MONGODB_URI value:', process.env.MONGODB_URI); // Add this to see the actual value

const express = require('express');
const mongoose = require('mongoose'); // Only declare mongoose once
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

// Route imports
const cmsRoutes = require("./routes/cmsRoutes");
const reviewRoutes = require("./routes/review");
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cartRoutes = require('./routes/cartRoutes');
const heroRoutes = require('./routes/heroRoutes');

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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan("dev"));

// Routes
app.use("/api/hero-slides", heroRoutes);
app.use("/api/cms", cmsRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);

// MongoDB Connection - IMPROVED VERSION
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // Exit process with failure
  }
};

// Connect to DB before starting server
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS origin not allowed' });
  }
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});