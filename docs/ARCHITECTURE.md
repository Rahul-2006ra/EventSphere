# EventSphere — Architecture Documentation

## System Architecture

```
┌─────────────────────────────────────────────────┐
│                 AWS EC2 Instance                  │
│                (Elastic IP: x.x.x.x)             │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │              Nginx (Port 80/443)             │ │
│  │         Reverse Proxy + Static Files         │ │
│  └────────────┬──────────────┬─────────────────┘ │
│               │              │                    │
│  ┌────────────▼──┐    ┌─────▼──────────────────┐ │
│  │  Frontend     │    │   Node.js API           │ │
│  │  (Static)     │    │   (Port 5000)           │ │
│  │  HTML/CSS/JS  │    │   Express + Socket.IO   │ │
│  │  Tailwind CSS │    │   PM2 Cluster           │ │
│  └───────────────┘    └──────┬──────────────────┘ │
│                              │                    │
│                    ┌─────────▼──────────────────┐ │
│                    │    PostgreSQL               │ │
│                    │    (Prisma ORM)             │ │
│                    └────────────────────────────┘ │
│                              │                    │
│                    ┌─────────▼──────────────────┐ │
│                    │   Flask AI Service          │ │
│                    │   (Port 8000)               │ │
│                    │   Gunicorn + Gemini API     │ │
│                    └────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Data Flow

### Booking Flow
```
User → Frontend → POST /bookings/initiate → Node.js API
  → Validates ticket availability in PostgreSQL
  → Creates Razorpay order (Razorpay API)
  → Returns {orderId, keyId, amount} to Frontend

Frontend → Razorpay Checkout (user pays)
  → Razorpay returns {paymentId, signature}

Frontend → POST /bookings/verify → Node.js API
  → Verifies HMAC signature
  → Creates tickets with QR codes (qrcode npm)
  → Updates ticket counts (Prisma transaction)
  → Creates notification record
  → Emits Socket.IO events (live updates)
  → Returns tickets with base64 QR codes
```

### AI Description Flow
```
Organizer → Frontend → POST /ai/generate-description → Node.js
  → Proxies to Flask POST /ai/generate-description
  → Flask → Gemini API (generate content)
  → Parses JSON response
  → Returns structured {shortDescription, fullDescription, highlights}
```

### Real-time Check-in Flow
```
Scanner → Socket.IO "checkin:scan" → Server
  → Validates ticket in PostgreSQL
  → Updates ticket status to USED
  → Emits "checkin:result" to scanner
  → Emits "dashboard:checkin" to organizer's dashboard room
  → Emits "event:checkin" to event room (all viewers)
```

## Database Schema Overview

```
User ──────────────── (1:many) ──────── Event (organizer)
User ──────────────── (1:many) ──────── Booking
User ──────────────── (1:many) ──────── Review
User ──────────────── (1:many) ──────── Notification
User ──────────────── (1:many) ──────── Wishlist

Event ─────────────── (1:many) ──────── TicketType
Event ─────────────── (1:many) ──────── Booking
Event ─────────────── (1:many) ──────── Review
Event ─────────────── (1:many) ──────── Wishlist

Booking ────────────── (1:many) ──────── Ticket
TicketType ─────────── (1:many) ──────── Ticket
```

## Security Architecture

```
Request → Nginx (TLS termination, rate limiting)
       → Node.js (helmet.js, CORS, express-rate-limit)
       → authenticate middleware (JWT verification)
       → authorize middleware (role check)
       → Controller (business logic)
       → Prisma (parameterized queries, no SQL injection)
       → PostgreSQL
```

## Socket.IO Room Architecture

```
Rooms:
  event:{eventId}         — All viewers of an event
  dashboard:{organizerId} — Organizer's dashboard
  user:{userId}           — User's notification channel

Events emitted to rooms:
  event:{id}    ← event:stats, event:checkin, event:updated
  dashboard:{id} ← dashboard:update, dashboard:checkin
  user:{id}     ← notification:new
```

## Microservice Communication

```
Node.js Backend (Express)
    │
    │  HTTP POST (axios, 30s timeout)
    │  Internal network only (localhost:8000)
    │
    ▼
Flask AI Service (Gunicorn)
    │
    │  HTTPS
    │
    ▼
Google Gemini API (External)
```

The Flask service is **never exposed to the public internet** — it only listens on `127.0.0.1:8000` and is accessed by Node.js internally.
