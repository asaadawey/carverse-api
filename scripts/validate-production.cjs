#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Running Final Production Validation...\n');

let validationErrors = [];
let validationWarnings = [];
let validationInfo = [];

// Check if production cleanup was run
function checkProductionCleanup() {
    console.log('📋 Checking production cleanup status...');
    
    const cleanupMarkerPath = path.join(__dirname, '..', '.production-cleanup-complete');
    if (!fs.existsSync(cleanupMarkerPath)) {
        validationErrors.push('Production cleanup script has not been run. Please run "npm run cleanup:production" first.');
    } else {
        validationInfo.push('✓ Production cleanup completed');
    }
}

// Validate environment file
function validateEnvironment() {
    console.log('🔧 Validating environment configuration...');
    
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
        validationErrors.push('No .env file found. Create .env file with production settings.');
        return;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    const requiredVars = [
        'NODE_ENV',
        'DATABASE_URL',
        'APP_SECRET',
        'API_VALUE',
        'COOKIE_SECRET',
        'STRIPE_API_KEY',
        'EMAIL_USER',
        'EMAIL_PASSWORD'
    ];
    
    const missingVars = [];
    const weakSecrets = [];
    
    requiredVars.forEach(varName => {
        const envVar = envLines.find(line => line.startsWith(`${varName}=`));
        if (!envVar) {
            missingVars.push(varName);
        } else {
            const value = envVar.split('=')[1];
            if (varName.includes('SECRET') || varName.includes('PASSWORD') || varName.includes('KEY')) {
                if (value && value.length < 32) {
                    weakSecrets.push(`${varName} (${value.length} characters)`);
                }
            }
        }
    });
    
    if (missingVars.length > 0) {
        validationErrors.push(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    if (weakSecrets.length > 0) {
        validationWarnings.push(`Weak secrets detected (should be 32+ characters): ${weakSecrets.join(', ')}`);
    }
    
    // Check NODE_ENV
    const nodeEnvLine = envLines.find(line => line.startsWith('NODE_ENV='));
    if (nodeEnvLine && !nodeEnvLine.includes('production')) {
        validationWarnings.push('NODE_ENV is not set to "production"');
    }
    
    validationInfo.push(`✓ Environment file exists with ${envLines.length} variables`);
}

// Check package.json scripts
function validatePackageScripts() {
    console.log('📦 Validating package.json scripts...');
    
    const packagePath = path.join(__dirname, '..', 'package.json');
    if (!fs.existsSync(packagePath)) {
        validationErrors.push('package.json not found');
        return;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const scripts = packageJson.scripts || {};
    
    const requiredScripts = ['start', 'build', 'test'];
    const missingScripts = requiredScripts.filter(script => !scripts[script]);
    
    if (missingScripts.length > 0) {
        validationErrors.push(`Missing required scripts: ${missingScripts.join(', ')}`);
    }
    
    validationInfo.push('✓ Package.json scripts validated');
}

// Check Prisma setup
function validatePrisma() {
    console.log('🗄️ Validating Prisma setup...');
    
    const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
    if (!fs.existsSync(schemaPath)) {
        validationErrors.push('Prisma schema.prisma not found');
        return;
    }
    
    const migrationsPath = path.join(__dirname, '..', 'prisma', 'migrations');
    if (!fs.existsSync(migrationsPath)) {
        validationWarnings.push('No Prisma migrations found');
    }
    
    // Check if Prisma client is generated
    const clientPath = path.join(__dirname, '..', 'node_modules', '.prisma', 'client');
    if (!fs.existsSync(clientPath)) {
        validationWarnings.push('Prisma client not generated. Run "npx prisma generate"');
    }
    
    validationInfo.push('✓ Prisma configuration validated');
}

// Check for TypeScript compilation
function validateTypeScript() {
    console.log('🔧 Validating TypeScript setup...');
    
    const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json');
    if (!fs.existsSync(tsconfigPath)) {
        validationWarnings.push('No tsconfig.json found');
    }
    
    const distPath = path.join(__dirname, '..', 'dist');
    if (!fs.existsSync(distPath)) {
        validationWarnings.push('No dist folder found. Run "npm run build" to compile TypeScript');
    }
    
    validationInfo.push('✓ TypeScript configuration checked');
}

// Check logs directory
function validateLogging() {
    console.log('📝 Validating logging setup...');
    
    const logsPath = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsPath)) {
        fs.mkdirSync(logsPath, { recursive: true });
        validationInfo.push('✓ Created logs directory');
    } else {
        validationInfo.push('✓ Logs directory exists');
    }
}

// Check for remaining console statements
function checkConsoleStatements() {
    console.log('🔍 Checking for remaining console statements...');
    
    const srcPath = path.join(__dirname, '..', 'src');
    let consoleCount = 0;
    
    function scanDirectory(dir) {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                scanDirectory(filePath);
            } else if (file.endsWith('.ts') || file.endsWith('.js')) {
                const content = fs.readFileSync(filePath, 'utf8');
                const lines = content.split('\n');
                
                lines.forEach((line, index) => {
                    if (line.includes('console.log') || line.includes('console.error') || 
                        line.includes('console.warn') || line.includes('console.info')) {
                        consoleCount++;
                    }
                });
            }
        });
    }
    
    if (fs.existsSync(srcPath)) {
        scanDirectory(srcPath);
    }
    
    if (consoleCount > 0) {
        validationWarnings.push(`${consoleCount} console statements found in source code`);
    } else {
        validationInfo.push('✓ No console statements found in source code');
    }
}

