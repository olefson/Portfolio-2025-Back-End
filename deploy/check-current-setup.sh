#!/bin/bash
# Quick script to check what's currently running on the server

echo "🔍 Current Server Setup Check"
echo "=============================="
echo ""

echo "📊 PM2 Processes:"
if command -v pm2 &> /dev/null; then
    pm2 list
else
    echo "PM2 not installed"
fi

echo ""
echo "🌐 Nginx Status:"
sudo systemctl status nginx --no-pager -l || echo "Nginx not running"

echo ""
echo "🗄️  PostgreSQL Status:"
sudo systemctl status postgresql --no-pager -l || echo "PostgreSQL not running"

echo ""
echo "📁 Current Deployment Directories:"
if [ -d "/var/www" ]; then
    ls -la /var/www/
else
    echo "/var/www doesn't exist"
fi

echo ""
echo "🔌 Port Usage:"
echo "Port 80:"
sudo lsof -i :80 || echo "  Nothing on port 80"
echo "Port 443:"
sudo lsof -i :443 || echo "  Nothing on port 443"
echo "Port 3000:"
sudo lsof -i :3000 || echo "  Nothing on port 3000"
echo "Port 3001:"
sudo lsof -i :3001 || echo "  Nothing on port 3001"

echo ""
echo "📂 Node Processes:"
ps aux | grep node | grep -v grep || echo "No Node processes found"

echo ""
echo "📋 Nginx Configuration:"
if [ -d "/etc/nginx/sites-enabled" ]; then
    echo "Enabled sites:"
    ls -la /etc/nginx/sites-enabled/
fi

echo ""
echo "✅ Check complete!"

