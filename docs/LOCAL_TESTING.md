# EventSphere Local Testing Guide

## Start The Website

```powershell
cd "C:\Users\rahul\OneDrive\Desktop\Devis Hakathon\EventSphere\backend-node"
npm start
```

Open:

```text
http://localhost:5000
```

The current local setup uses `DEMO_MODE=true`, so it works without PostgreSQL.

## Demo Accounts

```text
Attendee:  attendee@demo.com  / demo1234
Organizer: organizer@demo.com / demo1234
```

## Test Checklist

1. Home page
   - Open `http://localhost:5000`.
   - Confirm event cards load.
   - Search `TechConf`.
   - Filter by `Workshop` or `Networking`.

2. Organizer login and dashboard
   - Login with `organizer@demo.com`.
   - Confirm dashboard stats load.
   - Open `Create Event`.

3. AI event creation
   - Enter title, category, date, venue, and city.
   - Click `Generate with AI`.
   - Confirm description is filled.
   - Add one ticket type.
   - Click `Publish Event`.
   - Confirm event detail page opens.

4. Attendee booking and QR ticket
   - Sign out.
   - Login with `attendee@demo.com`.
   - Open `Startup Networking Hyderabad`.
   - Select one free `General` ticket.
   - Confirm the free booking.
   - Open `My Bookings`.
   - Click the ticket button and confirm QR code appears.

5. Paid booking / Razorpay behavior
   - Open a paid event such as `TechConf India 2026`.
   - Select a paid ticket and click booking/payment.
   - If Razorpay keys are not set, the booking must show as `PENDING` and no QR ticket should appear.
   - If Razorpay test keys are set, Razorpay checkout opens. The booking becomes `CONFIRMED` only after payment verification succeeds.

6. API health checks

```powershell
Invoke-RestMethod http://localhost:5000/health
Invoke-RestMethod http://localhost:5000/api/v1/events
Invoke-RestMethod http://localhost:5000/api/v1/demo/status
```

## API Keys Needed For Full Mode

- `XAI_API_KEY`: Grok/xAI key for AI generation. Put it in `ai-flask/.env`.
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`: required only for real paid checkout.
- `DATABASE_URL`: PostgreSQL connection string for persistent production-like data.
- `JWT_SECRET`: already present locally, but replace it before deployment.

Optional fallback:

- `GEMINI_API_KEY`: only needed if you want Gemini fallback instead of Grok.
