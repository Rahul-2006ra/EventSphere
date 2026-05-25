# EventSphere — Complete Implementation Guide
## From Zero to Production on AWS EC2

> **Beginner-friendly · Step-by-step · Production-ready**
> Estimated total time: 8–12 hours for full implementation

---

# TABLE OF CONTENTS

- [Phase 1 — System Requirements](#phase-1)
- [Phase 2 — Project Initialization](#phase-2)
- [Phase 3 — PostgreSQL + Prisma](#phase-3)
- [Phase 4 — Node.js Backend](#phase-4)
- [Phase 5 — Frontend Development](#phase-5)
- [Phase 6 — Authentication System](#phase-6)
- [Phase 7 — Event Management](#phase-7)
- [Phase 8 — Image Upload System](#phase-8)
- [Phase 9 — Booking + Razorpay](#phase-9)
- [Phase 10 — QR Code System](#phase-10)
- [Phase 11 — Socket.IO Real-Time](#phase-11)
- [Phase 12 — Organizer Dashboard](#phase-12)
- [Phase 13 — Flask AI Service](#phase-13)
- [Phase 14 — Testing & Debugging](#phase-14)
- [Phase 15 — GitHub Setup](#phase-15)
- [Phase 16 — AWS Deployment](#phase-16)
- [Phase 17 — Production Checklist](#phase-17)

---

# PHASE 1 — SYSTEM REQUIREMENTS {#phase-1}

## What You Need to Install

### 1.1 — Visual Studio Code

**Download:** https://code.visualstudio.com

**Install these extensions:**
- Open VS Code → Extensions (Ctrl+Shift+X)
- Search and install each:

```
ESLint                     — JavaScript linting
Prettier                   — Code formatting
Prisma                     — Prisma schema highlighting
Thunder Client             — API testing inside VS Code
GitLens                    — Git superpowers
Tailwind CSS IntelliSense  — CSS autocomplete
Python                     — Python support
Auto Rename Tag            — HTML tag pairing
```

**VS Code Settings** (Ctrl+Shift+P → "Open User Settings JSON"):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "terminal.integrated.defaultProfile.windows": "Git Bash"
}
```

---

### 1.2 — Node.js Installation

**Download:** https://nodejs.org → Choose "LTS" version (v20.x)

**Verify installation:**
```bash
node --version    # Should show v20.x.x
npm --version     # Should show 10.x.x
```

**If you see errors:**
- Windows: Restart terminal after install
- Mac: Run `sudo chown -R $(whoami) /usr/local/bin /usr/local/lib`
- Linux: Use nvm instead (see below)

**Using nvm (recommended for Linux/Mac):**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Restart terminal, then:
nvm install 20
nvm use 20
nvm alias default 20
```

---

### 1.3 — Python Installation

**Download:** https://python.org → Python 3.11+ (NOT 3.12 for best compatibility)

**During Windows install:** ✅ Check "Add Python to PATH"

**Verify:**
```bash
python3 --version    # Should show 3.11.x or higher
pip3 --version
```

**Windows users:** You may need to use `python` instead of `python3`

---

### 1.4 — PostgreSQL Installation

**Option A: Neon (Cloud — Recommended for beginners)**
→ Skip local install, use cloud DB at https://neon.tech (free tier)

**Option B: Local PostgreSQL**

**Download:** https://postgresql.org/download

During install:
- Remember the password you set for user `postgres`
- Default port: `5432` (keep it)
- Install pgAdmin (included — GUI for database)

**Verify local install:**
```bash
psql --version    # Should show psql 14.x or higher
```

**Connect to verify:**
```bash
psql -U postgres
# Enter your password
# You should see: postgres=#
\q    # to quit
```

---

### 1.5 — Git Installation

**Download:** https://git-scm.com/downloads

**Configure after install:**
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
git config --global init.defaultBranch main
```

**Verify:**
```bash
git --version    # Should show git version 2.x.x
```

---

### 1.6 — GitHub Setup

1. Create account at https://github.com
2. Create new repository named `eventsphere`
3. Set to **Private** (important — keeps secrets safe)
4. Don't initialize with README (we'll push our own)

**Setup SSH key (recommended):**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your@email.com"
# Press Enter for all prompts

# Copy public key
cat ~/.ssh/id_ed25519.pub
# Copy the output

# Go to GitHub → Settings → SSH Keys → New SSH Key
# Paste and save
```

---

### 1.7 — AWS Account Setup

1. Go to https://aws.amazon.com → Create Account
2. Enter credit card (won't be charged — free tier)
3. Choose **Basic Support (Free)**
4. After signup, go to **EC2 Dashboard**

**Set your region:** Choose closest to your users
- India: `ap-south-1` (Mumbai)
- US East: `us-east-1` (N. Virginia)

**IMPORTANT:** Note your selected region — keep it consistent.

---

### 1.8 — Razorpay Account Setup

1. Go to https://razorpay.com → Sign Up
2. Verify email and phone
3. Dashboard → **Settings → API Keys**
4. Click **Generate Test Mode API Keys**
5. Save these two values:
   ```
   Key ID:     rzp_test_xxxxxxxxxxxxxxxxxx
   Key Secret: xxxxxxxxxxxxxxxxxxxxxxxx
   ```

**Never share your Key Secret!**

---

### 1.9 — Google Gemini API Setup

1. Go to https://ai.google.dev
2. Click **Get API Key in Google AI Studio**
3. Sign in with Google account
4. Click **Create API Key**
5. Copy and save your key: `AIzaSy...`

**Free tier limits:**
- 15 requests/minute
- 1 million tokens/day
- Plenty for development and demos

---

# PHASE 2 — PROJECT INITIALIZATION {#phase-2}

## 2.1 — Create Project Structure

Open your terminal and run these commands **exactly**:

```bash
# Navigate to where you want the project
cd ~/Desktop    # or wherever you prefer

# Create root project folder
mkdir EventSphere
cd EventSphere

# Create all subdirectories
mkdir -p frontend/css
mkdir -p frontend/js
mkdir -p frontend/pages
mkdir -p backend-node/src/controllers
mkdir -p backend-node/src/routes
mkdir -p backend-node/src/middleware
mkdir -p backend-node/src/utils
mkdir -p backend-node/prisma
mkdir -p backend-node/uploads
mkdir -p ai-flask/routes
mkdir -p ai-flask/services
mkdir -p deployment
mkdir -p docs

# Verify structure
ls -la
```

Expected output:
```
EventSphere/
├── frontend/
├── backend-node/
├── ai-flask/
├── deployment/
└── docs/
```

---

## 2.2 — Initialize Node.js Backend

```bash
cd backend-node

# Initialize package.json (creates configuration file)
npm init -y

# Install ALL production dependencies
npm install \
  @prisma/client \
  axios \
  bcryptjs \
  cors \
  dotenv \
  express \
  express-rate-limit \
  express-validator \
  helmet \
  jsonwebtoken \
  morgan \
  multer \
  qrcode \
  razorpay \
  socket.io \
  uuid

# Install development dependencies (only needed while coding)
npm install --save-dev \
  nodemon \
  prisma

# Verify node_modules installed
ls node_modules | head -10
```

**If you see `EACCES permission denied`:**
```bash
# Fix npm permissions (Mac/Linux)
sudo chown -R $(whoami) ~/.npm
npm install ...  # try again
```

**If you see network errors:**
```bash
# Try with different registry
npm install --registry https://registry.npmjs.org ...
```

---

## 2.3 — Initialize Flask AI Service

```bash
# Go back to project root, then into ai-flask
cd ../ai-flask

# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
# Mac/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Your terminal prompt should now show (venv)

# Install Flask dependencies
pip install flask flask-cors python-dotenv google-generativeai gunicorn requests

# Save dependencies to requirements.txt
pip freeze > requirements.txt

# Verify installation
pip list | grep -E "flask|google|gunicorn"

# Deactivate when done
deactivate
```

**If `python3 -m venv venv` fails:**
```bash
# Install venv manually
sudo apt install python3-venv    # Ubuntu/Debian
brew install python3             # Mac
```

---

## 2.4 — Create Empty __init__ Files for Flask

```bash
# These make Python treat directories as packages
cd ai-flask
touch routes/__init__.py
touch services/__init__.py
```

---

## 2.5 — Create Environment Variable Files

**CRITICAL: These files hold your secrets. Never commit them to GitHub.**

```bash
# Go to backend-node directory
cd ~/Desktop/EventSphere/backend-node

# Create .env file
cat > .env << 'EOF'
# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Database — replace with your actual connection string
DATABASE_URL=postgresql://username:password@localhost:5432/eventsphere

# JWT — create a random 32+ char string
JWT_SECRET=replace_this_with_a_random_64_character_string_minimum
JWT_EXPIRES_IN=7d

# Razorpay Test Keys
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here

# Flask AI service URL
FLASK_AI_URL=http://localhost:8000

# Uploads
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
EOF

echo "✓ backend .env created"
```

```bash
# Now create Flask .env
cd ~/Desktop/EventSphere/ai-flask

cat > .env << 'EOF'
FLASK_ENV=development
FLASK_PORT=8000
GEMINI_API_KEY=your_gemini_api_key_here
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000
EOF

echo "✓ flask .env created"
```

**Generate a secure JWT secret:**
```bash
# Run this to generate a proper JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy the output into JWT_SECRET in your .env
```

---

## 2.6 — Create .gitignore

```bash
cd ~/Desktop/EventSphere

cat > .gitignore << 'EOF'
# Environment files — NEVER commit these
.env
.env.local
.env.production
.env.development
.env.*.local

# Node.js
node_modules/
npm-debug.log*

# Python
__pycache__/
*.pyc
*.pyo
venv/
.venv/
*.egg-info/

# Uploads (user content)
backend-node/uploads/*
!backend-node/uploads/.gitkeep

# OS files
.DS_Store
Thumbs.db
*.swp

# Editor
.idea/
.vscode/settings.json

# Logs
*.log
logs/

# Database dumps
*.sql
*.dump
EOF

# Create gitkeep placeholder for uploads
touch backend-node/uploads/.gitkeep

echo "✓ .gitignore created"
```

---

## 2.7 — Open Project in VS Code

```bash
cd ~/Desktop/EventSphere
code .
```

You should see the full folder structure in the left panel.

---

# PHASE 3 — POSTGRESQL + PRISMA SETUP {#phase-3}

## 3.1 — Option A: Neon Cloud Database (Easiest)

1. Go to https://neon.tech → Sign up (free)
2. Click **Create Project**
3. Name: `eventsphere` | Region: closest to you
4. Click **Create**
5. On the dashboard, find **Connection String**
6. Copy it — looks like:
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
7. Paste it as `DATABASE_URL` in `backend-node/.env`

**Test connection:**
```bash
cd backend-node
# Install Prisma CLI
npx prisma --version
```

---

## 3.2 — Option B: Local PostgreSQL Setup

```bash
# Connect to PostgreSQL
psql -U postgres

# Inside PostgreSQL shell:
CREATE USER eventsphere_user WITH PASSWORD 'strongpassword123';
CREATE DATABASE eventsphere OWNER eventsphere_user;
GRANT ALL PRIVILEGES ON DATABASE eventsphere TO eventsphere_user;
\q

# Your DATABASE_URL:
# postgresql://eventsphere_user:strongpassword123@localhost:5432/eventsphere
```

Update `backend-node/.env`:
```
DATABASE_URL=postgresql://eventsphere_user:strongpassword123@localhost:5432/eventsphere
```

---

## 3.3 — Initialize Prisma

```bash
cd ~/Desktop/EventSphere/backend-node

# Initialize Prisma (creates prisma/schema.prisma + .env if not exists)
npx prisma init --datasource-provider postgresql

# Prisma creates:
#   prisma/schema.prisma
#   .env (check it didn't overwrite yours!)
```

---

## 3.4 — Create Prisma Schema

Replace the content of `backend-node/prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(ATTENDEE)
  avatar    String?
  phone     String?
  bio       String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  events        Event[]        @relation("OrganizerEvents")
  bookings      Booking[]
  reviews       Review[]
  notifications Notification[]
  wishlist      Wishlist[]

  @@map("users")
}

enum Role {
  ATTENDEE
  ORGANIZER
  ADMIN
}

model Event {
  id          String      @id @default(cuid())
  title       String
  slug        String      @unique
  description String
  shortDesc   String?
  category    Category
  status      EventStatus @default(DRAFT)
  bannerImage String?
  venue       String
  address     String?
  city        String?
  startDate   DateTime
  endDate     DateTime
  timezone    String      @default("Asia/Kolkata")
  isOnline    Boolean     @default(false)
  onlineLink  String?
  faqs        Json?
  speakers    Json?
  tags        String[]
  totalCapacity Int       @default(0)
  bookedCount   Int       @default(0)
  isFeatured    Boolean   @default(false)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  organizerId String
  organizer   User        @relation("OrganizerEvents", fields: [organizerId], references: [id], onDelete: Cascade)
  ticketTypes TicketType[]
  bookings    Booking[]
  reviews     Review[]
  wishlist    Wishlist[]

  @@map("events")
}

enum Category {
  CONFERENCE
  CONCERT
  WORKSHOP
  SEMINAR
  MEETUP
  FESTIVAL
  SPORTS
  NETWORKING
  EXHIBITION
  OTHER
}

enum EventStatus {
  DRAFT
  PUBLISHED
  CANCELLED
  COMPLETED
}

model TicketType {
  id          String    @id @default(cuid())
  name        String
  description String?
  price       Float
  quantity    Int
  sold        Int       @default(0)
  maxPerOrder Int       @default(10)
  salesStart  DateTime?
  salesEnd    DateTime?
  perks       String[]
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  eventId String
  event   Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  tickets Ticket[]

  @@map("ticket_types")
}

model Booking {
  id               String        @id @default(cuid())
  bookingRef       String        @unique @default(cuid())
  status           BookingStatus @default(PENDING)
  totalAmount      Float
  currency         String        @default("INR")
  paymentId        String?
  orderId          String?
  paymentSignature String?
  paymentMethod    String?
  paidAt           DateTime?
  cancelledAt      DateTime?
  cancelReason     String?
  attendeeDetails  Json?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  userId  String
  user    User    @relation(fields: [userId], references: [id])
  eventId String
  event   Event   @relation(fields: [eventId], references: [id])
  tickets Ticket[]

  @@map("bookings")
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
  REFUNDED
  FAILED
}

model Ticket {
  id            String       @id @default(cuid())
  ticketNumber  String       @unique
  qrCode        String?
  qrData        String?
  status        TicketStatus @default(ACTIVE)
  checkedInAt   DateTime?
  checkedInBy   String?
  attendeeName  String?
  attendeeEmail String?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  bookingId    String
  booking      Booking    @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  ticketTypeId String
  ticketType   TicketType @relation(fields: [ticketTypeId], references: [id])

  @@map("tickets")
}

enum TicketStatus {
  ACTIVE
  USED
  CANCELLED
  EXPIRED
}

model Review {
  id         String   @id @default(cuid())
  rating     Int
  title      String?
  body       String
  isVerified Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  userId  String
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  eventId String
  event   Event  @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@unique([userId, eventId])
  @@map("reviews")
}

model Notification {
  id        String           @id @default(cuid())
  type      NotificationType
  title     String
  message   String
  isRead    Boolean          @default(false)
  data      Json?
  createdAt DateTime         @default(now())

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notifications")
}

enum NotificationType {
  BOOKING_CONFIRMED
  BOOKING_CANCELLED
  EVENT_REMINDER
  EVENT_UPDATED
  EVENT_CANCELLED
  PAYMENT_SUCCESS
  PAYMENT_FAILED
  CHECKIN_COMPLETE
  GENERAL
}

model Wishlist {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())

  userId  String
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  eventId String
  event   Event  @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@unique([userId, eventId])
  @@map("wishlist")
}
```

---

## 3.5 — Run Database Migration

```bash
cd ~/Desktop/EventSphere/backend-node

# Create and run the first migration
npx prisma migrate dev --name init

# Expected output:
# ✓ Generated Prisma Client
# ✓ The following migration(s) have been created and applied:
#   migrations/20240101000000_init/migration.sql
```

**If migration fails:**
```bash
# Check your DATABASE_URL is correct
cat .env | grep DATABASE_URL

# Test database connectivity
npx prisma db pull

# If using Neon and getting SSL errors, add ?sslmode=require to URL
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
```

---

## 3.6 — Generate Prisma Client

```bash
# Generate the TypeScript/JS client from schema
npx prisma generate

# Expected: ✓ Generated Prisma Client into ./node_modules/@prisma/client
```

---

## 3.7 — Verify with Prisma Studio

```bash
# Open visual database browser
npx prisma studio

# Opens http://localhost:5555
# You'll see all your tables (empty for now)
# Press Ctrl+C to stop
```

---

## 3.8 — Run Database Seed

```bash
# Seed with demo data
node prisma/seed.js

# Expected output:
# ✓ Users created: attendee@demo.com organizer@demo.com
# ✓ Event: TechConf India 2025
# ✓ Event: Mumbai Design Week 2025
# ...
# ✅ Database seeded successfully!
```

---

# PHASE 4 — NODE.JS BACKEND SETUP {#phase-4}

## 4.1 — Create Prisma Client Singleton

Create `backend-node/src/utils/prisma.js`:

```javascript
const { PrismaClient } = require('@prisma/client');

const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
```

**Why singleton?** In development, hot-reloading creates new Prisma connections on each file save, which exhausts the database connection pool. The singleton prevents this.

---

## 4.2 — Create the Main Server

Create `backend-node/src/server.js` — this is your entry point.

The server initializes in this order:
1. Load environment variables (dotenv)
2. Create Express app
3. Create HTTP server (needed for Socket.IO)
4. Attach Socket.IO
5. Register middleware (cors, helmet, morgan, json parser)
6. Register all routes
7. Register error handlers
8. Listen on PORT

See the provided `server.js` file in the project — it handles all of this.

**Test the server:**
```bash
cd backend-node
npm run dev

# Expected output:
# ╔══════════════════════════════════════╗
# ║   EventSphere API Server             ║
# ║   Port: 5000                         ║
# ║   Mode: development                  ║
# ╚══════════════════════════════════════╝
```

**Test in browser:** Open http://localhost:5000
- Should return: `{"message":"EventSphere API v1.0","status":"running"}`

**Test health endpoint:** http://localhost:5000/health
- Should return: `{"status":"healthy","timestamp":"..."}`

---

## 4.3 — Test Individual API Routes

Open **Thunder Client** in VS Code (or use Postman):

**Test Register:**
```
POST http://localhost:5000/api/v1/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "role": "ATTENDEE"
}
```

Expected response:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { "id": "...", "name": "Test User", "email": "test@example.com", "role": "ATTENDEE" },
    "token": "eyJhbGci..."
  }
}
```

**Test Login:**
```
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**Test Protected Route:**
```
GET http://localhost:5000/api/v1/auth/me
Authorization: Bearer eyJhbGci...  ← paste token from login
```

---

## 4.4 — Common Backend Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module '@prisma/client'` | Prisma not generated | Run `npx prisma generate` |
| `P2002: Unique constraint failed` | Duplicate email | Use different email |
| `connect ECONNREFUSED 127.0.0.1:5432` | PostgreSQL not running | Start PostgreSQL service |
| `invalid signature` | Wrong JWT_SECRET | Check .env file |
| `TypeError: Cannot read property` | Missing null check | Check if data exists before accessing |
| `CORS error` | Frontend/backend on different ports | Check CLIENT_URL in .env |

---

# PHASE 5 — FRONTEND DEVELOPMENT {#phase-5}

## 5.1 — Frontend Structure

Your `frontend/` folder should contain:

```
frontend/
├── index.html          ← Home page (event listing)
├── css/
│   └── main.css        ← All custom styles
├── js/
│   ├── config.js       ← API URL, helper functions
│   ├── api.js          ← API client + Toast system
│   ├── auth.js         ← Session management
│   └── main.js         ← Home page logic
└── pages/
    ├── login.html
    ├── register.html
    ├── event-detail.html
    ├── create-event.html
    ├── dashboard.html
    ├── my-bookings.html
    ├── my-events.html
    ├── checkin.html
    └── wishlist.html
```

---

## 5.2 — Tailwind CSS Setup

EventSphere uses the **Tailwind CDN** — no build step required:

```html
<!-- Add this to <head> of every HTML page -->
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        fontFamily: {
          display: ['Syne', 'sans-serif'],
          body: ['DM Sans', 'sans-serif'],
        },
        colors: {
          primary: { DEFAULT: '#6366f1', dark: '#4f46e5', light: '#818cf8' },
          accent: { DEFAULT: '#f59e0b' },
          surface: { DEFAULT: '#0f0f1a', card: '#161625', border: '#1e1e35' },
        },
      },
    },
  };
</script>
```

**Why CDN?** For a hackathon/MVP, CDN is perfect — no webpack, no build process. For production optimization, you'd run `npx tailwindcss build` to purge unused classes.

---

## 5.3 — Serve the Frontend Locally

**Option A: VS Code Live Server**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"
- Opens at http://127.0.0.1:5500

**Option B: npx serve**
```bash
cd ~/Desktop/EventSphere/frontend
npx serve .
# Serves at http://localhost:3000
```

**Option C: Python HTTP server**
```bash
cd frontend
python3 -m http.server 3000
# Serves at http://localhost:3000
```

---

## 5.4 — Configure API URL

Edit `frontend/js/config.js`:

```javascript
const CONFIG = {
  // Automatically detects local vs production
  API_BASE_URL: window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api/v1'      // Development
    : '/api/v1',                           // Production (Nginx proxies)

  SOCKET_URL: window.location.hostname === 'localhost' ||
              window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : window.location.origin,
};
```

This means you **never have to change this file** between development and production.

---

## 5.5 — Testing the Frontend

1. Make sure backend is running: `npm run dev` in `backend-node/`
2. Open `frontend/index.html` with Live Server
3. You should see the EventSphere home page
4. Events should load (if database is seeded)

**If events don't load:**
- Open browser DevTools (F12) → Console tab
- Look for errors — usually CORS or wrong API URL
- Check Network tab → filter "XHR" to see API calls

---

# PHASE 6 — AUTHENTICATION SYSTEM {#phase-6}

## 6.1 — How JWT Authentication Works

```
1. User submits login form
2. Frontend → POST /api/v1/auth/login {email, password}
3. Backend checks email in DB, verifies bcrypt password
4. Backend creates JWT: jwt.sign({userId}, SECRET, {expiresIn: '7d'})
5. Backend returns token to frontend
6. Frontend stores token in localStorage
7. All future requests include: Authorization: Bearer <token>
8. Backend middleware verifies token on protected routes
```

## 6.2 — Token Storage

In `frontend/js/auth.js`:

```javascript
// Save after login
localStorage.setItem('es_token', token);
localStorage.setItem('es_user', JSON.stringify(user));

// Get on each request
const token = localStorage.getItem('es_token');

// Clear on logout
localStorage.removeItem('es_token');
localStorage.removeItem('es_user');
```

**Security note:** localStorage is fine for this type of app. For higher security, use httpOnly cookies, but that requires additional backend setup.

## 6.3 — Testing Auth Flow

```bash
# 1. Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"pass1234","role":"ORGANIZER"}'

# 2. Login and get token
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass1234"}'

# 3. Use token (replace TOKEN with actual token)
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer TOKEN"
```

---

# PHASE 7 — EVENT MANAGEMENT {#phase-7}

## 7.1 — Event Lifecycle

```
DRAFT → (organizer reviews) → PUBLISHED → (event runs) → COMPLETED
                           ↘ CANCELLED
```

## 7.2 — Creating an Event (Test)

```bash
# Login as organizer first, get token
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:5000/api/v1/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Event",
    "description": "A test event description",
    "category": "CONFERENCE",
    "venue": "Test Venue",
    "city": "Bangalore",
    "startDate": "2025-12-01T09:00:00Z",
    "endDate": "2025-12-01T18:00:00Z",
    "ticketTypes": [
      {"name": "General", "price": 999, "quantity": 100}
    ]
  }'
```

## 7.3 — Listing Events

```bash
# Get all published events
curl "http://localhost:5000/api/v1/events?status=PUBLISHED&limit=5"

# Search events
curl "http://localhost:5000/api/v1/events?search=conference&category=CONFERENCE"

# Get single event
curl "http://localhost:5000/api/v1/events/EVENT_ID_HERE"
```

## 7.4 — Frontend Event Cards

Each event card in the UI shows:
- Banner image (or emoji placeholder)
- Category badge (color-coded)
- Title
- Date and venue
- Availability progress bar
- Starting price

The card links to `/pages/event-detail.html?id=EVENT_ID`

---

# PHASE 8 — IMAGE UPLOAD SYSTEM {#phase-8}

## 8.1 — Multer Setup

Multer handles file uploads in Node.js. Create `backend-node/src/middleware/upload.middleware.js`:

```javascript
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    // Unique filename to prevent overwrites
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

// File filter — images only
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files allowed (jpg, png, webp)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  },
});

module.exports = upload;
```

## 8.2 — Upload Route

Add to `backend-node/src/routes/event.routes.js`:

```javascript
const upload = require('../middleware/upload.middleware');

// POST /api/v1/events/upload-banner
router.post(
  '/upload-banner',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  upload.single('banner'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ success: true, data: { url: fileUrl, filename: req.file.filename } });
  }
);
```

## 8.3 — Frontend Image Upload

In `create-event.html`, the banner image accepts a URL. For file upload, add:

```javascript
async function uploadBanner(file) {
  const formData = new FormData();
  formData.append('banner', file);

  const token = localStorage.getItem('es_token');
  const res = await fetch(`${CONFIG.API_BASE_URL}/events/upload-banner`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,  // Don't set Content-Type — browser sets it with boundary
  });

  const data = await res.json();
  return data.data.url;  // Use this URL as bannerImage
}
```

## 8.4 — Cloud Storage Alternative (Production)

For production, use AWS S3 instead of local storage:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Add to `.env`:
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=eventsphere-uploads
```

This avoids losing uploads when the EC2 instance is restarted.

---

# PHASE 9 — BOOKING + RAZORPAY {#phase-9}

## 9.1 — Razorpay Payment Flow (Step by Step)

```
Step 1: User selects tickets → clicks "Book Now"
Step 2: Frontend → POST /bookings/initiate → Backend validates + creates Razorpay order
Step 3: Backend → Razorpay API (creates order) → gets orderId
Step 4: Backend returns {orderId, amount, keyId} to frontend
Step 5: Frontend opens Razorpay Checkout modal
Step 6: User enters card details → Razorpay processes
Step 7: Razorpay calls frontend handler with {paymentId, orderId, signature}
Step 8: Frontend → POST /bookings/verify with payment proof
Step 9: Backend verifies HMAC signature (cryptographic proof)
Step 10: Backend issues QR tickets, emits Socket.IO events
Step 11: Frontend shows success with ticket details
```

## 9.2 — Test Razorpay Payment

Use these **test credentials** in Razorpay checkout:

```
Card Number: 4111 1111 1111 1111
Expiry:      Any future date (e.g., 12/26)
CVV:         Any 3 digits (e.g., 123)
Name:        Any name
OTP:         Enter 1234 if prompted

UPI:         success@razorpay (for UPI test)
NetBanking:  Any bank, any credentials
```

## 9.3 — Verify Payment Manually

```bash
# Check if booking was created
curl "http://localhost:5000/api/v1/bookings" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 9.4 — Common Razorpay Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Invalid key_id` | Wrong key in .env | Double-check RAZORPAY_KEY_ID |
| `Signature verification failed` | Wrong secret | Check RAZORPAY_KEY_SECRET |
| `amount must be integer` | Decimal amount | Multiply by 100, use Math.round() |
| `order_id not found` | Expired order | Create new order |

---

# PHASE 10 — QR CODE SYSTEM {#phase-10}

## 10.1 — How QR Tickets Work

```
Booking confirmed → For each ticket:
  1. Generate unique ticketNumber (EVS-timestamp-random)
  2. Create qrData JSON: {ticketNumber, eventId, bookingId, issuedAt}
  3. Generate QR code as base64 PNG using `qrcode` npm
  4. Store in database: ticket.qrCode (base64) + ticket.qrData (JSON)
  5. Return to frontend → user can view/download
```

## 10.2 — QR Data Structure

```json
{
  "ticketNumber": "EVS-1704067200000-AB12CD",
  "eventId": "clxxxxxxxxxxxx",
  "bookingId": "clxxxxxxxxxxxx",
  "ticketTypeId": "clxxxxxxxxxxxx",
  "issuedAt": "2025-01-01T12:00:00.000Z"
}
```

## 10.3 — Validate a QR Ticket

```bash
# Get ticket number from QR scan
curl "http://localhost:5000/api/v1/tickets/EVS-1704067200000-AB12CD/verify" \
  -H "Authorization: Bearer ORGANIZER_TOKEN"

# Expected response:
{
  "success": true,
  "data": {
    "ticketNumber": "EVS-...",
    "status": "ACTIVE",
    "attendeeName": "John Doe",
    "event": "TechConf 2025",
    "ticketType": "General"
  }
}
```

## 10.4 — Download QR Ticket

In the My Bookings page, clicking a ticket shows the QR code modal.
The "Download" button saves the base64 PNG:

```javascript
function downloadQR(base64DataUrl, ticketNumber) {
  const link = document.createElement('a');
  link.href = base64DataUrl;
  link.download = `ticket-${ticketNumber}.png`;
  link.click();
}
```

---

# PHASE 11 — SOCKET.IO REAL-TIME SYSTEM {#phase-11}

## 11.1 — Socket.IO Architecture

```
Server (Node.js)
├── Room: event:{eventId}       → All viewers of an event page
├── Room: dashboard:{orgId}     → Organizer's dashboard
└── Room: user:{userId}         → Individual user notifications

Events flow:
├── New booking → emit to event:{id} + dashboard:{orgId}
├── Check-in → emit to event:{id} + dashboard:{orgId}
└── Status change → emit to event:{id}
```

## 11.2 — Frontend Socket Connection

Include in pages that need real-time:

```html
<script src="https://cdn.socket.io/4.7.4/socket.io.min.js"></script>
<script>
  const socket = io(CONFIG.SOCKET_URL, {
    transports: ['websocket', 'polling'],  // Try WebSocket first, fallback to polling
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);

    // Join relevant rooms
    socket.emit('join:event', 'EVENT_ID');
    socket.emit('join:notifications', 'USER_ID');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  // Listen for live ticket count
  socket.on('event:stats', (data) => {
    document.getElementById('attendee-count').textContent = data.bookedCount;
  });
</script>
```

## 11.3 — Test Socket.IO

Open two browser tabs on the event detail page.
Book a ticket in one tab.
The other tab should show the attendee count increase in real-time — no refresh needed.

**Debug Socket.IO:**
```javascript
// Add to frontend to log all events
socket.onAny((event, ...args) => {
  console.log('[Socket]', event, args);
});
```

---

# PHASE 12 — ORGANIZER DASHBOARD {#phase-12}

## 12.1 — Dashboard Data Points

The `/api/v1/dashboard/overview` endpoint returns:

```json
{
  "totalRevenue": 125000,
  "totalTicketsSold": 234,
  "totalBookings": 198,
  "totalCheckIns": 145,
  "totalEvents": 5,
  "upcomingEvents": 3,
  "recentBookings": [...],
  "eventPerformance": [...],
  "monthlyRevenue": [
    {"month": "2025-01", "revenue": 25000},
    {"month": "2025-02", "revenue": 45000}
  ]
}
```

## 12.2 — Charts with Chart.js

The dashboard uses Chart.js CDN (no install needed):

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
```

**Revenue line chart:**
```javascript
new Chart(ctx, {
  type: 'line',
  data: {
    labels: monthlyData.map(d => d.month),
    datasets: [{
      label: 'Revenue (₹)',
      data: monthlyData.map(d => d.revenue),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      fill: true,
      tension: 0.4,
    }]
  },
  options: {
    scales: {
      y: { ticks: { callback: v => `₹${v.toLocaleString()}` } }
    }
  }
});
```

## 12.3 — Real-time Dashboard Updates

The dashboard room receives events automatically:

```javascript
socket.on('dashboard:update', async (data) => {
  if (data.type === 'new_booking') {
    // Refresh stats
    await loadDashboard();
    showToast(`New booking! ${formatINR(data.amount)} received`);
  }
});

socket.on('dashboard:checkin', (data) => {
  // Add to live feed, increment check-in count
  addCheckinFeedItem(data);
});
```

---

# PHASE 13 — FLASK AI SERVICE {#phase-13}

## 13.1 — Start Flask Service

```bash
cd ~/Desktop/EventSphere/ai-flask

# Activate virtual environment
source venv/bin/activate    # Mac/Linux
# venv\Scripts\activate     # Windows

# Make sure GEMINI_API_KEY is in .env

# Start Flask
python app.py

# Expected output:
# [EventSphere AI] Starting on port 8000
# * Running on http://0.0.0.0:8000
```

## 13.2 — Test Flask Endpoints Directly

```bash
# Health check
curl http://localhost:8000/health

# Test AI description
curl -X POST http://localhost:8000/ai/generate-description \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Python Conference 2025",
    "category": "CONFERENCE",
    "venue": "Bangalore Convention Center",
    "date": "2025-06-15"
  }'
```

## 13.3 — Test Flask via Node.js Proxy

```bash
# Login first, get ORGANIZER token
curl -X POST http://localhost:5000/api/v1/ai/generate-description \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ORGANIZER_TOKEN" \
  -d '{
    "title": "Python Conference 2025",
    "category": "CONFERENCE"
  }'
```

## 13.4 — Common Flask Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `GEMINI_API_KEY not set` | Missing env var | Check ai-flask/.env |
| `400 INVALID_ARGUMENT` | Bad Gemini request | Check prompt format |
| `ConnectionRefusedError` | Flask not running | Start `python app.py` |
| `JSONDecodeError` | Gemini returned non-JSON | Add JSON parsing fallback |
| `venv not found` | Wrong directory | `cd ai-flask` first |

---

# PHASE 14 — TESTING & DEBUGGING {#phase-14}

## 14.1 — API Testing Checklist

Run through each endpoint with Thunder Client or Postman:

```
AUTH:
□ POST /auth/register — Create attendee account
□ POST /auth/register — Create organizer account
□ POST /auth/login — Login with both accounts
□ GET  /auth/me — Get profile (need token)
□ PUT  /auth/profile — Update name/bio

EVENTS:
□ GET  /events — Returns list with pagination
□ GET  /events?search=tech — Returns filtered results
□ GET  /events?category=CONFERENCE — Returns category filter
□ POST /events — Creates event (organizer token)
□ PUT  /events/:id — Updates event
□ PATCH /events/:id/publish — Publishes draft

BOOKINGS:
□ POST /bookings/initiate — Creates Razorpay order
□ POST /bookings/verify — Verifies payment (use test signature)
□ GET  /bookings — Returns user's bookings

TICKETS:
□ GET /tickets/:number/verify — Returns ticket status

DASHBOARD:
□ GET /dashboard/overview — Returns stats (organizer token)

AI:
□ POST /ai/generate-description — Returns AI description
□ POST /ai/schedule — Returns AI schedule
```

## 14.2 — Frontend Testing Checklist

```
□ Home page loads events correctly
□ Category filter works
□ Search works
□ Login form submits and stores token
□ Register form creates account
□ Event detail page loads all info
□ Ticket selector adds/removes quantities
□ Booking modal opens with correct total
□ Razorpay checkout opens
□ Test payment completes
□ QR ticket appears in My Bookings
□ QR download works
□ Wishlist toggle works
□ Dashboard shows stats
□ Dashboard updates in real-time after booking
□ Check-in scanner verifies ticket
```

## 14.3 — Socket.IO Testing

```javascript
// Run this in browser console to manually test socket
const s = io('http://localhost:5000');
s.on('connect', () => console.log('Connected:', s.id));
s.emit('join:event', 'any-event-id');
s.on('event:stats', data => console.log('Stats:', data));
```

## 14.4 — Payment Testing Flow

1. Select tickets on event detail page
2. Click "Book Now"
3. Fill attendee details
4. Click "Pay with Razorpay"
5. Razorpay modal opens
6. Use test card: `4111 1111 1111 1111` | `12/26` | `123`
7. Enter OTP: `1234`
8. Payment completes → booking confirmed modal appears
9. Go to "My Bookings" → ticket with QR visible

## 14.5 — Debugging Tips

**Backend not starting:**
```bash
# Check for port conflict
lsof -i :5000    # Mac/Linux
netstat -ano | findstr :5000    # Windows

# Kill conflicting process
kill -9 PID_NUMBER    # Mac/Linux
```

**Database queries failing:**
```bash
# Enable Prisma query logging
# In prisma.js, set log: ['query', 'error']
# You'll see exact SQL in terminal
```

**CORS errors in browser:**
```javascript
// Check your CLIENT_URL in backend .env matches
// the URL you're accessing the frontend from
// e.g., if frontend is at http://127.0.0.1:5500
// set CLIENT_URL=http://127.0.0.1:5500
```

**Gemini API errors:**
```python
# Test Gemini key directly
import google.generativeai as genai
genai.configure(api_key="your_key")
model = genai.GenerativeModel("gemini-1.5-flash")
response = model.generate_content("Say hello")
print(response.text)
```

---

# PHASE 15 — GITHUB SETUP {#phase-15}

## 15.1 — Initialize Git Repository

```bash
cd ~/Desktop/EventSphere

# Initialize git
git init

# Verify .gitignore exists
cat .gitignore | grep "node_modules"
# Should show: node_modules/

# Check what will be tracked (should NOT show .env or node_modules)
git status
```

## 15.2 — First Commit

```bash
# Stage all files
git add .

# Verify nothing sensitive is staged
git status
# Look for .env — it should NOT appear
# node_modules/ should NOT appear

# If .env appears, something is wrong with .gitignore
# Fix: echo ".env" >> .gitignore && git rm --cached .env

# Create first commit
git commit -m "feat: initial EventSphere project setup

- Node.js Express backend with Prisma ORM
- Flask AI microservice with Gemini integration
- PostgreSQL schema (8 models)
- Frontend with Tailwind CSS
- Authentication, events, bookings, tickets
- Socket.IO real-time features
- Razorpay payment integration
- QR ticket system
- Organizer dashboard
- AWS deployment config"
```

## 15.3 — Push to GitHub

```bash
# Add your GitHub remote
git remote add origin git@github.com:YOUR_USERNAME/eventsphere.git

# Push to GitHub
git push -u origin main

# Verify at: https://github.com/YOUR_USERNAME/eventsphere
# Check that .env and node_modules are NOT visible
```

## 15.4 — Protect Your Main Branch

On GitHub:
1. Settings → Branches
2. Add rule for `main`
3. Check "Require pull request before merging"
4. Check "Require status checks to pass"

## 15.5 — Secret Management on GitHub

**Never put secrets in code.** But for deployment, you need them on the server.

**Add GitHub Secrets** (for CI/CD later):
1. GitHub repo → Settings → Secrets and variables → Actions
2. Add each secret:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `GEMINI_API_KEY`

---

# PHASE 16 — AWS DEPLOYMENT {#phase-16}

## 16.1 — Create EC2 Instance

1. Go to AWS Console → EC2 → **Launch Instance**
2. **Name:** `eventsphere-production`
3. **AMI:** Ubuntu Server 22.04 LTS (free tier eligible)
4. **Instance type:** `t3.small` (2GB RAM) — or `t2.micro` for free tier
5. **Key pair:** Click "Create new key pair"
   - Name: `eventsphere-key`
   - Type: RSA, format: .pem
   - Download and save `.pem` file safely
6. **Network settings:**
   - Allow SSH (port 22) — only from your IP
   - Allow HTTP (port 80) — from anywhere
   - Allow HTTPS (port 443) — from anywhere
7. **Storage:** 20 GB
8. Click **Launch Instance**

---

## 16.2 — Allocate Elastic IP

1. EC2 Dashboard → **Elastic IPs** (left sidebar)
2. Click **Allocate Elastic IP address**
3. Click **Allocate**
4. Select the new IP → **Actions → Associate Elastic IP address**
5. Select your `eventsphere-production` instance
6. Click **Associate**
7. **Note your Elastic IP** — this is your permanent server address

---

## 16.3 — Connect to Your EC2 Instance

```bash
# Move your .pem key to a safe location
mv ~/Downloads/eventsphere-key.pem ~/.ssh/
chmod 400 ~/.ssh/eventsphere-key.pem    # REQUIRED — fix permissions

# Connect via SSH (replace YOUR_ELASTIC_IP)
ssh -i ~/.ssh/eventsphere-key.pem ubuntu@YOUR_ELASTIC_IP

# First connection: type "yes" to accept fingerprint
# You should see: ubuntu@ip-xxx-xxx-xxx-xxx:~$
```

**Windows users:** Use PuTTY or Windows Terminal:
```
# Convert .pem to .ppk using PuTTYgen
# Or use Windows PowerShell with OpenSSH
ssh -i ~/.ssh/eventsphere-key.pem ubuntu@YOUR_ELASTIC_IP
```

---

## 16.4 — Install Node.js on EC2

```bash
# Once connected via SSH, run these:

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version    # v20.x.x
npm --version     # 10.x.x

# Install PM2 globally
sudo npm install -g pm2
pm2 --version
```

---

## 16.5 — Install Python on EC2

```bash
# Python 3.11 is included in Ubuntu 22.04
python3 --version

# Install pip and venv
sudo apt install -y python3-pip python3-venv python3-dev

# Verify
pip3 --version
```

---

## 16.6 — Install PostgreSQL on EC2

```bash
sudo apt install -y postgresql postgresql-contrib

# Start and enable
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql << 'SQL'
CREATE USER eventsphere WITH PASSWORD 'CHOOSE_STRONG_PASSWORD';
CREATE DATABASE eventsphere OWNER eventsphere;
GRANT ALL PRIVILEGES ON DATABASE eventsphere TO eventsphere;
\q
SQL

echo "✓ PostgreSQL ready"
```

---

## 16.7 — Install Nginx on EC2

```bash
sudo apt install -y nginx

sudo systemctl start nginx
sudo systemctl enable nginx

# Test: open http://YOUR_ELASTIC_IP in browser
# Should show "Welcome to nginx!" page
```

---

## 16.8 — Upload Project to EC2

**Option A: Git clone (recommended)**

```bash
# On EC2 server:
# Install git (usually pre-installed)
git --version

# Clone your repository
git clone https://github.com/YOUR_USERNAME/eventsphere.git /var/www/eventsphere

# Set permissions
sudo chown -R ubuntu:ubuntu /var/www/eventsphere
sudo mkdir -p /var/log/eventsphere
sudo chown -R ubuntu:ubuntu /var/log/eventsphere
```

**Option B: SCP upload from local machine**

```bash
# Run from your LOCAL machine (new terminal)
scp -i ~/.ssh/eventsphere-key.pem -r ~/Desktop/EventSphere ubuntu@YOUR_ELASTIC_IP:/var/www/eventsphere
```

---

## 16.9 — Create .env Files on Server

```bash
# On EC2 server:
cd /var/www/eventsphere/backend-node

# Create .env with production values
sudo nano .env
```

Paste this content (fill in your values):
```env
NODE_ENV=production
PORT=5000
CLIENT_URL=http://YOUR_ELASTIC_IP

DATABASE_URL=postgresql://eventsphere:STRONG_PASSWORD@localhost:5432/eventsphere

JWT_SECRET=GENERATE_RANDOM_64_CHAR_STRING
JWT_EXPIRES_IN=7d

RAZORPAY_KEY_ID=rzp_test_your_key
RAZORPAY_KEY_SECRET=your_secret

FLASK_AI_URL=http://localhost:8000
```

Save with Ctrl+X → Y → Enter

```bash
# Flask .env
cd /var/www/eventsphere/ai-flask
nano .env
```

```env
FLASK_ENV=production
FLASK_PORT=8000
GEMINI_API_KEY=your_gemini_key
ALLOWED_ORIGINS=http://YOUR_ELASTIC_IP
```

---

## 16.10 — Install Backend Dependencies on EC2

```bash
cd /var/www/eventsphere/backend-node

# Install production dependencies only
npm install --production

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database
node prisma/seed.js
```

---

## 16.11 — Setup Flask on EC2

```bash
cd /var/www/eventsphere/ai-flask

# Create virtual environment
python3 -m venv venv

# Activate
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Test Flask starts
python app.py
# Should show: Running on http://0.0.0.0:8000
# Press Ctrl+C to stop
```

---

## 16.12 — Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/eventsphere
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name YOUR_ELASTIC_IP;    # ← Replace with your IP

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Static frontend files
    location / {
        root /var/www/eventsphere/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Node.js API
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO — CRITICAL for real-time to work
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Uploaded files
    location /uploads/ {
        alias /var/www/eventsphere/backend-node/uploads/;
        expires 30d;
    }
}
```

```bash
# Enable the site
sudo ln -sf /etc/nginx/sites-available/eventsphere /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration syntax
sudo nginx -t
# Expected: nginx: configuration file syntax is ok

# Reload Nginx
sudo systemctl reload nginx
```

---

## 16.13 — Start Node.js with PM2

```bash
cd /var/www/eventsphere

# Start with PM2 using ecosystem config
pm2 start deployment/ecosystem.config.js --env production

# Check status
pm2 status
# Should show: eventsphere-api | online | ...

# View logs
pm2 logs eventsphere-api

# If you see errors, check:
pm2 logs eventsphere-api --lines 50
```

---

## 16.14 — Start Flask with Gunicorn

```bash
cd /var/www/eventsphere/ai-flask

source venv/bin/activate

# Start Gunicorn (production WSGI server for Flask)
gunicorn \
  --bind 127.0.0.1:8000 \
  --workers 2 \
  --timeout 30 \
  --daemon \
  --access-logfile /var/log/eventsphere/flask-access.log \
  --error-logfile /var/log/eventsphere/flask-error.log \
  app:app

# Check it's running
curl http://localhost:8000/health
# Expected: {"status": "healthy", "service": "EventSphere AI"}
```

---

## 16.15 — Enable Auto-restart on Reboot

```bash
# PM2 — save current process list and enable startup
pm2 save
pm2 startup ubuntu

# Follow the output command — it looks like:
# sudo env PATH=... pm2 startup ubuntu -u ubuntu --hp /home/ubuntu
# Copy and run that exact command!

# For Gunicorn, create a systemd service:
sudo nano /etc/systemd/system/eventsphere-ai.service
```

Paste:
```ini
[Unit]
Description=EventSphere Flask AI Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/var/www/eventsphere/ai-flask
Environment="PATH=/var/www/eventsphere/ai-flask/venv/bin"
ExecStart=/var/www/eventsphere/ai-flask/venv/bin/gunicorn \
    --bind 127.0.0.1:8000 \
    --workers 2 \
    --timeout 30 \
    app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable eventsphere-ai
sudo systemctl start eventsphere-ai
sudo systemctl status eventsphere-ai
```

---

## 16.16 — Install SSL Certificate (Free HTTPS)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate (replace with your actual domain)
# IMPORTANT: You need a domain name pointing to your Elastic IP
# If you don't have a domain, skip SSL for now
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# Enter email: your@email.com
# Agree to terms: Y
# Share email with EFF: N (or Y)
# Redirect HTTP to HTTPS: 2 (yes, redirect)

# Certificate auto-renews every 90 days
# Test renewal:
sudo certbot renew --dry-run
```

**If you don't have a domain:** Use the Elastic IP directly with HTTP.

---

## 16.17 — Verify Production Deployment

```bash
# Check all services are running:
pm2 status                           # Node.js: should show "online"
sudo systemctl status nginx          # Nginx: should show "active (running)"
sudo systemctl status eventsphere-ai # Flask: should show "active (running)"
sudo systemctl status postgresql     # DB: should show "active (running)"

# Test each endpoint:
curl http://YOUR_ELASTIC_IP/health                    # Should return {"status":"healthy"}
curl http://YOUR_ELASTIC_IP/api/v1/events             # Should return events
curl http://YOUR_ELASTIC_IP/api/v1/ai/generate-description  # Should reach Flask

# Check logs for errors:
pm2 logs eventsphere-api --lines 20
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/eventsphere/flask-error.log
```

**Open in browser:**
```
http://YOUR_ELASTIC_IP        ← Should show EventSphere home page
```

---

## 16.18 — Update Deployment (When You Push New Code)

```bash
# On EC2 server:
cd /var/www/eventsphere

# Pull latest code
git pull origin main

# Update backend
cd backend-node
npm install
npx prisma generate
npx prisma migrate deploy

# Restart Node.js (zero-downtime)
pm2 reload eventsphere-api

# Restart Flask if changed
sudo systemctl restart eventsphere-ai

echo "✓ Deployment updated!"
```

---

# PHASE 17 — FINAL PRODUCTION CHECKLIST {#phase-17}

## 17.1 — Deployment Checklist

```
INFRASTRUCTURE:
□ EC2 instance running (check AWS console)
□ Elastic IP attached and accessible
□ Security groups: ports 22, 80, 443 open
□ PM2 running Node.js (pm2 status → online)
□ Gunicorn running Flask (systemctl status eventsphere-ai)
□ Nginx running and configured (nginx -t passes)
□ PostgreSQL running and migrated
□ All .env files on server (never in git)

APPLICATION:
□ http://YOUR_IP loads the home page
□ Events load from database
□ Registration and login work
□ Organizer can create events
□ Booking flow completes (test payment)
□ QR ticket generated and downloadable
□ Real-time updates work (open 2 tabs)
□ Dashboard shows correct stats
□ AI description generator returns results
□ Check-in scanner validates tickets
```

## 17.2 — Performance Checklist

```
□ PM2 running in cluster mode (uses all CPU cores)
□ Nginx gzip compression enabled
□ Static files cached (CSS/JS/images: 1 year cache)
□ Database has proper indexes (Prisma adds them automatically)
□ Rate limiting active (100 req/15min per IP)
□ Images served via /uploads/ or cloud storage
□ No console.log in production code (or controlled logging)
```

## 17.3 — Security Checklist

```
□ .env files NOT in git repository (check GitHub — no .env visible)
□ JWT secret is 64+ random characters
□ Passwords hashed with bcrypt (12 salt rounds)
□ HTTPS enabled (if you have a domain)
□ Razorpay signature verified server-side (NEVER client-side)
□ File uploads: mime type checked, size limited to 5MB
□ CORS restricted to your frontend URL
□ Helmet.js security headers active
□ Rate limiting prevents brute force
□ SQL injection impossible (Prisma uses parameterized queries)
□ SSH: only your IP can connect (security group)
□ PostgreSQL: not exposed to internet (only localhost)
□ Flask: not exposed to internet (only localhost:8000)
```

## 17.4 — Testing Checklist

```
FUNCTIONAL:
□ Register as attendee → login → browse events → book → get ticket → view QR
□ Register as organizer → login → create event → publish → see dashboard
□ Check-in flow: organizer scans QR → ticket marked USED → dashboard updates

EDGE CASES:
□ Try booking with 0 tickets (should show error)
□ Try booking more than max per order (should show error)
□ Try booking sold-out event (should show error)
□ Try accessing dashboard as attendee (should show 403)
□ Try accessing protected route without token (should show 401)
□ Wrong password login (should show 401)

REAL-TIME:
□ Open event page in two tabs → book in one → other shows updated count
□ Organizer dashboard auto-updates when booking happens
□ Check-in appears in live feed instantly
```

## 17.5 — Demo Checklist (for Hackathon Judges)

Prepare this exact flow before presenting:

```
1. Show the LIVE URL: http://YOUR_ELASTIC_IP

2. ATTENDEE FLOW (2 min):
   □ Open home page → show event listing
   □ Search for "conference" → filter category
   □ Click event → show rich detail page
   □ Select tickets → click Book Now
   □ Complete Razorpay test payment
   □ Show QR ticket in My Bookings
   □ Download the QR ticket PNG

3. ORGANIZER FLOW (2 min):
   □ Login as organizer@demo.com
   □ Go to Create Event
   □ Click "✨ Generate with AI" → show Gemini description
   □ Click "Generate Schedule" → show AI schedule
   □ Show Dashboard with charts
   □ Show live check-in feed

4. REAL-TIME DEMO (1 min):
   □ Open event page in two browser windows side-by-side
   □ Book tickets in one window
   □ Show the OTHER window's count update live

5. TECH STACK HIGHLIGHT (30 sec):
   □ Show architecture: Node.js → Flask → Gemini
   □ Show Prisma Studio with live data
   □ Show PM2 status on server

BACKUP PLAN (if internet fails):
□ Have screenshots/screen recording ready
□ Have localhost demo running on laptop
□ Have Prisma Studio open showing data
```

---

## 17.6 — Common Production Issues & Fixes

| Issue | Symptom | Fix |
|-------|---------|-----|
| 502 Bad Gateway | Nginx can't reach Node.js | `pm2 restart eventsphere-api` |
| Events not loading | API returns error | Check `pm2 logs eventsphere-api` |
| AI not working | 503 Service Unavailable | `sudo systemctl restart eventsphere-ai` |
| Socket.IO not connecting | Real-time broken | Check Nginx socket.io location block |
| Database error | P2xxx errors | `npx prisma migrate deploy` |
| Permission denied | Can't write to uploads | `sudo chown -R ubuntu:ubuntu /var/www/eventsphere` |
| Port already in use | EADDRINUSE | `pm2 kill && pm2 start ecosystem.config.js` |

---

## Quick Reference Commands

```bash
# ── DEVELOPMENT ──────────────────────────────
# Start backend
cd backend-node && npm run dev

# Start Flask
cd ai-flask && source venv/bin/activate && python app.py

# Serve frontend  
cd frontend && npx serve .

# Prisma Studio
cd backend-node && npx prisma studio

# ── PRODUCTION (on EC2) ───────────────────────
# Status check
pm2 status
sudo systemctl status nginx eventsphere-ai postgresql

# Restart services
pm2 reload eventsphere-api
sudo systemctl restart eventsphere-ai
sudo systemctl reload nginx

# View logs
pm2 logs eventsphere-api --lines 50
sudo tail -f /var/log/nginx/error.log
sudo journalctl -u eventsphere-ai -f

# Deploy update
cd /var/www/eventsphere && git pull && cd backend-node && npm install && npx prisma migrate deploy && pm2 reload eventsphere-api
```

---

*EventSphere Implementation Guide — Complete ✅*
*Build time: ~8 hours for a full implementation*
*Stack: Node.js + Flask + PostgreSQL + Socket.IO + Razorpay + Gemini + AWS*
