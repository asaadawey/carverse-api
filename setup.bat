@echo off
echo 🚗 Car Wash API Setup
echo =====================

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

:: Check if Yarn is installed
yarn --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Yarn is not installed. Please install Yarn first.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    yarn install
)

:: Check if .env file exists
if not exist ".env" (
    echo ⚠️  .env file not found. Please create one based on .env.example
    echo 📄 Required environment variables:
    echo    - DATABASE_URL
    echo    - JWT_SECRET
    echo    - APP_SECRET
    echo    - REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
    echo    - AWS credentials for S3
    echo    - STRIPE_SECRET_KEY
    pause
    exit /b 1
)

:: Build the project
echo 🔨 Building the project...
yarn build

if %errorlevel% equ 0 (
    echo ✅ Build successful
) else (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo.
echo 🎉 Setup complete!
echo.
echo 📚 Available commands:
echo    yarn dev          - Start development server
echo    yarn start        - Start production server  
echo    yarn test         - Run unit tests
echo    yarn test:intg    - Run integration tests
echo    yarn prisma:migrate - Run database migrations
echo    yarn seed         - Seed the database
echo.
echo 📖 API Documentation:
echo    http://localhost:3000/api-docs (when server is running)
echo.
echo 🏥 Health Check:
echo    http://localhost:3000/health
echo.
pause
