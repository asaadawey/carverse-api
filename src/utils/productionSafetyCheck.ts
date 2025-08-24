/**
 * Production Safety Check Utility
 * Validates that the application is ready for production deployment
 */

import envVars from '@src/config/environment';
import logger from '@src/utils/logger';

interface SafetyCheckResult {
  passed: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Performs comprehensive production safety checks
 */
export function performProductionSafetyCheck(): SafetyCheckResult {
  const result: SafetyCheckResult = {
    passed: true,
    warnings: [],
    errors: [],
  };

  // Check environment
  if (envVars.mode === 'production') {
    // 1. Check for development-only configurations
    if (envVars.auth.skipAuth) {
      result.errors.push('SKIP_AUTH is enabled in production - this is a security risk');
      result.passed = false;
    }

    // 2. Check for weak secrets
    if (envVars.appSecret.length < 32 || envVars.appSecret === 'N') {
      result.errors.push('APP_SECRET is too weak for production');
      result.passed = false;
    }

    if (envVars.cookies.secret === 'N') {
      result.errors.push('COOKIE_SECRET is not set for production');
      result.passed = false;
    }

    // 3. Check database configuration
    if (envVars.databaseUrl.includes('localhost')) {
      result.warnings.push('Database appears to be localhost - verify this is correct for production');
    }

    // 4. Check Redis configuration
    if (!envVars.redis.url && !envVars.redis.host) {
      result.warnings.push('Redis is not properly configured - this may affect performance');
    }

    // 5. Check email configuration
    if (!envVars.email.user || !envVars.email.password) {
      result.warnings.push('Email service is not properly configured');
    }

    // 6. Check Firebase configuration
    if (!envVars.firebase.projectId || !envVars.firebase.clientEmail || !envVars.firebase.privateKey) {
      result.warnings.push('Firebase is not properly configured - push notifications may not work');
    }

    // 7. Check logging configuration
    if (envVars.logVerbose === 'all') {
      result.warnings.push('Log verbosity is set to "all" - this may impact performance');
    }
  }

  // Log results
  if (result.errors.length > 0) {
    logger.error('Production safety check failed', {
      errors: result.errors,
      warnings: result.warnings,
    });
  } else if (result.warnings.length > 0) {
    logger.warn('Production safety check completed with warnings', {
      warnings: result.warnings,
    });
  } else {
    logger.info('Production safety check passed');
  }

  return result;
}

/**
 * Validates that sensitive environment variables are properly configured
 */
export function validateSensitiveConfig(): boolean {
  const sensitiveVars = ['APP_SECRET', 'DATABASE_URL', 'STRIPE_API_KEY', 'FIREBASE_PRIVATE_KEY'];

  for (const varName of sensitiveVars) {
    const value = process.env[varName];
    if (!value || value === 'N' || value === 'your_secret_here' || value.includes('example')) {
      logger.error(`Sensitive variable ${varName} is not properly configured`);
      return false;
    }
  }

  return true;
}

/**
 * Checks for development artifacts that should not be in production
 */
export function checkForDevelopmentArtifacts(): string[] {
  const artifacts: string[] = [];

  // These checks would ideally be done during build process
  if (process.env.NODE_ENV === 'production') {
    // Check for console.log statements (would need static analysis)
    // Check for debug packages
    // Check for test files in production bundle
    // etc.
  }

  return artifacts;
}
