const Location = require('../models/Location'); // Location model thay thế Restaurant
const Friend = require('../models/Friend');
const logger = require('../services/logger');
const cloudinaryService = require('../services/cloudinaryService');
const { ok, created, badRequest, notFound, forbidden } = require('../utils/responseHelper');
const { emitLocationEvent } = require('../utils/socketHelper');
const socketEvents = require('../utils/socketEvents');

// Helper function to format location with creator info
const formatLocationWithCreator = (location) => {
  const locationObj = location.toJSON ? location.toJSON() : location.toObject();
  
  // If userId is populated (has user info)
  if (location.userId && typeof location.userId === 'object' && location.userId._id) {
    locationObj.createdBy = {
      id: location.userId._id.toString(),
      name: location.userId.name || '',
      avatar: location.userId.avatar || null,
      email: location.userId.email || '',
    };
    // Keep userId for backward compatibility
    locationObj.userId = location.userId._id.toString();
  } else if (location.userId) {
    // If userId is just an ObjectId, keep it as is
    locationObj.userId = location.userId.toString();
    locationObj.createdBy = null; // Will be populated if needed
  }
  
  return locationObj;
};

// @desc    Get all locations (only from friends)
// @route   GET /api/locations
// @access  Private
exports.getAllLocations = async (req, res, next) => {
  try {
    const { area, type } = req.query;
    const userId = req.user._id;

    logger.debug('Get all locations', { userId, area, type });

    // Get list of friend IDs (both requester and recipient)
    const friendships = await Friend.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' },
      ],
    });

    const friendIds = friendships.map(friendship => {
      const friendId = friendship.requester._id.toString() === userId.toString()
        ? friendship.recipient._id
        : friendship.requester._id;
      return friendId;
    });

    // Include current user's own locations
    friendIds.push(userId);

    // Build query for filtering
    let query = {
      userId: { $in: friendIds },
    };

    if (area && area !== 'All' && area !== 'all') {
      query.area = area;
    }

    if (type && type !== 'All' && type !== 'all') {
      query.types = { $in: [type] };
    }

    const locations = await Location.find(query)
      .populate('userId', 'name avatar email')
      .sort({ createdAt: -1 });

    logger.info('Locations retrieved', { 
      count: locations.length, 
      area, 
      type,
      friendCount: friendIds.length - 1, // Exclude current user
    });

    return ok(res, null, {
      count: locations.length,
      locations: locations.map(l => formatLocationWithCreator(l)),
    });
  } catch (error) {
    logger.error('Get all locations error', error, { area: req.query.area, type: req.query.type });
    next(error);
  }
};

// @desc    Get locations by current user (only own locations)
// @route   GET /api/locations/user/me
// @access  Private
exports.getLocationsByUser = async (req, res, next) => {
  try {
    const { area, type } = req.query;
    const userId = req.user._id;

    logger.debug('Get locations by user', { userId, area, type });

    // Build query for filtering - chỉ lấy locations của user hiện tại
    let query = {
      userId: userId,
    };

    if (area && area !== 'All' && area !== 'all') {
      query.area = area;
    }

    if (type && type !== 'All' && type !== 'all') {
      query.types = { $in: [type] };
    }

    const locations = await Location.find(query)
      .populate('userId', 'name avatar email')
      .sort({ createdAt: -1 });

    logger.info('User locations retrieved', { 
      count: locations.length, 
      area, 
      type,
      userId: userId.toString(),
    });

    return ok(res, null, {
      count: locations.length,
      locations: locations.map(l => formatLocationWithCreator(l)),
    });
  } catch (error) {
    logger.error('Get locations by user error', error, { area: req.query.area, type: req.query.type });
    next(error);
  }
};

// @desc    Get location by ID (only if friend or owner)
// @route   GET /api/locations/:id
// @access  Private
exports.getLocation = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const location = await Location.findById(req.params.id)
      .populate('userId', 'name avatar email');
    
    if (!location) {
      return notFound(res, 'Location not found');
    }

    // Get location owner ID (handle both populated and non-populated cases)
    const locationOwnerId = location.userId._id 
      ? location.userId._id.toString() 
      : location.userId.toString();

    // Check if user is the owner
    if (locationOwnerId === userId.toString()) {
      return ok(res, null, {
        location: formatLocationWithCreator(location),
      });
    }

    // Check if user is friend with location owner
    const friendship = await Friend.findOne({
      $or: [
        { requester: userId, recipient: locationOwnerId, status: 'accepted' },
        { requester: locationOwnerId, recipient: userId, status: 'accepted' },
      ],
    });

    if (!friendship) {
      return forbidden(res, 'You can only view locations from your friends');
    }

    return ok(res, null, {
      location: formatLocationWithCreator(location),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create location
// @route   POST /api/locations
// @access  Private
exports.createLocation = async (req, res, next) => {
  try {
    const { name, types, imageUrls, latLng, address, area } = req.body;
    const userId = req.user._id;

    logger.debug('Create location attempt', { userId, name, types, hasLatLng: !!latLng });

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
      userId,
    });

    logger.info('Location created successfully', { locationId: location._id, name, userId });

    // Populate user info before sending response
    await location.populate('userId', 'name avatar email');

    // Emit socket event để notify clients
    emitLocationEvent(req, socketEvents.LOCATION_CREATED, {
      location: formatLocationWithCreator(location),
    });

    return created(res, null, {
      location: formatLocationWithCreator(location),
    });
  } catch (error) {
    logger.error('Create location error', error, { name: req.body.name });
    next(error);
  }
};

// @desc    Update location
// @route   PUT /api/locations/:id
// @access  Private (only owner can update)
exports.updateLocation = async (req, res, next) => {
  try {
    const { name, types, imageUrls, latLng, address, area } = req.body;
    const userId = req.user._id;

    const location = await Location.findById(req.params.id);
    if (!location) {
      return notFound(res, 'Location not found');
    }

    // Check if user is the owner
    if (location.userId.toString() !== userId.toString()) {
      return forbidden(res, 'You can only update your own locations');
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

    // Populate user info before sending response
    await location.populate('userId', 'name avatar email');

    logger.info('Location updated successfully', { locationId: location._id });

    // Emit socket event để notify clients
    emitLocationEvent(req, socketEvents.LOCATION_UPDATED, {
      location: formatLocationWithCreator(location),
    });

    return ok(res, null, {
      location: formatLocationWithCreator(location),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete location
// @route   DELETE /api/locations/:id
// @access  Private (only owner can delete)
exports.deleteLocation = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const location = await Location.findById(req.params.id);
    if (!location) {
      return notFound(res, 'Location not found');
    }

    // Check if user is the owner
    if (location.userId.toString() !== userId.toString()) {
      return forbidden(res, 'You can only delete your own locations');
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

// @desc    Get distinct areas (only from friends' locations)
// @route   GET /api/locations/areas
// @access  Private
exports.getDistinctAreas = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get list of friend IDs
    const friendships = await Friend.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' },
      ],
    });

    const friendIds = friendships.map(friendship => {
      const friendId = friendship.requester._id.toString() === userId.toString()
        ? friendship.recipient._id
        : friendship.requester._id;
      return friendId;
    });

    // Include current user's own locations
    friendIds.push(userId);

    const locations = await Location.find({
      userId: { $in: friendIds },
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

