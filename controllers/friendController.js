const Friend = require('../models/Friend');
const User = require('../models/User');
const logger = require('../services/logger');
const { ok, notFound, badRequest, forbidden } = require('../utils/responseHelper');
const fcmService = require('../services/fcmService');
const socketEvents = require('../utils/socketEvents');

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
      if (existingRequest.status === 'rejected') {
        // Nếu request đã bị reject, cho phép gửi lại
        // Cập nhật lại request với requester và recipient mới (có thể đổi chiều)
        existingRequest.requester = requesterId;
        existingRequest.recipient = recipientId;
        existingRequest.status = 'pending';
        await existingRequest.save();
        
        // Populate for response
        await existingRequest.populate('requester', 'name email avatar');
        await existingRequest.populate('recipient', 'name email avatar');
        
        return ok(res, 'Friend request sent', {
          friendRequest: existingRequest.toJSON(),
        });
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

    // Populate for response
    await friendRequest.populate('requester', 'name email avatar');
    await friendRequest.populate('recipient', 'name email avatar');

    // Get requester info for notification
    const requester = await User.findById(friendRequest.requester._id);
    const accepter = req.user;

    // Send FCM notification to requester
    if (requester && requester.fcmToken) {
      fcmService.sendFriendRequestAcceptedNotification(
        requester.fcmToken,
        {
          id: accepter._id.toString(),
          name: accepter.name,
          avatar: accepter.avatar,
        },
      ).catch(err => {
        logger.error('Failed to send FCM notification', err);
      });
    }

    // Emit socket events to both users
    const io = req.app.get('io');
    if (io) {
      const friendData = {
        ...friendRequest.toJSON(),
        requester: friendRequest.requester.toJSON(),
        recipient: friendRequest.recipient.toJSON(),
      };

      // Notify requester
      io.to(`user:${friendRequest.requester._id}`).emit(
        socketEvents.FRIEND_REQUEST_ACCEPTED,
        { friend: friendData },
      );

      // Notify accepter
      io.to(`user:${userId}`).emit(socketEvents.FRIEND_ADDED, {
        friend: friendData,
      });
    }

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
          
          // Populate for response
          await existingRequest.populate('requester', 'name email avatar');
          await existingRequest.populate('recipient', 'name email avatar');

          // Get users for notification
          const requester = await User.findById(existingRequest.requester._id);
          const accepter = await User.findById(existingRequest.recipient._id);

          // Send FCM notification to requester
          if (requester && requester.fcmToken) {
            fcmService.sendFriendRequestAcceptedNotification(
              requester.fcmToken,
              {
                id: accepter._id.toString(),
                name: accepter.name,
                avatar: accepter.avatar,
              },
            ).catch(err => {
              logger.error('Failed to send FCM notification', err);
            });
          }

          // Emit socket events
          const io = req.app.get('io');
          if (io) {
            const friendData = {
              ...existingRequest.toJSON(),
              requester: existingRequest.requester.toJSON(),
              recipient: existingRequest.recipient.toJSON(),
            };

            io.to(`user:${existingRequest.requester._id}`).emit(
              socketEvents.FRIEND_REQUEST_ACCEPTED,
              { friend: friendData },
            );

            io.to(`user:${existingRequest.recipient._id}`).emit(
              socketEvents.FRIEND_ADDED,
              { friend: friendData },
            );
          }

          return ok(res, 'Friend request accepted', {
            friend: existingRequest.toJSON(),
          });
        }
      }
      if (existingRequest.status === 'rejected') {
        // Nếu request đã bị reject, cho phép gửi lại
        // Cập nhật lại request với requester và recipient mới (có thể đổi chiều)
        existingRequest.requester = requesterId;
        existingRequest.recipient = recipientId;
        existingRequest.status = 'pending';
        await existingRequest.save();
        
        // Populate for response
        await existingRequest.populate('requester', 'name email avatar');
        await existingRequest.populate('recipient', 'name email avatar');
        
        // Get requester info for notification
        const requesterUser = await User.findById(requesterId);
        
        // Send FCM notification to recipient
        if (recipient && recipient.fcmToken) {
          fcmService.sendFriendRequestNotification(
            recipient.fcmToken,
            {
              id: requesterUser._id.toString(),
              name: requesterUser.name,
              avatar: requesterUser.avatar,
            },
            existingRequest._id.toString(),
          ).catch(err => {
            logger.error('Failed to send FCM notification', err);
          });
        }

        // Emit socket event to recipient
        const io = req.app.get('io');
        if (io) {
          io.to(`user:${recipientId}`).emit(socketEvents.FRIEND_REQUEST_RECEIVED, {
            request: {
              ...existingRequest.toJSON(),
              requester: existingRequest.requester.toJSON(),
            },
          });
        }
        
        return ok(res, 'Friend request sent', {
          friendRequest: existingRequest.toJSON(),
        });
      }
    }

    // Get requester info for notification
    const requester = await User.findById(requesterId);

    // Create new friend request
    const friendRequest = new Friend({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending',
    });

    await friendRequest.save();

    // Populate requester for response and notification
    await friendRequest.populate('requester', 'name email avatar');

    // Send FCM notification
    if (recipient.fcmToken) {
      fcmService.sendFriendRequestNotification(
        recipient.fcmToken,
        {
          id: requester._id.toString(),
          name: requester.name,
          avatar: requester.avatar,
        },
        friendRequest._id.toString(),
      ).catch(err => {
        logger.error('Failed to send FCM notification', err);
      });
    }

    // Emit socket event to recipient
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${recipientId}`).emit(socketEvents.FRIEND_REQUEST_RECEIVED, {
        request: {
          ...friendRequest.toJSON(),
          requester: requester.toJSON(),
        },
      });
    }

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

// @desc    Delete friend (unfriend)
// @route   DELETE /api/friends/:id
// @access  Private
exports.deleteFriend = async (req, res, next) => {
  try {
    const friendshipId = req.params.id;
    const userId = req.user._id;

    // Find friendship
    const friendship = await Friend.findById(friendshipId);
    if (!friendship) {
      return notFound(res, 'Friendship not found');
    }

    // Check if user is part of this friendship
    const isRequester = friendship.requester._id.toString() === userId.toString();
    const isRecipient = friendship.recipient._id.toString() === userId.toString();

    if (!isRequester && !isRecipient) {
      return forbidden(res, 'Not authorized to delete this friendship');
    }

    // Check if friendship is accepted
    if (friendship.status !== 'accepted') {
      return badRequest(res, 'Can only delete accepted friendships');
    }

    // Get friend info before deleting (for notification)
    const friendId = isRequester 
      ? friendship.recipient._id 
      : friendship.requester._id;

    // Delete friendship
    await friendship.deleteOne();

    logger.info('Friendship deleted', { 
      userId, 
      friendId: friendId.toString(),
      friendshipId 
    });

    // Emit socket event to both users
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${userId}`).emit(socketEvents.FRIEND_REMOVED, {
        friendId: friendId.toString(),
      });
      io.to(`user:${friendId}`).emit(socketEvents.FRIEND_REMOVED, {
        friendId: userId.toString(),
      });
    }

    return ok(res, 'Friend removed successfully');
  } catch (error) {
    logger.error('Delete friend error', error, { 
      friendshipId: req.params.id,
      userId: req.user?._id 
    });
    next(error);
  }
};

