const User = require('../models/User');
const { generateToken } = require('../services/jwtService');
const logger = require('../services/logger');
const { created, ok, badRequest, unauthorized, notFound } = require('../utils/responseHelper');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    logger.debug('Register attempt', { email, name: name ? '***' : undefined });

    // Validation
    if (!email || !password || !name) {
      logger.warn('Register validation failed', { email, hasPassword: !!password, hasName: !!name });
      return badRequest(res, 'Please provide email, password, and name');
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn('Register failed: email already exists', { email });
      return badRequest(res, 'Email already exists');
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
    });

    // Generate token
    const token = generateToken(user._id);

    logger.info('User registered successfully', { userId: user._id, email });

    return created(res, null, {
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    logger.error('Register error', error, { email: req.body.email });
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    logger.debug('Login attempt', { email });

    // Validation
    if (!email || !password) {
      logger.warn('Login validation failed', { email, hasPassword: !!password });
      return badRequest(res, 'Please provide email and password');
    }

    // Check user and password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      logger.warn('Login failed: user not found', { email });
      return unauthorized(res, 'Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn('Login failed: invalid password', { email, userId: user._id });
      return unauthorized(res, 'Invalid credentials');
    }

    // Generate token
    const token = generateToken(user._id);

    logger.info('User logged in successfully', { userId: user._id, email });

    return ok(res, null, {
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    logger.error('Login error', error, { email: req.body.email });
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    logger.debug('Get current user', { userId: req.user._id });
    const user = await User.findById(req.user._id);
    return ok(res, null, {
      user: user.toJSON(),
    });
  } catch (error) {
    logger.error('Get current user error', error, { userId: req.user._id });
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    logger.debug('Forgot password request', { email });

    if (!email) {
      logger.warn('Forgot password validation failed', { email });
      return badRequest(res, 'Please provide email');
    }

    const user = await User.findOne({ email });
    if (!user) {
      logger.warn('Forgot password: email not found', { email });
      return notFound(res, 'Email not found');
    }

    logger.info('Password reset requested', { email, userId: user._id });

    // In production, send reset link via email
    // For now, just return success
    return ok(res, 'Password reset link sent to email');
  } catch (error) {
    logger.error('Forgot password error', error, { email: req.body.email });
    next(error);
  }
};

// @desc    Logout (client-side token removal, but endpoint for consistency)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Xóa FCM token khi logout
    const user = await User.findById(userId);
    if (user) {
      user.fcmToken = null;
      await user.save();
      logger.info('FCM token removed on logout', { userId });
    }
    
    logger.info('User logged out', { userId });
    return ok(res, 'Logged out successfully');
  } catch (error) {
    logger.error('Logout error', error, { userId: req.user?._id });
    next(error);
  }
};

