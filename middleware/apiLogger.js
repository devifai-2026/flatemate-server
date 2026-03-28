const ApiLog = require('../models/ApiLog');
const jwt = require('jsonwebtoken');

const apiLogger = (req, res, next) => {
  // Skip logging for health checks, static files, and swagger
  if (req.path === '/health' || req.path === '/' || req.path.startsWith('/api-docs') || req.path.startsWith('/uploads')) {
    return next();
  }

  const start = Date.now();

  const originalEnd = res.end;
  res.end = function (...args) {
    const responseTime = Date.now() - start;

    // Extract userId from token if present
    let userId = null;
    let isGuest = true;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        userId = decoded.id;
        isGuest = false;
      } catch (_) {}
    }

    // Fire and forget — don't block the response
    ApiLog.create({
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      ip: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      userId,
      isGuest,
      error: res.statusCode >= 400 ? res.statusMessage : undefined,
    }).catch(() => {});

    originalEnd.apply(res, args);
  };

  next();
};

module.exports = apiLogger;
