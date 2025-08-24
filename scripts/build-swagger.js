import swaggerJsdoc from 'swagger-jsdoc';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the swagger configuration (we'll need to adapt this for CommonJS)
const options = {
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
        url: process.env.BASE_URL || 'http://localhost:3000',
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

console.log('🔧 Building Swagger JSON specification...');

try {
  // Generate the swagger specification
  const specs = swaggerJsdoc(options);

  // Create the output directory if it doesn't exist
  const outputDir = path.join(__dirname, '../public');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write the swagger.json file
  const outputPath = path.join(outputDir, 'swagger.json');
  fs.writeFileSync(outputPath, JSON.stringify(specs, null, 2));

  console.log('✅ Swagger JSON generated successfully!');
  console.log(`📄 Output file: ${outputPath}`);
  console.log(`📊 Found ${Object.keys(specs.paths || {}).length} API endpoints`);
  console.log(`🏷️  Found ${specs.tags?.length || 0} tags`);
  console.log(`📋 Found ${Object.keys(specs.components?.schemas || {}).length} schemas`);

  // Also create a minified version
  const minifiedPath = path.join(outputDir, 'swagger.min.json');
  fs.writeFileSync(minifiedPath, JSON.stringify(specs));
  console.log(`🗜️  Minified version: ${minifiedPath}`);
} catch (error) {
  console.error('❌ Error generating Swagger JSON:', error.message);
  process.exit(1);
}
