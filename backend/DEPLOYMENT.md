# Deployment Guide — Greenwood Public School Backend

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+
- **PM2** (process manager): `npm install -g pm2`
- **Firebase project** with Firestore, Auth, and Storage enabled
- **Linux VPS** (Ubuntu 22.04+ recommended) or cloud platform

---

## 1. Server Setup

### 1.1 Install Node.js (Ubuntu)

```bash
# Install Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version   # v20.x.x
npm --version    # 10.x.x
```

### 1.2 Install PM2

```bash
npm install -g pm2
pm2 --version
```

### 1.3 Clone and Install

```bash
# Clone your repository
git clone <your-repo-url> /var/www/st-thomas
cd /var/www/st-thomas/backend

# Install production dependencies only
npm ci --production
```

---

## 2. Environment Configuration

### 2.1 Create .env File

```bash
cp .env.example .env
nano .env
```

### 2.2 Production .env Values

```env
# Server
PORT=5000
NODE_ENV=production

# Firebase (from Firebase Console → Project Settings → Service Accounts)
FIREBASE_PROJECT_ID=st-thomas-school-b71e3
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@st-thomas-school-b71e3.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=st-thomas-school-b71e3.appspot.com

# CORS — Your production domain(s)
ALLOWED_ORIGINS=https://stthomasschool.edu.in,https://www.stthomasschool.edu.in

# Production domain for CSP headers
PRODUCTION_DOMAIN=stthomasschool.edu.in

# Rate Limiting (production values)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
FORM_RATE_LIMIT_MAX=5

# Logging
LOG_LEVEL=info

# Performance
REQUEST_TIMEOUT_MS=30000
CACHE_MAX_AGE=300
```

### 2.3 Secure the .env File

```bash
chmod 600 .env
chown www-data:www-data .env
```

---

## 3. Start with PM2

### 3.1 Production Start

```bash
cd /var/www/st-thomas/backend

# Start with PM2 in production mode
pm2 start ecosystem.config.js --env production

# Verify it's running
pm2 status

# Check health
curl http://localhost:5000/api/health
```

### 3.2 Useful PM2 Commands

```bash
pm2 status                    # Process status
pm2 logs greenwood-backend    # Real-time logs
pm2 monit                     # CPU/memory monitor
pm2 restart greenwood-backend # Restart
pm2 reload greenwood-backend  # Zero-downtime reload
pm2 stop greenwood-backend    # Stop
pm2 delete greenwood-backend  # Remove from PM2
```

### 3.3 Auto-Start on Server Reboot

```bash
pm2 startup systemd
# Run the command PM2 prints out
pm2 save
```

---

## 4. Nginx Reverse Proxy

### 4.1 Install Nginx

```bash
sudo apt install -y nginx
```

### 4.2 Configuration

Create `/etc/nginx/sites-available/st-thomas`:

```nginx
server {
    listen 80;
    server_name stthomasschool.edu.in www.stthomasschool.edu.in;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name stthomasschool.edu.in www.stthomasschool.edu.in;

    # SSL certificates (use Certbot/Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/stthomasschool.edu.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stthomasschool.edu.in/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Static frontend files
    root /var/www/st-thomas;
    index index.html;

    # Frontend routes — serve static HTML files
    location / {
        try_files $uri $uri.html $uri/ =404;
    }

    # API — proxy to Node.js backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 30s;
        proxy_send_timeout 30s;
    }

    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|webp|woff2|ttf)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Security — deny access to hidden files
    location ~ /\. {
        deny all;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
}
```

### 4.3 Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/st-thomas /etc/nginx/sites-enabled/
sudo nginx -t          # Test config
sudo systemctl reload nginx
```

---

## 5. SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d stthomasschool.edu.in -d www.stthomasschool.edu.in

# Auto-renewal (runs twice daily by default)
sudo certbot renew --dry-run
```

---

## 6. Firestore Security Rules

Deploy the security rules from `firestore.rules`:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy rules
firebase deploy --only firestore:rules --project st-thomas-school-b71e3
```

---

## 7. Monitoring

### 7.1 Health Check

```bash
# Quick health check
curl -s http://localhost:5000/api/health | jq

# Automated health monitoring (add to crontab)
# Check every 5 minutes, alert if unhealthy
*/5 * * * * curl -sf http://localhost:5000/api/health > /dev/null || echo "St. Thomas API is down!" | mail -s "API Alert" admin@school.com
```

### 7.2 Log Files

```
backend/logs/
├── error.log      — Errors only
├── combined.log   — All application logs
├── access.log     — HTTP request logs
├── pm2-error.log  — PM2 stderr
├── pm2-out.log    — PM2 stdout
└── pm2-combined.log — PM2 combined
```

### 7.3 PM2 Monitoring Dashboard

```bash
pm2 monit           # Terminal-based monitoring
pm2 plus            # Web dashboard (PM2 Plus — optional paid service)
```

---

## 8. Troubleshooting

| Problem | Solution |
|---------|----------|
| `EADDRINUSE` port error | Another process is using port 5000. Run `lsof -i :5000` to find it. |
| Firebase auth errors | Check `.env` credentials. Ensure `FIREBASE_PRIVATE_KEY` has `\n` preserved. |
| CORS errors in browser | Verify `ALLOWED_ORIGINS` in `.env` matches your domain exactly (with protocol). |
| 502 Bad Gateway (Nginx) | Check if PM2 process is running: `pm2 status`. Check Nginx logs: `tail /var/log/nginx/error.log`. |
| Memory issues | Check `pm2 monit`. Increase `max_memory_restart` in `ecosystem.config.js`. |
| Rate limiting blocking | Adjust `RATE_LIMIT_MAX_REQUESTS` in `.env`. Default is 100 req/15 min. |

---

## 9. Update/Redeploy

```bash
cd /var/www/st-thomas/backend

# Pull latest code
git pull origin main

# Install dependencies (if package.json changed)
npm ci --production

# Zero-downtime reload
pm2 reload greenwood-backend
```
