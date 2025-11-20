const mongoose = require('mongoose');
const logger = require('../services/logger');

const connectDB = async () => {
  try {
    logger.debug('Attempting to connect to MongoDB...', {
      uri: process.env.MONGODB_URI ? '***' : 'mongodb://localhost:27017/gogo_db',
    });

    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gogo_db');

    logger.info(`MongoDB Connected: ${conn.connection.host}`, {
      database: conn.connection.name,
      host: conn.connection.host,
      port: conn.connection.port,
    });
  } catch (error) {
    logger.error('Error connecting to MongoDB', error, {
      uri: process.env.MONGODB_URI ? '***' : 'mongodb://localhost:27017/gogo_db',
    });
    process.exit(1);
  }
};

// Log MongoDB events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  logger.error('MongoDB connection error', error);
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

module.exports = connectDB;

