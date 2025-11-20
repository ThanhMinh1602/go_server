const User = require('../models/User');
const logger = require('../services/logger');
const { ok, notFound, forbidden } = require('../utils/responseHelper');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return ok(res, null, {
      count: users.length,
      users: users.map(user => user.toJSON()),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return notFound(res, 'User not found');
    }
    return ok(res, null, {
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;

    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return notFound(res, 'User not found');
    }

    // Check if user is updating their own profile or is admin
    if (req.user._id.toString() !== req.params.id) {
      return forbidden(res, 'Not authorized to update this profile');
    }

    // Update fields
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    return ok(res, null, {
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

