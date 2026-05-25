#!/bin/bash
# ─────────────────────────────────────────────
# EventSphere - AWS EC2 Deployment Script
# Ubuntu 22.04 LTS
# Run as: sudo bash deploy.sh
# ─────────────────────────────────────────────

set -e  # Exit on any error

echo "
╔══════════════════════════════════════════╗
║     EventSphere Deployment Script        ║
║     AWS EC2 - Ubuntu 22.04               ║
╚══════════════════════════════════════════╝
"

# ── STEP 1: System Update ──
echo "[1/10] Updating system packages..."
apt-get update -y && apt-get upgrade -y

# ── STEP 2: Install Node.js 20 ──
echo "[2/10] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version
npm --version

# ── STEP 3: Install Python & pip ──
echo "[3/10] Installing Python 3.11..."
apt-get install -y python3 python3-pip python3-venv python3-dev

# ── STEP 4: Install PostgreSQL ──
echo "[4/10] Installing PostgreSQL..."
apt-get install -y postgresql postgresql-contrib

# Start & enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql << 'EOF'
CREATE USER eventsphere WITH PASSWORD 'CHANGE_THIS_PASSWORD';
CREATE DATABASE eventsphere OWNER eventsphere;
GRANT ALL PRIVILEGES ON DATABASE eventsphere TO eventsphere;
\q
EOF

echo "✓ PostgreSQL configured"

# ── STEP 5: Install Nginx ──
echo "[5/10] Installing Nginx..."
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx

# ── STEP 6: Install PM2 ──
echo "[6/10] Installing PM2..."
npm install -g pm2
pm2 startup ubuntu -u ubuntu --hp /home/ubuntu

# ── STEP 7: Create directories ──
echo "[7/10] Creating directories..."
mkdir -p /var/www/eventsphere
mkdir -p /var/log/eventsphere
mkdir -p /var/www/eventsphere/backend-node/uploads

chown -R ubuntu:ubuntu /var/www/eventsphere
chown -R ubuntu:ubuntu /var/log/eventsphere

# ── STEP 8: Clone/Copy project ──
echo "[8/10] Setting up project..."
# If using GitHub:
# git clone https://github.com/YOUR_USERNAME/eventsphere.git /var/www/eventsphere
# Or copy files manually

# ── STEP 9: Install dependencies ──
echo "[9/10] Installing dependencies..."

# Node.js backend
cd /var/www/eventsphere/backend-node
npm install --production

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Flask AI service
cd /var/www/eventsphere/ai-flask
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

# ── STEP 10: Configure Nginx ──
echo "[10/10] Configuring Nginx..."
cp /var/www/eventsphere/deployment/nginx.conf /etc/nginx/sites-available/eventsphere
ln -sf /etc/nginx/sites-available/eventsphere /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── Start services ──
echo "Starting services..."

# Start Flask with Gunicorn
cd /var/www/eventsphere/ai-flask
source venv/bin/activate
nohup gunicorn -c /var/www/eventsphere/deployment/gunicorn.conf.py app:app &
deactivate

# Start Node.js with PM2
cd /var/www/eventsphere
pm2 start deployment/ecosystem.config.js --env production
pm2 save

echo "
╔══════════════════════════════════════════╗
║     ✓ Deployment Complete!               ║
╠══════════════════════════════════════════╣
║  Node.js API:  http://localhost:5000     ║
║  Flask AI:     http://localhost:8000     ║
║  Nginx:        http://YOUR_ELASTIC_IP   ║
╠══════════════════════════════════════════╣
║  IMPORTANT: Set your .env files before  ║
║  starting services!                      ║
╚══════════════════════════════════════════╝
"
