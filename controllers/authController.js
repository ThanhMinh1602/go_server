const User = require('../models/User');
const { generateToken } = require('../services/jwtService');
const logger = require('../services/logger');

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
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and name',
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn('Register failed: email already exists', { email });
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
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

    res.status(201).json({
      success: true,
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
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check user and password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      logger.warn('Login failed: user not found', { email });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn('Login failed: invalid password', { email, userId: user._id });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    logger.info('User logged in successfully', { userId: user._id, email });

    res.json({
      success: true,
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
    res.json({
      success: true,
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
      return res.status(400).json({
        success: false,
        message: 'Please provide email',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      logger.warn('Forgot password: email not found', { email });
      return res.status(404).json({
        success: false,
        message: 'Email not found',
      });
    }

    logger.info('Password reset requested', { email, userId: user._id });

    // In production, send reset link via email
    // For now, just return success
    res.json({
      success: true,
      message: 'Password reset link sent to email',
    });
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
    logger.info('User logged out', { userId: req.user._id });
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error', error, { userId: req.user?._id });
    next(error);
  }
};

