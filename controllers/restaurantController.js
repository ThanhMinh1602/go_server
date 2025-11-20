const Restaurant = require('../models/Restaurant');
const logger = require('../services/logger');
const cloudinaryService = require('../services/cloudinaryService');
const { ok, created, badRequest, notFound } = require('../utils/responseHelper');
const { emitRestaurantEvent } = require('../utils/socketHelper');
const socketEvents = require('../utils/socketEvents');

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
exports.getAllRestaurants = async (req, res, next) => {
  try {
    const { area, type } = req.query;

    logger.debug('Get all restaurants', { area, type });

    let query = {};

    // Build query for filtering
    if (area && area !== 'All' && area !== 'all') {
      query['location.area'] = area;
    }

    if (type && type !== 'All' && type !== 'all') {
      query.types = { $in: [type] };
    }

    const restaurants = await Restaurant.find(query).sort({ createdAt: -1 });

    logger.info('Restaurants retrieved', { count: restaurants.length, area, type });

    return ok(res, null, {
      count: restaurants.length,
      restaurants: restaurants.map(r => r.toJSON()),
    });
  } catch (error) {
    logger.error('Get all restaurants error', error, { area: req.query.area, type: req.query.type });
    next(error);
  }
};

// @desc    Get restaurant by ID
// @route   GET /api/restaurants/:id
// @access  Public
exports.getRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return notFound(res, 'Restaurant not found');
    }
    return ok(res, null, {
      restaurant: restaurant.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create restaurant
// @route   POST /api/restaurants
// @access  Public (can be changed to Private if needed)
exports.createRestaurant = async (req, res, next) => {
  try {
    const { name, types, imageUrls, location } = req.body;

    logger.debug('Create restaurant attempt', { name, types, hasLocation: !!location });

    // Validation
    if (!name || !types || !Array.isArray(types) || types.length === 0) {
      logger.warn('Create restaurant validation failed', { name, types });
      return badRequest(res, 'Please provide name and at least one type');
    }

    const restaurant = await Restaurant.create({
      name,
      types,
      imageUrls: imageUrls || [],
      location: location || null,
    });

    logger.info('Restaurant created successfully', { restaurantId: restaurant._id, name });

    // Emit socket event để notify clients
    emitRestaurantEvent(req, socketEvents.RESTAURANT_CREATED, {
      restaurant: restaurant.toJSON(),
    });

    return created(res, null, {
      restaurant: restaurant.toJSON(),
    });
  } catch (error) {
    logger.error('Create restaurant error', error, { name: req.body.name });
    next(error);
  }
};

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Public (can be changed to Private if needed)
exports.updateRestaurant = async (req, res, next) => {
  try {
    const { name, types, imageUrls, location } = req.body;

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return notFound(res, 'Restaurant not found');
    }

    // Lưu danh sách images cũ để so sánh và xóa
    const oldImageUrls = restaurant.imageUrls ? [...restaurant.imageUrls] : [];

    // Update fields
    if (name) restaurant.name = name;
    if (types && Array.isArray(types)) restaurant.types = types;
    if (imageUrls && Array.isArray(imageUrls)) restaurant.imageUrls = imageUrls;
    if (location !== undefined) restaurant.location = location;

    // Xóa các images cũ không còn trong danh sách mới
    if (oldImageUrls.length > 0 && imageUrls && Array.isArray(imageUrls)) {
      const imagesToDelete = oldImageUrls.filter(
        (oldUrl) => !imageUrls.includes(oldUrl)
      );

      if (imagesToDelete.length > 0) {
        logger.debug('Deleting old restaurant images', {
          restaurantId: restaurant._id,
          imageCount: imagesToDelete.length,
          imagesToDelete,
        });

        try {
          await cloudinaryService.deleteMultipleImages(imagesToDelete);
          logger.info('Old restaurant images deleted', {
            restaurantId: restaurant._id,
            imageCount: imagesToDelete.length,
          });
        } catch (deleteError) {
          // Log error nhưng không throw để không ảnh hưởng đến việc update restaurant
          logger.error('Error deleting old restaurant images', deleteError, {
            restaurantId: restaurant._id,
            imageCount: imagesToDelete.length,
          });
        }
      }
    }

    await restaurant.save();

    logger.info('Restaurant updated successfully', { restaurantId: restaurant._id });

    // Emit socket event để notify clients
    emitRestaurantEvent(req, socketEvents.RESTAURANT_UPDATED, {
      restaurant: restaurant.toJSON(),
    });

    return ok(res, null, {
      restaurant: restaurant.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete restaurant
// @route   DELETE /api/restaurants/:id
// @access  Public (can be changed to Private if needed)
exports.deleteRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return notFound(res, 'Restaurant not found');
    }

    const restaurantId = restaurant._id.toString();
    const folderPath = `gogo/restaurants/${restaurantId}`;

    // Delete all images in the restaurant folder from Cloudinary
    // This will delete all images in the folder, not just the ones in imageUrls
    try {
      logger.debug('Deleting restaurant folder from Cloudinary', {
        restaurantId,
        folderPath,
      });
      
      await cloudinaryService.deleteFolder(folderPath);
      
      logger.info('Restaurant folder deleted from Cloudinary', {
        restaurantId,
        folderPath,
      });
    } catch (error) {
      // Log error but continue with restaurant deletion
      logger.error('Error deleting restaurant folder from Cloudinary', error, {
        restaurantId,
        folderPath,
      });
    }

    // Also delete images from imageUrls list (backup, in case folder deletion fails)
    if (restaurant.imageUrls && restaurant.imageUrls.length > 0) {
      try {
        logger.debug('Deleting restaurant images from imageUrls', {
          restaurantId,
          imageCount: restaurant.imageUrls.length,
        });
        
        await cloudinaryService.deleteMultipleImages(restaurant.imageUrls);
        
        logger.info('Restaurant images deleted', {
          restaurantId,
          imageCount: restaurant.imageUrls.length,
        });
      } catch (error) {
        logger.error('Error deleting restaurant images', error, {
          restaurantId,
        });
      }
    }

    // Delete restaurant from database
    await restaurant.deleteOne();

    logger.info('Restaurant deleted successfully', { restaurantId });

    // Emit socket event để notify clients
    emitRestaurantEvent(req, socketEvents.RESTAURANT_DELETED, {
      restaurantId,
    });

    return ok(res, 'Restaurant deleted');
  } catch (error) {
    logger.error('Delete restaurant error', error, { restaurantId: req.params.id });
    next(error);
  }
};

// @desc    Get distinct areas
// @route   GET /api/restaurants/areas
// @access  Public
exports.getDistinctAreas = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find({
      'location.area': { $exists: true, $ne: null, $ne: '' },
    });

    const areas = [...new Set(restaurants.map(r => r.location?.area).filter(Boolean))];
    areas.sort();

    return ok(res, null, {
      areas,
    });
  } catch (error) {
    next(error);
  }
};

