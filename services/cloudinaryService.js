const cloudinary = require('cloudinary').v2;
const logger = require('./logger');
const fs = require('fs');

class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(filePath, folder = 'gogo', options = {}) {
    try {
      const { publicId, overwrite = false } = options;
      
      logger.debug('Uploading image to Cloudinary', { folder, filePath, publicId, overwrite });
      
      const uploadOptions = {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { width: 1920, height: 1920, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      };

      // Nếu có publicId, sử dụng nó để đảm bảo file được thay thế
      if (publicId) {
        uploadOptions.public_id = publicId;
        uploadOptions.overwrite = overwrite !== false; // Mặc định overwrite = true nếu có publicId
      }

      const result = await cloudinary.uploader.upload(filePath, uploadOptions);

      logger.debug('Image uploaded to Cloudinary', {
        publicId: result.public_id,
        url: result.secure_url,
        size: result.bytes,
      });

      return result.secure_url;
    } catch (error) {
      logger.error('Error uploading image to Cloudinary', error, { folder, filePath });
      throw error;
    }
  }

  async uploadMultipleImages(filePaths, folder = 'gogo') {
    try {
      const urls = [];
      for (const filePath of filePaths) {
        const url = await this.uploadImage(filePath, folder);
        urls.push(url);
      }
      return urls;
    } catch (error) {
      console.error('Error uploading multiple images to Cloudinary:', error);
      throw error;
    }
  }

  async deleteImage(imageUrl) {
    try {
      // Extract public_id from Cloudinary URL
      const publicId = this.extractPublicId(imageUrl);
      
      if (!publicId) {
        logger.warn('Could not extract public_id from Cloudinary URL', { imageUrl });
        return;
      }

      logger.debug('Deleting image from Cloudinary', { publicId, imageUrl });
      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result === 'ok') {
        logger.info('Image deleted from Cloudinary', { publicId });
      } else {
        logger.warn('Image deletion result', { publicId, result: result.result });
      }
    } catch (error) {
      // Don't throw error if file doesn't exist
      if (error.http_code !== 404) {
        logger.error('Error deleting image from Cloudinary', error, { imageUrl });
      } else {
        logger.debug('Image not found in Cloudinary (404)', { imageUrl });
      }
    }
  }

  async deleteMultipleImages(imageUrls) {
    try {
      if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        return;
      }

      logger.debug('Deleting multiple images from Cloudinary', { count: imageUrls.length });
      
      // Delete all images in parallel
      const deletePromises = imageUrls.map(url => this.deleteImage(url));
      await Promise.all(deletePromises);
      
      logger.info('Multiple images deletion completed', { count: imageUrls.length });
    } catch (error) {
      logger.error('Error deleting multiple images from Cloudinary', error, { count: imageUrls?.length });
      // Don't throw - continue even if some deletions fail
    }
  }

  extractPublicId(url) {
    if (!url) return null;

    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
    // or: https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}.{format}
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    
    if (match && match[1]) {
      // Remove file extension if present
      return match[1].replace(/\.[^.]+$/, '');
    }

    return null;
  }
}

module.exports = new CloudinaryService();

