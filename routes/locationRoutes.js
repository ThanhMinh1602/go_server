const express = require('express');
const router = express.Router();
const {
  getAddress,
  getFullAddress,
} = require('../controllers/locationController');

/**
 * @swagger
 * /api/location/address:
 *   get:
 *     summary: Get address (area/town name) from latitude and longitude
 *     tags: [Location]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude
 *     responses:
 *       200:
 *         description: Address information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 address:
 *                   type: string
 *                   description: Area/town name
 *       400:
 *         description: Bad request (missing or invalid lat/lng)
 */
router.get('/address', getAddress);

/**
 * @swagger
 * /api/location/full-address:
 *   get:
 *     summary: Get full address information from latitude and longitude
 *     tags: [Location]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude
 *     responses:
 *       200:
 *         description: Full address information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 area:
 *                   type: string
 *                   description: Area name (Xã/Phường/Thị trấn)
 *                 address:
 *                   type: string
 *                   description: Full address
 *                 name:
 *                   type: string
 *                   description: Place name (POI name if available)
 *       400:
 *         description: Bad request (missing or invalid lat/lng)
 */
router.get('/full-address', getFullAddress);

module.exports = router;

