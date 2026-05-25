# EventSphere 🌐

**A production-ready, real-time AI-powered event management platform.**

Built with Node.js, Flask, PostgreSQL, Socket.IO, Razorpay, and Gemini AI — deployed on AWS EC2.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 Auth | JWT, bcrypt, role-based (Organizer / Attendee) |
| 🎪 Events | Full CRUD, search, filter, categories, FAQs, speakers |
| 💳 Payments | Razorpay test mode, order verification, signature validation |
| 🎟 Tickets | QR code generation, downloadable tickets, check-in validation |
| ⚡ Real-time | Socket.IO — live attendee count, check-ins, dashboard, notifications |
| 🤖 AI | Gemini-powered description generator, recommendations, schedule builder |
| 📊 Dashboard | Revenue charts, ticket analytics, live check-in feed |
| ❤️ Wishlist | Save events for later |
| ⭐ Reviews | Star ratings with verified attendee badge |

---

## 🗂 Folder Structure

```
EventSphere/
├── frontend/               # HTML/CSS/JS + Tailwind (static)
│   ├── index.html          # Home / event listing
│   ├── css/main.css        # Global styles
│   ├── js/
│   │   ├── config.js       # API base URL, helpers
│   │   ├── api.js          # API client + Toast system
│   │   ├── auth.js         # Session management
│   │   └── main.js         # Home page logic
│   └── pages/
│       ├── event-detail.html
│       ├── create-event.html
│       ├── dashboard.html
│       ├── my-bookings.html
│       ├── checkin.html
│       ├── login.html
│       └── register.html
│
├── backend-node/           # Node.js + Express main API
│   ├── src/
│   │   ├── server.js       # Entry point, Socket.IO setup
│   │   ├── controllers/    # Business logic
│   │   ├── routes/         # Express routes
│   │   ├── middleware/     # Auth middleware
│   │   └── utils/          # Prisma client, Socket helper
│   ├── prisma/
│   │   ├── schema.prisma   # Full DB schema (8 models)
│   │   └── seed.js         # Demo data seeder
│   └── package.json
│
├── ai-flask/               # Python Flask AI microservice
│   ├── app.py              # Flask entry point
│   ├── routes/ai_routes.py # AI endpoints
│   ├── services/
│   │   └── gemini_service.py  # Gemini API integration
│   └── requirements.txt
│
├── deployment/             # Production config
│   ├── nginx.conf          # Nginx reverse proxy + WebSocket
│   ├── ecosystem.config.js # PM2 cluster config
│   ├── gunicorn.conf.py    # Gunicorn config for Flask
│   └── deploy.sh           # Full EC2 setup script
│
└── docs/
    ├── API.md              # Full API documentation
    └── ARCHITECTURE.md     # System architecture
```

---

## 🚀 Local Development Setup

### Prerequisites

- Node.js 18+
- Python 3.9+
- PostgreSQL 14+
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/eventsphere.git
cd eventsphere
```

### 2. Setup Backend (Node.js)

```bash
cd backend-node

# Install dependencies
npm install

# Copy and fill environment variables
cp .env.example .env
# Edit .env with your values (DB URL, JWT secret, Razorpay keys)

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed demo data
npm run db:seed

# Start development server
npm run dev
```

The API will run at `http://localhost:5000`

### 3. Setup Flask AI Service

```bash
cd ai-flask

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and fill environment variables
cp .env.example .env
# Edit .env — add your GEMINI_API_KEY

# Run Flask
python app.py
```

The AI service will run at `http://localhost:8000`

### 4. Setup Frontend

```bash
# Option A: Serve with any static file server
npx serve frontend

# Option B: Use Python's built-in server
cd frontend && python3 -m http.server 3000

# Option C: Use VS Code Live Server extension
```

Open `http://localhost:3000`

---

## 🗄 Database Setup

### Create PostgreSQL database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE USER eventsphere WITH PASSWORD 'your_password';
CREATE DATABASE eventsphere OWNER eventsphere;
GRANT ALL PRIVILEGES ON DATABASE eventsphere TO eventsphere;
\q
```

### Set DATABASE_URL in .env

```
DATABASE_URL=postgresql://eventsphere:your_password@localhost:5432/eventsphere
```

### Run migrations

```bash
cd backend-node
npx prisma migrate dev --name init
npx prisma generate
node prisma/seed.js
```

### View database (Prisma Studio)

```bash
cd backend-node
npm run db:studio
# Opens at http://localhost:5555
```

---

## 💳 Razorpay Setup (Test Mode)

1. Sign up at [razorpay.com](https://razorpay.com)
2. Go to **Settings → API Keys** → Generate test keys
3. Add to `backend-node/.env`:

```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

**Test card:** `4111 1111 1111 1111` | Any CVV | Any future date

---

## 🤖 Gemini AI Setup

