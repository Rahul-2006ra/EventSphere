# EventSphere — Complete Setup & Deployment Guide
## From Your Local Folder to Live AWS Website

---

# ══════════════════════════════════════════
# PART 1 — RUN LOCALLY ON YOUR COMPUTER
# ══════════════════════════════════════════

---

## STEP 1 — Install Required Software

### 1A — Install Node.js
- Go to: https://nodejs.org
- Download "LTS" version (v20)
- Install with default settings
- **IMPORTANT on Windows:** Check ✅ "Add to PATH" during install

Verify in terminal:
```
node --version       ← should show v20.x.x
npm --version        ← should show 10.x.x
```

---

### 1B — Install Python
- Go to: https://python.org/downloads
- Download Python 3.11
- **IMPORTANT on Windows:** Check ✅ "Add Python to PATH"
- Install with default settings

Verify:
```
python --version     ← should show 3.11.x
pip --version
```

---

### 1C — Install PostgreSQL
- Go to: https://www.postgresql.org/download/windows
- Download and install
- During install:
  - Set password for user "postgres" → remember this password!
  - Port: 5432 (keep default)
  - Install pgAdmin (include it)

Verify:
```
psql --version       ← should show psql 14.x or higher
```

---

### 1D — Install Git
- Go to: https://git-scm.com/download/win
- Install with default settings

Verify:
```
git --version
```

---

### 1E — Install VS Code
- Go to: https://code.visualstudio.com
- Install with default settings
- Open VS Code → Extensions → install:
  - "Live Server" (by Ritwick Dey)
  - "Prettier"
  - "Prisma"

---

## STEP 2 — Create the PostgreSQL Database

### Open pgAdmin (installed with PostgreSQL)

OR use the command line:

**Open Command Prompt as Administrator and type:**
```
psql -U postgres
```

Enter your postgres password when asked.

Then type these commands one by one:
```sql
CREATE USER eventsphere WITH PASSWORD 'mypassword123';
CREATE DATABASE eventsphere OWNER eventsphere;
GRANT ALL PRIVILEGES ON DATABASE eventsphere TO eventsphere;
\q
```

Write down your connection string:
```
postgresql://eventsphere:mypassword123@localhost:5432/eventsphere
```

---

## STEP 3 — Get Your API Keys

### 3A — Razorpay (Payment Gateway)
1. Go to: https://razorpay.com
2. Click "Sign Up" → fill details
3. After login, go to: Settings → API Keys
4. Click "Generate Test Mode API Keys"
5. Copy both keys:
   ```
   Key ID:     rzp_test_XXXXXXXXXXXXXXXXXX
   Key Secret: XXXXXXXXXXXXXXXXXXXXXXXX
   ```

### 3B — Google Gemini AI
1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key:
   ```
   AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

---

## STEP 4 — Setup the Backend (.env file)

Open your project folder in File Explorer:
```
Devis Hakathon → EventSphere → backend-node
```

**Create a new file called `.env`** (no extension, just `.env`)

In VS Code, open that file and paste:
```
NODE_ENV=development
PORT=5000
CLIENT_URL=http://127.0.0.1:5500

DATABASE_URL=postgresql://eventsphere:mypassword123@localhost:5432/eventsphere

JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2

JWT_EXPIRES_IN=7d

RAZORPAY_KEY_ID=rzp_test_PASTE_YOUR_KEY_HERE
RAZORPAY_KEY_SECRET=PASTE_YOUR_SECRET_HERE

FLASK_AI_URL=http://localhost:8000

UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

**Replace:**
- `mypassword123` with your PostgreSQL password
- `rzp_test_PASTE_YOUR_KEY_HERE` with your Razorpay Key ID
- `PASTE_YOUR_SECRET_HERE` with your Razorpay Key Secret

Save the file.

---

## STEP 5 — Setup the Flask AI Service (.env file)

Go to folder:
```
Devis Hakathon → EventSphere → ai-flask
```

