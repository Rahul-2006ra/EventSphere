/**
 * EventSphere - Main Server
 * Express + Socket.IO + Prisma
 */

require('dotenv').config();
const { normalizeEnvironment } = require('./utils/env');
normalizeEnvironment();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const httpServer = http.createServer(app);
const isDemoMode = process.env.DEMO_MODE === 'true' || !process.env.DATABASE_URL;
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ALLOWED_ORIGINS,
]
  .filter(Boolean)
  .join(',')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOrigin = (origin, callback) => {
  if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    return callback(null, true);
  }
  return callback(new Error(`CORS blocked for origin: ${origin}`));
};

// ─────────────────────────────────────────────
// Socket.IO Setup
// ─────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Attach io to app for use in controllers
app.set('io', io);
if (isDemoMode) {
  io.on('connection', (socket) => {
    socket.on('join:event', () => {});
    socket.on('join:dashboard', () => {});
    socket.on('join:notifications', () => {});
    socket.on('checkin:scan', () => socket.emit('checkin:result', { success: false, message: 'Use ticket verification in demo mode' }));
  });
} else {
  const { initSocketIO } = require('./utils/socket');
  initSocketIO(io);
}

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (uploaded images, etc.)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
const API = '/api/v1';
const frontendPath = path.resolve(__dirname, '..', '..', 'frontend');

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/health/db', async (req, res) => {
  if (isDemoMode) {
    return res.json({ status: 'healthy', database: 'demo-memory', timestamp: new Date().toISOString() });
  }

  try {
    const prisma = require('./utils/prisma');
    await prisma.$runCommandRaw({ ping: 1 });
    return res.json({ status: 'healthy', database: 'mongodb', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[Health DB]', err.message);
    return res.status(503).json({ status: 'unhealthy', database: 'mongodb', message: 'Database connection failed' });
  }
});

if (isDemoMode) {
  console.warn('[EventSphere] DEMO_MODE enabled: using in-memory data instead of MongoDB.');
  app.use(API, require('./routes/demo.routes'));
  app.use('/', require('./routes/demo.routes'));
} else {
  const authRoutes = require('./routes/auth.routes');
  const eventRoutes = require('./routes/event.routes');
  const bookingRoutes = require('./routes/booking.routes');
  const ticketRoutes = require('./routes/ticket.routes');
  const userRoutes = require('./routes/user.routes');
  const reviewRoutes = require('./routes/review.routes');
  const notificationRoutes = require('./routes/notification.routes');
  const wishlistRoutes = require('./routes/wishlist.routes');
  const aiRoutes = require('./routes/ai.routes');
  const dashboardRoutes = require('./routes/dashboard.routes');

  app.use(`${API}/auth`, authRoutes);
  app.use(`${API}/events`, eventRoutes);
  app.use(`${API}/bookings`, bookingRoutes);
  app.use(`${API}/tickets`, ticketRoutes);
  app.use(`${API}/users`, userRoutes);
  app.use(`${API}/reviews`, reviewRoutes);
  app.use(`${API}/notifications`, notificationRoutes);
  app.use(`${API}/wishlist`, wishlistRoutes);
  app.use(`${API}/ai`, aiRoutes);
  app.use(`${API}/dashboard`, dashboardRoutes);

  app.use('/auth', authRoutes);
  app.use('/events', eventRoutes);
  app.use('/bookings', bookingRoutes);
  app.use('/tickets', ticketRoutes);
  app.use('/users', userRoutes);
  app.use('/reviews', reviewRoutes);
  app.use('/notifications', notificationRoutes);
  app.use('/wishlist', wishlistRoutes);
  app.use('/ai', aiRoutes);
  app.use('/dashboard', dashboardRoutes);
}

app.use(express.static(frontendPath));

// ─────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);

  const isPrismaConnectionError = err.message && (
    err.message.includes('Server selection timeout')
    || err.message.includes('SCRAM failure')
    || err.message.includes('authentication failed')
    || err.message.includes('Raw query failed')
  );

  if (isPrismaConnectionError) {
    return res.status(503).json({
      success: false,
      message: 'Database connection failed',
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   EventSphere API Server             ║
  ║   Port: ${PORT}                         ║
  ║   Mode: ${process.env.NODE_ENV || 'development'}              ║
  ╚══════════════════════════════════════╝
  `);
});

module.exports = { app, io };
