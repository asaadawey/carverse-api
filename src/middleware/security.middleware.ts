/**
 * Security Headers Middleware
 * Adds essential security headers for production deployment
 */

import { RequestHandler } from 'express';
import envVars from '@src/config/environment';

/**
 * Comprehensive security headers middleware
 */
export const securityHeaders: RequestHandler = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy (adjust based on your needs)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // Be more restrictive in production
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);

  // Strict Transport Security (HTTPS only)
  if (envVars.mode === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Feature Policy / Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    ['geolocation=(self)', 'microphone=()', 'camera=()', 'fullscreen=(self)', 'payment=(self)'].join(', '),
  );

  // Server identification
  res.removeHeader('X-Powered-By');
  res.setHeader('X-API-Version', envVars.appServer.version);

  next();
};

/**
 * Rate limiting headers
 */
export const rateLimitHeaders: RequestHandler = (req, res, next) => {
  // These would typically be set by your rate limiting middleware
  // but we can set some default security-oriented headers

  if (envVars.mode === 'production') {
    // Add headers to help with DDoS mitigation
    res.setHeader('X-RateLimit-Policy', 'strict');
  }

  next();
};

/**
 * API versioning and deprecation headers
 */
export const apiVersionHeaders: RequestHandler = (req, res, next) => {
  res.setHeader('API-Version', 'v1');
  res.setHeader('X-API-Deprecation-Info', 'See https://api.carverse.me/docs for latest API documentation');

  next();
};
