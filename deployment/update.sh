#!/bin/bash
# ─────────────────────────────────────────────
# EventSphere — Production Update Script
# Run on EC2: bash deployment/update.sh
# ─────────────────────────────────────────────

set -e
APP_DIR="/var/www/eventsphere"
GREEN='\033[0;32m'; NC='\033[0m'
log() { echo -e "${GREEN}[Deploy]${NC} $1"; }

log "Starting deployment update..."

cd $APP_DIR

# Pull latest code
log "Pulling latest code from GitHub..."
git pull origin main

# Update Node.js backend
log "Updating backend dependencies..."
cd $APP_DIR/backend-node
npm install --production
npx prisma generate
npx prisma migrate deploy

# Reload Node.js (zero-downtime)
log "Reloading Node.js (zero-downtime)..."
pm2 reload eventsphere-api

# Update Flask if requirements changed
log "Updating Flask dependencies..."
cd $APP_DIR/ai-flask
source venv/bin/activate
pip install -r requirements.txt -q
deactivate

log "Restarting Flask service..."
sudo systemctl restart eventsphere-ai

# Reload Nginx (in case config changed)
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Deployment updated successfully!"
echo ""
pm2 status eventsphere-api
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
