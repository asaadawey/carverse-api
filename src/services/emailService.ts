/**
 * Email Service
 *
 * This service handles all email functionality including:
 * - Sending OTP emails
 * - Email verification
 * - Password reset emails
 * - Template-based email sending
 */

import nodemailer, { Transporter } from 'nodemailer';
import { otpConfig, emailTemplates } from '@src/config/email';
import environment from '@src/config/environment';
import logger from '@src/utils/logger';

// Global state for the email services
let otpTransporter: Transporter | null = null;
let supportTransporter: Transporter | null = null;
let isOtpConfigured: boolean = false;
let isSupportConfigured: boolean = false;

/**
 * Create email transporter configuration
 */
function createTransporterConfig(user: string, password: string) {
  return {
    service: environment.email.service,
    host: environment.email.host,
    port: environment.email.port ? parseInt(environment.email.port) : 587,
    secure: environment.email.secure,
    auth: {
      user,
      pass: password,
    },
  };
}

/**
 * Initialize the email transporters for different purposes
 */
export function initializeEmailService(): void {
  try {
    // Initialize OTP transporter
    if (environment.otpEmail.user && environment.otpEmail.password) {
      const otpConfig = createTransporterConfig(environment.otpEmail.user, environment.otpEmail.password);
      otpTransporter = nodemailer.createTransport(otpConfig);
      isOtpConfigured = true;
      logger.info('OTP email service initialized successfully', {
        user: environment.otpEmail.user,
      });
    } else {
      logger.warn('OTP email service not configured. OTP emails will be logged instead of sent.');
      isOtpConfigured = false;
    }

    // Initialize Support transporter
    if (environment.supportEmail.user && environment.supportEmail.password) {
      const supportConfig = createTransporterConfig(environment.supportEmail.user, environment.supportEmail.password);
      supportTransporter = nodemailer.createTransport(supportConfig);
      isSupportConfigured = true;
      logger.info('Support email service initialized successfully', {
        user: environment.supportEmail.user,
      });
    } else {
      logger.warn('Support email service not configured. Support emails will be logged instead of sent.');
      isSupportConfigured = false;
    }
  } catch (error) {
    logger.error('Failed to initialize email services', { error });
    isOtpConfigured = false;
    isSupportConfigured = false;
  }
}

/**
 * Verify email service connections
 */
export async function verifyEmailConnection(): Promise<boolean> {
  let otpVerified = false;
  let supportVerified = false;

  if (isOtpConfigured && otpTransporter) {
    try {
      await otpTransporter.verify();
      otpVerified = true;
      logger.info('OTP email service connection verified');
    } catch (error) {
      logger.error('OTP email service connection failed', { error });
    }
  }

  if (isSupportConfigured && supportTransporter) {
    try {
      await supportTransporter.verify();
      supportVerified = true;
      logger.info('Support email service connection verified');
    } catch (error) {
      logger.error('Support email service connection failed', { error });
    }
  }

  return otpVerified || supportVerified;
}

/**
 * Generic OTP email sender
 */
export async function sendOTPEmail(
  email: string,
  otp: string,
  type: 'PASSWORD_RESET' | 'EMAIL_VERIFICATION',
): Promise<boolean> {
  try {
    const template = type === 'PASSWORD_RESET' ? emailTemplates.passwordReset : emailTemplates.emailVerification;

    const fromName = environment.email.fromName || 'CarWash Service';
    const fromEmail = environment.email.fromAddress || environment.otpEmail.user;

    if (isOtpConfigured && otpTransporter) {
      const info = await otpTransporter.sendMail({
        from: `\"${fromName}\" <${fromEmail}>`,
        to: email,
        subject: template.subject,
        text: template.text(otp, otpConfig.expirationMinutes),
        html: template.html(otp, otpConfig.expirationMinutes),
      });

      logger.info('OTP email sent successfully', {
        to: email,
        type,
        messageId: info.messageId,
        otpLength: otp.length,
        info,
      });

      return true;
    } else {
      // Fallback: log the OTP for development
      logger.warn('Email service not configured. OTP logged for development:', {
        to: email,
        type,
        otp: process.env.NODE_ENV === 'development' ? otp : '[HIDDEN]',
        subject: template.subject,
      });

      // In development, we still return true to allow the flow to continue
      return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    }
  } catch (error) {
    logger.error('Failed to send OTP email', {
      to: email,
      type,
      error: error instanceof Error ? error.message : error,
    });

    return false;
  }
}

