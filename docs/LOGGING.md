# Car Wash API Logging System

## Overview

This Car Wash API now features a comprehensive Winston-based logging system that replaces all `console.log` usage with structured, professional logging. The system provides multiple log levels, specialized utilities, and persistent log storage with daily rotation.

## 🎯 Features

### Log Levels

- **DEBUG**: Detailed debugging information
- **INFO**: General application flow
- **WARN**: Warning messages for potential issues
- **ERROR**: Error conditions and exceptions

### Specialized Log Utilities

- **Authentication Events**: Login/logout tracking
- **Database Operations**: CRUD operation monitoring
- **Performance Metrics**: Response time tracking
- **Security Events**: Suspicious activity detection
- **Error Logging**: Structured error reporting

### Log Storage

- **Console Output**: Colored, formatted logs for development
- **Combined Log**: All log levels in `logs/combined.log`
- **Error Log**: Error-only logs in `logs/error.log`
- **Rotating Logs**: Daily rotation for specialized logs
  - `logs/auth-YYYY-MM-DD.log`
  - `logs/performance-YYYY-MM-DD.log`
  - `logs/security-YYYY-MM-DD.log`

## 🚀 Usage

### Basic Logging

```typescript
import logger from '@src/utils/logger';

// Different log levels
logger.debug('Debugging user preferences', { userId: 123 });
logger.info('User successfully logged in', { userId: 123, email: 'user@example.com' });
logger.warn('High API usage detected', { userId: 123, requestCount: 95 });
logger.error('Failed to process payment', { orderId: 456, error: 'Invalid card' });
```

### Specialized Utilities

```typescript
import logger, { loggerUtils } from '@src/utils/logger';

// Authentication events
loggerUtils.logAuthEvent('Login successful', userId, true, {
  email: 'user@example.com',
  userType: 'Customer',
});

// Database operations
loggerUtils.logDatabaseOperation('CREATE', 'orders', {
  orderId: 12345,
  customerId: 101,
});

// Performance tracking
const startTime = Date.now();
// ... some operation
loggerUtils.logPerformance('order-processing', Date.now() - startTime, {
  orderId: 12345,
});

// Error logging with context
loggerUtils.logError(error as Error, 'Order Controller', {
  userId: 123,
  orderId: 456,
});

// Security events
loggerUtils.logSecurityEvent('Multiple failed login attempts', 'HIGH', {
  ip: '192.168.1.100',
  attempts: 5,
});
```

## 🔧 Configuration

### Environment Variables

The logging system respects the following environment variables:

```env
# Log level (debug, info, warn, error)
LOG_LEVEL=info

# Enable/disable console logging
LOG_CONSOLE=true

# Enable/disable file logging
LOG_FILE=true

# Log directory path
LOG_DIR=logs
```

### Customization

The logger configuration is in `src/utils/logger.ts`. You can modify:

- Log formats
- Transport settings
- Rotation policies
- Custom log levels

## 📊 Enhanced Middleware

The system includes enhanced request/response logging middleware:

### Pre-request Logging

- Request details (method, URL, IP)
- Authentication info
- Request timing start

### Post-response Logging

- Response status and timing
- Performance metrics
- Success/failure tracking

### Error Logging

- Comprehensive error details
- Stack traces
- Request context

## 🧪 Testing

Run the logging system test:

```bash
# Windows
scripts\build-and-test-logging.bat

# Manual testing
npm run build
node scripts/test-logging.js
```

## 📁 Log File Structure

```
logs/
├── combined.log              # All log levels
├── error.log                # Errors only
├── auth-2024-01-15.log      # Authentication events
├── performance-2024-01-15.log # Performance metrics
└── security-2024-01-15.log  # Security events
```

## 🔄 Migration from console.log

### Before

```typescript
console.log('User logged in:', userId);
console.error('Payment failed:', error);
```

### After

```typescript
logger.info('User logged in', { userId });
loggerUtils.logError(error as Error, 'Payment Controller', { userId });
```

## 🛡️ Security Features

- **Sensitive Data Filtering**: Automatically filters passwords, tokens
- **IP Tracking**: Logs source IP for security events
- **Rate Limiting Logs**: Tracks suspicious activity patterns
- **Error Sanitization**: Removes sensitive data from error logs

## 📈 Performance Monitoring

The system automatically tracks:

- Request/response times
- Database operation duration
- Memory usage patterns
- API endpoint performance

## 🎨 Console Output

Development console output features:

- **Color-coded levels**: Error (red), Warn (yellow), Info (green)
- **Timestamp formatting**: Human-readable timestamps
- **Structured display**: JSON objects prettified
- **Request correlation**: Request IDs for tracing

## 🔧 Maintenance

### Log Rotation

- Daily rotation prevents large log files
- Configurable retention (default: 14 days)
- Automatic compression of old logs

### Monitoring

- Monitor log file sizes
- Set up log aggregation for production
- Configure alerts for error patterns

## 📚 Best Practices

1. **Use appropriate log levels**

   - DEBUG: Development debugging only
   - INFO: Normal application flow
   - WARN: Unexpected but recoverable issues
   - ERROR: Actual problems requiring attention

2. **Provide context**

   - Include relevant IDs (userId, orderId, etc.)
   - Add request correlation IDs
   - Include business context

3. **Avoid logging sensitive data**

   - No passwords or tokens
   - Mask credit card numbers
   - Filter PII in production

4. **Use structured logging**
   - Pass objects instead of string concatenation
   - Consistent field naming
   - Include timestamps and request IDs

## 🆘 Troubleshooting

### Common Issues

1. **Logs not appearing**

   - Check LOG_LEVEL environment variable
   - Ensure logs directory exists and is writable
   - Verify TypeScript compilation

2. **Performance impact**

   - Use appropriate log levels in production
   - Consider async logging for high-traffic endpoints
   - Monitor log file sizes

3. **Missing context**
   - Ensure middleware is properly configured
   - Check request ID generation
   - Verify user context injection

## 🔗 Integration Points

The logging system integrates with:

- **Express middleware**: Request/response logging
- **Authentication system**: Login/logout tracking
- **Database operations**: CRUD monitoring
- **Error handling**: Structured error reporting
- **WebSocket events**: Real-time communication logging
- **Payment processing**: Transaction logging

This comprehensive logging system provides visibility into your Car Wash API's operation, helping with debugging, monitoring, and maintaining system health.
