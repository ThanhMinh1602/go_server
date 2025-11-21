const Friend = require('../models/Friend');
const User = require('../models/User');
const logger = require('../services/logger');
const { ok, notFound, badRequest, forbidden } = require('../utils/responseHelper');

// @desc    Get QR code link for friend request
// @route   GET /api/friends/qr-code
// @access  Private
exports.getQRCodeLink = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const qrLink = `${baseUrl}/add-friend?userId=${userId}`;
    
    return ok(res, null, {
      qrLink,
      userId,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send friend request
// @route   POST /api/friends/request
// @access  Private
exports.sendFriendRequest = async (req, res, next) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.user._id;

    if (!recipientId) {
      return badRequest(res, 'Recipient ID is required');
    }

    if (requesterId.toString() === recipientId) {
      return badRequest(res, 'Cannot send friend request to yourself');
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return notFound(res, 'Recipient not found');
    }

    // Check if friend request already exists
    const existingRequest = await Friend.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existingRequest) {
      if (existingRequest.status === 'accepted') {
        return badRequest(res, 'Already friends');
      }
      if (existingRequest.status === 'pending') {
        if (existingRequest.requester.toString() === requesterId.toString()) {
          return badRequest(res, 'Friend request already sent');
        } else {
          // Auto-accept if recipient is sending request back
          existingRequest.status = 'accepted';
          await existingRequest.save();
          return ok(res, 'Friend request accepted', {
            friend: existingRequest.toJSON(),
          });
        }
      }
    }

    // Create new friend request
    const friendRequest = new Friend({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending',
    });

    await friendRequest.save();

    return ok(res, 'Friend request sent', {
      friendRequest: friendRequest.toJSON(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return badRequest(res, 'Friend request already exists');
    }
    next(error);
  }
};

// @desc    Get pending friend requests
// @route   GET /api/friends/requests
// @access  Private
exports.getFriendRequests = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const requests = await Friend.find({
      recipient: userId,
      status: 'pending',
    })
      .populate('requester', 'name email avatar')
      .sort({ createdAt: -1 });

    return ok(res, null, {
      count: requests.length,
      requests: requests.map(req => ({
        ...req.toJSON(),
        requester: req.requester.toJSON(),
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept friend request
// @route   PUT /api/friends/requests/:id/accept
// @access  Private
exports.acceptFriendRequest = async (req, res, next) => {
  try {
    const requestId = req.params.id;
    const userId = req.user._id;

    const friendRequest = await Friend.findById(requestId);
    if (!friendRequest) {
      return notFound(res, 'Friend request not found');
    }

    if (friendRequest.recipient.toString() !== userId.toString()) {
      return forbidden(res, 'Not authorized to accept this request');
    }

    if (friendRequest.status !== 'pending') {
      return badRequest(res, 'Friend request is not pending');
    }

    friendRequest.status = 'accepted';
    await friendRequest.save();

    return ok(res, 'Friend request accepted', {
      friend: friendRequest.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject friend request
// @route   PUT /api/friends/requests/:id/reject
// @access  Private
exports.rejectFriendRequest = async (req, res, next) => {
  try {
    const requestId = req.params.id;
    const userId = req.user._id;

    const friendRequest = await Friend.findById(requestId);
    if (!friendRequest) {
      return notFound(res, 'Friend request not found');
    }

    if (friendRequest.recipient.toString() !== userId.toString()) {
      return forbidden(res, 'Not authorized to reject this request');
    }

    if (friendRequest.status !== 'pending') {
      return badRequest(res, 'Friend request is not pending');
    }

    friendRequest.status = 'rejected';
    await friendRequest.save();

    return ok(res, 'Friend request rejected', {
      friend: friendRequest.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get friends list
// @route   GET /api/friends
// @access  Private
exports.getFriends = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const friendships = await Friend.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' },
      ],
    })
      .populate('requester', 'name email avatar')
      .populate('recipient', 'name email avatar')
      .sort({ updatedAt: -1 });

    // Map to get friend user info (not the current user)
    const friends = friendships.map(friendship => {
      const friendData = friendship.requester._id.toString() === userId.toString()
        ? friendship.recipient.toJSON()
        : friendship.requester.toJSON();
      
      return {
        ...friendData,
        friendshipId: friendship._id.toString(),
        createdAt: friendship.createdAt,
        updatedAt: friendship.updatedAt,
      };
    });

    return ok(res, null, {
      count: friends.length,
      friends,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add friend from QR code scan
// @route   POST /api/friends/scan
// @access  Private
exports.addFriendFromQR = async (req, res, next) => {
  try {
    const { userId: recipientId } = req.body;
    const requesterId = req.user._id;

    if (!recipientId) {
      return badRequest(res, 'User ID is required');
    }

    if (requesterId.toString() === recipientId) {
      return badRequest(res, 'Cannot add yourself as friend');
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return notFound(res, 'User not found');
    }

    // Check if friend request already exists
    const existingRequest = await Friend.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existingRequest) {
      if (existingRequest.status === 'accepted') {
        return badRequest(res, 'Already friends');
      }
      if (existingRequest.status === 'pending') {
        if (existingRequest.requester.toString() === requesterId.toString()) {
          return badRequest(res, 'Friend request already sent');
        } else {
          // Auto-accept if recipient is sending request back
          existingRequest.status = 'accepted';
          await existingRequest.save();
          return ok(res, 'Friend request accepted', {
            friend: existingRequest.toJSON(),
          });
        }
      }
    }

    // Create new friend request
    const friendRequest = new Friend({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending',
    });

    await friendRequest.save();

    return ok(res, 'Friend request sent', {
      friendRequest: friendRequest.toJSON(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return badRequest(res, 'Friend request already exists');
    }
    next(error);
  }
};