// Check for test coverage
function validateTests() {
    console.log('🧪 Validating test setup...');
    
    const testsPath = path.join(__dirname, '..', 'tests');
    const coveragePath = path.join(__dirname, '..', 'coverage');
    
    if (!fs.existsSync(testsPath)) {
        validationWarnings.push('No tests directory found');
    } else {
        validationInfo.push('✓ Tests directory exists');
    }
    
    if (!fs.existsSync(coveragePath)) {
        validationWarnings.push('No test coverage found. Run "npm test" to generate coverage');
    } else {
        validationInfo.push('✓ Test coverage reports available');
    }
}

// Check security headers middleware
function validateSecurity() {
    console.log('🔒 Validating security setup...');
    
    const securityMiddlewarePath = path.join(__dirname, '..', 'src', 'middleware', 'security.middleware.ts');
    const mainIndexPath = path.join(__dirname, '..', 'src', 'index.ts');
    
    if (!fs.existsSync(securityMiddlewarePath)) {
        validationErrors.push('Security middleware not found');
    } else {
        const indexContent = fs.readFileSync(mainIndexPath, 'utf8');
        if (!indexContent.includes('security.middleware')) {
            validationWarnings.push('Security middleware not integrated in main app');
        } else {
            validationInfo.push('✓ Security middleware configured');
        }
    }
}

// Run all validations
function runValidation() {
    checkProductionCleanup();
    validateEnvironment();
    validatePackageScripts();
    validatePrisma();
    validateTypeScript();
    validateLogging();
    checkConsoleStatements();
    validateTests();
    validateSecurity();
    
    // Print results
    console.log('\n' + '='.repeat(60));
    console.log('📊 PRODUCTION VALIDATION RESULTS');
    console.log('='.repeat(60));
    
    if (validationErrors.length > 0) {
        console.log('\n❌ ERRORS (Must be fixed before deployment):');
        validationErrors.forEach(error => console.log(`   • ${error}`));
    }
    
    if (validationWarnings.length > 0) {
        console.log('\n⚠️  WARNINGS (Recommended to fix):');
        validationWarnings.forEach(warning => console.log(`   • ${warning}`));
    }
    
    if (validationInfo.length > 0) {
        console.log('\n✅ PASSED CHECKS:');
        validationInfo.forEach(info => console.log(`   • ${info}`));
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (validationErrors.length === 0) {
        console.log('🎉 PRODUCTION VALIDATION PASSED!');
        console.log('Your application is ready for production deployment.');
        
        if (validationWarnings.length > 0) {
            console.log(`\n⚠️  Note: ${validationWarnings.length} warnings found. Consider addressing them for optimal production performance.`);
        }
    } else {
        console.log('❌ PRODUCTION VALIDATION FAILED!');
        console.log(`Fix ${validationErrors.length} error(s) before deploying to production.`);
        process.exit(1);
    }
    
    console.log('\n📖 For detailed deployment instructions, see PRODUCTION_DEPLOYMENT.md');
    console.log('='.repeat(60));
}

// Run the validation
runValidation();
