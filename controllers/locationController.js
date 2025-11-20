const Location = require('../models/Location'); // Location model thay thế Restaurant
const logger = require('../services/logger');
const cloudinaryService = require('../services/cloudinaryService');
const { ok, created, badRequest, notFound } = require('../utils/responseHelper');
const { emitLocationEvent } = require('../utils/socketHelper');
const socketEvents = require('../utils/socketEvents');

// @desc    Get all locations
// @route   GET /api/locations
// @access  Public
exports.getAllLocations = async (req, res, next) => {
  try {
    const { area, type } = req.query;

    logger.debug('Get all locations', { area, type });

    let query = {};

    // Build query for filtering
    if (area && area !== 'All' && area !== 'all') {
      query.area = area; // Location model có area trực tiếp
    }

    if (type && type !== 'All' && type !== 'all') {
      query.types = { $in: [type] };
    }

    const locations = await Location.find(query).sort({ createdAt: -1 });

    logger.info('Locations retrieved', { count: locations.length, area, type });

    return ok(res, null, {
      count: locations.length,
      locations: locations.map(l => l.toJSON()),
    });
  } catch (error) {
    logger.error('Get all locations error', error, { area: req.query.area, type: req.query.type });
    next(error);
  }
};

// @desc    Get location by ID
// @route   GET /api/locations/:id
// @access  Public
exports.getLocation = async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return notFound(res, 'Location not found');
    }
    return ok(res, null, {
      location: location.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create location
// @route   POST /api/locations
// @access  Public (can be changed to Private if needed)
exports.createLocation = async (req, res, next) => {
  try {
    const { name, types, imageUrls, latLng, address, area } = req.body;

    logger.debug('Create location attempt', { name, types, hasLatLng: !!latLng });

    // Validation
    if (!name || !types || !Array.isArray(types) || types.length === 0) {
      logger.warn('Create location validation failed', { name, types });
      return badRequest(res, 'Please provide name and at least one type');
    }

    if (!latLng || !latLng.latitude || !latLng.longitude) {
      logger.warn('Create location validation failed', { hasLatLng: !!latLng });
      return badRequest(res, 'Please provide latLng with latitude and longitude');
    }

    if (!address || !area) {
      logger.warn('Create location validation failed', { address, area });
      return badRequest(res, 'Please provide address and area');
    }

    const location = await Location.create({
      name,
      types,
      imageUrls: imageUrls || [],
      latLng: {
        latitude: latLng.latitude,
        longitude: latLng.longitude,
      },
      address,
      area,
    });

    logger.info('Location created successfully', { locationId: location._id, name });

    // Emit socket event để notify clients
    emitLocationEvent(req, socketEvents.LOCATION_CREATED, {
      location: location.toJSON(),
    });

    return created(res, null, {
      location: location.toJSON(),
    });
  } catch (error) {
    logger.error('Create location error', error, { name: req.body.name });
    next(error);
  }
};

// @desc    Update location
// @route   PUT /api/locations/:id
// @access  Public (can be changed to Private if needed)
exports.updateLocation = async (req, res, next) => {
  try {
    const { name, types, imageUrls, latLng, address, area } = req.body;

    const location = await Location.findById(req.params.id);
    if (!location) {
      return notFound(res, 'Location not found');
    }

    // Lưu danh sách images cũ để so sánh và xóa
    const oldImageUrls = location.imageUrls ? [...location.imageUrls] : [];

    // Update fields
    if (name) location.name = name;
    if (types && Array.isArray(types)) location.types = types;
    if (imageUrls && Array.isArray(imageUrls)) location.imageUrls = imageUrls;
    if (latLng) {
      if (latLng.latitude !== undefined) location.latLng.latitude = latLng.latitude;
      if (latLng.longitude !== undefined) location.latLng.longitude = latLng.longitude;
    }
    if (address) location.address = address;
    if (area) location.area = area;

    // Xóa các images cũ không còn trong danh sách mới
    if (oldImageUrls.length > 0 && imageUrls && Array.isArray(imageUrls)) {
      const imagesToDelete = oldImageUrls.filter(
        (oldUrl) => !imageUrls.includes(oldUrl)
      );

      if (imagesToDelete.length > 0) {
        logger.debug('Deleting old location images', {
          locationId: location._id,
          imageCount: imagesToDelete.length,
          imagesToDelete,
        });

        try {
          await cloudinaryService.deleteMultipleImages(imagesToDelete);
          logger.info('Old location images deleted', {
            locationId: location._id,
            imageCount: imagesToDelete.length,
          });
        } catch (deleteError) {
          // Log error nhưng không throw để không ảnh hưởng đến việc update location
          logger.error('Error deleting old location images', deleteError, {
            locationId: location._id,
            imageCount: imagesToDelete.length,
          });
        }
      }
    }

    await location.save();

    logger.info('Location updated successfully', { locationId: location._id });

    // Emit socket event để notify clients
    emitLocationEvent(req, socketEvents.LOCATION_UPDATED, {
      location: location.toJSON(),
    });

    return ok(res, null, {
      location: location.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete location
// @route   DELETE /api/locations/:id
// @access  Public (can be changed to Private if needed)
exports.deleteLocation = async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return notFound(res, 'Location not found');
    }

    const locationId = location._id.toString();
    const folderPath = `gogo/locations/${locationId}`;

    // Delete all images in the location folder from Cloudinary
    // This will delete all images in the folder, not just the ones in imageUrls
    try {
      logger.debug('Deleting location folder from Cloudinary', {
        locationId,
        folderPath,
      });
      
      await cloudinaryService.deleteFolder(folderPath);
      
      logger.info('Location folder deleted from Cloudinary', {
        locationId,
        folderPath,
      });
    } catch (error) {
      // Log error but continue with location deletion
      logger.error('Error deleting location folder from Cloudinary', error, {
        locationId,
        folderPath,
      });
    }

    // Also delete images from imageUrls list (backup, in case folder deletion fails)
    if (location.imageUrls && location.imageUrls.length > 0) {
      try {
        logger.debug('Deleting location images from imageUrls', {
          locationId,
          imageCount: location.imageUrls.length,
        });
        
        await cloudinaryService.deleteMultipleImages(location.imageUrls);
        
        logger.info('Location images deleted', {
          locationId,
          imageCount: location.imageUrls.length,
        });
      } catch (error) {
        logger.error('Error deleting location images', error, {
          locationId,
        });
      }
    }

    // Delete location from database
    await location.deleteOne();

    logger.info('Location deleted successfully', { locationId });

    // Emit socket event để notify clients
    emitLocationEvent(req, socketEvents.LOCATION_DELETED, {
      locationId: locationId,
    });

    return ok(res, 'Location deleted');
  } catch (error) {
    logger.error('Delete location error', error, { locationId: req.params.id });
    next(error);
  }
};

// @desc    Get distinct areas
// @route   GET /api/locations/areas
// @access  Public
exports.getDistinctAreas = async (req, res, next) => {
  try {
    const locations = await Location.find({
      area: { $exists: true, $ne: null, $ne: '' },
    });

    const areas = [...new Set(locations.map(l => l.area).filter(Boolean))];
    areas.sort();

    return ok(res, null, {
      areas,
    });
  } catch (error) {
    next(error);
  }
};

