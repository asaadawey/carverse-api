#!/bin/bash

# Car Wash API Development Setup Script

echo "🚗 Car Wash API Setup"
echo "====================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Yarn is installed
if ! command -v yarn &> /dev/null; then
    echo "❌ Yarn is not installed. Please install Yarn first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    yarn install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Please create one based on .env.example"
    echo "📄 Required environment variables:"
    echo "   - DATABASE_URL"
    echo "   - JWT_SECRET" 
    echo "   - APP_SECRET"
    echo "   - REDIS_HOST, REDIS_PORT, REDIS_PASSWORD"
    echo "   - AWS credentials for S3"
    echo "   - STRIPE_SECRET_KEY"
    exit 1
fi

# Build the project
echo "🔨 Building the project..."
yarn build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📚 Available commands:"
echo "   yarn dev          - Start development server"
echo "   yarn start        - Start production server"
echo "   yarn test         - Run unit tests"
echo "   yarn test:intg    - Run integration tests"
echo "   yarn prisma:migrate - Run database migrations"
echo "   yarn seed         - Seed the database"
echo ""
echo "📖 API Documentation:"
echo "   http://localhost:3000/api-docs (when server is running)"
echo ""
echo "🏥 Health Check:"
echo "   http://localhost:3000/health"
echo ""
