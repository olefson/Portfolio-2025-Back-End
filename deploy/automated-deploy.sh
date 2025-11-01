#!/bin/bash
# Automated deployment script that can be run via EC2 Instance Connect
# This script handles the complete deployment process

set -e

echo "🚀 Automated Portfolio Deployment"
echo "=================================="
echo ""

# Configuration
BASE_DIR="/var/www/portfolio"
BACKEND_DIR="$BASE_DIR/backend"
FRONTEND_DIR="$BASE_DIR/frontend"
BACKEND_SOURCE="$HOME/Portfolio/Portfolio-2025-Back-End"
FRONTEND_SOURCE="$HOME/Portfolio/Portfolio-2025-Front-End"

# Check if running as root or with sudo
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Running as root. This is okay for initial setup."
    SUDO=""
else
    SUDO="sudo"
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."
MISSING_DEPS=()

if ! command_exists node; then
    MISSING_DEPS+=("nodejs")
fi
if ! command_exists npm; then
    MISSING_DEPS+=("npm")
fi
if ! command_exists pm2; then
    MISSING_DEPS+=("pm2")
fi
if ! command_exists psql; then
    MISSING_DEPS+=("postgresql")
fi
if ! command_exists nginx; then
    MISSING_DEPS+=("nginx")
fi

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo "❌ Missing dependencies: ${MISSING_DEPS[*]}"
    echo "   Please run setup-ec2.sh first, or install manually:"
    echo "   ${SUDO} apt-get install -y ${MISSING_DEPS[*]}"
    echo "   npm install -g pm2"
    exit 1
fi

echo "✅ All prerequisites met!"
echo ""

# Create directories if they don't exist
echo "📁 Setting up directories..."
$SUDO mkdir -p "$BASE_DIR"
$SUDO mkdir -p "$BACKEND_DIR"
$SUDO mkdir -p "$FRONTEND_DIR"
$SUDO mkdir -p "$BACKEND_DIR/uploads"
$SUDO mkdir -p "$BACKEND_DIR/logs"
$SUDO mkdir -p "$FRONTEND_DIR/logs"

# Set permissions
if [ -n "$SUDO" ]; then
    $SUDO chown -R $USER:$USER "$BASE_DIR"
fi

echo "✅ Directories ready"
echo ""

# Check if source code exists
if [ ! -d "$BACKEND_SOURCE" ] && [ ! -d "$HOME/Portfolio-2025-Back-End" ]; then
    echo "⚠️  Backend source not found in expected locations."
    echo "   Expected: $BACKEND_SOURCE or $HOME/Portfolio-2025-Back-End"
    echo "   Please ensure your code is available."
    echo ""
    echo "   You can:"
    echo "   1. Upload code via SCP/RSYNC"
    echo "   2. Clone from Git repository"
    echo "   3. Place code in $HOME/Portfolio/"
    exit 1
fi

# Find source directories
if [ -d "$BACKEND_SOURCE" ]; then
    ACTUAL_BACKEND_SOURCE="$BACKEND_SOURCE"
elif [ -d "$HOME/Portfolio-2025-Back-End" ]; then
    ACTUAL_BACKEND_SOURCE="$HOME/Portfolio-2025-Back-End"
fi

if [ -d "$FRONTEND_SOURCE" ]; then
    ACTUAL_FRONTEND_SOURCE="$FRONTEND_SOURCE"
elif [ -d "$HOME/Portfolio-2025-Front-End" ]; then
    ACTUAL_FRONTEND_SOURCE="$HOME/Portfolio-2025-Front-End"
fi

# Copy source code
echo "📦 Copying source code..."
if [ -d "$ACTUAL_BACKEND_SOURCE" ]; then
    rsync -av --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
        "$ACTUAL_BACKEND_SOURCE/" "$BACKEND_DIR/"
    echo "✅ Backend code copied"
else
    echo "❌ Backend source not found"
    exit 1
fi

if [ -d "$ACTUAL_FRONTEND_SOURCE" ]; then
    rsync -av --exclude 'node_modules' --exclude '.git' --exclude '.next' \
        "$ACTUAL_FRONTEND_SOURCE/" "$FRONTEND_DIR/"
    echo "✅ Frontend code copied"
