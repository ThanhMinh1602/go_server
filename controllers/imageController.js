const cloudinaryService = require('../services/cloudinaryService');
const logger = require('../services/logger');
const fs = require('fs');

// @desc    Upload image
// @route   POST /api/images/upload
// @access  Public (can be changed to Private if needed)
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      logger.warn('Image upload failed: no file', { body: req.body });
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
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

    res.json({
      success: true,
      url: imageUrl,
      message: 'Image uploaded successfully',
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
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
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
        console.error('Error deleting local file:', unlinkError);
      }
    });

    res.json({
      success: true,
      urls,
      count: urls.length,
      message: `${urls.length} image(s) uploaded successfully`,
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

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
