const logger = require('../services/logger');

/**
 * Emit socket event to restaurants room
 * @param {Object} req - Express request object
 * @param {string} event - Event name
 * @param {Object} data - Data to emit
 */
function emitRestaurantEvent(req, event, data) {
  try {
    const io = req.app.get('io');
    if (!io) {
      logger.warn('Socket.IO not initialized, cannot emit event', { event });
      return;
    }

    logger.debug('Emitting restaurant event', { event, data });
    io.to('restaurants').emit(event, data);
  } catch (error) {
    logger.error('Error emitting socket event', error, { event, data });
  }
}

module.exports = {
  emitRestaurantEvent,
};

