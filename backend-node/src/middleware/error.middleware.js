/**
 * EventSphere - Error Handling Middleware
 * Centralised error formatter for all Express errors
 */

/**
 * Handle known error types and return consistent JSON responses
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: `A record with this ${err.meta?.target?.join(', ')} already exists`,
    });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }
  if (err.code === 'P2003') {
    return res.status(400).json({ success: false, message: 'Related record not found' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token has expired' });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File is too large (max 5MB)' });
  }
  if (err.message && err.message.includes('Only image files')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Razorpay errors
  if (err.statusCode && err.error) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.error.description || 'Payment gateway error',
    });
  }

  // Default
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

/**
 * 404 handler — must be registered AFTER all routes
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
};

module.exports = { errorHandler, notFound };
