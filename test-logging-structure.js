// Quick test to verify stack trace separation in logging
const logger = require('./dist/src/utils/logger').default;

// Create a test error
const testError = new Error('Test error for stack separation');

// Test the logError function
console.log('Testing error logging with separated stack trace...\n');

// Mock console to capture the logged output structure
const originalLog = console.log;
const originalError = console.error;
let capturedLog = '';

console.log = (...args) => {
  capturedLog += args.join(' ') + '\n';
};
console.error = (...args) => {
  capturedLog += args.join(' ') + '\n';
};

// Log the error
logger.loggerUtils.logError(testError, 'Test Context', { testMeta: 'test-value' });

// Wait a bit for the log to be processed
setTimeout(() => {
  // Restore console
  console.log = originalLog;
  console.error = originalError;

  // Check if the log contains separate error and stack objects
  if (capturedLog.includes('"error":') && capturedLog.includes('"stack":')) {
    console.log('✅ SUCCESS: Stack trace is properly separated from error object');
    console.log('\nCaptured log structure preview:');

    // Try to extract and format the JSON part
    try {
      const jsonMatch = capturedLog.match(/\{.*\}/s);
      if (jsonMatch) {
        const logObj = JSON.parse(jsonMatch[0]);
        console.log('Error object:', JSON.stringify(logObj.error, null, 2));
        console.log('Stack trace exists:', !!logObj.stack);
        console.log('Stack trace length:', logObj.stack ? logObj.stack.length : 0);
      }
    } catch (e) {
      console.log('Raw captured log:', capturedLog);
    }
  } else {
    console.log('❌ ISSUE: Stack trace separation not working properly');
    console.log('Captured log:', capturedLog);
  }
}, 100);
