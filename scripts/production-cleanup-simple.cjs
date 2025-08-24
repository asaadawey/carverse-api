const fs = require('fs');
const path = require('path');

console.log('Starting production cleanup...\n');

let consoleIssues = [];
let todos = [];

// Function to scan files for console statements
function scanConsoleStatements(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('dist') && !file.includes('coverage')) {
      scanConsoleStatements(filePath);
    } else if ((file.endsWith('.ts') || file.endsWith('.js')) && !file.includes('test') && !file.includes('spec')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (
          trimmedLine.includes('console.log') ||
          trimmedLine.includes('console.error') ||
          trimmedLine.includes('console.warn') ||
          trimmedLine.includes('console.info')
        ) {
          const relativePath = path.relative(process.cwd(), filePath);
          consoleIssues.push({
            file: relativePath,
            line: index + 1,
            content: trimmedLine.substring(0, 100) + (trimmedLine.length > 100 ? '...' : ''),
          });
        }

        if (trimmedLine.includes('TODO') || trimmedLine.includes('FIXME')) {
          const relativePath = path.relative(process.cwd(), filePath);
          todos.push({
            file: relativePath,
            line: index + 1,
            content: trimmedLine.substring(0, 100) + (trimmedLine.length > 100 ? '...' : ''),
          });
        }
      });
    }
  });
}

// Function to check environment configuration
function checkEnvironmentConfig() {
  const envPath = path.join(process.cwd(), '.env');
  return fs.existsSync(envPath);
}

// Main cleanup function
function runCleanup() {
  const srcPath = path.join(process.cwd(), 'src');

  console.log('Checking for console statements...');
  if (fs.existsSync(srcPath)) {
    scanConsoleStatements(srcPath);
  }

  if (consoleIssues.length > 0) {
    console.log(`WARNING: Found ${consoleIssues.length} console statements:`);
    consoleIssues.slice(0, 10).forEach((issue) => {
      console.log(`   ${issue.file}:${issue.line} - ${issue.content}`);
    });
    if (consoleIssues.length > 10) {
      console.log(`   ... and ${consoleIssues.length - 10} more`);
    }
  } else {
    console.log('OK: No console statements found');
  }

  console.log('\nChecking for TODO/FIXME comments...');
  if (todos.length > 0) {
    console.log(`WARNING: Found ${todos.length} TODO/FIXME comments:`);
    todos.forEach((todo) => {
      console.log(`   ${todo.file}:${todo.line} - ${todo.content}`);
    });
  } else {
    console.log('OK: No TODO/FIXME comments found');
  }

  console.log('\nChecking environment configuration...');
  const envConfigured = checkEnvironmentConfig();
  if (envConfigured) {
    console.log('OK: Found .env file');
  } else {
    console.log('WARNING: No .env file found');
  }

  // Print summary
  console.log('\nProduction Cleanup Summary:');
  console.log(`   Console statements: ${consoleIssues.length > 0 ? 'WARNING ' + consoleIssues.length : 'OK 0'}`);
  console.log(`   TODO comments: ${todos.length > 0 ? 'INFO ' + todos.length : 'OK 0'}`);
  console.log(`   Environment: ${envConfigured ? 'OK Configured' : 'WARNING Needs attention'}`);

  // Create completion marker
  const markerPath = path.join(__dirname, '..', '.production-cleanup-complete');
  fs.writeFileSync(
    markerPath,
    `Production cleanup completed at ${new Date().toISOString()}\nConsole statements: ${
      consoleIssues.length
    }\nTODO comments: ${todos.length}\nEnvironment configured: ${envConfigured}\n`,
  );

  if (consoleIssues.length > 0 || !envConfigured) {
    console.log('\nWARNING: Please address the issues above before deploying to production');
  } else {
    console.log('\nSUCCESS: Production cleanup completed successfully!');
  }

  console.log('INFO: Production cleanup marker created');
}

// Run the cleanup
runCleanup();
