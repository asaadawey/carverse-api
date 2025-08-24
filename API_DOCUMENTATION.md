# Car Wash API Documentation

## Overview

The Car Wash API is a comprehensive RESTful API built with Node.js, Express, TypeScript, and Prisma. It provides a complete backend solution for car wash service management, including user authentication, service booking, provider management, and payment processing.

## Features

- **User Authentication**: JWT-based authentication with role-based access control
- **Service Management**: Create and manage car wash services and packages
- **Provider Management**: Handle service providers and their offerings
- **Order Processing**: Complete order lifecycle management with payment integration
- **File Uploads**: Secure file upload and management system
- **Real-time Features**: WebSocket support for real-time updates
- **Payment Integration**: Stripe integration for secure payments
- **Rate Limiting**: Redis-based rate limiting for API protection

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt for password hashing
- **File Storage**: AWS S3 integration
- **Caching**: Redis for sessions and rate limiting
- **Documentation**: Swagger/OpenAPI 3.0
- **Testing**: Jest with integration tests
- **Security**: Helmet, CORS, CSRF protection

## API Documentation

The API documentation is available via Swagger UI at `/api-docs` when the server is running.

### Base URL

```
Development: http://localhost:3000
Production: [Your production URL]
```

### Authentication

The API uses Bearer token authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Alternatively, you can use cookie-based authentication for web clients.

## API Endpoints

### Authentication

- `POST /login` - User login
- `POST /register` - User registration
- `POST /checkUserExist` - Check if user exists

### Users

- `GET /getUserDetails/{userId?}` - Get user details
- `POST /addDeleteRequest/{userId?}` - Request account deletion
- `GET /processDeleteRequest/{deleteRequestId}` - Process deletion request (Admin)
- `GET /getPreviousAddresses` - Get user's previous addresses

### Services

- `GET /services/{moduleId}` - Get all services for a module
- `GET /services/{moduleId}/{providerId}` - Get provider services
- `POST /services/add` - Add new service

### Orders

- `POST /orders/add` - Create new order
- `GET /orders/one/{id}` - Get order details
- `GET /orders/getOrderStatements` - Get order amount breakdown
- `POST /orders/confirmOrder/{orderId}` - Confirm order

### Providers

- `GET /providers` - Get all providers
- `GET /providers/one/{id}` - Get provider details
- `POST /providers/services/add` - Add provider service

### Cars

- `GET /cars` - Get user's cars
- `GET /cars/bodyTypes` - Get car body types
- `POST /cars/add` - Add new car
- `GET /car/checkCarExist/{plateNumber}` - Verify car number

### Payment

- `GET /payment/methods` - Get payment methods

### Modules

- `GET /modules` - Get all service modules

### Packages

- `GET /packages/{moduleId}` - Get packages for module

### Attachments

- `GET /attachments/getTypes` - Get attachment types
- `GET /attachments/getListOfAttachments/{typeName}` - Get attachments by type
- `GET /attachments/getImages` - Get image
- `POST /attachments/upload/{userId}/{attachmentTypeId}` - Upload file

### Constants

- `GET /constants` - Get system constants
- `PUT /constants/update` - Update constant (Admin)

### System

- `GET /health` - Health check
- `GET /cvapi-csrf` - Get CSRF token

## Data Models

### User

```typescript
{
  id: number;
  FirstName: string;
  LastName: string;
  Email: string;
  MobileNumber: string;
  UserTypeName: string;
}
```

### Service

```typescript
{
  id: number;
  ServiceName: string;
  ServiceDescription: string;
}
```

### Order

```typescript
{
  id: number;
  providerId: number;
  orderAmount: number;
  addressString: string;
  longitude: number;
  latitude: number;
}
```

### Provider

```typescript
{
  id: number;
  ProviderName: string;
  longitude: number;
  latitude: number;
}
```

### Car

```typescript
{
  id: number;
  PlateNumber: string;
  Model: string;
  Color: string;
}
```

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    /* Response data */
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

## Error Codes

- `200` - Success
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Security Features

- **Rate Limiting**: 100 requests per 2 minutes per IP
- **CORS**: Configurable CORS policy
- **Helmet**: Security headers
- **CSRF Protection**: Double-submit cookie pattern
- **Input Validation**: Yup schema validation
- **SQL Injection Protection**: Prisma ORM parameterized queries
- **JWT Security**: Signed tokens with expiration

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/carwash

# JWT
JWT_SECRET=your-jwt-secret
APP_SECRET=your-app-secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=your-redis-password

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# App Configuration
PORT=3000
BASE_URL=http://localhost:3000
NODE_ENV=development
```

## Development

### Prerequisites

- Node.js 16+
- PostgreSQL
- Redis
- AWS S3 account (for file uploads)
- Stripe account (for payments)

### Installation

1. Clone the repository
2. Install dependencies: `yarn install`
3. Set up environment variables
4. Run database migrations: `yarn prisma:migrate`
5. Seed the database: `yarn seed`
6. Start development server: `yarn dev`

### Testing

- Unit tests: `yarn test`
- Integration tests: `yarn test:intg`
- All tests: `yarn test:all`

### API Documentation

Access the Swagger documentation at `http://localhost:3000/api-docs` when running in development mode.

## Production Deployment

1. Build the application: `yarn build`
2. Start the production server: `yarn start`
3. Ensure all environment variables are properly configured
4. Set up proper SSL certificates
5. Configure reverse proxy (nginx/Apache)
6. Set up monitoring and logging

## WebSocket Events

The API supports real-time features through WebSocket connections:

- `online-users` - Broadcast online providers
- `order-updates` - Real-time order status updates
- `provider-location` - Provider location updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.
