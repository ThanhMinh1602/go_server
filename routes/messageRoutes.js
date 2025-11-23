const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
  getUnreadCount,
} = require('../controllers/messageController');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - content
 *             properties:
 *               recipientId:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden - not friends
 */
router.post('/', auth, sendMessage);

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Get all conversations
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get('/', auth, getConversations);

/**
 * @swagger
 * /api/messages/unread/count:
 *   get:
 *     summary: Get unread message count
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread message count
 */
router.get('/unread/count', auth, getUnreadCount);

/**
 * @swagger
 * /api/messages/{userId}:
 *   get:
 *     summary: Get conversation with a user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to get conversation with
 *     responses:
 *       200:
 *         description: Conversation messages
 *       403:
 *         description: Forbidden - not friends
 */
router.get('/:userId', auth, getConversation);

/**
 * @swagger
 * /api/messages/{userId}/read:
 *   put:
 *     summary: Mark messages as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Sender ID to mark messages as read
 *     responses:
 *       200:
 *         description: Messages marked as read
 */
router.put('/:userId/read', auth, markAsRead);

module.exports = router;

