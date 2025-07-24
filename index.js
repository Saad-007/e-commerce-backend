require('dotenv').config();

// Enhanced debug logging
console.log('=== ENVIRONMENT VARIABLES ===');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Exists' : 'MISSING');
console.log('All variables:', Object.keys(process.env));

const express = require('express');
const mongoose = require('mongoose');
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

// Enhanced MongoDB Connection
const connectDB = async () => {
  try {
    // Trim and verify connection string
    const connectionString = process.env.MONGODB_URI?.trim();
    
    if (!connectionString) {
      throw new Error('MONGODB_URI is missing or empty in environment variables');
    }

    console.log('Connecting to MongoDB with URI:', connectionString.replace(/:\/\/.*@/, '://<credentials>@'));

    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 15000
    };

    await mongoose.connect(connectionString, connectionOptions);
    
    console.log('✅ MongoDB connected successfully');
    console.log('Database Name:', mongoose.connection.db.databaseName);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
};

// Database connection and server start
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🛡️  CORS allowed for: ${allowedOrigins.join(', ')}`);
  });
});

// Enhanced error handler
app.use((err, req, res, next) => {
  console.error('‼️ Server Error:', err.stack);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      status: 'fail', 
      message: 'CORS origin not allowed',
      allowedOrigins
    });
  }
  
  res.status(500).json({ 
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});