1. Get API key at [ai.google.dev](https://ai.google.dev)
2. Add to `ai-flask/.env`:

```
GEMINI_API_KEY=your_gemini_api_key
```

---

## 🌐 Environment Variables Reference

### backend-node/.env

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

DATABASE_URL=postgresql://user:pass@localhost:5432/eventsphere

JWT_SECRET=your_jwt_secret_min_32_characters
JWT_EXPIRES_IN=7d

RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx

FLASK_AI_URL=http://localhost:8000
```

### ai-flask/.env

```env
FLASK_ENV=development
FLASK_PORT=8000
GEMINI_API_KEY=your_gemini_key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000
```

---

## ☁️ AWS EC2 Deployment

### Instance recommendation

- **Type:** t3.medium (2 vCPU, 4 GB RAM)
- **OS:** Ubuntu 22.04 LTS
- **Storage:** 20 GB SSD
- **Security Groups:** Open ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

### Quick deploy

```bash
# 1. SSH into your EC2 instance
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP

# 2. Upload your project or clone from GitHub
git clone https://github.com/YOUR_USERNAME/eventsphere.git /var/www/eventsphere

# 3. Create .env files
nano /var/www/eventsphere/backend-node/.env
nano /var/www/eventsphere/ai-flask/.env

# 4. Run the deployment script
cd /var/www/eventsphere
sudo bash deployment/deploy.sh

# 5. Update Nginx config with your IP/domain
sudo nano /etc/nginx/sites-available/eventsphere
# Replace YOUR_DOMAIN_OR_IP

# 6. Reload Nginx
sudo nginx -t && sudo systemctl reload nginx
```

### SSL with Let's Encrypt (free HTTPS)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### PM2 commands

```bash
pm2 status                          # View process status
pm2 logs eventsphere-api            # View logs
pm2 restart eventsphere-api         # Restart
pm2 reload eventsphere-api          # Zero-downtime reload
pm2 monit                           # CPU/memory monitor
```

---

## 📡 API Overview

**Base URL:** `http://localhost:5000/api/v1`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Register user |
| POST | `/auth/login` | — | Login |
| GET | `/auth/me` | ✓ | Current user |
| GET | `/events` | — | List events (paginated) |
| GET | `/events/:id` | — | Get event detail |
| POST | `/events` | Organizer | Create event |
| PUT | `/events/:id` | Organizer | Update event |
| PATCH | `/events/:id/publish` | Organizer | Publish event |
| DELETE | `/events/:id` | Organizer | Delete event |
| POST | `/bookings/initiate` | ✓ | Create Razorpay order |
| POST | `/bookings/verify` | ✓ | Verify payment + issue tickets |
| GET | `/bookings` | ✓ | My bookings |
| GET | `/tickets/:number/verify` | ✓ | Verify QR ticket |
| GET | `/dashboard/overview` | Organizer | Analytics data |
| POST | `/ai/generate-description` | Organizer | Gemini description |
| POST | `/ai/schedule` | Organizer | Gemini schedule |
| POST | `/ai/recommendations` | ✓ | Event recommendations |

---

## ⚡ Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join:event` | Client→Server | Join event room for live updates |
| `join:dashboard` | Client→Server | Join organizer dashboard room |
| `join:notifications` | Client→Server | Subscribe to notifications |
| `event:stats` | Server→Client | Live ticket availability |
| `event:checkin` | Server→Client | Someone checked in |
| `event:updated` | Server→Client | Event status changed |
| `dashboard:update` | Server→Client | New booking/revenue update |
| `dashboard:checkin` | Server→Client | Check-in for organizer |
| `notification:new` | Server→Client | New notification |
| `checkin:scan` | Client→Server | Scan QR for check-in |
| `checkin:result` | Server→Client | Check-in result |

---

## 🔒 Security Notes

- All `.env` files are gitignored — never commit secrets
- Razorpay payment signatures are cryptographically verified server-side
- JWT tokens expire in 7 days
- Rate limiting: 100 requests / 15 minutes per IP
- Passwords hashed with bcrypt (12 salt rounds)
- Helmet.js sets security headers
- CORS restricted to `CLIENT_URL`

---

## 🧪 Demo Accounts

After running `npm run db:seed`:

| Role | Email | Password |
|------|-------|----------|
| Attendee | attendee@demo.com | demo1234 |
| Organizer | organizer@demo.com | demo1234 |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JS, Tailwind CSS |
| Backend | Node.js 20, Express.js |
| AI Service | Python 3.11, Flask |
| Database | PostgreSQL 14+ |
| ORM | Prisma 5 |
| Real-time | Socket.IO 4 |
| Payments | Razorpay |
| QR Codes | qrcode npm package |
| AI | Google Gemini 1.5 Flash |
| Process Manager | PM2 |
| WSGI | Gunicorn |
| Reverse Proxy | Nginx |
| Cloud | AWS EC2 + Elastic IP |
| Version Control | Git / GitHub |

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

*Built with ❤️ by the EventSphere team*
