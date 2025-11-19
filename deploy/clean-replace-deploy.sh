#!/bin/bash
# Clean Replace Deployment Script
# This script stops the old site, cleans up, and deploys the new portfolio

set -e

echo "🧹 Starting Clean Replace Deployment..."
echo "======================================"
echo ""

# Check what's currently running
echo "📊 Checking what's currently running..."
if command -v pm2 &> /dev/null; then
    echo "PM2 processes:"
    pm2 list || echo "No PM2 processes found"
else
    echo "PM2 not installed"
fi

echo ""
echo "Checking for running Node processes:"
ps aux | grep node | grep -v grep || echo "No Node processes found"

echo ""
echo "Checking for running services:"
sudo systemctl list-units --type=service --state=running | grep -E "(nginx|node|portfolio)" || echo "No relevant services found"

echo ""
read -p "⚠️  This will STOP and REMOVE all current portfolio applications. Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Stop and remove old applications
echo ""
echo "🛑 Stopping old applications..."
if command -v pm2 &> /dev/null; then
    pm2 delete all 2>/dev/null || echo "No PM2 apps to delete"
    pm2 save 2>/dev/null || true
fi

# Kill any remaining Node processes on ports 3000 and 3001
echo "   Killing any processes on ports 3000 and 3001..."
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true
sudo lsof -ti:3001 | xargs sudo kill -9 2>/dev/null || true

# Clean up old deployment directories (optional - comment out if you want to keep)
echo ""
read -p "🗑️  Remove old deployment files in /var/www/? (yes/no): " cleanup_old
if [ "$cleanup_old" = "yes" ]; then
    echo "   Removing old deployment..."
    sudo rm -rf /var/www/portfolio 2>/dev/null || true
    echo "✅ Old files removed"
fi

# Create fresh directories
echo ""
echo "📁 Creating fresh deployment directories..."
sudo mkdir -p /var/www/portfolio/backend
sudo mkdir -p /var/www/portfolio/frontend
sudo mkdir -p /var/www/portfolio/backend/uploads
sudo mkdir -p /var/www/portfolio/backend/logs
sudo mkdir -p /var/www/portfolio/frontend/logs
sudo chown -R $USER:$USER /var/www/portfolio

# Ask for source locations
echo ""
echo "📦 Where are your code repositories?"
echo "1. Already cloned in ~/"
echo "2. Need to clone from Git"
echo "3. Upload manually (you'll do this separately)"
read -p "Choose option (1/2/3): " source_option

case $source_option in
    1)
        BACKEND_SOURCE="$HOME/Portfolio-2025-Back-End"
        FRONTEND_SOURCE="$HOME/Portfolio-2025-Front-End"
        if [ ! -d "$BACKEND_SOURCE" ]; then
            echo "❌ Backend source not found at $BACKEND_SOURCE"
            exit 1
        fi
        if [ ! -d "$FRONTEND_SOURCE" ]; then
            echo "❌ Frontend source not found at $FRONTEND_SOURCE"
            exit 1
        fi
        ;;
    2)
        read -p "Backend Git URL: " BACKEND_GIT
        read -p "Frontend Git URL: " FRONTEND_GIT
        cd ~
        rm -rf Portfolio-2025-Back-End Portfolio-2025-Front-End
        git clone "$BACKEND_GIT" Portfolio-2025-Back-End
        git clone "$FRONTEND_GIT" Portfolio-2025-Front-End
        BACKEND_SOURCE="$HOME/Portfolio-2025-Back-End"
        FRONTEND_SOURCE="$HOME/Portfolio-2025-Front-End"
        ;;
    3)
        echo "📝 Please upload your code to:"
        echo "   Backend: ~/Portfolio-2025-Back-End or ~/Portfolio/Portfolio-2025-Back-End"
        echo "   Frontend: ~/Portfolio-2025-Front-End or ~/Portfolio/Portfolio-2025-Front-End"
        read -p "Press Enter when code is uploaded..."
        
        if [ -d "$HOME/Portfolio/Portfolio-2025-Back-End" ]; then
            BACKEND_SOURCE="$HOME/Portfolio/Portfolio-2025-Back-End"
        else
            BACKEND_SOURCE="$HOME/Portfolio-2025-Back-End"
        fi
        
        if [ -d "$HOME/Portfolio/Portfolio-2025-Front-End" ]; then
            FRONTEND_SOURCE="$HOME/Portfolio/Portfolio-2025-Front-End"
        else
            FRONTEND_SOURCE="$HOME/Portfolio-2025-Front-End"
        fi
        ;;
