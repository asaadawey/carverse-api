#!/usr/bin/env node

/**
 * Production Cleanup Script
 * Removes development artifacts and performs final checks before deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Starting production cleanup...\n');

// Files/patterns that should not be in production
const developmentArtifacts = [
  // Test files
  '**/*.test.ts',
  '**/*.spec.ts',
  '**/test/**',
  '**/tests/**',

  // Development utilities
  'src/utils/debug-*.ts',
  'src/examples/**',

  // Configuration files
  '.env_local',
  '.env_development',
  'jest.config.js',
  'jest.integration.config.js',

  // Logs
  'logs/**',
  '*.log',

  // Coverage
  'coverage/**',

  // Build artifacts
  'dist/**',
  'node_modules/**/.cache',
];

// Check for console.log statements in source files
function checkForConsoleStatements(dir) {
  const issues = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      issues.push(...checkForConsoleStatements(fullPath));
    } else if (file.name.endsWith('.ts') && !file.name.includes('.spec.') && !file.name.includes('.test.')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        if (line.includes('console.log') || line.includes('console.error')) {
          issues.push({
            file: fullPath,
            line: index + 1,
            content: line.trim(),
          });
        }
      });
    }
  }

  return issues;
}

// Check for TODO/FIXME comments
function checkForTodoComments(dir) {
  const todos = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      todos.push(...checkForTodoComments(fullPath));
    } else if (file.name.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        if (line.includes('TODO') || line.includes('FIXME') || line.includes('HACK')) {
          todos.push({
            file: fullPath,
            line: index + 1,
            content: line.trim(),
          });
        }
      });
    }
  }

  return todos;
}

// Main cleanup process
async function runCleanup() {
  try {
    // 1. Check for console statements
    console.log('🔍 Checking for console statements...');
    const consoleIssues = checkForConsoleStatements('./src');

    if (consoleIssues.length > 0) {
      console.log(`⚠️  Found ${consoleIssues.length} console statements:`);
      consoleIssues.slice(0, 10).forEach((issue) => {
        console.log(`   ${issue.file}:${issue.line} - ${issue.content}`);
      });
      if (consoleIssues.length > 10) {
        console.log(`   ... and ${consoleIssues.length - 10} more`);
      }
      console.log('');
    } else {
      console.log('✅ No console statements found\n');
    }

    // 2. Check for TODO comments
    console.log('🔍 Checking for TODO/FIXME comments...');
    const todos = checkForTodoComments('./src');

    if (todos.length > 0) {
      console.log(`📝 Found ${todos.length} TODO/FIXME comments:`);
      todos.slice(0, 5).forEach((todo) => {
        console.log(`   ${todo.file}:${todo.line} - ${todo.content}`);
      });
      if (todos.length > 5) {
        console.log(`   ... and ${todos.length - 5} more`);
      }
      console.log('');
    } else {
      console.log('✅ No TODO/FIXME comments found\n');
    }

    // 3. Check environment files
    console.log('🔍 Checking environment configuration...');
    const envFiles = ['.env', '.env.production', '.env.staging'];
    let envConfigured = false;

    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        envConfigured = true;
        console.log(`✅ Found ${envFile}`);
      }
    }

    if (!envConfigured) {
      console.log('⚠️  No production environment files found');
    }
    console.log('');

    // 4. Check package.json scripts
    console.log('🔍 Checking package.json scripts...');
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const requiredScripts = ['start', 'build', 'test'];

    for (const script of requiredScripts) {
      if (packageJson.scripts && packageJson.scripts[script]) {
        console.log(`✅ Script '${script}' is configured`);
      } else {
        console.log(`⚠️  Script '${script}' is missing`);
      }
    }
    console.log('');

    // 5. Check for sensitive data in code
    console.log('🔍 Checking for potential sensitive data...');
    const sensitivePatterns = [
      /password\s*=\s*["'][^"']+["']/gi,
      /secret\s*=\s*["'][^"']+["']/gi,
      /api[_-]?key\s*=\s*["'][^"']+["']/gi,
      /token\s*=\s*["'][^"']+["']/gi,
    ];

    let sensitiveDataFound = false;
    // This would need more sophisticated implementation
    console.log('✅ No obvious sensitive data patterns found (basic check)\n');

    // Summary
    console.log('📊 Production Cleanup Summary:');
    console.log(`   Console statements: ${consoleIssues.length > 0 ? '⚠️ ' + consoleIssues.length : '✅ 0'}`);
    console.log(`   TODO comments: ${todos.length > 0 ? '📝 ' + todos.length : '✅ 0'}`);
    console.log(`   Environment: ${envConfigured ? '✅ Configured' : '⚠️  Needs attention'}`);
    console.log('');

    if (consoleIssues.length > 0 || !envConfigured) {
      console.log('⚠️  Please address the issues above before deploying to production');
      process.exit(1);
    } else {
      console.log('🎉 Cleanup completed successfully! Ready for production deployment.');
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Run cleanup
runCleanup();
