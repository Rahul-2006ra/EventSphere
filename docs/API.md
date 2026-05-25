# EventSphere — API Documentation

Base URL: `http://localhost:5000/api/v1`

All protected routes require:
```
Authorization: Bearer <token>
```

All responses follow:
```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Error description" }
```

---

## 🔐 Authentication

### Register
`POST /auth/register`

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "ATTENDEE"  // or "ORGANIZER"
}
```
**Response:** `201` — User object + JWT token

---

### Login
`POST /auth/login`

**Body:**
```json
{ "email": "john@example.com", "password": "securepassword" }
```
**Response:** `200` — User object + JWT token

---

### Get Current User
`GET /auth/me` 🔒

**Response:** User profile object

---

### Update Profile
`PUT /auth/profile` 🔒

**Body:** `{ name, phone, bio, avatar }`

---

### Change Password
`PUT /auth/change-password` 🔒

**Body:** `{ currentPassword, newPassword }`

---

## 🎪 Events

### List Events
`GET /events`

**Query params:**
| Param | Type | Default | Description |
|---|---|---|---|
| page | number | 1 | Page number |
| limit | number | 12 | Results per page |
| search | string | — | Search in title/description |
| category | string | — | Filter by category |
| city | string | — | Filter by city |
| startDate | ISO date | — | Events starting after |
| endDate | ISO date | — | Events ending before |
| minPrice | number | — | Min ticket price |
| maxPrice | number | — | Max ticket price |
| sort | string | startDate | Sort field |
| order | string | asc | Sort direction |
| featured | boolean | — | Featured events only |
| status | string | PUBLISHED | Event status |

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [...],
    "pagination": { "total": 42, "page": 1, "limit": 12, "pages": 4 }
  }
}
```

---

### Get Event
`GET /events/:idOrSlug`

Returns full event with ticketTypes, reviews, organizer, speakers, FAQs.

---

### Create Event
`POST /events` 🔒 **[Organizer only]**

**Body:**
```json
{
  "title": "TechConf 2025",
  "description": "Full description...",
  "shortDesc": "One line teaser",
  "category": "CONFERENCE",
  "venue": "Convention Center",
  "address": "123 Main St",
  "city": "Bangalore",
  "startDate": "2025-06-01T09:00:00Z",
  "endDate": "2025-06-03T18:00:00Z",
  "isOnline": false,
  "bannerImage": "https://...",
  "tags": ["tech", "ai"],
  "faqs": [{ "question": "Q?", "answer": "A." }],
  "speakers": [{ "name": "John", "title": "CTO", "bio": "..." }],
  "ticketTypes": [
    {
      "name": "General",
      "price": 999,
      "quantity": 500,
      "maxPerOrder": 5,
      "perks": ["Lunch", "Badge"]
    }
  ],
  "isFeatured": false
}
```

---

### Update Event
`PUT /events/:id` 🔒 **[Organizer/own]**

**Body:** Any subset of create fields.

---

### Publish Event
`PATCH /events/:id/publish` 🔒 **[Organizer/own]**

Changes status from `DRAFT` → `PUBLISHED`

---

### Delete Event
`DELETE /events/:id` 🔒 **[Organizer/own]**

---

### My Events
`GET /events/organizer/my-events` 🔒 **[Organizer]**

**Query params:** `page`, `limit`, `status`

---

## 💳 Bookings & Payments

### Initiate Booking
`POST /bookings/initiate` 🔒

Creates Razorpay order for paid events or confirms free bookings directly.

**Body:**
```json
{
  "eventId": "clxxxx",
  "tickets": [
    { "ticketTypeId": "clxxxx", "quantity": 2 }
  ],
  "attendeeDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91 9876543210"
  }
}
```

**Response (paid event):**
```json
{
  "success": true,
  "data": {
    "bookingId": "clxxxx",
    "orderId": "order_xxxx",
    "amount": 1998,
    "currency": "INR",
    "keyId": "rzp_test_xxxx"
  }
}
```

---

### Verify Payment
`POST /bookings/verify` 🔒

Called after Razorpay payment success. Verifies signature, issues QR tickets.

**Body:**
```json
{
  "bookingId": "clxxxx",
  "orderId": "order_xxxx",
  "paymentId": "pay_xxxx",
  "signature": "razorpay_signature_hash",
  "tickets": [
    { "ticketTypeId": "clxxxx", "quantity": 2, "attendees": [{ "name": "A" }, { "name": "B" }] }
  ]
}
```

