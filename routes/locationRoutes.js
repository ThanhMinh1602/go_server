const express = require('express');
const router = express.Router();
const {
  getAllLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  getDistinctAreas,
} = require('../controllers/locationController');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * /api/locations/areas:
 *   get:
 *     summary: Get distinct areas
 *     tags: [Locations]
 *     responses:
 *       200:
 *         description: List of distinct areas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 areas:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/areas', auth, getDistinctAreas);

/**
 * @swagger
 * /api/locations/{id}:
 *   get:
 *     summary: Get location by ID
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 location:
 *                   $ref: '#/components/schemas/Location'
 *       404:
 *         description: Location not found
 *       403:
 *         description: Forbidden - not friend with location owner
 */
router.get('/:id', auth, getLocation);

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: Get all locations (only from friends)
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: area
 *         schema:
 *           type: string
 *         description: Filter by area
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [food, coffee]
 *         description: Filter by type
 *     responses:
 *       200:
 *         description: List of locations from friends
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 locations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Location'
 */
router.get('/', auth, getAllLocations);

/**
 * @swagger
 * /api/locations:
 *   post:
 *     summary: Create a new location
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - types
 *               - latLng
 *               - address
 *               - area
 *             properties:
 *               name:
 *                 type: string
 *               types:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [food, coffee]
 *               imageUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *               latLng:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *               address:
 *                 type: string
 *               area:
 *                 type: string
 *     responses:
 *       201:
 *         description: Location created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 location:
 *                   $ref: '#/components/schemas/Location'
 *       400:
 *         description: Bad request
 */
router.post('/', auth, createLocation);

/**
 * @swagger
 * /api/locations/{id}:
 *   put:
 *     summary: Update location
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               types:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [food, coffee]
 *               imageUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *               latLng:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *               address:
 *                 type: string
 *               area:
 *                 type: string
 *     responses:
 *       200:
 *         description: Location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 location:
 *                   $ref: '#/components/schemas/Location'
 *       404:
 *         description: Location not found
 */
router.put('/:id', auth, updateLocation);

/**
 * @swagger
 * /api/locations/{id}:
 *   delete:
 *     summary: Delete location
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Location not found
 *       403:
 *         description: Forbidden - not the owner
 */
router.delete('/:id', auth, deleteLocation);

module.exports = router;

