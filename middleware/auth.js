const { verifyToken } = require('../services/jwtService');
const User = require('../models/User');
const logger = require('../services/logger');
const { unauthorized } = require('../utils/responseHelper');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Authentication failed: no token provided', { url: req.url, method: req.method });
      return unauthorized(res, 'No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      logger.warn('Authentication failed: invalid token', { url: req.url, method: req.method });
      return unauthorized(res, 'Invalid token');
    }

    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      logger.warn('Authentication failed: user not found', { userId: decoded.userId, url: req.url });
      return unauthorized(res, 'User not found');
    }

    logger.debug('User authenticated', { userId: user._id, email: user.email, url: req.url });
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error', error, { url: req.url, method: req.method });
    return unauthorized(res, 'Authentication failed');
  }
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      if (decoded) {
        const user = await User.findById(decoded.userId);
        if (user) {
          req.user = user;
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without auth if there's an error
    next();
  }
};

module.exports = { auth, optionalAuth };

