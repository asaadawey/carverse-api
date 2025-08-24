# Email OTP Service Implementation

## Overview

This implementation provides a complete, production-ready email OTP (One-Time Password) system with the following features:

- **Real email sending** using Nodemailer
- **Database-backed OTP storage** with expiration and rate limiting
- **Beautiful HTML email templates**
- **Multiple email service providers** support
- **Comprehensive security features**
- **Automatic cleanup** of expired OTPs
- **Development-friendly** with console logging fallback

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
yarn add nodemailer @types/nodemailer
```

### 2. Database Migration

The OTP table has been added to your Prisma schema. Run:

```bash
npx prisma migrate dev --name add-email-otp-table
npx prisma generate
```

### 3. Configure Email Service

#### Option A: Gmail (Easiest for Development)

1. Enable 2-factor authentication on your Gmail account
2. Generate an "App Password": https://support.google.com/accounts/answer/185833
3. Add to your `.env` file:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=CarWash Service
EMAIL_FROM_ADDRESS=your-email@gmail.com
```

#### Option B: SendGrid (Recommended for Production)

1. Sign up at https://sendgrid.com/
2. Create an API key with Mail Send permissions
3. Add to your `.env` file:

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM_NAME=CarWash Service
EMAIL_FROM_ADDRESS=noreply@yourapp.com
```

#### Option C: No Email Setup (Development)

Leave email variables empty - OTPs will be logged to console instead.

## 📧 Email Service Features

### Multiple Provider Support

- **Gmail** - Perfect for development and testing
- **SendGrid** - Recommended for production (99% delivery rate)
- **Mailgun** - Alternative production solution
- **AWS SES** - Enterprise-grade solution
- **Custom SMTP** - Any SMTP provider

### Email Templates

Professional HTML templates with:

- Responsive design
- CarWash Service branding
- Security warnings
- Clear OTP display
- Fallback text versions

### Security Features

- **Rate limiting** - Max 5 OTPs per email per hour
- **Expiration** - OTPs expire after 10 minutes
- **One-time use** - OTPs are invalidated after verification
- **Cryptographically secure** - Uses crypto.randomInt()
- **Auto-cleanup** - Expired OTPs removed automatically

## 🔧 API Endpoints

### Send OTP

```http
POST /api/users/send-email-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP sent to your email address",
  "otpSent": true
}
```

### Verify OTP

```http
POST /api/users/verify-email-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP verified successfully",
  "verified": true
}
```

## 📊 Database Schema

```prisma
model emailOtps {
  id          String    @id @default(cuid())
  email       String
  otp         String
  type        OtpType   @default(PASSWORD_RESET)
  expiresAt   DateTime
  isUsed      Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([email])
  @@index([email, type])
  @@index([expiresAt])
}

enum OtpType {
  PASSWORD_RESET
  EMAIL_VERIFICATION
  TWO_FACTOR_AUTH
}
```

## 🔄 Background Jobs

### OTP Cleanup Job

Automatically runs every hour to:

- Remove expired OTPs
- Clean up used OTPs older than 24 hours
- Maintain database performance

Monitor via logs:

```
[INFO] OTP cleanup job completed {
  "deletedCount": 25,
  "duration": "150ms",
  "before": {"total": 100, "active": 15, "expired": 25, "used": 60},
  "after": {"total": 75, "active": 15, "expired": 0, "used": 60}
}
```

## 🛡️ Security Best Practices

### Rate Limiting

- Maximum 5 OTP requests per email per hour
- Configurable via `otpConfig.maxOtpsPerHour`

### OTP Security

- 6-digit cryptographically secure random numbers
- 10-minute expiration (configurable)
- One-time use only
- Secure storage with database indexes

### Email Security

- HTML and text versions for compatibility
- Clear security warnings in templates
- Professional sender identification
- No sensitive data in logs (production)

## 🧪 Testing

### Development Mode

When `NODE_ENV=development` or `NODE_ENV=test`:

- OTPs are logged to console if email fails
- Detailed logging for debugging
- Graceful fallbacks

### Test with Console Logging

```javascript
// In development, you'll see:
[WARN] Email service not configured. OTP logged for development: {
  "to": "user@example.com",
  "type": "PASSWORD_RESET",
  "otp": "123456",
  "subject": "Password Reset OTP - CarWash Service"
}
```

## 🎛️ Configuration

### OTP Settings (`src/config/email.ts`)

```typescript
export const otpConfig = {
  length: 6, // OTP length
  expirationMinutes: 10, // Expiration time
  maxAttempts: 3, // Max verification attempts
  maxOtpsPerHour: 5, // Rate limit per email
};
```

### Email Settings

```typescript
export const emailConfig = {
  service: 'gmail', // or custom SMTP
  host: 'smtp.gmail.com', // SMTP host
  port: 587, // SMTP port
  secure: false, // true for 465, false for others
  // ... auth and from settings
};
```

## 📈 Monitoring

### Service Status

Check email service status:

```typescript
import emailService from '@src/services/emailService';

const status = emailService.getStatus();
// { configured: true, ready: true }

const connected = await emailService.verifyConnection();
// true/false
```

### OTP Statistics

```typescript
import OtpService from '@src/services/otpService';
const otpService = new OtpService(prisma);

const stats = await otpService.getOtpStats();
// { total: 100, active: 15, expired: 5, used: 80 }
```

## 🚨 Error Handling

### Common Errors

- **Rate limited**: "Too many OTP requests. Please try again in X minutes."
- **Invalid format**: "Invalid OTP format"
- **Expired**: "OTP has expired. Please request a new one."
- **Not found**: "Invalid or expired OTP"
- **Email failure**: "Failed to send OTP email"

### Error Logging

All operations are comprehensively logged with:

- User identification
- Request tracking IDs
- Error details
- Security events

## 🔧 Troubleshooting

### Email Not Sending

1. Check environment variables are set correctly
2. Verify email service credentials
3. Check firewall/network restrictions
4. Review email service provider limits
5. Monitor application logs for detailed errors

### Gmail Setup Issues

1. Ensure 2FA is enabled
2. Use App Password, not regular password
3. Check "Less secure app access" if needed
4. Verify Gmail SMTP settings

### Database Issues

1. Ensure migration has been run
2. Check database connectivity
3. Verify Prisma schema is up to date
4. Monitor database logs

## 📝 Example Usage

```typescript
// Send OTP
import emailService from '@src/services/emailService';
import OtpService from '@src/services/otpService';

const otpService = new OtpService(prisma);

// Generate and send OTP
const result = await otpService.generateOtp('user@example.com', 'PASSWORD_RESET');
if (result.success) {
  await emailService.sendPasswordResetOTP('user@example.com', result.otp!);
}

// Verify OTP
const verification = await otpService.verifyOtp('user@example.com', '123456', 'PASSWORD_RESET');
if (verification.success) {
  // OTP is valid, proceed with password reset
}
```

This implementation is production-ready, secure, and provides excellent developer experience with comprehensive logging and error handling.
