# Production Deployment Guide

This guide will help you deploy your Portfolio site to EC2.

## Prerequisites

- EC2 instance running Ubuntu 22.04
- Domain name pointing to your EC2 instance (optional but recommended)
- SSH access to your EC2 instance

## Architecture Overview

```
Internet
   ↓
Nginx (Port 80/443) - Reverse Proxy
   ↓
Frontend: Next.js (Port 3000) - PM2
Backend: Express API (Port 3001) - PM2
Database: PostgreSQL
```

## Step 1: Initial EC2 Setup

### 1.1 Connect to your EC2 instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 1.2 Run the setup script

Upload the setup script to your EC2 instance and run it:

```bash
chmod +x setup-ec2.sh
./setup-ec2.sh
```

This will install:
- Node.js 20.x
- PostgreSQL
- Nginx
- PM2
- Build essentials

## Step 2: Configure Environment Variables

### 2.1 Backend Environment Variables

Create `/var/www/portfolio/backend/.env`:

```bash
nano /var/www/portfolio/backend/.env
```

Add:

```env
DATABASE_URL="postgresql://portfolio_user:YOUR_PASSWORD@localhost:5432/portfolio_db?schema=public"
PORT=3001
NODE_ENV=production
CORS_ORIGINS="http://localhost:3000,https://yourdomain.com,https://www.yourdomain.com"
SESSION_SECRET="your-very-secure-random-string-here"
```

**Important:** Replace `YOUR_PASSWORD` with the password you set during PostgreSQL setup.

Generate a secure session secret:
```bash
openssl rand -base64 32
```

### 2.2 Frontend Environment Variables

Create `/var/www/portfolio/frontend/.env`:

```bash
nano /var/www/portfolio/frontend/.env
```

Add:

```env
BACKEND_URL=http://localhost:3001
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Step 3: Deploy Your Code

### 3.1 Upload your code

You have several options:

**Option A: Clone from Git (Recommended)**
```bash
cd /var/www/portfolio
git clone https://github.com/yourusername/Portfolio.git temp
mv temp/Portfolio-2025-Back-End backend
mv temp/Portfolio-2025-Front-End frontend
rm -rf temp
```

**Option B: Use SCP/RSYNC**
```bash
# From your local machine
scp -r -i your-key.pem Portfolio-2025-Back-End ubuntu@your-ec2-ip:/var/www/portfolio/backend
scp -r -i your-key.pem Portfolio-2025-Front-End ubuntu@your-ec2-ip:/var/www/portfolio/frontend
```

**Option C: Manual upload via FileZilla/WinSCP**

### 3.2 Run deployment script

```bash
cd /var/www/portfolio
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

## Step 4: Configure Nginx

### 4.1 Copy Nginx configuration

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/portfolio
```

### 4.2 Update domain name

Edit the nginx config:
```bash
sudo nano /etc/nginx/sites-available/portfolio
```

Replace `yourdomain.com` with your actual domain (or use your EC2 IP for testing).

### 4.3 Enable site

```bash
sudo ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

## Step 5: Setup SSL with Let's Encrypt (Optional but Recommended)

### 5.1 Install Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### 5.2 Get SSL certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts. Certbot will automatically configure Nginx.

### 5.3 Update Nginx config

After SSL setup, uncomment the HTTPS redirect section in `/etc/nginx/sites-available/portfolio`.

## Step 6: Configure Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable
```

## Step 7: Verify Deployment

### 7.1 Check PM2 status

```bash
pm2 status
```

You should see both `portfolio-backend` and `portfolio-frontend` running.

### 7.2 Check logs

```bash
pm2 logs portfolio-backend
pm2 logs portfolio-frontend
```

### 7.3 Test endpoints

```bash
curl http://localhost:3001/health  # Backend health check
curl http://localhost:3000         # Frontend
```

### 7.4 Test from browser

Visit `http://your-ec2-ip` or `https://yourdomain.com`

## Updating Your Deployment

When you make changes:

1. **Pull/Upload new code**
2. **Run the deployment script**:
   ```bash
   cd /var/www/portfolio
   ./deploy/deploy.sh
   ```

## Useful Commands

### PM2 Commands
```bash
pm2 status              # Check status
pm2 logs                # View all logs
pm2 logs portfolio-backend    # Backend logs only
pm2 logs portfolio-frontend   # Frontend logs only
pm2 restart all         # Restart all apps
pm2 stop all            # Stop all apps
pm2 delete all          # Remove all apps
pm2 save                # Save current process list
```

### Nginx Commands
```bash
sudo nginx -t           # Test configuration
sudo systemctl reload nginx  # Reload without downtime
sudo systemctl restart nginx # Restart
sudo systemctl status nginx   # Check status
```

### PostgreSQL Commands
```bash
sudo -u postgres psql  # Connect to PostgreSQL
\l                     # List databases
\c portfolio_db        # Connect to database
\dt                    # List tables
\q                     # Quit
```

### Database Backup
```bash
# Backup
pg_dump -U portfolio_user portfolio_db > backup.sql

# Restore
psql -U portfolio_user portfolio_db < backup.sql
```

## Troubleshooting

### Backend not starting
1. Check environment variables: `cat /var/www/portfolio/backend/.env`
2. Check logs: `pm2 logs portfolio-backend`
3. Check if port is in use: `sudo lsof -i :3001`
4. Test database connection: `psql -U portfolio_user -d portfolio_db`

### Frontend not starting
1. Check environment variables: `cat /var/www/portfolio/frontend/.env`
2. Check logs: `pm2 logs portfolio-frontend`
3. Check if port is in use: `sudo lsof -i :3000`
4. Verify build: `cd /var/www/portfolio/frontend && npm run build`

### Nginx errors
1. Check config: `sudo nginx -t`
2. Check error log: `sudo tail -f /var/log/nginx/error.log`
3. Check access log: `sudo tail -f /var/log/nginx/access.log`

### Database connection errors
1. Verify PostgreSQL is running: `sudo systemctl status postgresql`
2. Check database exists: `sudo -u postgres psql -l`
3. Verify connection string in `.env`
4. Test connection: `psql -U portfolio_user -d portfolio_db`

## Security Checklist

- [ ] Changed default PostgreSQL password
- [ ] Set strong SESSION_SECRET
- [ ] Configured firewall (UFW)
- [ ] SSL certificate installed
- [ ] Environment variables are secure
- [ ] PM2 running as non-root user
- [ ] Regular backups configured
- [ ] Updated system packages

## Monitoring

### Setup PM2 monitoring (optional)

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Setup automatic backups (optional)

Create `/etc/cron.daily/portfolio-backup`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/portfolio"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U portfolio_user portfolio_db > $BACKUP_DIR/db_$DATE.sql
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
```

Make it executable:
```bash
sudo chmod +x /etc/cron.daily/portfolio-backup
```