Create a new file called `.env` and paste:
```
FLASK_ENV=development
FLASK_PORT=8000
GEMINI_API_KEY=PASTE_YOUR_GEMINI_KEY_HERE
ALLOWED_ORIGINS=http://127.0.0.1:5500,http://localhost:5500,http://localhost:3000
```

**Replace** `PASTE_YOUR_GEMINI_KEY_HERE` with your Gemini API key.

Save the file.

---

## STEP 6 — Open Terminal in VS Code

In VS Code:
- Go to: Terminal → New Terminal
- The terminal opens at the bottom

---

## STEP 7 — Install Node.js Backend Dependencies

In the terminal, type:
```
cd "C:\Users\YourName\OneDrive\Desktop\Devis Hakathon\EventSphere\backend-node"
```

*(Replace YourName and path with your actual path)*

Then run:
```
npm install
```

Wait for it to finish (takes 1-2 minutes).

Expected output:
```
added 450 packages in 45s
```

---

## STEP 8 — Setup the Database

Still inside the `backend-node` folder in terminal:

**Step 8A — Generate Prisma client:**
```
npx prisma generate
```

Expected: `Generated Prisma Client`

**Step 8B — Create database tables:**
```
npx prisma migrate dev --name init
```

If that fails, try:
```
npx prisma db push
```

Expected: `✓ Your database is now in sync`

**Step 8C — Add demo data:**
```
node prisma/seed.js
```

Expected output:
```
✓ Users created: attendee@demo.com organizer@demo.com
✓ Event: TechConf India 2025
✓ Event: Mumbai Design Week 2025
✅ Database seeded successfully!
```

---

## STEP 9 — Start the Node.js Backend

In the terminal (still in backend-node folder):
```
npm run dev
```

You should see:
```
╔══════════════════════════════════════╗
║   EventSphere API Server             ║
║   Port: 5000                         ║
║   Mode: development                  ║
╚══════════════════════════════════════╝
```

**Keep this terminal open!** Do not close it.

Test it — open your browser and go to:
```
http://localhost:5000
```
You should see: `{"message":"EventSphere API v1.0","status":"running"}`

---

## STEP 10 — Setup Flask AI Service

Open a **NEW terminal** in VS Code:
- Click the `+` button in the terminal panel

Navigate to the ai-flask folder:
```
cd "C:\Users\YourName\OneDrive\Desktop\Devis Hakathon\EventSphere\ai-flask"
```

**Step 10A — Create Python virtual environment:**
```
python -m venv venv
```

**Step 10B — Activate it:**

On Windows:
```
venv\Scripts\activate
```

You should see `(venv)` appear at the start of the line.

**Step 10C — Install Flask dependencies:**
```
pip install -r requirements.txt
```

Wait for it to finish.

**Step 10D — Start Flask:**
```
python app.py
```

You should see:
```
[EventSphere AI] Starting on port 8000
* Running on http://0.0.0.0:8000
```

**Keep this terminal open too!**

Test it — open browser:
```
http://localhost:8000/health
```
Should show: `{"status": "healthy", "service": "EventSphere AI"}`

---

## STEP 11 — Open the Frontend

In VS Code:
1. In the left panel (Explorer), navigate to:
   ```
   EventSphere → frontend → index.html
   ```
2. Right-click on `index.html`
3. Click **"Open with Live Server"**

Your browser will open:
```
http://127.0.0.1:5500/index.html
```

**You should see the EventSphere homepage with events loaded!** 🎉

---

## STEP 12 — Test the Full Flow

**Test login:**
1. Click "Get Started" or "Sign In"
2. Go to login page
3. Enter:
   - Email: `organizer@demo.com`
   - Password: `demo1234`
4. You should be logged in and see the dashboard

**Test event booking:**
1. Go to home page
2. Click any event
3. Select ticket quantity
4. Click "Book Now"
5. Fill details
6. Click "Pay with Razorpay"
7. Use test card:
   ```
   Card: 4111 1111 1111 1111
   Expiry: 12/26
   CVV: 123
   OTP: 1234
   ```
