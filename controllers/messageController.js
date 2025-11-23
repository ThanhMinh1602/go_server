const Message = require('../models/Message');
const User = require('../models/User');
const Friend = require('../models/Friend');
const logger = require('../services/logger');
const { ok, notFound, badRequest, forbidden } = require('../utils/responseHelper');
const fcmService = require('../services/fcmService');
const socketEvents = require('../utils/socketEvents');

// Helper function to format message with sender info
const formatMessageWithSender = (message) => {
  const messageObj = message.toJSON ? message.toJSON() : message.toObject();
  
  // If sender is populated (has user info)
  if (message.sender && typeof message.sender === 'object' && message.sender._id) {
    messageObj.sender = {
      id: message.sender._id.toString(),
      name: message.sender.name || '',
      avatar: message.sender.avatar || null,
      email: message.sender.email || '',
    };
  }
  
  // If recipient is populated
  if (message.recipient && typeof message.recipient === 'object' && message.recipient._id) {
    messageObj.recipient = {
      id: message.recipient._id.toString(),
      name: message.recipient.name || '',
      avatar: message.recipient.avatar || null,
      email: message.recipient.email || '',
    };
  }
  
  return messageObj;
};

// Helper function to emit socket event
function emitMessageEvent(req, event, data) {
  try {
    const io = req.app.get('io');
    if (!io) {
      logger.warn('Socket.IO not initialized, cannot emit event', { event });
      return;
    }

    logger.debug('Emitting message event', { event, data });
    io.to('messages').emit(event, data);
    
    // Also emit to specific user rooms for real-time delivery
    if (data.recipientId) {
      io.to(`user:${data.recipientId}`).emit(event, data);
    }
    // Emit to sender as well (for read receipts)
    if (data.senderId) {
      io.to(`user:${data.senderId}`).emit(event, data);
    }
  } catch (error) {
    logger.error('Error emitting socket event', error, { event, data });
  }
}

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { recipientId, content } = req.body;
    const senderId = req.user._id;

    if (!recipientId || !content) {
      return badRequest(res, 'Recipient ID and content are required');
    }

    if (senderId.toString() === recipientId) {
      return badRequest(res, 'Cannot send message to yourself');
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return notFound(res, 'Recipient not found');
    }

    // Check if users are friends
    const friendship = await Friend.findOne({
      $or: [
        { requester: senderId, recipient: recipientId, status: 'accepted' },
        { requester: recipientId, recipient: senderId, status: 'accepted' },
      ],
    });

    if (!friendship) {
      return forbidden(res, 'You can only send messages to your friends');
    }

    // Create message
    const message = await Message.create({
      sender: senderId,
      recipient: recipientId,
      content: content.trim(),
    });

    // Populate sender and recipient info
    await message.populate('sender', 'name avatar email');
    await message.populate('recipient', 'name avatar email');

    logger.info('Message sent successfully', {
      messageId: message._id,
      senderId: senderId.toString(),
      recipientId,
    });

    // Emit socket event
    emitMessageEvent(req, socketEvents.MESSAGE_SENT, {
      message: formatMessageWithSender(message),
      senderId: senderId.toString(),
      recipientId,
    });

    // Send FCM notification to recipient if they have FCM token
    if (recipient.fcmToken) {
      const sender = await User.findById(senderId).select('name');
      fcmService.sendNotification(
        recipient.fcmToken,
        sender.name || 'New Message',
        content.length > 50 ? content.substring(0, 50) + '...' : content,
        {
          type: 'message',
          messageId: message._id.toString(),
          senderId: senderId.toString(),
          recipientId,
        }
      ).catch((error) => {
        logger.error('Error sending FCM notification', error, {
          messageId: message._id,
          recipientId,
        });
      });
    }

    return ok(res, null, {
      message: formatMessageWithSender(message),
    });
  } catch (error) {
    logger.error('Send message error', error, {
      recipientId: req.body.recipientId,
    });
    next(error);
  }
};

// @desc    Get conversation with a user
// @route   GET /api/messages/:userId
// @access  Private
exports.getConversation = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;

    if (!otherUserId) {
      return badRequest(res, 'User ID is required');
    }

    // Check if users are friends
    const friendship = await Friend.findOne({
      $or: [
        { requester: currentUserId, recipient: otherUserId, status: 'accepted' },
        { requester: otherUserId, recipient: currentUserId, status: 'accepted' },
      ],
    });

    if (!friendship) {
      return forbidden(res, 'You can only view messages with your friends');
    }

    // Get messages between two users
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId },
      ],
    })
      .populate('sender', 'name avatar email')
      .populate('recipient', 'name avatar email')
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 messages

    // Reverse to show oldest first
    messages.reverse();

    logger.info('Conversation retrieved', {
      currentUserId: currentUserId.toString(),
      otherUserId,
      messageCount: messages.length,
    });

    return ok(res, null, {
      messages: messages.map(m => formatMessageWithSender(m)),
      count: messages.length,
    });
  } catch (error) {
    logger.error('Get conversation error', error, {
      userId: req.params.userId,
    });
    next(error);
  }
};

// @desc    Get all conversations (list of users with messages)
// @route   GET /api/messages
// @access  Private
exports.getConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    // Get all unique users that current user has conversations with
    const messages = await Message.find({
      $or: [
        { sender: currentUserId },
        { recipient: currentUserId },
      ],
    })
      .populate('sender', 'name avatar email')
      .populate('recipient', 'name avatar email')
      .sort({ createdAt: -1 });

    // Group by other user and get latest message
    const conversationsMap = new Map();

    messages.forEach((message) => {
      const otherUser =
        message.sender._id.toString() === currentUserId.toString()
          ? message.recipient
          : message.sender;

      const otherUserId = otherUser._id.toString();

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          user: {
            id: otherUser._id.toString(),
            name: otherUser.name || '',
            avatar: otherUser.avatar || null,
            email: otherUser.email || '',
          },
          lastMessage: formatMessageWithSender(message),
          unreadCount: 0,
        });
      }

      // Update unread count if message is unread and recipient is current user
      if (
        message.recipient._id.toString() === currentUserId.toString() &&
        !message.read
      ) {
        const conversation = conversationsMap.get(otherUserId);
        conversation.unreadCount += 1;
      }
    });

    const conversations = Array.from(conversationsMap.values());

    logger.info('Conversations retrieved', {
      userId: currentUserId.toString(),
      count: conversations.length,
    });

    return ok(res, null, {
      conversations,
      count: conversations.length,
    });
  } catch (error) {
    logger.error('Get conversations error', error);
    next(error);
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/:userId/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const senderId = req.params.userId;

    if (!senderId) {
      return badRequest(res, 'Sender ID is required');
    }

    // Mark all unread messages from sender as read
    const result = await Message.updateMany(
      {
        sender: senderId,
        recipient: currentUserId,
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    logger.info('Messages marked as read', {
      currentUserId: currentUserId.toString(),
      senderId,
      count: result.modifiedCount,
    });

    // Emit socket event
    emitMessageEvent(req, socketEvents.MESSAGES_READ, {
      senderId,
      recipientId: currentUserId.toString(),
      count: result.modifiedCount,
    });

    return ok(res, 'Messages marked as read', {
      count: result.modifiedCount,
    });
  } catch (error) {
    logger.error('Mark as read error', error, {
      userId: req.params.userId,
    });
    next(error);
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread/count
// @access  Private
exports.getUnreadCount = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    const count = await Message.countDocuments({
      recipient: currentUserId,
      read: false,
    });

    return ok(res, null, {
      count,
    });
  } catch (error) {
    logger.error('Get unread count error', error);
    next(error);
  }
};

