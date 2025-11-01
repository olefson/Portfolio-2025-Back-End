#!/bin/bash
# Production Deployment Script
# Run this script to deploy both frontend and backend

set -e  # Exit on error

BASE_DIR="/var/www/portfolio"
BACKEND_DIR="$BASE_DIR/backend"
FRONTEND_DIR="$BASE_DIR/frontend"

echo "🚀 Starting deployment..."

# Check if directories exist
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found: $BACKEND_DIR"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi

# Deploy Backend
echo "📦 Deploying Backend..."
cd "$BACKEND_DIR"

# Install dependencies
echo "   Installing backend dependencies..."
npm ci --production=false

# Build TypeScript
echo "   Building TypeScript..."
npm run build

# Generate Prisma Client
echo "   Generating Prisma Client..."
npx prisma generate

# Run database migrations
echo "   Running database migrations..."
npx prisma migrate deploy

# Create uploads directory if it doesn't exist
mkdir -p "$BACKEND_DIR/uploads"

# Restart backend with PM2
echo "   Restarting backend with PM2..."
pm2 delete portfolio-backend 2>/dev/null || true
pm2 start ecosystem.config.js --name portfolio-backend
pm2 save

# Deploy Frontend
echo "📦 Deploying Frontend..."
cd "$FRONTEND_DIR"

# Install dependencies
echo "   Installing frontend dependencies..."
npm ci --production=false

# Build Next.js app
echo "   Building Next.js application..."
npm run build

# Restart frontend with PM2
echo "   Restarting frontend with PM2..."
pm2 delete portfolio-frontend 2>/dev/null || true
pm2 start ecosystem.config.js --name portfolio-frontend
pm2 save

# Reload Nginx
echo "🔄 Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo ""
echo "📊 Check PM2 status: pm2 status"
echo "📊 View logs: pm2 logs"
echo "🌐 Your site should be available at your domain"