**Response:** Booking with issued tickets (including QR code base64).

---

### My Bookings
`GET /bookings` 🔒

**Query params:** `page`, `limit`, `status`

---

### Get Booking
`GET /bookings/:id` 🔒

Returns booking with all tickets and QR codes.

---

### Cancel Booking
`POST /bookings/:id/cancel` 🔒

**Body:** `{ "reason": "Optional cancel reason" }`

---

## 🎫 Tickets

### Verify Ticket
`GET /tickets/:ticketNumber/verify` 🔒

Used for manual verification. Returns ticket status and attendee info.

---

### Get QR Code
`GET /tickets/:id/qr` 🔒

Returns the QR code base64 for a specific ticket (user must own it).

---

## ⭐ Reviews

### Create/Update Review
`POST /reviews` 🔒

**Body:**
```json
{
  "eventId": "clxxxx",
  "rating": 5,
  "title": "Amazing event!",
  "body": "Loved every moment..."
}
```

---

### List Event Reviews
`GET /reviews/event/:eventId`

Returns reviews with avgRating and total count.

---

## 🔔 Notifications

### List Notifications
`GET /notifications` 🔒

Returns last 50 notifications for current user.

---

### Mark as Read
`PATCH /notifications/:id/read` 🔒

---

### Mark All as Read
`PATCH /notifications/read-all` 🔒

---

## ❤️ Wishlist

### My Wishlist
`GET /wishlist` 🔒

---

### Toggle Wishlist
`POST /wishlist/:eventId` 🔒

Adds if not saved, removes if already saved. Returns `{ wishlisted: true/false }`.

---

## 📊 Dashboard

### Overview Stats
`GET /dashboard/overview` 🔒 **[Organizer]**

Returns: totalRevenue, totalTicketsSold, totalBookings, totalCheckIns, totalEvents, upcomingEvents, recentBookings, eventPerformance, monthlyRevenue.

---

### Event Dashboard
`GET /dashboard/event/:eventId` 🔒 **[Organizer/own]**

Returns detailed stats for a single event: revenue, check-in rate, ticket breakdown, recent attendees.

---

## 🤖 AI Endpoints

All AI endpoints proxy to the Flask microservice.

### Generate Description
`POST /ai/generate-description` 🔒 **[Organizer]**

**Body:**
```json
{
  "title": "TechConf 2025",
  "category": "CONFERENCE",
  "venue": "BEC Bangalore",
  "date": "2025-06-01",
  "speakers": [{ "name": "John" }]
}
```

**Response:**
```json
{
  "shortDescription": "...",
  "fullDescription": "...",
  "highlights": ["..."],
  "targetAudience": "...",
  "callToAction": "..."
}
```

---

### Event Recommendations
`POST /ai/recommendations` 🔒

**Body:**
```json
{
  "interests": ["tech", "ai", "startup"],
  "location": "Bangalore",
  "pastEvents": ["TechConf 2024", "AI Summit"]
}
```

**Response:**
```json
{
  "recommendedCategories": [...],
  "recommendedTags": [...],
  "reasoning": "...",
  "discoveryPrompts": [...]
}
```

---

### Generate Schedule
`POST /ai/schedule` 🔒 **[Organizer]**

**Body:**
```json
{
  "eventTitle": "TechConf 2025",
  "duration": 8,
  "topics": ["AI", "Cloud", "DevOps"],
  "speakers": [{ "name": "John" }],
  "breaks": true
}
```

**Response:**
```json
{
  "startTime": "09:00 AM",
  "endTime": "06:00 PM",
  "totalSessions": 12,
  "schedule": [
    { "time": "09:00 AM", "duration": 60, "title": "Opening Keynote", "type": "keynote", "speaker": "John", "description": "..." }
  ],
  "tips": [...]
}
```

---

## 🚨 Error Codes

| Status | Meaning |
|---|---|
| 400 | Bad Request — missing/invalid fields |
| 401 | Unauthorized — invalid or missing token |
| 403 | Forbidden — insufficient permissions |
| 404 | Not Found |
| 409 | Conflict — e.g. email already exists |
| 429 | Too Many Requests — rate limit hit |
| 500 | Internal Server Error |
| 503 | AI Service Unavailable |
