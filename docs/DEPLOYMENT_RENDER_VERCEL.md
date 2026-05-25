# EventSphere Deployment Guide

This project deploys as three managed services:

- Frontend: Vercel, serving the static `frontend` folder.
- API: Render web service from `backend-node`.
- AI service: Render web service from `ai-flask`.
- Database: MongoDB Atlas, connected through Prisma.

## 1. MongoDB Atlas

1. Create a free Atlas cluster.
2. Create a database user and password.
3. Add Render outbound access. For a hackathon demo, Atlas Network Access can temporarily allow `0.0.0.0/0`; restrict it after judging.
4. Copy the connection string and set the database name to `eventsphere`.
5. Use this as `DATABASE_URL` in the Render API service:

```env
DATABASE_URL=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/eventsphere?retryWrites=true&w=majority
```

## 2. Render

Use `render.yaml` as a Blueprint or create two web services manually.

API service:

```text
Root Directory: backend-node
Build Command: npm ci && npm run build
Start Command: npm start
Health Check Path: /health
```

AI service:

```text
Root Directory: ai-flask
Build Command: pip install -r requirements.txt
Start Command: gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120
Health Check Path: /health
```

Set all required values from `.env.example`. After both Render services are created:

- Set API `FLASK_AI_URL` to the AI service URL.
- Set API `CLIENT_URL` and `ALLOWED_ORIGINS` to the final Vercel URL.
- Set AI `ALLOWED_ORIGINS` to the API URL and final Vercel URL.

Render free web services may sleep when idle. For always-on judging, upgrade the API and AI services to a paid instance before submitting.

## 3. Vercel

Import the GitHub repository into Vercel. Keep the repository root as the project root; `vercel.json` handles the frontend folder.

Set these Vercel environment variables:

```env
VERCEL_PUBLIC_API_BASE_URL=https://your-eventsphere-api.onrender.com/api/v1
VERCEL_PUBLIC_SOCKET_URL=https://your-eventsphere-api.onrender.com
VERCEL_PUBLIC_RAZORPAY_KEY=rzp_test_xxxxxxxxxxxxxxxx
```

Deploy. The build writes `frontend/js/env.js`, so the static frontend calls the Render API without manual code edits.

## 4. Database Setup

After the API service has `DATABASE_URL`, run this once from Render Shell or locally with the Atlas URL:

```bash
npx prisma db push
npm run db:seed
```

Use `db:seed` only if you want demo accounts and sample events.

## 5. Final Smoke Test

1. Open the Vercel URL.
2. Register a new attendee and organizer.
3. Create and publish an event as organizer.
4. Search events from the homepage.
5. Try AI description generation.
6. Confirm these URLs return JSON:

```text
https://your-eventsphere-api.onrender.com/health
https://your-eventsphere-ai.onrender.com/health
```
