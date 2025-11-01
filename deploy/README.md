# Portfolio Deployment Scripts

This directory contains scripts and configurations for deploying your Portfolio site to EC2.

## Quick Start

### Option 1: Automated Deployment (Recommended)

If you're connected via EC2 Instance Connect:

1. **Upload your code** to the EC2 instance (via git clone, scp, or file upload)
2. **Run the automated deployment script**:
   ```bash
   chmod +x deploy/automated-deploy.sh
   ./deploy/automated-deploy.sh
   ```

The script will:
- Check for all prerequisites
- Copy your code to `/var/www/portfolio/`
- Install dependencies
- Build and deploy both frontend and backend
- Configure PM2 for process management
- Setup Nginx reverse proxy

### Option 2: Manual Step-by-Step

1. **Initial setup** (run once):
   ```bash
   chmod +x deploy/setup-ec2.sh
   ./deploy/setup-ec2.sh
   ```

2. **Configure environment variables**:
   - Backend: Create `/var/www/portfolio/backend/.env`
   - Frontend: Create `/var/www/portfolio/frontend/.env`
   - See `.env.example` files for reference

3. **Upload your code** to `/var/www/portfolio/`

4. **Deploy**:
   ```bash
   chmod +x deploy/deploy.sh
   ./deploy/deploy.sh
   ```

## Files Overview

- `setup-ec2.sh` - Initial EC2 setup (Node.js, PostgreSQL, Nginx, PM2)
- `deploy.sh` - Standard deployment script
- `automated-deploy.sh` - Fully automated deployment (best for EC2 Instance Connect)
- `nginx.conf` - Nginx reverse proxy configuration
- `DEPLOYMENT.md` - Complete deployment guide with troubleshooting

## Architecture

```
Internet → Nginx (Port 80/443) → Frontend (Next.js :3000) + Backend (Express :3001)
                                          ↓
                                    PostgreSQL Database
```

## Environment Variables

### Backend (`/var/www/portfolio/backend/.env`)
```env
DATABASE_URL="postgresql://portfolio_user:password@localhost:5432/portfolio_db?schema=public"
PORT=3001
NODE_ENV=production
CORS_ORIGINS="http://localhost:3000,https://yourdomain.com"
SESSION_SECRET="your-secret-here"
```

### Frontend (`/var/www/portfolio/frontend/.env`)
```env
BACKEND_URL=http://localhost:3001
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Using EC2 Instance Connect

If you're using AWS EC2 Instance Connect in the browser:

1. **Upload files** using the file upload feature, or
2. **Clone from Git**:
   ```bash
   cd ~
   git clone https://github.com/yourusername/Portfolio.git
   cd Portfolio
   ```
3. **Run automated deployment**:
   ```bash
   chmod +x deploy/automated-deploy.sh
   ./deploy/automated-deploy.sh
   ```

## Common Commands

### PM2 (Process Management)
```bash
pm2 status              # Check status
pm2 logs                # View logs
pm2 restart all         # Restart all
pm2 stop all            # Stop all
```

### Nginx
```bash
sudo nginx -t           # Test config
sudo systemctl reload nginx  # Reload
```

### Database
```bash
sudo -u postgres psql  # Connect
\l                     # List databases
```

## Troubleshooting

See `DEPLOYMENT.md` for detailed troubleshooting guide.

## Security Checklist

- [ ] Changed PostgreSQL default password
- [ ] Set strong SESSION_SECRET
- [ ] Configured firewall (UFW)
- [ ] SSL certificate installed
- [ ] Environment variables secured

