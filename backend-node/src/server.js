/**
 * EventSphere - Main Server
 * Express + Socket.IO + Prisma
 */

require('dotenv').config();
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
const allowedOrigins = (process.env.CLIENT_URL || process.env.ALLOWED_ORIGINS || '')
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

if (isDemoMode) {
  console.warn('[EventSphere] DEMO_MODE enabled: using in-memory data instead of PostgreSQL.');
  app.use(API, require('./routes/demo.routes'));
} else {
  app.use(`${API}/auth`, require('./routes/auth.routes'));
  app.use(`${API}/events`, require('./routes/event.routes'));
  app.use(`${API}/bookings`, require('./routes/booking.routes'));
  app.use(`${API}/tickets`, require('./routes/ticket.routes'));
  app.use(`${API}/users`, require('./routes/user.routes'));
  app.use(`${API}/reviews`, require('./routes/review.routes'));
  app.use(`${API}/notifications`, require('./routes/notification.routes'));
  app.use(`${API}/wishlist`, require('./routes/wishlist.routes'));
  app.use(`${API}/ai`, require('./routes/ai.routes'));
  app.use(`${API}/dashboard`, require('./routes/dashboard.routes'));
}

app.use(express.static(frontendPath));

// ─────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);

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
