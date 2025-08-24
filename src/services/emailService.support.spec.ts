import * as emailService from '@src/services/emailService';
import environment from '@src/config/environment';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

// Mock environment
jest.mock('@src/config/environment', () => ({
  email: {
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: '587',
    secure: false,
    user: 'general@example.com',
    password: 'general-password',
    fromName: 'CarWash Service',
    fromAddress: 'general@example.com',
  },
  otpEmail: {
    user: 'otp@example.com',
    password: 'otp-password',
  },
  supportEmail: {
    address: 'support@carverse.me',
    user: 'support@carverse.me',
    password: 'support-password',
  },
}));

// Mock logger
jest.mock('@src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock email templates
jest.mock('@src/config/email', () => ({
  emailTemplates: {
    supportRequest: {
      subject: 'Support Request Confirmation',
      text: jest.fn((supportId, issueDescription, userEmail) => `Support ID: ${supportId}`),
      html: jest.fn((supportId, issueDescription, userEmail) => `<p>Support ID: ${supportId}</p>`),
    },
  },
}));

describe('emailService - Multiple Email Configurations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should have separate OTP and support email configurations', () => {
    expect(environment.otpEmail.user).toBe('otp@example.com');
    expect(environment.otpEmail.password).toBe('otp-password');
    expect(environment.supportEmail.user).toBe('support@carverse.me');
    expect(environment.supportEmail.password).toBe('support-password');
  });

  it('Should return status for both email services', () => {
    const status = emailService.getEmailServiceStatus();

    expect(status).toHaveProperty('otp');
    expect(status).toHaveProperty('support');
    expect(status.otp).toHaveProperty('configured');
    expect(status.otp).toHaveProperty('ready');
    expect(status.support).toHaveProperty('configured');
    expect(status.support).toHaveProperty('ready');
  });

  it('Should validate environment variables are properly structured', () => {
    // Test that all required fields are present
    expect(environment.email).toBeDefined();
    expect(environment.otpEmail).toBeDefined();
    expect(environment.supportEmail).toBeDefined();

    // Test OTP email config
    expect(environment.otpEmail.user).toBeDefined();
    expect(environment.otpEmail.password).toBeDefined();

    // Test support email config
    expect(environment.supportEmail.user).toBeDefined();
    expect(environment.supportEmail.password).toBeDefined();
  });
});
