#!/usr/bin/env node

/**
 * Test script for 404 Not Found Controller
 * This script tests various scenarios for unmatched API routes
 * Note: availableEndpoints are only included in development environment
 */

const http = require('http');
const envVars = require('../dist/config/environment.js').default;

const API_BASE = `http://localhost:${envVars.appServer.port}`;

const testCases = [
  {
    name: 'Non-existent GET endpoint',
    method: 'GET',
    path: '/api/non-existent-endpoint',
  },
  {
    name: 'Invalid POST endpoint',
    method: 'POST',
    path: '/api/invalid-resource',
    body: JSON.stringify({ test: 'data' }),
  },
  {
    name: 'Missing resource with ID',
    method: 'GET',
    path: '/api/missing-resource/123',
  },
  {
    name: 'Typo in valid endpoint',
    method: 'GET',
    path: '/api/loginn', // typo in 'login'
  },
  {
    name: 'Wrong HTTP method',
    method: 'DELETE',
    path: '/api/login', // login doesn't support DELETE
  },
  {
    name: 'Very long invalid path',
    method: 'GET',
    path: '/api/' + 'very-long-'.repeat(10) + 'endpoint',
  },
  {
    name: 'Path with special characters',
    method: 'GET',
    path: '/api/test@#$%endpoint',
  },
];

function makeRequest(testCase) {
  return new Promise((resolve, reject) => {
    const url = new URL(testCase.path, API_BASE);
    const options = {
      method: testCase.method,
      headers: {
        'Content-Type': 'application/json',
        req_id: `test-${Date.now()}`,
      },
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedData,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (testCase.body) {
      req.write(testCase.body);
    }

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing 404 Not Found Controller...\n');
  console.log(`📡 API Base URL: ${API_BASE}\n`);

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    try {
      console.log(`🔍 Testing: ${testCase.name}`);
      console.log(`   ${testCase.method} ${testCase.path}`);

      const response = await makeRequest(testCase);

      // Check if response is 404
      if (response.statusCode === 404) {
        console.log(`   ✅ Status: ${response.statusCode} (Expected: 404)`);

        // Check response structure
        if (response.body && typeof response.body === 'object') {
          const requiredFields = ['status', 'message', 'path', 'method', 'timestamp', 'requestId'];
          const hasAllFields = requiredFields.every((field) => response.body.hasOwnProperty(field));

          if (hasAllFields) {
            console.log(`   ✅ Response structure: Valid`);
            console.log(`   📍 Path: ${response.body.path}`);
            console.log(`   🔤 Method: ${response.body.method}`);
            console.log(`   🆔 Request ID: ${response.body.requestId}`);
            passedTests++;
          } else {
            console.log(`   ❌ Response structure: Missing required fields`);
            console.log(`   📄 Response: ${JSON.stringify(response.body, null, 2)}`);
          }
        } else {
          console.log(`   ❌ Response structure: Invalid JSON`);
        }
      } else {
        console.log(`   ❌ Status: ${response.statusCode} (Expected: 404)`);
        console.log(`   📄 Response: ${JSON.stringify(response.body, null, 2)}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    console.log(''); // Empty line for readability
  }

  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! 404 controller is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }

  console.log('\n📚 To test manually, try:');
  console.log(`curl -X GET "${API_BASE}/api/non-existent-endpoint"`);
  console.log(
    `curl -X POST "${API_BASE}/api/invalid-resource" -H "Content-Type: application/json" -d '{"test":"data"}'`,
  );
}

// Check if server is running first
function checkServer() {
  return new Promise((resolve, reject) => {
    const req = http.request(`${API_BASE}/health`, { method: 'GET' }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

async function main() {
  const serverRunning = await checkServer();

  if (!serverRunning) {
    console.log('❌ Server is not running or not responding');
    console.log('💡 Please start the server first with: npm run dev');
    console.log(`📡 Expected server at: ${API_BASE}`);
    process.exit(1);
  }

  await runTests();
}

main().catch(console.error);
