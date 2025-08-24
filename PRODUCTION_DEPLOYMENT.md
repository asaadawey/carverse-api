# 🚀 Production Deployment Guide

## Pre-Deployment Checklist

### ✅ Security & Configuration

- [ ] All environment variables properly configured
- [ ] No hardcoded secrets or API keys
- [ ] Strong passwords and secrets (32+ characters)
- [ ] Database connection secured
- [ ] Redis connection configured
- [ ] Email service configured
- [ ] Firebase push notifications configured

### ✅ Code Quality

- [ ] All tests passing
- [ ] No console.log statements in production code
- [ ] TypeScript compilation successful
- [ ] No TODO/FIXME comments for critical issues
- [ ] Error handling implemented
- [ ] Logging properly configured

### ✅ Performance & Monitoring

- [ ] Rate limiting configured
- [ ] Redis caching enabled
- [ ] Database indexes optimized
- [ ] Log rotation configured
- [ ] Health check endpoint available
- [ ] Monitoring and alerting set up

## Environment Configuration

### Required Environment Variables

```bash
# Application
NODE_ENV=production
APP_NAME=carverse-api
APP_SECRET=<32+ character secret>
PORT=4000

# Database
DATABASE_URL=<production_database_url>

# Authentication
API_KEY=x-GAPI-Key
API_VALUE=<secure_value>
AUTH_KEY=authorization
API_SALT=<secure_salt>
ALLOWED_CLIENT_KEY=<secure_key>
SKIP_AUTH=false

# Security
COOKIE_KEY=CSRF-CVAPI
COOKIE_SECRET=<secure_secret>
PASSWORD_HASH_SEPERATOR=<secure_separator>

# Redis
REDIS_URL=<redis_production_url>
# OR
REDIS_HOST=<redis_host>
REDIS_PORT=<redis_port>
REDIS_PASSWORD=<redis_password>

# AWS S3
AWS_S3_BUCKET_NAME=<production_bucket>
AWS_S3_REGION=<aws_region>

# Stripe
STRIPE_API_KEY=<live_stripe_key>

# Email Service
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=true
EMAIL_USER=<email_user>
EMAIL_PASSWORD=<email_password>
EMAIL_FROM_NAME=CarVerse Service
EMAIL_FROM_ADDRESS=<from_email>

# OTP Email
OTP_EMAIL_USER=<otp_email>
OTP_EMAIL_PASSWORD=<otp_password>

# Support Email
SUPPORT_EMAIL_USER=<support_email>
SUPPORT_EMAIL_PASSWORD=<support_password>

# Firebase
FIREBASE_PROJECT_ID=<project_id>
FIREBASE_CLIENT_EMAIL=<service_account_email>
FIREBASE_PRIVATE_KEY=<private_key>

# Application Settings
ORDER_TIMEOUT_SECONDS=300
CUTOMER_PROVIDER_LOCATION_THERSHOLD=5
LOG_VERBOSE=error
BASE_URL=/api/v1
```

## Deployment Steps

### 1. Pre-Deployment Setup

```bash
# Run production cleanup
npm run cleanup:production

# Run all tests
npm test

# Build the application
npm run build

# Check for vulnerabilities
npm audit --audit-level=moderate
```

### 2. Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed initial data (if needed)
npx prisma db seed
```

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env.production

# Configure all required variables
nano .env.production

# Validate environment
npm run validate:env
```

### 4. Application Deployment

```bash
# Start the application
npm start

# Or with PM2 for production
pm2 start dist/bin/index.js --name carverse-api

# Check application health
curl http://localhost:4000/health
```

## Production Monitoring

### Health Checks

- **Endpoint**: `GET /health`
- **Expected Response**: 200 OK with system status
- **Monitor**: Response time, memory usage, Redis connectivity

### Log Monitoring

- **Location**: `/logs/` directory
- **Levels**: error, warn, info, http
- **Rotation**: Daily with 14-day retention
- **Monitor**: Error rates, response times, authentication failures

### Database Monitoring

- **Connections**: Monitor connection pool usage
- **Performance**: Query execution times
- **Storage**: Database size and growth

### Redis Monitoring

- **Memory Usage**: Monitor Redis memory consumption
- **Connections**: Active connections count
- **Performance**: Command response times

## Security Considerations

### Network Security

- Use HTTPS in production
- Implement proper CORS settings
- Use VPN or private networks for database access
- Regular security updates

### Application Security

- Regular dependency updates
- Rate limiting enabled
- Input validation on all endpoints
- Proper error handling (no sensitive data leakage)

### Data Security

- Database encryption at rest
- Secure API key management
- Regular backups
- Access logging

## Troubleshooting

### Common Issues

1. **Database Connection Errors**

   - Check DATABASE_URL format
   - Verify network connectivity
   - Check database credentials

2. **Redis Connection Issues**

   - Verify REDIS_URL or host/port/password
   - Check Redis server status
   - Monitor Redis memory usage

3. **Email Service Failures**

   - Verify email credentials
   - Check SMTP settings
   - Test email connectivity

4. **High Memory Usage**
   - Monitor for memory leaks
   - Check Redis usage
   - Review application logs

### Debug Commands

```bash
# Check application logs
tail -f logs/application-$(date +%Y-%m-%d).log

# Check error logs
tail -f logs/error-$(date +%Y-%m-%d).log

# Monitor system resources
top -p $(pgrep -f "node.*carverse")

# Check database connections
npx prisma studio

# Test Redis connection
redis-cli ping
```

## Performance Optimization

### Recommended Settings

- Node.js cluster mode for multi-core utilization
- Redis connection pooling
- Database connection pooling
- Gzip compression
- Static file caching

### Monitoring Tools

- **APM**: New Relic, DataDog, or similar
- **Logs**: ELK Stack or similar
- **Infrastructure**: Prometheus + Grafana
- **Uptime**: Pingdom or similar

## Backup Strategy

### Database Backups

- Daily automated backups
- Point-in-time recovery capability
- Test restore procedures regularly

### Application Backups

- Source code in version control
- Environment configurations (encrypted)
- SSL certificates and keys

## Support & Maintenance

### Regular Tasks

- [ ] Monitor application health daily
- [ ] Review error logs weekly
- [ ] Update dependencies monthly
- [ ] Security patches as needed
- [ ] Performance review quarterly

### Emergency Contacts

- **Development Team**: [team@company.com]
- **DevOps/Infrastructure**: [devops@company.com]
- **Database Admin**: [dba@company.com]

---

**⚠️ Important**: Never deploy to production without proper testing in a staging environment that mirrors production configuration.