/**
 * Send a custom email using OTP transporter
 */
async function sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
  try {
    if (!isOtpConfigured || !otpTransporter) {
      logger.warn('Cannot send email: OTP service not configured', { to, subject });
      return false;
    }

    const fromName = environment.email.fromName || 'CarWash Service';
    const fromEmail = environment.email.fromAddress || environment.otpEmail.user;

    const mailOptions = {
      from: `\"${fromName}\" <${fromEmail}>`,
      to,
      subject,
      text,
      html: html || text,
    };

    const info = await otpTransporter.sendMail(mailOptions);

    logger.info('Email sent successfully', {
      to,
      subject,
      messageId: info.messageId,
    });

    return true;
  } catch (error) {
    logger.error('Failed to send email', {
      to,
      subject,
      error: error instanceof Error ? error.message : error,
    });

    return false;
  }
}

/**
 * Send support request confirmation email
 */
export async function sendSupportRequestEmail(
  userEmail: string,
  supportId: string,
  issueDescription: string,
): Promise<boolean> {
  try {
    const template = emailTemplates.supportRequest;
    const fromName = environment.email.fromName || 'CarWash Service';
    const fromEmail = environment.email.fromAddress || environment.supportEmail.user;
    const supportEmail = environment.supportEmail.user || 'support@carverse.me';

    if (isSupportConfigured && supportTransporter) {
      const info = await supportTransporter.sendMail({
        from: `\"${fromName}\" <${fromEmail}>`,
        to: userEmail,
        cc: supportEmail, // CC the support team
        subject: template.subject,
        text: template.text(supportId, issueDescription, userEmail),
        html: template.html(supportId, issueDescription, userEmail),
      });

      logger.info('Support request email sent successfully', {
        to: userEmail,
        cc: supportEmail,
        supportId,
        messageId: info.messageId,
      });

      return true;
    } else {
      // Fallback: log for development
      logger.warn('Support email service not configured. Support email logged for development:', {
        to: userEmail,
        cc: supportEmail,
        supportId,
        subject: template.subject,
        issueDescription: process.env.NODE_ENV === 'development' ? issueDescription : '[HIDDEN]',
      });

      return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    }
  } catch (error) {
    logger.error('Failed to send support request email', {
      to: userEmail,
      supportId,
      error: error instanceof Error ? error.message : error,
    });

    return false;
  }
}

/**
 * Get service status
 */
export function getEmailServiceStatus(): {
  otp: { configured: boolean; ready: boolean };
  support: { configured: boolean; ready: boolean };
} {
  return {
    otp: {
      configured: isOtpConfigured,
      ready: isOtpConfigured && !!otpTransporter,
    },
    support: {
      configured: isSupportConfigured,
      ready: isSupportConfigured && !!supportTransporter,
    },
  };
}

/**
 * Send account activation email
 */
export async function sendAccountActivationEmail(
  userEmail: string,
  firstName: string,
  lastName: string,
): Promise<boolean> {
  try {
    const template = emailTemplates.accountActivation;
    const fromName = environment.email.fromName || 'CarVerse Service';
    const fromEmail = environment.supportEmail.user || 'support@carverse.me';

    if (isSupportConfigured && supportTransporter) {
      const info = await supportTransporter.sendMail({
        from: `\"${fromName}\" <${fromEmail}>`,
        to: userEmail,
        subject: template.subject,
        text: template.text(firstName, lastName),
        html: template.html(firstName, lastName),
      });

      logger.info('Account activation email sent successfully', {
        to: userEmail,
        userName: `${firstName} ${lastName}`,
        messageId: info.messageId,
      });

      return true;
    } else {
      // Fallback: log for development
      logger.warn('Support email service not configured. Account activation email logged for development:', {
        to: userEmail,
        userName: `${firstName} ${lastName}`,
        subject: template.subject,
      });

      return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    }
  } catch (error) {
    logger.error('Failed to send account activation email', {
      to: userEmail,
      userName: `${firstName} ${lastName}`,
      error: error instanceof Error ? error.message : error,
    });

    return false;
  }
}

// Initialize the email service immediately
initializeEmailService();

// Export the functions as default for backward compatibility
export default {
  sendEmail,
  verifyConnection: verifyEmailConnection,
  getStatus: getEmailServiceStatus,
};