8. Booking confirmed! Check "My Bookings" for QR ticket.

---

## TROUBLESHOOTING — Common Local Errors

### Error: "Cannot connect to database"
- Make sure PostgreSQL is running
- Open Services (Windows) → find "postgresql" → Start it
- Check your DATABASE_URL password is correct

### Error: "EADDRINUSE port 5000"
- Something is using port 5000
- In terminal: `npx kill-port 5000`
- Then run `npm run dev` again

### Error: "Module not found"
- Run `npm install` again in backend-node folder

### Error: "venv\Scripts\activate not recognized"
- Run as Administrator
- Or use: `python -m venv venv` then `.\venv\Scripts\Activate.ps1`

### Error: CORS errors in browser
- Make sure CLIENT_URL in backend `.env` matches your Live Server URL
- Check what URL your browser shows (127.0.0.1:5500 or localhost:5500)
- Update CLIENT_URL accordingly and restart backend

### Frontend shows "Failed to load events"
- Make sure backend is running on port 5000
- Open browser DevTools (F12) → Console tab to see error
- Open: http://localhost:5000/api/v1/events to check API directly

---

# ══════════════════════════════════════════
# PART 2 — DEPLOY TO AWS EC2
# ══════════════════════════════════════════

---

## STEP 13 — Create AWS Account

