require('dotenv').config();

// Enhanced debug logging
console.log('=== ENVIRONMENT VARIABLES ===');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Exists' : 'MISSING');
if (process.env.MONGODB_URI) {
  console.log('DB Connection:', process.env.MONGODB_URI.replace(/:\/\/[^@]+@/, '://<credentials>@'));
}

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

// Middleware - CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://ecommerce-client-woad.vercel.app',
  'https://ecommerce-client-g7uy0gj5r-saad-3892s-projects.vercel.app'
];


app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan("dev"));

// API Routes
app.use("/api/hero-slides", heroRoutes);
app.use("/api/cms", cmsRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);

// Database Connection
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI?.trim();
    if (!uri) throw new Error('MONGODB_URI missing in Railway variables');

    // Railway-specific timeout settings
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      w: 'majority'
    });

    console.log('✅ Connected to DB:', mongoose.connection.db.databaseName);
  } catch (err) {
    console.error('❌ Railway Connection Error:', {
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    process.exit(1);
  }
};
// Server Startup
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🛡️  CORS allowed for: ${allowedOrigins.join(', ')}`);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing server...');
    server.close(() => {
      mongoose.connection.close(false, () => {
        console.log('Server and DB connection closed');
        process.exit(0);
      });
    });
  });
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  res.json({
    status: dbStatus === 1 ? 'healthy' : 'degraded',
    database: {
      name: mongoose.connection.db?.databaseName,
      state: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbStatus]
    },
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

// Enhanced Error Handling
app.use((err, req, res, next) => {
  console.error('‼️ Error:', err.stack);
  
  const response = {
    status: 'error',
    message: err.message || 'Something went wrong',
    timestamp: new Date()
  };

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      ...response,
      allowedOrigins,
      yourOrigin: req.headers.origin
    });
  }
  
  res.status(500).json(response);
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.method} ${req.path} not found`
  });
});