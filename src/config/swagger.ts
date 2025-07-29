import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import envVars from './environment';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Car Wash API',
      version: '1.0.0',
      description: 'A comprehensive API for car wash services management',
      contact: {
        name: 'Car Wash API Support',
        email: 'support@carwash.com',
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication operations',
      },
      {
        name: 'Users',
        description: 'User management operations',
      },
      {
        name: 'Services',
        description: 'Car wash service operations',
      },
      {
        name: 'Orders',
        description: 'Order management operations',
      },
      {
        name: 'Providers',
        description: 'Service provider operations',
      },
      {
        name: 'Cars',
        description: 'Car management operations',
      },
      {
        name: 'Payment',
        description: 'Payment method operations',
      },
      {
        name: 'Modules',
        description: 'Service module operations',
      },
      {
        name: 'Packages',
        description: 'Service package operations',
      },
      {
        name: 'Attachments',
        description: 'File attachment operations',
      },
      {
        name: 'Constants',
        description: 'System constants operations',
      },
      {
        name: 'System',
        description: 'System health and monitoring',
      },
    ],
    servers: [
      {
        url: envVars.baseUrl || 'http://localhost:3000',
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
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            data: {
              type: 'object',
              nullable: true,
            },
          },
        },
        NotFound: {
          type: 'object',
          properties: {
            status: {
              type: 'integer',
              example: 404,
            },
            message: {
              type: 'string',
              example: 'API endpoint not found',
            },
            path: {
              type: 'string',
              example: '/api/invalid-endpoint',
            },
            method: {
              type: 'string',
              example: 'GET',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00.000Z',
            },
            requestId: {
              type: 'string',
              example: 'req-12345',
            },
            availableEndpoints: {
              type: 'object',
              description: 'Only included in development environment',
              properties: {
                documentation: {
                  type: 'string',
                  example: '/api-docs',
                },
                health: {
                  type: 'string',
                  example: '/health',
                },
                authentication: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  example: ['/api/login', '/api/register'],
                },
              },
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
              example: 'Operation successful',
            },
            data: {
              type: 'object',
            },
          },
        },
        PaginationQuery: {
          type: 'object',
          properties: {
            take: {
              type: 'string',
              description: 'Number of items to take',
              example: '10',
            },
            skip: {
              type: 'string',
              description: 'Number of items to skip',
              example: '0',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            FirstName: {
              type: 'string',
              example: 'John',
            },
            LastName: {
              type: 'string',
              example: 'Doe',
            },
            Email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
            },
            MobileNumber: {
              type: 'string',
              example: '+1234567890',
            },
            UserTypeName: {
              type: 'string',
              example: 'Customer',
            },
          },
        },
        Service: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            ServiceName: {
              type: 'string',
              example: 'Basic Wash',
            },
            ServiceDescription: {
              type: 'string',
              example: 'Basic car washing service',
            },
          },
        },
        Provider: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            ProviderName: {
              type: 'string',
              example: 'Premium Car Wash',
            },
            longitude: {
              type: 'number',
              format: 'float',
              example: -122.4194,
            },
            latitude: {
              type: 'number',
              format: 'float',
              example: 37.7749,
            },
          },
        },
        Car: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            PlateNumber: {
              type: 'string',
              example: 'ABC123',
            },
            Model: {
              type: 'string',
              example: 'Toyota Camry',
            },
            Color: {
              type: 'string',
              example: 'Blue',
            },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            providerId: {
              type: 'integer',
              example: 1,
            },
            orderAmount: {
              type: 'number',
              format: 'float',
              example: 25.99,
            },
            addressString: {
              type: 'string',
              example: '123 Main St, City, State',
            },
            longitude: {
              type: 'number',
              format: 'float',
              example: -122.4194,
            },
            latitude: {
              type: 'number',
              format: 'float',
              example: 37.7749,
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/**/*.ts', './src/config/swagger.ts'],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (app as any).use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Car Wash API Documentation',
    }),
  );
};

export default specs;
