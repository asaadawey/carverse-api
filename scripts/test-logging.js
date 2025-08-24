#!/usr/bin/env node

/**
 * Test script to verify the logging system is working correctly
 * This script tests different log levels and utilities
 */

const path = require('path');
const fs = require('fs');

// Mock Express-like request object for testing
const mockReq = {
  method: 'POST',
  url: '/api/test',
  ip: '127.0.0.1',
  headers: {
    req_id: 'test-12345',
    'user-agent': 'Test Agent',
  },
  user: {
    id: 1,
    customerId: 101,
    providerId: 201,
  },
};

async function testLogging() {
  try {
    // Import logger modules using ES module syntax in Node.js
    const { default: logger, loggerUtils, logStartup, logShutdown } = await import('../dist/utils/logger.js');

    console.log('🧪 Testing Car Wash API Logging System...\n');

    // Test startup logging
    console.log('1. Testing startup logging...');
    logStartup();

    // Test different log levels
    console.log('\n2. Testing different log levels...');
    logger.debug('This is a debug message', { component: 'test-script' });
    logger.info('This is an info message', { component: 'test-script' });
    logger.warn('This is a warning message', { component: 'test-script' });
    logger.error('This is an error message', { component: 'test-script' });

    // Test authentication logging
    console.log('\n3. Testing authentication event logging...');
    loggerUtils.logAuthEvent('Test login attempt', 1, true, {
      email: 'test@example.com',
      userType: 'Customer',
    });

    loggerUtils.logAuthEvent('Test failed login', undefined, false, {
      email: 'invalid@example.com',
      reason: 'Invalid credentials',
    });

    // Test database operation logging
    console.log('\n4. Testing database operation logging...');
    loggerUtils.logDatabaseOperation('CREATE', 'orders', {
      orderId: 12345,
      customerId: 101,
      amount: 150.0,
    });

    loggerUtils.logDatabaseOperation('UPDATE', 'orders', {
      orderId: 12345,
      status: 'confirmed',
    });

    // Test error logging
    console.log('\n5. Testing error logging...');
    const testError = new Error('Test error for logging system validation');
    testError.stack = 'Error: Test error\n    at testLogging (/test/script.js:1:1)';

    loggerUtils.logError(testError, 'Test Controller', {
      userId: 1,
      operation: 'test-logging',
    });

    // Test performance logging
    console.log('\n6. Testing performance logging...');
    const perfStart = Date.now();

    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 100));

    loggerUtils.logPerformance('test-operation', Date.now() - perfStart, {
      userId: 1,
      operation: 'test-performance',
    });

    // Test security event logging
    console.log('\n7. Testing security event logging...');
    loggerUtils.logSecurityEvent('Test suspicious activity', 'HIGH', {
      ip: '192.168.1.100',
      userAgent: 'Suspicious Bot',
      attemptedAction: 'brute-force',
    });

    // Test structured logging
    console.log('\n8. Testing structured logging...');
    logger.info('Order processing completed', {
      orderId: 12345,
      customerId: 101,
      providerId: 201,
      amount: 150.0,
      processingTime: '2.3s',
      paymentMethod: 'Credit Card',
      timestamp: new Date().toISOString(),
    });

    console.log('\n✅ All logging tests completed successfully!');
    console.log('\n📁 Check the following log files:');
    console.log('   - logs/combined.log (all logs)');
    console.log('   - logs/error.log (errors only)');
    console.log('   - logs/auth-YYYY-MM-DD.log (authentication events)');
    console.log('   - logs/performance-YYYY-MM-DD.log (performance metrics)');
    console.log('   - logs/security-YYYY-MM-DD.log (security events)');

    // Test shutdown logging
    console.log('\n9. Testing shutdown logging...');
    logShutdown();
  } catch (error) {
    console.error('❌ Error testing logging system:', error.message);
    console.error('Make sure to build the TypeScript files first with: npm run build');
    process.exit(1);
  }
}

// Run the test
testLogging().catch(console.error);
