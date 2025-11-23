const express = require('express');
const router = express.Router();
const {
  getQRCodeLink,
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  addFriendFromQR,
  deleteFriend,
} = require('../controllers/friendController');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * /api/friends/qr-code:
 *   get:
 *     summary: Get QR code link for friend request
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QR code link
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 qrLink:
 *                   type: string
 *                 userId:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/qr-code', auth, getQRCodeLink);

/**
 * @swagger
 * /api/friends/request:
 *   post:
 *     summary: Send friend request
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipientId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Friend request sent
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/request', auth, sendFriendRequest);

/**
 * @swagger
 * /api/friends/requests:
 *   get:
 *     summary: Get pending friend requests
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending friend requests
 *       401:
 *         description: Unauthorized
 */
router.get('/requests', auth, getFriendRequests);

/**
 * @swagger
 * /api/friends/requests/{id}/accept:
 *   put:
 *     summary: Accept friend request
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Friend request accepted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.put('/requests/:id/accept', auth, acceptFriendRequest);

/**
 * @swagger
 * /api/friends/requests/{id}/reject:
 *   put:
 *     summary: Reject friend request
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Friend request rejected
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.put('/requests/:id/reject', auth, rejectFriendRequest);

/**
 * @swagger
 * /api/friends:
 *   get:
 *     summary: Get friends list
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of friends
 *       401:
 *         description: Unauthorized
 */
router.get('/', auth, getFriends);

/**
 * @swagger
 * /api/friends/scan:
 *   post:
 *     summary: Add friend from QR code scan
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Friend request sent
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/scan', auth, addFriendFromQR);

/**
 * @swagger
 * /api/friends/{id}:
 *   delete:
 *     summary: Delete friend (unfriend)
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Friendship ID
 *     responses:
 *       200:
 *         description: Friend removed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Friendship not found
 */
router.delete('/:id', auth, deleteFriend);

module.exports = router;

