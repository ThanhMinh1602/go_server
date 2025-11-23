const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

// Initialize Firebase Admin SDK
let initialized = false;

function initializeFCM() {
  if (initialized) {
    return;
  }

  try {
    // Check if Firebase credentials are provided
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountPath) {
      // Resolve absolute path
      const absolutePath = path.isAbsolute(serviceAccountPath)
        ? serviceAccountPath
        : path.resolve(__dirname, '..', serviceAccountPath);
      
      // Check if file exists
      if (!fs.existsSync(absolutePath)) {
        logger.warn(`FCM service account file not found: ${absolutePath}`);
        return;
      }

      // Initialize with service account file
      const serviceAccount = require(absolutePath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      logger.info(`Firebase Admin SDK initialized with service account: ${absolutePath}`);
    } else if (serviceAccountJson) {
      // Initialize with service account JSON string
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      logger.info('Firebase Admin SDK initialized with service account JSON');
    } else {
      logger.warn('FCM not initialized: No Firebase credentials provided');
      return;
    }

    initialized = true;
    logger.info('Firebase Admin SDK initialized for FCM');
  } catch (error) {
    logger.error('Error initializing Firebase Admin SDK', error);
  }
}

// Initialize on module load
initializeFCM();

/**
 * Send FCM notification to a user
 * @param {string} fcmToken - FCM token of the recipient
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload
 * @returns {Promise<boolean>} - Success status
 */
async function sendNotification(fcmToken, title, body, data = {}) {
  if (!initialized || !fcmToken) {
    logger.warn('FCM not available or token missing', { fcmToken: !!fcmToken });
    return false;
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        // Convert all data values to strings (FCM requirement)
        ...Object.keys(data).reduce((acc, key) => {
          acc[key] = String(data[key]);
          return acc;
        }, {}),
      },
      token: fcmToken,
      android: {
        priority: 'high', // Highest priority for Android
        notification: {
          sound: 'default',
          channelId: 'friend_requests',
          priority: 'high', // High priority to show immediately
          visibility: 'public', // Show on lock screen
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        headers: {
          'apns-priority': '10', // Highest priority (10) for iOS
        },
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            alert: {
              title: title,
              body: body,
            },
            'content-available': 1, // Wake app if needed
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    logger.info('FCM notification sent successfully', {
      messageId: response,
      fcmToken: fcmToken.substring(0, 20) + '...',
    });
    return true;
  } catch (error) {
    logger.error('Error sending FCM notification', error, {
      fcmToken: fcmToken.substring(0, 20) + '...',
    });

    // If token is invalid, return false (caller should handle token removal)
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      return false;
    }

    return false;
  }
}

/**
 * Send friend request notification
 * @param {string} recipientFcmToken - FCM token of recipient
 * @param {object} requesterInfo - Requester user info
 * @param {string} requestId - Friend request ID
 * @returns {Promise<boolean>}
 */
async function sendFriendRequestNotification(recipientFcmToken, requesterInfo, requestId) {
  return sendNotification(
    recipientFcmToken,
    'Lời mời kết bạn mới',
    `${requesterInfo.name} muốn kết bạn với bạn`,
    {
      type: 'friend_request',
      requestId,
      requesterId: requesterInfo.id,
      requesterName: requesterInfo.name,
      requesterAvatar: requesterInfo.avatar || '',
    },
  );
}

/**
 * Send friend request accepted notification
 * @param {string} recipientFcmToken - FCM token of recipient
 * @param {object} accepterInfo - User who accepted the request
 * @returns {Promise<boolean>}
 */
async function sendFriendRequestAcceptedNotification(recipientFcmToken, accepterInfo) {
  return sendNotification(
    recipientFcmToken,
    'Lời mời kết bạn đã được chấp nhận',
    `${accepterInfo.name} đã chấp nhận lời mời kết bạn của bạn`,
    {
      type: 'friend_request_accepted',
      friendId: accepterInfo.id,
      friendName: accepterInfo.name,
      friendAvatar: accepterInfo.avatar || '',
    },
  );
}

module.exports = {
  sendNotification,
  sendFriendRequestNotification,
  sendFriendRequestAcceptedNotification,
  isInitialized: () => initialized,
};

