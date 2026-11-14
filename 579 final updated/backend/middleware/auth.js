'use strict';

const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    return res.status(503).json({ message: 'Authentication is not configured' });
  }
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'fintrackpro',
      audience: 'fintrackpro-web',
    });
    if (typeof payload.userId !== 'string' || !/^[a-f\d]{24}$/i.test(payload.userId)) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    req.user = { userId: payload.userId };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = auth;
