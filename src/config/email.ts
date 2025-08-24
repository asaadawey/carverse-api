/**
 * Email Configuration
 *
 * This file contains email service configuration.
 * For production, use environment variables to configure these settings.
 *
 * Supported email services:
 * 1. Gmail SMTP (recommended for development)
 * 2. SendGrid (recommended for production)
 * 3. AWS SES (enterprise solution)
 * 4. Mailgun (alternative production solution)
 */

/**
 * OTP Configuration
 */
export const otpConfig = {
  // OTP length (6 digits recommended)
  length: 6,

  // OTP expiration time in minutes
  expirationMinutes: 10,

  // Maximum OTP attempts before blocking
  maxAttempts: 3,

  // Rate limiting: max OTPs per email per hour
  maxOtpsPerHour: 5,
};

/**
 * Email Templates
 */
export const emailTemplates = {
  passwordReset: {
    subject: 'Password Reset OTP - CarVerse Service',
    html: (otp: string, expirationMinutes: number) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset OTP</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; color: #333; margin-bottom: 30px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #007bff; text-align: center; padding: 20px; background-color: #f8f9fa; border-radius: 5px; margin: 20px 0; letter-spacing: 5px; }
            .content { color: #555; line-height: 1.6; }
            .warning { color: #dc3545; font-weight: bold; margin-top: 20px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 CarVerse Service</h1>
              <h2>Password Reset Request</h2>
            </div>
            
            <div class="content">
              <p>Hello,</p>
              <p>You have requested to reset your password. Please use the following One-Time Password (OTP) to proceed:</p>
              
              <div class="otp-code">${otp}</div>
              
              <p><strong>Important:</strong></p>
              <ul>
                <li>This OTP is valid for <strong>${expirationMinutes} minutes</strong> only</li>
                <li>Use this OTP only on the official CarVerse app or website</li>
                <li>Do not share this OTP with anyone</li>
              </ul>
              
              <div class="warning">
                If you did not request this password reset, please ignore this email or contact our support team immediately.
              </div>
            </div>
            
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>&copy; 2024 CarVerse Service. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: (otp: string, expirationMinutes: number) => `
      CarVerse Service - Password Reset

      You have requested to reset your password. 
      
      Your OTP: ${otp}
      
      This OTP is valid for ${expirationMinutes} minutes only.
      
      If you did not request this, please ignore this email.
      
      CarVerse Service Team
    `,
  },

  emailVerification: {
    subject: 'Email Verification OTP - CarVerse Service',
    html: (otp: string, expirationMinutes: number) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification OTP</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; color: #333; margin-bottom: 30px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #28a745; text-align: center; padding: 20px; background-color: #f8f9fa; border-radius: 5px; margin: 20px 0; letter-spacing: 5px; }
            .content { color: #555; line-height: 1.6; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 CarVerse Service</h1>
              <h2>Email Verification</h2>
            </div>
            
            <div class="content">
              <p>Welcome to CarVerse Service!</p>
              <p>Please use the following OTP to verify your email address:</p>
              
              <div class="otp-code">${otp}</div>
              
              <p>This OTP is valid for <strong>${expirationMinutes} minutes</strong> only.</p>
            </div>
            
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>&copy; 2024 CarVerse Service. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: (otp: string, expirationMinutes: number) => `
      CarVerse Service - Email Verification

      Welcome to CarVerse Service!
      
      Your verification OTP: ${otp}
      
      This OTP is valid for ${expirationMinutes} minutes only.
      
      CarVerse Service Team
    `,
  },

  supportRequest: {
    subject: 'Support Request Confirmation - CarVerse Service',
    html: (supportId: string, issueDescription: string, userEmail: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Support Request Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; color: #333; margin-bottom: 30px; }
            .support-id { font-size: 24px; font-weight: bold; color: #007bff; text-align: center; padding: 15px; background-color: #f8f9fa; border-radius: 5px; margin: 20px 0; }
            .content { color: #555; line-height: 1.6; }
            .issue-box { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 CarVerse Service</h1>
              <h2>Support Request Received</h2>
            </div>
            
            <div class="content">
              <p>Dear Customer,</p>
              <p>We have received your support request and our team will review it shortly. Here are the details:</p>
              
              <div class="support-id">Support ID: ${supportId}</div>
              
              <div class="issue-box">
                <strong>Issue Description:</strong><br>
                ${issueDescription}
              </div>
              
              <p><strong>What happens next:</strong></p>
              <ul>
                <li>Our support team will review your request within 24 hours</li>
                <li>You will receive updates on your registered email: ${userEmail}</li>
                <li>For urgent matters, please reference your Support ID: <strong>${supportId}</strong></li>
              </ul>
              
              <p>Thank you for using CarVerse Service. We appreciate your feedback and will work to resolve your issue promptly.</p>
            </div>
            
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>&copy; 2024 CarVerse Service. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: (supportId: string, issueDescription: string, userEmail: string) => `
      CarVerse Service - Support Request Confirmation

      Dear Customer,
      
      We have received your support request.
      
      Support ID: ${supportId}
      
      Issue Description: ${issueDescription}
      
      Our support team will review your request within 24 hours.
      Updates will be sent to: ${userEmail}
      
      Thank you for using CarVerse Service.
      
      CarVerse Service Team
    `,
  },

  accountActivation: {
    subject: '🎉 Your CarVerse Account Has Been Activated!',
    html: (firstName: string, lastName: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Activated - CarVerse</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; color: #333; margin-bottom: 30px; }
            .success-badge { font-size: 48px; color: #28a745; text-align: center; margin: 20px 0; }
            .content { color: #555; line-height: 1.6; }
            .cta-button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .features { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 CarVerse Service</h1>
              <div class="success-badge">✅</div>
              <h2>Account Activated Successfully!</h2>
            </div>
            
            <div class="content">
              <p>Dear ${firstName} ${lastName},</p>
              
              <p><strong>Great news!</strong> Your CarVerse account has been activated and you can now login to access all our services.</p>
              
              <div class="features">
                <h3>🎯 What you can do now:</h3>
                <ul>
                  <li>🚗 Book car wash services instantly</li>
                  <li>📍 Find nearby service providers</li>
                  <li>💳 Secure payment processing</li>
                  <li>⭐ Rate and review services</li>
                  <li>📱 Real-time order tracking</li>
                  <li>💬 Chat with service providers</li>
                </ul>
              </div>
              
              <p style="text-align: center;">
                <a href="#" class="cta-button">Login to Your Account</a>
              </p>
              
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team at <strong>support@carverse.me</strong>.</p>
              
              <p>Welcome to the CarVerse family! 🎉</p>
            </div>
            
            <div class="footer">
              <p>This is an automated message from CarVerse Service.</p>
              <p>&copy; 2024 CarVerse Service. All rights reserved.</p>
              <p>📧 support@carverse.me | 🌐 www.carverse.me</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: (firstName: string, lastName: string) => `
      CarVerse Service - Account Activated!

      Dear ${firstName} ${lastName},
      
      Great news! Your CarVerse account has been activated and you can now login to access all our services.
      
      What you can do now:
      • Book car wash services instantly
      • Find nearby service providers  
      • Secure payment processing
      • Rate and review services
      • Real-time order tracking
      • Chat with service providers
      
      If you have any questions, contact us at support@carverse.me
      
      Welcome to the CarVerse family!
      
      CarVerse Service Team
      support@carverse.me
    `,
  },
};
