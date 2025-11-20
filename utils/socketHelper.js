const logger = require('../services/logger');

/**
 * Emit socket event to locations room
 * @param {Object} req - Express request object
 * @param {string} event - Event name
 * @param {Object} data - Data to emit
 */
function emitLocationEvent(req, event, data) {
  try {
    const io = req.app.get('io');
    if (!io) {
      logger.warn('Socket.IO not initialized, cannot emit event', { event });
      return;
    }

    logger.debug('Emitting location event', { event, data });
    io.to('locations').emit(event, data);
  } catch (error) {
    logger.error('Error emitting socket event', error, { event, data });
  }
}

module.exports = {
  emitLocationEvent,
};
