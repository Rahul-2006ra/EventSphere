#!/bin/bash
# ─────────────────────────────────────────────
# EventSphere — Local Development Quick Start
# Run from project root: bash start-dev.sh
# ─────────────────────────────────────────────

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[EventSphere]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Check prerequisites ──
log "Checking prerequisites..."

command -v node >/dev/null 2>&1   || err "Node.js not found. Install from https://nodejs.org"
command -v python3 >/dev/null 2>&1 || err "Python3 not found. Install from https://python.org"
command -v npm >/dev/null 2>&1    || err "npm not found."

NODE_VER=$(node -e "console.log(process.versions.node.split('.')[0])")
[ "$NODE_VER" -lt 18 ] && err "Node.js 18+ required. Current: $(node --version)"

log "Node.js $(node --version) ✓"
log "Python3 $(python3 --version) ✓"

# ── Check .env files ──
if [ ! -f "$ROOT_DIR/backend-node/.env" ]; then
  warn "backend-node/.env not found. Copying from .env.example..."
  cp "$ROOT_DIR/backend-node/.env.example" "$ROOT_DIR/backend-node/.env"
  warn "IMPORTANT: Edit backend-node/.env with your actual credentials!"
  echo ""
fi

if [ ! -f "$ROOT_DIR/ai-flask/.env" ]; then
  warn "ai-flask/.env not found. Copying from .env.example..."
  cp "$ROOT_DIR/ai-flask/.env.example" "$ROOT_DIR/ai-flask/.env"
  warn "IMPORTANT: Edit ai-flask/.env with your GEMINI_API_KEY!"
  echo ""
fi

# ── Install backend dependencies ──
log "Installing Node.js dependencies..."
cd "$ROOT_DIR/backend-node"
[ ! -d "node_modules" ] && npm install || log "node_modules already exists, skipping install"

# ── Prisma setup ──
log "Generating Prisma client..."
npx prisma generate

# Check if DB migration is needed
if [ ! -d "prisma/migrations" ] || [ -z "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  log "Running database migrations..."
  npx prisma migrate dev --name init 2>/dev/null || {
    warn "Migration failed — trying db push instead..."
    npx prisma db push --accept-data-loss
  }
fi

# Seed if not already seeded
log "Seeding database (if empty)..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count().then(c => {
  if (c === 0) {
    console.log('Database empty — will seed');
    process.exit(1);
  } else {
    console.log('Database already has ' + c + ' users — skipping seed');
    process.exit(0);
  }
}).catch(() => process.exit(1)).finally(() => prisma.\$disconnect());
" && true || node prisma/seed.js

# ── Flask setup ──
log "Setting up Flask AI service..."
cd "$ROOT_DIR/ai-flask"

if [ ! -d "venv" ]; then
  log "Creating Python virtual environment..."
  python3 -m venv venv
fi

log "Installing Python dependencies..."
source venv/bin/activate
pip install -r requirements.txt -q
deactivate

# ── Start all services in background ──
echo ""
log "Starting all services..."
echo ""

# Kill any existing processes on our ports
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Start Flask
cd "$ROOT_DIR/ai-flask"
source venv/bin/activate
nohup python app.py > /tmp/flask.log 2>&1 &
FLASK_PID=$!
deactivate
log "Flask AI service started (PID: $FLASK_PID) → http://localhost:8000"

sleep 1

# Start Node.js
cd "$ROOT_DIR/backend-node"
nohup npm run dev > /tmp/node.log 2>&1 &
NODE_PID=$!
log "Node.js API started (PID: $NODE_PID) → http://localhost:5000"

sleep 2

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  🚀 EventSphere is running!"
echo ""
echo "  Frontend:   Open frontend/index.html with Live Server"
echo "              or run: cd frontend && npx serve ."
echo ""
echo "  API:        http://localhost:5000"
echo "  AI Service: http://localhost:8000"
echo "  DB Studio:  cd backend-node && npx prisma studio"
echo ""
echo "  Demo Login: organizer@demo.com / demo1234"
echo "              attendee@demo.com  / demo1234"
echo ""
echo "  Logs: tail -f /tmp/node.log"
echo "        tail -f /tmp/flask.log"
echo ""
echo "  Stop all: kill $NODE_PID $FLASK_PID"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
