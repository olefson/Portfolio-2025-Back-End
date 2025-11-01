#!/bin/bash
# EC2 Production Deployment Script
# This script sets up the production environment on Ubuntu EC2

set -e  # Exit on error

echo "🚀 Starting EC2 Production Setup..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 20.x
echo "📦 Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
echo "📦 Installing PostgreSQL..."
sudo apt-get install -y postgresql postgresql-contrib

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt-get install -y nginx

# Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install build essentials
echo "📦 Installing build essentials..."
sudo apt-get install -y build-essential

# Install Git (if not already installed)
echo "📦 Installing Git..."
sudo apt-get install -y git

# Create application directories
echo "📁 Creating application directories..."
sudo mkdir -p /var/www/portfolio
sudo mkdir -p /var/www/portfolio/backend
sudo mkdir -p /var/www/portfolio/frontend
sudo mkdir -p /var/www/portfolio/uploads

# Set permissions
sudo chown -R $USER:$USER /var/www/portfolio

# Setup PostgreSQL database
echo "🗄️  Setting up PostgreSQL database..."
sudo -u postgres psql <<EOF
CREATE DATABASE portfolio_db;
CREATE USER portfolio_user WITH ENCRYPTED PASSWORD 'CHANGE_THIS_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE portfolio_db TO portfolio_user;
ALTER DATABASE portfolio_db OWNER TO portfolio_user;
\q
EOF

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Configure environment variables in /var/www/portfolio/backend/.env"
echo "2. Configure environment variables in /var/www/portfolio/frontend/.env"
echo "3. Update the PostgreSQL password in backend/.env"
echo "4. Deploy your code to /var/www/portfolio/"
echo "5. Run the deployment script: ./deploy.sh"

