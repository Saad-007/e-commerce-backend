require('dotenv').config();

// Enhanced debug logging
console.log('=== ENVIRONMENT VARIABLES ===');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Exists' : 'MISSING');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const compression = require('compression'); // ⚡ SPEED UPGRADE 1

// Route imports
const cmsRoutes = require("./routes/cmsRoutes");
const reviewRoutes = require("./routes/review");
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cartRoutes = require('./routes/cartRoutes');
const heroRoutes = require('./routes/heroRoutes');
const orderRoutes = require('./routes/orderRoutes')
const salesRoutes = require('./routes/salesRoutes');

const app = express();

// ⚡ SPEED UPGRADE 2: Enable Gzip Compression
// This compresses your API responses, making them download much faster
app.use(compression());

// Middleware - CORS
const allowedOrigins = [
  'https://ecommerce-client-woad.vercel.app',  // Main prod
  'http://localhost:5173',                    // Local dev
];

const allowedOriginPatterns = [
  /^https:\/\/ecommerce-client(-[a-z0-9]+)?\.vercel\.app$/, // Preview URLs
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow no-origin requests

    const isExactMatch = allowedOrigins.includes(origin);
    const isPatternMatch = allowedOriginPatterns.some((pattern) => pattern.test(origin));

    if (isExactMatch || isPatternMatch) {
      return callback(null, true);
    } else {
      console.warn('❌ CORS blocked:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT','PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan("dev"));

// ⚡ SPEED UPGRADE 3: Smart Caching Middleware
// This tells browsers to keep Hero/Product data for 5 minutes (300s)
// "stale-while-revalidate" allows the browser to show old data instantly while fetching new data in background
const cachePublicData = (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  } else {
    res.set('Cache-Control', 'no-store');
  }
  next();
};

// --- API Routes ---

// ✅ FAST ROUTES (Cached)
// Applied to Hero and Products so they load instantly on repeat visits
app.use("/api/hero-slides", cachePublicData, heroRoutes);
app.use('/api/products', cachePublicData, productRoutes);
app.use("/api/cms", cachePublicData, cmsRoutes);

// 🔒 DYNAMIC ROUTES (Not Cached)
// Never cache these (Auth, Cart, Orders) because data changes per user
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/sales', salesRoutes);
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
      socketTimeoutMS: 45000, // Increased for stability
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
    console.log(`⚡ Speed optimizations (Compression & Caching) enabled`);
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