const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Go Server API',
      version: '1.0.0',
      description: 'Backend API for GoGo app - Replacement for Firebase',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5001}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
            },
            name: {
              type: 'string',
              description: 'User name',
            },
            phone: {
              type: 'string',
              nullable: true,
              description: 'User phone number',
            },
            avatar: {
              type: 'string',
              nullable: true,
              description: 'User avatar URL',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Location: {
          type: 'object',
          properties: {
            latitude: {
              type: 'number',
              description: 'Latitude',
            },
            longitude: {
              type: 'number',
              description: 'Longitude',
            },
            address: {
              type: 'string',
              description: 'Full address',
            },
            area: {
              type: 'string',
              description: 'Area/District',
            },
          },
          required: ['latitude', 'longitude', 'address', 'area'],
        },
        Restaurant: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Restaurant ID',
            },
            name: {
              type: 'string',
              description: 'Restaurant name',
            },
            types: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['food', 'coffee'],
              },
              description: 'Restaurant types',
            },
            imageUrls: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Image URLs',
            },
            location: {
              $ref: '#/components/schemas/Location',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
            },
            error: {
              type: 'string',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Restaurants',
        description: 'Restaurant CRUD endpoints',
      },
      {
        name: 'Images',
        description: 'Image upload/delete endpoints',
      },
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js', './server.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

