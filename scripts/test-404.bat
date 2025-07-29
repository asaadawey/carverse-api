@echo off
echo 🧪 Testing 404 Not Found Controller...
echo.
echo 📋 This script will test various scenarios for unmatched API routes
echo.

echo 🔨 Building TypeScript files...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo ❌ Build failed. Please fix TypeScript errors before testing.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo 🚀 Starting 404 tests...
node scripts/test-404.js

echo.
echo 📋 404 controller test completed.
pause
