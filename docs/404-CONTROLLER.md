# 404 Not Found Controller

## Overview

The Car Wash API includes a comprehensive 404 Not Found controller that handles all unmatched API routes. This controller provides structured error responses and helpful information when clients attempt to access non-existent endpoints.

## 🎯 Features

### Structured Response

- Consistent JSON format for all 404 responses
- Request tracking with correlation IDs
- Timestamp for debugging
- Method and path information

### Helpful Information

- Lists available API endpoints
- Suggests correct endpoints
- Provides API documentation links
- Includes health check endpoint

### Logging Integration

- Logs all 404 attempts with full context
- Tracks IP addresses and user agents
- Records query parameters and headers
- Integrates with Winston logging system

## 📊 Response Format

### Development Environment

```json
{
  "status": 404,
  "message": "API endpoint not found",
  "path": "/api/invalid-endpoint",
  "method": "GET",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req-12345",
  "availableEndpoints": {
    "documentation": "/api-docs",
    "health": "/health",
    "authentication": ["/api/login", "/api/register"],
    "users": ["/api/getUserDetails", "/api/checkUserExist"],
    "orders": ["/api/orders/add", "/api/orders/one/:id"],
    "providers": ["/api/providers", "/api/providers/one/:id"],
    "cars": ["/api/cars", "/api/cars/add"],
    "services": ["/api/services/:moduleId"],
    "packages": ["/api/packages/:moduleId"]
  }
}
```

### Production Environment

```json
{
  "status": 404,
  "message": "API endpoint not found",
  "path": "/api/invalid-endpoint",
  "method": "GET",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req-12345"
}
```

## 🚀 Usage Examples

### Basic 404 Response

```bash
curl -X GET "http://localhost:3000/api/non-existent-endpoint"
```

### POST to Invalid Endpoint

```bash
curl -X POST "http://localhost:3000/api/invalid-resource" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### With Request ID Tracking

```bash
curl -X GET "http://localhost:3000/api/missing" \
  -H "req_id: custom-request-123"
```

## 🔧 Implementation Details

### Environment-Specific Behavior

The 404 controller behaves differently based on the environment:

- **Development (`isDev = true`)**: Includes `availableEndpoints` in the response to help developers discover valid API endpoints
- **Production (`isDev = false`)**: Excludes `availableEndpoints` to prevent information disclosure and maintain security

### Route Handler Placement

The 404 controller is placed as a catch-all route (`*`) after all other routes but before error middleware:

```typescript
app.use(apiPrefix, routes); // All API routes
app.use('*', notFoundController); // 404 handler
app.use(errorMiddleware); // Error handling
```

### Logging Context

Each 404 attempt logs the following information:

- HTTP method and path
- Client IP address
- User agent string
- Request headers (origin, referer)
- Query parameters
- Request correlation ID

### Performance Considerations

- Lightweight response generation
- No database queries
- Minimal processing overhead
- Fast response times

## 🧪 Testing

### Automated Tests

Run the 404 controller tests:

```bash
# Windows
scripts\test-404.bat

# Manual testing
npm run build
node scripts/test-404.js
```

### Manual Testing Scenarios

1. **Non-existent endpoints**: `/api/non-existent`
2. **Typos in valid endpoints**: `/api/loginn` instead of `/api/login`
3. **Wrong HTTP methods**: `DELETE /api/login`
4. **Invalid resource IDs**: `/api/users/invalid-id`
5. **Special characters**: `/api/test@#$%endpoint`

## 📈 Monitoring

### Log Analysis

404 responses are logged as warnings and can be monitored for:

- Frequent 404 patterns indicating client issues
- Potential attack vectors
- API usage patterns
- Missing endpoint requests

### Metrics to Track

- 404 response frequency
- Most common invalid endpoints
- Client IP patterns
- User agent analysis

## 🛡️ Security Features

### Security Features

- Does not reveal server internals
- Sanitizes error messages
- Provides helpful but safe information (development only)
- Logs suspicious activity patterns
- **Environment-aware responses**: Available endpoints are only shown in development to prevent information disclosure in production

### Rate Limiting Integration

- Works with existing rate limiting
- Tracks repeated 404 attempts
- Can identify bot activity
- Supports security monitoring

## 🔄 Customization

### Adding Custom Responses

To customize the available endpoints list:

```typescript
// In notFound.controller.ts
availableEndpoints: {
  documentation: '/api-docs',
  health: '/health',
  // Add your custom endpoint categories
  newCategory: ['/api/new-endpoint'],
}
```

### Modifying Response Format

The response structure can be customized by editing the controller:

```typescript
res.status(HTTPResponses.NotFound).json({
  // Customize response fields here
  status: HTTPResponses.NotFound,
  message: 'Custom 404 message',
  // Add additional fields as needed
});
```

## 🔗 Integration Points

### Swagger Documentation

- Documented in OpenAPI specification
- Available in `/api-docs`
- Includes response schema
- Shows example responses

### Error Handling Chain

- Positioned before global error handler
- Does not interfere with other middleware
- Maintains request context
- Preserves correlation IDs

### Logging System

- Integrates with Winston logger
- Uses structured logging format
- Includes security event tracking
- Supports log aggregation

## 📋 Best Practices

1. **Monitor 404 Patterns**: Regular analysis can reveal client issues or API changes needed
2. **Update Available Endpoints**: Keep the endpoint list current as APIs evolve
3. **Security Awareness**: Watch for suspicious 404 patterns that might indicate attacks
4. **Performance Monitoring**: Ensure 404 responses remain fast and don't impact performance
5. **Client Communication**: Use 404 logs to proactively communicate with API clients about issues

## 🆘 Troubleshooting

### Common Issues

1. **404 Handler Not Triggered**

   - Check route order in main app
   - Ensure catch-all route placement
   - Verify middleware configuration

2. **Missing Log Entries**

   - Check logging configuration
   - Verify log level settings
   - Ensure logger middleware is active

3. **Incorrect Response Format**
   - Verify TypeScript compilation
   - Check response serialization
   - Validate JSON structure

This 404 controller provides a professional, informative, and secure way to handle unmatched API routes while maintaining good user experience and system monitoring capabilities.
