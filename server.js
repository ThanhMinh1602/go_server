require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./services/logger');
const { morganMiddleware, requestLogger } = require('./middleware/logger');
const { ok, notFound } = require('./utils/responseHelper');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const imageRoutes = require('./routes/imageRoutes');
const locationRoutes = require('./routes/locationRoutes');

// Connect to database
connectDB();

// Initialize app
const app = express();

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
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/location', locationRoutes);

// 404 handler
app.use((req, res) => {
  return notFound(res, 'Route not found');
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Log level: ${process.env.LOG_LEVEL || 'debug'}`);
  logger.debug('Server initialized successfully');
});

