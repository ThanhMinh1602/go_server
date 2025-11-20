const cloudinaryService = require('../services/cloudinaryService');
const logger = require('../services/logger');
const { ok, badRequest } = require('../utils/responseHelper');
const fs = require('fs');

// @desc    Upload image
// @route   POST /api/images/upload
// @access  Public (can be changed to Private if needed)
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      logger.warn('Image upload failed: no file', { body: req.body });
      return badRequest(res, 'No file uploaded');
    }

    const { restaurantId, userId } = req.body;
    const filePath = req.file.path;

    logger.debug('Image upload started', {
      filename: req.file.filename,
      size: req.file.size,
      restaurantId,
      userId,
    });

    // Determine folder based on context
    let folder = 'gogo';
    if (restaurantId) {
      folder = `gogo/restaurants/${restaurantId}`;
    } else if (userId) {
      folder = `gogo/users/${userId}`;
    }

    // Upload to Cloudinary
    const imageUrl = await cloudinaryService.uploadImage(filePath, folder);

    logger.info('Image uploaded successfully', {
      url: imageUrl,
      folder,
      filename: req.file.filename,
    });

    // Delete local file after upload
    fs.unlinkSync(filePath);

    return ok(res, 'Image uploaded successfully', {
      url: imageUrl,
    });
  } catch (error) {
    logger.error('Image upload error', error, {
      filename: req.file?.filename,
      restaurantId: req.body.restaurantId,
      userId: req.body.userId,
    });
    // Clean up local file if upload fails
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        logger.error('Error deleting local file', unlinkError);
      }
    }
    next(error);
  }
};

// @desc    Upload multiple images
// @route   POST /api/images/upload-multiple
// @access  Public (can be changed to Private if needed)
exports.uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return badRequest(res, 'No files uploaded');
    }

    const { restaurantId, userId } = req.body;
    const filePaths = req.files.map(file => file.path);

    // Determine folder
    let folder = 'gogo';
    if (restaurantId) {
      folder = `gogo/restaurants/${restaurantId}`;
    } else if (userId) {
      folder = `gogo/users/${userId}`;
    }

    // Upload all files
    const urls = await cloudinaryService.uploadMultipleImages(filePaths, folder);

    // Delete local files after upload
    req.files.forEach(file => {
      try {
        fs.unlinkSync(file.path);
      } catch (unlinkError) {
        logger.error('Error deleting local file', unlinkError);
      }
    });

    return ok(res, `${urls.length} image(s) uploaded successfully`, {
      urls,
      count: urls.length,
    });
  } catch (error) {
    // Clean up remaining files
    if (req.files) {
      req.files.forEach(file => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (unlinkError) {
          console.error('Error deleting local file:', unlinkError);
        }
      });
    }
    next(error);
  }
};

// @desc    Delete image
// @route   DELETE /api/images/:id
// @access  Public (can be changed to Private if needed)
exports.deleteImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const imageUrl = req.body.url || id; // Support both URL and ID

    await cloudinaryService.deleteImage(imageUrl);

    return ok(res, 'Image deleted successfully');
  } catch (error) {
    next(error);
  }
};
