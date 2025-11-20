const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
} = require('../controllers/imageController');

/**
 * @swagger
 * /api/images/upload:
 *   post:
 *     summary: Upload a single image
 *     tags: [Images]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (jpg, png, gif, webp)
 *               restaurantId:
 *                 type: string
 *                 description: Restaurant ID (optional)
 *               userId:
 *                 type: string
 *                 description: User ID (optional)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 url:
 *                   type: string
 *                   description: Image URL on Google Drive
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 */
router.post('/upload', upload.single('image'), uploadImage);

/**
 * @swagger
 * /api/images/upload-multiple:
 *   post:
 *     summary: Upload multiple images
 *     tags: [Images]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Image files (max 10)
 *               restaurantId:
 *                 type: string
 *                 description: Restaurant ID (optional)
 *               userId:
 *                 type: string
 *                 description: User ID (optional)
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 urls:
 *                   type: array
 *                   items:
 *                     type: string
 *                 count:
 *                   type: number
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 */
router.post('/upload-multiple', upload.array('images', 10), uploadMultipleImages);

/**
 * @swagger
 * /api/images/{id}:
 *   delete:
 *     summary: Delete an image
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Image ID or URL
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: Image URL (alternative to path parameter)
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Bad request
 */
router.delete('/:id', deleteImage);

module.exports = router;