1. Go to: https://aws.amazon.com
2. Click "Create an AWS Account"
3. Fill in email, password, account name
4. Choose "Personal" account type
5. Enter credit card (won't be charged — free tier)
6. Choose "Basic Support (Free)"
7. Sign in to AWS Console: https://console.aws.amazon.com

---

## STEP 14 — Create EC2 Instance (Your Cloud Server)

1. In AWS Console, top bar — search for **"EC2"** → click it
2. Make sure region is set to **"Asia Pacific (Mumbai) ap-south-1"** (top right)
3. Click **"Launch Instance"** (orange button)

**Fill in these settings:**

**Name:** `eventsphere-server`

**Application and OS Image:**
- Click "Ubuntu"
- Version: **Ubuntu Server 22.04 LTS**
- Architecture: 64-bit (x86)

**Instance type:**
- Select `t2.micro` (Free tier eligible — 1 GB RAM)
- If you want better performance: `t3.small` (2 GB RAM, ~$15/month)

**Key pair (for SSH access):**
- Click "Create new key pair"
- Name: `eventsphere-key`
- Key pair type: RSA
- Private key format: `.pem`
- Click "Create key pair"
- **A file `eventsphere-key.pem` will download — SAVE IT SAFELY!**
- You cannot download it again!

**Network settings:**
- Click "Edit" next to Network settings
- Keep VPC and Subnet as default
- "Auto-assign public IP": Enable

**Firewall (Security Groups):**
- Click "Add security group rule" and add these:

| Type | Port | Source | Description |
|------|------|--------|-------------|
| SSH | 22 | My IP | SSH access |
| HTTP | 80 | 0.0.0.0/0 | Web traffic |
| HTTPS | 443 | 0.0.0.0/0 | Secure web |
| Custom TCP | 5000 | 0.0.0.0/0 | Node API (temp) |

**Configure storage:**
- 20 GB (change from default 8)
- Volume type: gp3

Click **"Launch Instance"** — wait 2 minutes.

---

## STEP 15 — Attach Elastic IP (Fixed IP Address)

Without Elastic IP, your server's IP changes every time it restarts.

1. In EC2 left sidebar → **"Elastic IPs"**
2. Click **"Allocate Elastic IP address"**
3. Keep defaults → Click **"Allocate"**
4. Select the new IP → **Actions → Associate Elastic IP address**
5. Select your instance: `eventsphere-server`
6. Click **"Associate"**

**Note your Elastic IP** — it looks like: `13.235.xxx.xxx`
This is your permanent website address!

---

## STEP 16 — Connect to Your Server

### On Windows — Use PuTTY or Windows Terminal

**Option A: Windows Terminal (easier)**

Open Windows Terminal (or PowerShell) and run:
```
ssh -i "C:\Users\YourName\Downloads\eventsphere-key.pem" ubuntu@YOUR_ELASTIC_IP
```

Replace `YOUR_ELASTIC_IP` with your actual IP from Step 15.

First time it asks: "Are you sure?" → type `yes` → Enter

**If you get "Permission denied" error:**
```
icacls "C:\Users\YourName\Downloads\eventsphere-key.pem" /inheritance:r /grant:r "%username%":"(R)"
```

**Option B: PuTTY**
1. Download PuTTY from: https://putty.org
2. Open PuTTYgen → Load your .pem file → Save private key as .ppk
3. Open PuTTY → Host: YOUR_ELASTIC_IP → Port: 22
4. Connection → SSH → Auth → Browse to your .ppk file
5. Click Open → Login as: `ubuntu`

---

## STEP 17 — Install Everything on the Server

You are now inside your cloud server. Run these commands **one by one:**

### Update the server:
```bash
sudo apt update && sudo apt upgrade -y
```
*(Takes 2-3 minutes)*

### Install Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

### Install Python:
```bash
sudo apt install -y python3 python3-pip python3-venv python3-dev
python3 --version
```

### Install PostgreSQL:
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Create the database:
```bash
sudo -u postgres psql
```

Inside PostgreSQL shell, type:
```sql
CREATE USER eventsphere WITH PASSWORD 'StrongPass2025!';
CREATE DATABASE eventsphere OWNER eventsphere;
GRANT ALL PRIVILEGES ON DATABASE eventsphere TO eventsphere;
\q
```

### Install Nginx:
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Install PM2 (keeps Node.js running):
```bash
sudo npm install -g pm2
pm2 --version
```

### Create log directories:
```bash
sudo mkdir -p /var/log/eventsphere
sudo chown -R ubuntu:ubuntu /var/log/eventsphere
```

---

## STEP 18 — Upload Your Project to the Server

### Option A: Upload via GitHub (Recommended)

**On your LOCAL computer first:**

Open terminal in your EventSphere folder:
```
cd "C:\Users\YourName\OneDrive\Desktop\Devis Hakathon\EventSphere"
```

Initialize git and push:
```
git init
git add .
git commit -m "Initial EventSphere project"
```

Go to GitHub.com:
1. Create account if you don't have one
2. Click "+" → "New Repository"
3. Name: `eventsphere`
4. Set to: **Private**
5. Don't initialize with README
6. Click "Create Repository"

Copy the commands shown, like:
```
git remote add origin https://github.com/YOURNAME/eventsphere.git
git branch -M main
git push -u origin main
```

Now on the **SERVER** (SSH terminal):
```bash
cd /var/www
sudo mkdir eventsphere
sudo chown -R ubuntu:ubuntu /var/www/eventsphere
git clone https://github.com/YOURNAME/eventsphere.git /var/www/eventsphere
```

---

### Option B: Upload via SCP (Direct upload from your PC)

On your **LOCAL computer**, open a new terminal:
```
scp -i "C:\path\to\eventsphere-key.pem" -r "C:\Users\YourName\OneDrive\Desktop\Devis Hakathon\EventSphere" ubuntu@YOUR_ELASTIC_IP:/var/www/eventsphere
```

*(This may take 5-10 minutes)*

---

## STEP 19 — Create .env Files on the Server

On the **SERVER** (SSH terminal):

### Backend .env:
```bash
cd /var/www/eventsphere/backend-node
nano .env
```

Type/paste this (press Ctrl+Shift+V to paste in terminal):
```
NODE_ENV=production
PORT=5000
CLIENT_URL=http://YOUR_ELASTIC_IP

DATABASE_URL=postgresql://eventsphere:StrongPass2025!@localhost:5432/eventsphere

JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2

JWT_EXPIRES_IN=7d

RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_SECRET_KEY

FLASK_AI_URL=http://localhost:8000

UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

**Replace:**
- `YOUR_ELASTIC_IP` with your actual IP (from Step 15)
- `YOUR_KEY_ID` and `YOUR_SECRET_KEY` with Razorpay keys

Save: Press `Ctrl+X` → type `Y` → press Enter

### Flask .env:
```bash
cd /var/www/eventsphere/ai-flask
nano .env
```

Paste:
```
FLASK_ENV=production
FLASK_PORT=8000
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
ALLOWED_ORIGINS=http://YOUR_ELASTIC_IP
```

Save: `Ctrl+X` → `Y` → Enter

---

## STEP 20 — Install Project Dependencies on Server

### Backend:
```bash
cd /var/www/eventsphere/backend-node
npm install --production
npx prisma generate
npx prisma migrate deploy
node prisma/seed.js
```

Expected at end:
```
✅ Database seeded successfully!
```

### Flask:
```bash
cd /var/www/eventsphere/ai-flask
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
```

---

## STEP 21 — Configure Nginx (Connect Frontend + Backend)

```bash
sudo nano /etc/nginx/sites-available/eventsphere
```

Paste this **entire configuration:**
```nginx
server {
    listen 80;
    server_name YOUR_ELASTIC_IP;

    # Gzip for faster loading
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # ── Frontend (your HTML/CSS/JS files) ──
    location / {
        root /var/www/eventsphere/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # ── Backend API ──
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    # ── Socket.IO (Real-time) ──
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

    # ── Uploaded images ──
    location /uploads/ {
        alias /var/www/eventsphere/backend-node/uploads/;
        expires 30d;
    }

    # ── Block hidden files ──
    location ~ /\. {
        deny all;
    }
}
```

Replace `YOUR_ELASTIC_IP` with your actual IP.

Save: `Ctrl+X` → `Y` → Enter

Enable the config:
```bash
sudo ln -sf /etc/nginx/sites-available/eventsphere /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
```

You should see:
```
nginx: configuration file syntax is ok
nginx: configuration file test is successful
```

Reload Nginx:
```bash
sudo systemctl reload nginx
```

---

## STEP 22 — Update Frontend API URL for Production

The frontend needs to know it's in production.

On the **SERVER:**
```bash
nano /var/www/eventsphere/frontend/js/config.js
```

Find this section and verify it looks like this:
```javascript
const CONFIG = {
  API_BASE_URL: window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api/v1'
    : '/api/v1',                    // ← Production uses Nginx proxy

  SOCKET_URL: window.location.hostname === 'localhost' ||
              window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : window.location.origin,       // ← Production uses same domain
};
```

If it already looks like this, great — no changes needed. Save: `Ctrl+X`.

---

## STEP 23 — Start Backend with PM2

```bash
cd /var/www/eventsphere
pm2 start deployment/ecosystem.config.js --env production
```

Check it's running:
```bash
pm2 status
```

You should see:
```
┌─────┬─────────────────────┬─────────┬───────┬──────────┐
│ id  │ name                │ status  │ cpu   │ mem      │
├─────┼─────────────────────┼─────────┼───────┼──────────┤
│ 0   │ eventsphere-api     │ online  │ 0%    │ 60mb     │
└─────┴─────────────────────┴─────────┴───────┴──────────┘
```

Save PM2 process list (auto-restarts on reboot):
```bash
pm2 save
pm2 startup
```

Copy and run the command it outputs (starts with `sudo env PATH=...`)

---

## STEP 24 — Start Flask with Gunicorn

```bash
# Copy the systemd service file
sudo cp /var/www/eventsphere/deployment/eventsphere-ai.service /etc/systemd/system/

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable eventsphere-ai
sudo systemctl start eventsphere-ai

# Check it's running
sudo systemctl status eventsphere-ai
```

Should show: `active (running)`

Test it:
```bash
curl http://localhost:8000/health
```
Should return: `{"status": "healthy"}`

---

## STEP 25 — Test Your Live Website!

Open your browser and go to:
```
http://YOUR_ELASTIC_IP
```

For example:
```
http://13.235.xxx.xxx
```

**You should see the EventSphere homepage!** 🎉

Test the full flow:
1. Browse events (loaded from your cloud database)
2. Login: `organizer@demo.com` / `demo1234`
3. Go to Dashboard
4. Book a test event
5. Check real-time updates

---

## STEP 26 — Verify All Services Are Running

Run this command to check everything:
```bash
echo "=== PM2 (Node.js) ===" && pm2 status
echo "=== Nginx ===" && sudo systemctl status nginx --no-pager | head -5
echo "=== Flask ===" && sudo systemctl status eventsphere-ai --no-pager | head -5
echo "=== PostgreSQL ===" && sudo systemctl status postgresql --no-pager | head -5
echo "=== API Test ===" && curl -s http://localhost:5000/health
echo "=== Flask Test ===" && curl -s http://localhost:8000/health
```

All should show "active (running)" or "online".

---

## STEP 27 — Add Free SSL (HTTPS) — Optional but Recommended

You need a domain name for SSL. If you have one, point it to your Elastic IP.

If you have a domain:
```bash
sudo apt install -y certbot python3-certbot-nginx

sudo certbot --nginx -d yourdomain.com

# Follow the prompts:
# Enter email → A (agree) → N → 2 (redirect HTTP to HTTPS)
```

Your site will now be at `https://yourdomain.com` 🔒

---

## ══════════════════════════════════
## QUICK REFERENCE COMMANDS
## ══════════════════════════════════

### Check all services:
```bash
pm2 status
sudo systemctl status nginx eventsphere-ai postgresql
```

### View live logs:
```bash
pm2 logs eventsphere-api         # Node.js logs
sudo journalctl -u eventsphere-ai -f   # Flask logs
sudo tail -f /var/log/nginx/error.log  # Nginx errors
```

### Restart services:
```bash
pm2 restart eventsphere-api      # Restart Node.js
sudo systemctl restart eventsphere-ai  # Restart Flask
sudo systemctl reload nginx      # Reload Nginx config
```

### Update website after code changes:
```bash
cd /var/www/eventsphere
git pull origin main
cd backend-node && npm install
npx prisma migrate deploy
pm2 reload eventsphere-api
sudo systemctl restart eventsphere-ai
```

### Connect to database:
```bash
psql -U eventsphere -d eventsphere -h localhost
```

---

## TROUBLESHOOTING — AWS Errors

### Website shows "502 Bad Gateway"
- Node.js crashed. Check logs:
  ```bash
  pm2 logs eventsphere-api --lines 30
  ```
- Restart: `pm2 restart eventsphere-api`

### Website not opening at all
- Check Nginx is running: `sudo systemctl status nginx`
- Check security group allows port 80
- Try: `curl http://localhost` on the server

### API returns 500 errors
- Check .env file has correct DATABASE_URL
- Check PostgreSQL is running
- Check Prisma migrations ran: `npx prisma migrate status`

### Socket.IO not working (real-time broken)
- Check Nginx config has the socket.io location block
- Run: `sudo nginx -t` to verify config
- Run: `sudo systemctl reload nginx`

### Flask/AI not working
- Check: `sudo systemctl status eventsphere-ai`
- Check logs: `sudo journalctl -u eventsphere-ai -n 30`
- Verify GEMINI_API_KEY in ai-flask/.env

### "Permission denied" errors
- Run: `sudo chown -R ubuntu:ubuntu /var/www/eventsphere`

---

## YOUR WEBSITE IS NOW LIVE! 🚀

**Local:** http://127.0.0.1:5500 (Live Server)
**Production:** http://YOUR_ELASTIC_IP

Demo Accounts:
- Organizer: organizer@demo.com / demo1234
- Attendee: attendee@demo.com / demo1234

Test Payment Card:
- Number: 4111 1111 1111 1111
- Expiry: 12/26  CVV: 123  OTP: 1234

---

*EventSphere — Setup Complete ✅*