else
    echo "❌ Frontend source not found"
    exit 1
fi

echo ""

# Deploy Backend
echo "🔧 Deploying Backend..."
cd "$BACKEND_DIR"

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "   Please edit .env with your configuration:"
        echo "   nano $BACKEND_DIR/.env"
        echo "   Important: Update DATABASE_URL with your PostgreSQL credentials"
    else
        echo "❌ No .env.example found. Please create .env manually."
        exit 1
    fi
fi

echo "   Installing dependencies..."
npm ci --production=false || npm install

echo "   Building TypeScript..."
npm run build

echo "   Generating Prisma Client..."
npx prisma generate

echo "   Running database migrations..."
npx prisma migrate deploy || echo "⚠️  Migration failed or already applied"

echo "   Setting up PM2..."
if [ ! -f "ecosystem.config.js" ]; then
    echo "⚠️  ecosystem.config.js not found. Creating default..."
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'portfolio-backend',
    script: './dist/server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    time: true,
    autorestart: true,
    watch: false
  }]
};
EOF
fi

echo "   Restarting backend..."
pm2 delete portfolio-backend 2>/dev/null || true
pm2 start ecosystem.config.js --name portfolio-backend
pm2 save

echo "✅ Backend deployed"
echo ""

# Deploy Frontend
echo "🎨 Deploying Frontend..."
cd "$FRONTEND_DIR"

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "   Please edit .env with your configuration:"
        echo "   nano $FRONTEND_DIR/.env"
    else
        echo "⚠️  No .env.example found. Creating default .env..."
        cat > .env << 'EOF'
BACKEND_URL=http://localhost:3001
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost
EOF
    fi
fi

echo "   Installing dependencies..."
npm ci --production=false || npm install

echo "   Building Next.js application..."
npm run build

echo "   Setting up PM2..."
if [ ! -f "ecosystem.config.js" ]; then
    echo "⚠️  ecosystem.config.js not found. Creating default..."
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'portfolio-frontend',
    script: 'npm',
    args: 'start',
    cwd: './',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    time: true,
    autorestart: true,
    watch: false
  }]
};
EOF
fi

echo "   Restarting frontend..."
pm2 delete portfolio-frontend 2>/dev/null || true
pm2 start ecosystem.config.js --name portfolio-frontend
pm2 save

echo "✅ Frontend deployed"
echo ""

# Setup Nginx
echo "🌐 Configuring Nginx..."
NGINX_CONFIG="/etc/nginx/sites-available/portfolio"
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "   Creating Nginx configuration..."
    $SUDO cp "$BACKEND_DIR/../deploy/nginx.conf" "$NGINX_CONFIG" 2>/dev/null || \
    $SUDO tee "$NGINX_CONFIG" > /dev/null << 'EOF'
upstream backend {
    server localhost:3001;
}
upstream frontend {
    server localhost:3000;
}
server {
    listen 80;
    server_name _;
    client_max_body_size 50M;
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /uploads {
        proxy_pass http://backend;
    }
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
    
    $SUDO ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/portfolio
    $SUDO rm -f /etc/nginx/sites-enabled/default
fi

echo "   Testing Nginx configuration..."
if $SUDO nginx -t; then
    echo "   Reloading Nginx..."
    $SUDO systemctl reload nginx
    echo "✅ Nginx configured"
else
    echo "⚠️  Nginx configuration has errors. Please fix manually."
fi

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "📊 Status:"
pm2 status
echo ""
echo "📝 Next Steps:"
echo "1. Check environment variables:"
echo "   - Backend: nano $BACKEND_DIR/.env"
echo "   - Frontend: nano $FRONTEND_DIR/.env"
echo "2. Update domain in Nginx config: $SUDO nano $NGINX_CONFIG"
echo "3. Setup SSL with Let's Encrypt (optional):"
echo "   $SUDO apt-get install -y certbot python3-certbot-nginx"
echo "   $SUDO certbot --nginx -d yourdomain.com"
echo "4. View logs: pm2 logs"
echo ""
echo "🌐 Your site should be accessible at your domain or EC2 IP address"

