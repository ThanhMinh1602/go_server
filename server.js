require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./services/logger');
const { morganMiddleware, requestLogger } = require('./middleware/logger');
const { ok, notFound } = require('./utils/responseHelper');
const socketEvents = require('./utils/socketEvents');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const locationRoutes = require('./routes/locationRoutes');
const imageRoutes = require('./routes/imageRoutes');
const geocodingRoutes = require('./routes/geocodingRoutes');
const friendRoutes = require('./routes/friendRoutes');

// Connect to database
connectDB();

// Initialize app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });

  // Join room để nhận updates về locations
  socket.on(socketEvents.JOIN_LOCATIONS, () => {
    socket.join('locations');
    logger.debug('Client joined locations room', { socketId: socket.id });
  });

  // Leave room
  socket.on(socketEvents.LEAVE_LOCATIONS, () => {
    socket.leave('locations');
    logger.debug('Client left locations room', { socketId: socket.id });
  });

  // Join user room for friend updates
  socket.on('join:user', (userId) => {
    socket.join(`user:${userId}`);
    logger.debug('Client joined user room', { socketId: socket.id, userId });
  });

  // Leave user room
  socket.on('leave:user', (userId) => {
    socket.leave(`user:${userId}`);
    logger.debug('Client left user room', { socketId: socket.id, userId });
  });

  // Join friends room
  socket.on(socketEvents.JOIN_FRIENDS, () => {
    socket.join('friends');
    logger.debug('Client joined friends room', { socketId: socket.id });
  });

  // Leave friends room
  socket.on(socketEvents.LEAVE_FRIENDS, () => {
    socket.leave('friends');
    logger.debug('Client left friends room', { socketId: socket.id });
  });
});

// Export io để sử dụng trong controllers
app.set('io', io);

// Logging middleware (phải đặt đầu tiên)
app.use(morganMiddleware);
app.use(requestLogger);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Go Server API Documentation',
}));

// Health check
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 */
app.get('/health', (req, res) => {
  return ok(res, 'Server is running', {
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/location', geocodingRoutes);
app.use('/api/friends', friendRoutes);

// 404 handler
app.use((req, res) => {
  return notFound(res, 'Route not found');
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Log level: ${process.env.LOG_LEVEL || 'debug'}`);
  logger.info(`Socket.IO enabled on port ${PORT}`);
  logger.debug('Server initialized successfully');
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use. Please kill the process using this port or use a different port.`);
    logger.error(`To find and kill the process: lsof -ti:${PORT} | xargs kill`);
    process.exit(1);
  } else {
    logger.error('Server error:', err);
    process.exit(1);
  }
});