esac

# Copy code
echo ""
echo "📋 Copying code..."
rsync -av --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude '.next' \
    "$BACKEND_SOURCE/" /var/www/portfolio/backend/
rsync -av --exclude 'node_modules' --exclude '.git' --exclude '.next' \
    "$FRONTEND_SOURCE/" /var/www/portfolio/frontend/
echo "✅ Code copied"

# Setup environment variables if they don't exist
echo ""
echo "⚙️  Environment variables..."
if [ ! -f "/var/www/portfolio/backend/.env" ]; then
    echo "   Creating backend .env template..."
    cat > /var/www/portfolio/backend/.env << 'EOF'
DATABASE_URL="postgresql://portfolio_user:CHANGE_THIS_PASSWORD@localhost:5432/portfolio_db?schema=public"
PORT=3001
NODE_ENV=production
CORS_ORIGINS="http://localhost:3000,https://jasonolefson.com,https://www.jasonolefson.com"
SESSION_SECRET=CHANGE_THIS_TO_RANDOM_STRING
EOF
    echo "⚠️  Please edit /var/www/portfolio/backend/.env with your settings"
fi

if [ ! -f "/var/www/portfolio/frontend/.env" ]; then
    echo "   Creating frontend .env template..."
    cat > /var/www/portfolio/frontend/.env << 'EOF'
BACKEND_URL=http://localhost:3001
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=https://jasonolefson.com
EOF
    echo "⚠️  Please edit /var/www/portfolio/frontend/.env if needed"
fi

# Deploy Backend
echo ""
echo "🔧 Deploying Backend..."
cd /var/www/portfolio/backend

echo "   Installing dependencies..."
npm ci --production=false || npm install

echo "   Building TypeScript..."
npm run build

echo "   Generating Prisma Client..."
npx prisma generate

echo "   Running database migrations..."
npx prisma migrate deploy || echo "⚠️  Migration may need attention"

echo "   Starting with PM2..."
pm2 start ecosystem.config.js --name portfolio-backend || {
    echo "⚠️  ecosystem.config.js not found, using basic PM2 start"
    pm2 start dist/server.js --name portfolio-backend
}
pm2 save

# Deploy Frontend
echo ""
echo "🎨 Deploying Frontend..."
cd /var/www/portfolio/frontend

echo "   Installing dependencies..."
npm ci --production=false || npm install

echo "   Building Next.js application..."
npm run build

echo "   Starting with PM2..."
pm2 start ecosystem.config.js --name portfolio-frontend || {
    echo "⚠️  ecosystem.config.js not found, using basic PM2 start"
    pm2 start npm --name portfolio-frontend -- start
}
pm2 save

# Configure Nginx
echo ""
echo "🌐 Configuring Nginx..."
if [ -f "/var/www/portfolio/backend/deploy/nginx.conf" ]; then
    sudo cp /var/www/portfolio/backend/deploy/nginx.conf /etc/nginx/sites-available/portfolio
    sudo ln -sf /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/portfolio
    sudo rm -f /etc/nginx/sites-enabled/default
    
    if sudo nginx -t; then
        sudo systemctl reload nginx
        echo "✅ Nginx configured and reloaded"
    else
        echo "⚠️  Nginx config has errors. Please fix manually"
    fi
else
    echo "⚠️  nginx.conf not found. Please configure manually"
fi

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "📊 Status:"
pm2 status
echo ""
echo "📝 Next Steps:"
echo "1. Verify environment variables are correct"
echo "2. Check if database needs setup: sudo -u postgres psql"
echo "3. Test the site: curl http://localhost:3001/health"
echo "4. Visit https://jasonolefson.com"
echo ""
echo "📊 Useful commands:"
echo "  pm2 logs              # View logs"
echo "  pm2 restart all       # Restart everything"
echo "  sudo nginx -t         # Test Nginx config"

