#!/bin/bash
# Quick deployment script for automated deployment via EC2 Instance Connect
# This script assumes you've already run setup-ec2.sh

set -e

echo "🚀 Quick Deployment Script"
echo "=========================="

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

BACKEND_DIR="$PROJECT_ROOT/Portfolio-2025-Back-End"
FRONTEND_DIR="$PROJECT_ROOT/Portfolio-2025-Front-End"
DEPLOY_BACKEND_DIR="/var/www/portfolio/backend"
DEPLOY_FRONTEND_DIR="/var/www/portfolio/frontend"

# Check if we're on the server or local machine
if [ -d "/var/www/portfolio" ]; then
    echo "📍 Running on EC2 server..."
    DEPLOY_MODE="server"
else
    echo "📍 Running on local machine..."
    DEPLOY_MODE="local"
fi

if [ "$DEPLOY_MODE" = "local" ]; then
    echo ""
    echo "This script is designed to run on the EC2 server."
    echo "Please upload your code first, then run deploy.sh on the server."
    echo ""
    echo "To upload code, you can use:"
    echo "  rsync -avz -e 'ssh -i your-key.pem' Portfolio-2025-Back-End/ ubuntu@your-ec2-ip:/var/www/portfolio/backend/"
    echo "  rsync -avz -e 'ssh -i your-key.pem' Portfolio-2025-Front-End/ ubuntu@your-ec2-ip:/var/www/portfolio/frontend/"
    exit 1
fi

# Deploy Backend
echo ""
echo "📦 Deploying Backend..."
cd "$DEPLOY_BACKEND_DIR"

if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Please create it first."
    echo "   Copy .env.example and update with your values."
fi

echo "   Installing dependencies..."
npm ci --production=false

echo "   Building TypeScript..."
npm run build

echo "   Generating Prisma Client..."
npx prisma generate

echo "   Running database migrations..."
npx prisma migrate deploy

mkdir -p uploads
mkdir -p logs

echo "   Restarting backend with PM2..."
pm2 delete portfolio-backend 2>/dev/null || true
pm2 start ecosystem.config.js --name portfolio-backend
pm2 save

# Deploy Frontend
echo ""
echo "📦 Deploying Frontend..."
cd "$DEPLOY_FRONTEND_DIR"

if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Please create it first."
    echo "   Copy .env.example and update with your values."
fi

echo "   Installing dependencies..."
npm ci --production=false

echo "   Building Next.js application..."
npm run build

mkdir -p logs

echo "   Restarting frontend with PM2..."
pm2 delete portfolio-frontend 2>/dev/null || true
pm2 start ecosystem.config.js --name portfolio-frontend
pm2 save

# Reload Nginx
echo ""
echo "🔄 Reloading Nginx..."
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Nginx configuration error. Please fix before reloading."
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Quick Status Check:"
pm2 status
echo ""
echo "📊 View logs: pm2 logs"
echo "🌐 Check your site at your domain"

