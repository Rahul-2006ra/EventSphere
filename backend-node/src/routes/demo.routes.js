const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const QRCode = require('qrcode');
const Razorpay = require('razorpay');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'eventsphere_local_demo_secret_change_me_123456';
const FLASK_URL = process.env.FLASK_AI_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000');
const state = { users: [], events: [], bookings: [], tickets: [], reviews: [], wishlist: [] };
const hasRazorpayKeys = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
const razorpay = hasRazorpayKeys ? new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
}) : null;

async function createRazorpayOrder({ amount, receipt, notes }) {
  const response = await axios.post(
    'https://api.razorpay.com/v1/orders',
    {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt,
      notes,
    },
    {
      auth: {
        username: process.env.RAZORPAY_KEY_ID,
        password: process.env.RAZORPAY_KEY_SECRET,
      },
      timeout: 20000,
    },
  );
  return response.data;
}

const id = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
const now = () => new Date().toISOString();
const publicUser = (user) => user && ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar || null,
  phone: user.phone || '',
  bio: user.bio || '',
  createdAt: user.createdAt,
});

function seed() {
  if (state.users.length) return;
  const password = bcrypt.hashSync('demo1234', 12);
  const attendee = { id: 'user_attendee_demo', name: 'Alex Johnson', email: 'attendee@demo.com', password, role: 'ATTENDEE', bio: 'Tech enthusiast and event lover', createdAt: now() };
  const organizer = { id: 'user_organizer_demo', name: 'Rahul', email: 'organizer@demo.com', password, role: 'ORGANIZER', bio: 'Creator of EventSphere and event organizer.', createdAt: now() };
  state.users.push(attendee, organizer);

  const future = (days, hours = 0) => new Date(Date.now() + (days * 24 + hours) * 60 * 60 * 1000).toISOString();
  state.events.push(
    {
      id: 'event_techconf_demo',
      title: 'TechConf India 2026',
      slug: 'techconf-india-2026',
      description: 'The largest technology conference in India. Join developers, designers, and tech leaders for practical AI, cloud, product, and startup sessions.',
      shortDesc: "India's premier tech conference with hands-on learning",
      category: 'CONFERENCE',
      status: 'PUBLISHED',
      venue: 'Bangalore International Exhibition Centre',
      address: 'Tumkur Road',
      city: 'Bangalore',
      startDate: future(15),
      endDate: future(17),
      totalCapacity: 5000,
      bookedCount: 3200,
      isFeatured: true,
      tags: ['tech', 'ai', 'cloud', 'startup'],
      faqs: [{ question: 'Is food included?', answer: 'Yes, lunch and refreshments are included.' }],
      speakers: [{ name: 'Neha Kapoor', title: 'AI Research Lead', bio: 'Machine learning leader and speaker.' }],
      ticketTypes: [
        { id: 'tt_tech_standard', name: 'Standard', price: 2999, quantity: 3000, sold: 2000, maxPerOrder: 5, perks: ['All sessions', 'Lunch'], isActive: true },
        { id: 'tt_tech_vip', name: 'VIP', price: 7999, quantity: 500, sold: 200, maxPerOrder: 2, perks: ['VIP lounge', 'Speaker meet'], isActive: true },
      ],
      organizerId: organizer.id,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'event_ai_workshop_demo',
      title: 'AI & ML Workshop: Build Real Products',
      slug: 'ai-ml-workshop-build-real-products',
      description: 'A hands-on workshop where participants build production-ready AI applications with LLMs, RAG, deployment, and practical product thinking.',
      shortDesc: 'Build real AI products in 2 days',
      category: 'WORKSHOP',
      status: 'PUBLISHED',
      venue: 'WeWork DLF Cyber City',
      address: 'DLF Cyber City',
      city: 'Gurugram',
      startDate: future(7),
      endDate: future(8),
      totalCapacity: 50,
      bookedCount: 38,
      isFeatured: false,
      tags: ['ai', 'ml', 'llm', 'python'],
      faqs: [{ question: 'Prerequisite?', answer: 'Basic Python knowledge is enough.' }],
      speakers: [{ name: 'Dr. Kiran Rao', title: 'ML Engineer', bio: 'Applied ML specialist.' }],
      ticketTypes: [{ id: 'tt_ai_participant', name: 'Participant', price: 5999, quantity: 50, sold: 38, maxPerOrder: 2, perks: ['Certificate', 'Course material'], isActive: true }],
      organizerId: organizer.id,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'event_networking_demo',
      title: 'Startup Networking Hyderabad',
      slug: 'startup-networking-hyderabad',
      description: 'Connect with founders, investors, and startup builders in Hyderabad through informal networking, pitches, and founder conversations.',
      shortDesc: "Connect with Hyderabad's startup ecosystem",
      category: 'NETWORKING',
      status: 'PUBLISHED',
      venue: 'T-Hub',
      address: 'IIIT-H Campus',
      city: 'Hyderabad',
      startDate: future(5),
      endDate: future(5, 5),
      totalCapacity: 200,
      bookedCount: 145,
      isFeatured: true,
      tags: ['startup', 'networking', 'funding'],
      faqs: [],
      speakers: [],
      ticketTypes: [
        { id: 'tt_networking_free', name: 'General', price: 0, quantity: 150, sold: 145, maxPerOrder: 2, perks: ['Networking access', 'Refreshments'], isActive: true },
        { id: 'tt_networking_investor', name: 'Investor Pass', price: 999, quantity: 50, sold: 0, maxPerOrder: 1, perks: ['Priority seating'], isActive: true },
      ],
      organizerId: organizer.id,
      createdAt: now(),
      updatedAt: now(),
    },
  );
}

seed();

const sign = (user) => jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const auth = (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Access token required' });
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET);
    req.user = state.users.find((u) => u.id === decoded.userId);
  } catch {
    req.user = null;
  }
  if (!req.user) return res.status(401).json({ success: false, message: 'Invalid token' });
  next();
};
const role = (...roles) => (req, res, next) => (
  roles.includes(req.user.role) ? next() : res.status(403).json({ success: false, message: `Access denied. Required role: ${roles.join(' or ')}` })
);

function attachEventData(event) {
  const organizer = state.users.find((u) => u.id === event.organizerId);
  const reviews = state.reviews.filter((r) => r.eventId === event.id).map((r) => ({ ...r, user: publicUser(state.users.find((u) => u.id === r.userId)) }));
  const avgRating = reviews.length ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10 : 0;
  return {
    ...event,
    bannerImage: event.bannerImage || null,
    timezone: event.timezone || 'Asia/Kolkata',
    isOnline: !!event.isOnline,
    organizer: publicUser(organizer),
    ticketTypes: event.ticketTypes.filter((tt) => tt.isActive !== false).sort((a, b) => a.price - b.price),
    reviews,
    avgRating,
    _count: { bookings: state.bookings.filter((b) => b.eventId === event.id).length, reviews: reviews.length },
  };
}

router.get('/demo/status', (req, res) => res.json({ success: true, data: { mode: 'demo', users: state.users.length, events: state.events.length } }));

router.post('/auth/register', async (req, res) => {
  const { name, email, password, role: userRole = 'ATTENDEE' } = req.body;
  if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  if (!['ATTENDEE', 'ORGANIZER'].includes(userRole)) return res.status(400).json({ success: false, message: 'Invalid role' });
  if (state.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) return res.status(409).json({ success: false, message: 'Email already registered' });
  const user = { id: id('user'), name, email, password: await bcrypt.hash(password, 12), role: userRole, createdAt: now() };
  state.users.push(user);
  res.status(201).json({ success: true, message: 'Registration successful', data: { user: publicUser(user), token: sign(user) } });
});

router.post('/auth/login', async (req, res) => {
  const user = state.users.find((u) => u.email.toLowerCase() === String(req.body.email || '').toLowerCase());
  if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  res.json({ success: true, message: 'Login successful', data: { user: publicUser(user), token: sign(user) } });
});
router.get('/auth/me', auth, (req, res) => res.json({ success: true, data: publicUser(req.user) }));
router.put('/auth/profile', auth, (req, res) => {
  Object.assign(req.user, { name: req.body.name || req.user.name, phone: req.body.phone || '', bio: req.body.bio || '', avatar: req.body.avatar || null });
  res.json({ success: true, message: 'Profile updated', data: publicUser(req.user) });
});
router.put('/auth/change-password', auth, async (req, res) => {
  if (!(await bcrypt.compare(req.body.currentPassword || '', req.user.password))) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  req.user.password = await bcrypt.hash(req.body.newPassword || '', 12);
  res.json({ success: true, message: 'Password changed successfully' });
});

router.get('/events', (req, res) => {
  const { search = '', category = '', city = '', status = 'PUBLISHED', featured, page = 1, limit = 12 } = req.query;
  let events = state.events.filter((event) => !status || event.status === status);
  const q = search.toLowerCase();
  if (q) events = events.filter((event) => [event.title, event.description, event.city, ...(event.tags || [])].join(' ').toLowerCase().includes(q));
  if (category) events = events.filter((event) => event.category === category);
  if (city) events = events.filter((event) => String(event.city || '').toLowerCase().includes(city.toLowerCase()));
  if (featured === 'true') events = events.filter((event) => event.isFeatured);
  const start = (Number(page) - 1) * Number(limit);
  res.json({ success: true, data: { events: events.slice(start, start + Number(limit)).map(attachEventData), pagination: { total: events.length, page: Number(page), limit: Number(limit), pages: Math.ceil(events.length / Number(limit)) } } });
});

router.get('/events/organizer/my-events', auth, role('ORGANIZER', 'ADMIN'), (req, res) => {
  const events = state.events.filter((event) => event.organizerId === req.user.id && (!req.query.status || event.status === req.query.status)).map(attachEventData);
  res.json({ success: true, data: { events, pagination: { total: events.length, page: 1, limit: events.length || 10 } } });
});

router.get('/events/:idOrSlug', (req, res) => {
  const event = state.events.find((item) => item.id === req.params.idOrSlug || item.slug === req.params.idOrSlug);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  res.json({ success: true, data: attachEventData(event) });
});

router.post('/events', auth, role('ORGANIZER', 'ADMIN'), (req, res) => {
  const ticketTypes = (req.body.ticketTypes || []).map((ticket) => ({
    id: id('tt'),
    name: ticket.name,
    description: ticket.description || '',
    price: Number(ticket.price || 0),
    quantity: Number(ticket.quantity || 0),
    sold: 0,
    maxPerOrder: Number(ticket.maxPerOrder || 10),
    perks: ticket.perks || [],
    isActive: true,
  }));
  const event = {
    id: id('event'),
    slug: `${String(req.body.title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now()}`,
    title: req.body.title,
    description: req.body.description,
    shortDesc: req.body.shortDesc || '',
    category: req.body.category || 'OTHER',
    status: 'DRAFT',
    bannerImage: req.body.bannerImage || null,
    venue: req.body.venue || 'Online',
    address: req.body.address || '',
    city: req.body.city || '',
    startDate: new Date(req.body.startDate).toISOString(),
    endDate: new Date(req.body.endDate).toISOString(),
    timezone: 'Asia/Kolkata',
    isOnline: !!req.body.isOnline,
    onlineLink: req.body.onlineLink || '',
    faqs: req.body.faqs || [],
    speakers: req.body.speakers || [],
    tags: req.body.tags || [],
    totalCapacity: ticketTypes.reduce((sum, ticket) => sum + ticket.quantity, 0),
    bookedCount: 0,
    isFeatured: !!req.body.isFeatured,
    organizerId: req.user.id,
    ticketTypes,
    createdAt: now(),
    updatedAt: now(),
  };
  state.events.push(event);
  res.status(201).json({ success: true, message: 'Event created successfully', data: attachEventData(event) });
});
router.patch('/events/:id/publish', auth, role('ORGANIZER', 'ADMIN'), (req, res) => {
  const event = state.events.find((item) => item.id === req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  event.status = 'PUBLISHED';
  res.json({ success: true, message: 'Event published!', data: attachEventData(event) });
});
router.put('/events/:id', auth, role('ORGANIZER', 'ADMIN'), (req, res) => {
  const event = state.events.find((item) => item.id === req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  Object.assign(event, req.body, { updatedAt: now() });
  res.json({ success: true, message: 'Event updated', data: attachEventData(event) });
});
router.delete('/events/:id', auth, role('ORGANIZER', 'ADMIN'), (req, res) => {
  const index = state.events.findIndex((event) => event.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Event not found' });
  state.events.splice(index, 1);
  res.json({ success: true, message: 'Event deleted successfully' });
});

async function issueTickets({ user, event, booking, selectedTickets, attendeeDetails }) {
  const made = [];
  for (const item of selectedTickets) {
    const ticketType = event.ticketTypes.find((ticket) => ticket.id === item.ticketTypeId);
    if (!ticketType) throw new Error('Ticket type not found');
    if (item.quantity > ticketType.quantity - ticketType.sold) throw new Error(`Only ${ticketType.quantity - ticketType.sold} ${ticketType.name} tickets available`);
    for (let i = 0; i < item.quantity; i += 1) {
      const ticketNumber = `EVS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const qrData = JSON.stringify({ ticketNumber, eventId: event.id, bookingId: booking.id });
      const attendee = item.attendees?.[i] || attendeeDetails || {};
      const ticket = {
        id: id('ticket'),
        ticketNumber,
        qrCode: await QRCode.toDataURL(qrData, { width: 300 }),
        qrData,
        status: 'ACTIVE',
        attendeeName: attendee.name || user.name,
        attendeeEmail: attendee.email || user.email,
        bookingId: booking.id,
        ticketTypeId: ticketType.id,
        ticketType,
        createdAt: now(),
      };
      ticketType.sold += 1;
      event.bookedCount += 1;
      state.tickets.push(ticket);
      made.push(ticket);
    }
  }
  booking.tickets = made;
  return made;
}

function bookingWithRelations(booking) {
  const event = state.events.find((item) => item.id === booking.eventId);
  return {
    ...booking,
    event: attachEventData(event),
    tickets: state.tickets.filter((ticket) => ticket.bookingId === booking.id),
  };
}

router.post('/bookings/initiate', auth, async (req, res) => {
  const event = state.events.find((item) => item.id === req.body.eventId);
  if (!event || event.status !== 'PUBLISHED') return res.status(400).json({ success: false, message: 'Event is not available for booking' });
  const tickets = req.body.tickets || [];
  let totalAmount = 0;
  for (const item of tickets) {
    const ticketType = event.ticketTypes.find((ticket) => ticket.id === item.ticketTypeId);
    if (!ticketType) return res.status(400).json({ success: false, message: 'Ticket type not found' });
    if (item.quantity > ticketType.quantity - ticketType.sold) return res.status(400).json({ success: false, message: `Only ${ticketType.quantity - ticketType.sold} ${ticketType.name} tickets available` });
    totalAmount += ticketType.price * item.quantity;
  }
  const booking = {
    id: id('booking'),
    bookingRef: id('EVS-DEMO'),
    status: totalAmount === 0 ? 'CONFIRMED' : 'PENDING',
    totalAmount,
    currency: 'INR',
    userId: req.user.id,
    eventId: event.id,
    attendeeDetails: req.body.attendeeDetails || {},
    pendingTickets: tickets,
    createdAt: now(),
    paidAt: totalAmount === 0 ? now() : null,
  };

  if (totalAmount === 0) {
    await issueTickets({ user: req.user, event, booking, selectedTickets: tickets, attendeeDetails: req.body.attendeeDetails });
  } else if (hasRazorpayKeys) {
    try {
      const order = await createRazorpayOrder({
        amount: totalAmount,
        receipt: booking.bookingRef.slice(0, 40),
        notes: { eventId: event.id, userId: req.user.id, eventTitle: event.title },
      });
      booking.orderId = order.id;
    } catch (err) {
      booking.paymentError = err?.error?.description || err?.message || 'Razorpay order creation failed';
    }
  }

  state.bookings.push(booking);

  if (totalAmount === 0) {
    return res.status(201).json({
      success: true,
      message: 'Free booking confirmed!',
      data: { ...bookingWithRelations(booking), amount: 0, paymentAvailable: false, keyId: '' },
    });
  }

  return res.status(201).json({
    success: true,
    message: booking.orderId ? 'Payment pending. Complete Razorpay checkout.' : `Payment pending. ${booking.paymentError || 'Add Razorpay keys to enable checkout.'}`,
    data: {
      ...bookingWithRelations(booking),
      amount: totalAmount,
      orderId: booking.orderId || null,
      keyId: booking.orderId ? process.env.RAZORPAY_KEY_ID : '',
      paymentAvailable: Boolean(booking.orderId),
      paymentError: booking.paymentError || null,
    },
  });
});
router.post('/bookings/verify', auth, (req, res) => {
  const booking = state.bookings.find((item) => item.id === req.body.bookingId);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  if (booking.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied' });
  if (booking.status === 'CONFIRMED') return res.json({ success: true, message: 'Booking already confirmed', data: bookingWithRelations(booking) });
  if (booking.status !== 'PENDING') return res.status(400).json({ success: false, message: `Booking is ${booking.status.toLowerCase()} and cannot be confirmed` });
  if (!hasRazorpayKeys) return res.status(400).json({ success: false, message: 'Razorpay keys are missing. Booking remains pending.' });
  if (!req.body.orderId || booking.orderId !== req.body.orderId) return res.status(400).json({ success: false, message: 'Payment order does not match this booking. Booking remains pending.' });

  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${req.body.orderId}|${req.body.paymentId}`)
    .digest('hex');

  if (!req.body.signature || generatedSignature !== req.body.signature) {
    return res.status(400).json({ success: false, message: 'Payment verification failed. Booking remains pending.' });
  }

  const event = state.events.find((item) => item.id === booking.eventId);
  const pendingTickets = booking.pendingTickets || [];
  if (!pendingTickets.length) return res.status(400).json({ success: false, message: 'No pending tickets found for this booking. Booking remains pending.' });
  booking.status = 'CONFIRMED';
  booking.paymentId = req.body.paymentId;
  booking.paymentSignature = req.body.signature;
  booking.paymentMethod = 'razorpay';
  booking.paidAt = now();
  issueTickets({ user: req.user, event, booking, selectedTickets: pendingTickets, attendeeDetails: booking.attendeeDetails })
    .then(() => res.json({ success: true, message: 'Payment verified. Booking confirmed!', data: bookingWithRelations(booking) }))
    .catch(() => res.status(500).json({ success: false, message: 'Payment captured but ticket generation failed' }));
});
router.get('/bookings', auth, (req, res) => {
  const bookings = state.bookings
    .filter((booking) => booking.userId === req.user.id && (!req.query.status || booking.status === req.query.status))
    .map(bookingWithRelations);
  res.json({ success: true, data: { bookings, pagination: { total: bookings.length, page: 1, limit: bookings.length || 10 } } });
});
router.get('/bookings/:id', auth, (req, res) => {
  const booking = state.bookings.find((item) => item.id === req.params.id && item.userId === req.user.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  res.json({ success: true, data: booking });
});
router.post('/bookings/:id/cancel', auth, (req, res) => {
  const booking = state.bookings.find((item) => item.id === req.params.id && item.userId === req.user.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  if (booking.status !== 'CONFIRMED') return res.status(400).json({ success: false, message: 'Only confirmed bookings can be cancelled' });
  booking.status = 'CANCELLED';
  booking.cancelledAt = now();
  state.tickets.filter((ticket) => ticket.bookingId === booking.id).forEach((ticket) => { ticket.status = 'CANCELLED'; });
  res.json({ success: true, message: 'Booking cancelled successfully' });
});

router.get('/tickets/:ticketNumber/verify', auth, (req, res) => {
  const ticket = state.tickets.find((item) => item.ticketNumber === req.params.ticketNumber);
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
  const booking = state.bookings.find((item) => item.id === ticket.bookingId);
  const event = state.events.find((item) => item.id === booking.eventId);
  res.json({ success: true, data: { ticketNumber: ticket.ticketNumber, status: ticket.status, attendeeName: ticket.attendeeName, attendeeEmail: ticket.attendeeEmail, event: event.title, eventId: event.id, ticketType: ticket.ticketType.name, checkedInAt: ticket.checkedInAt, bookingId: booking.id } });
});
router.post('/tickets/:ticketNumber/checkin', auth, role('ORGANIZER', 'ADMIN'), (req, res) => {
  const ticket = state.tickets.find((item) => item.ticketNumber === req.params.ticketNumber);
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
  if (ticket.status === 'USED') return res.status(400).json({ success: false, message: 'Ticket already used' });
  ticket.status = 'USED';
  ticket.checkedInAt = now();
  ticket.checkedInBy = req.user.id;
  res.json({ success: true, message: 'Check-in successful', data: ticket });
});

router.get('/reviews/event/:eventId', (req, res) => {
  const reviews = state.reviews.filter((review) => review.eventId === req.params.eventId).map((review) => ({ ...review, user: publicUser(state.users.find((user) => user.id === review.userId)) }));
  const avgRating = reviews.length ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10 : 0;
  res.json({ success: true, data: { reviews, avgRating, total: reviews.length, distribution: {} } });
});
router.post('/reviews', auth, (req, res) => {
  let review = state.reviews.find((item) => item.userId === req.user.id && item.eventId === req.body.eventId);
  if (review) Object.assign(review, { rating: Number(req.body.rating), title: req.body.title || '', body: req.body.body, updatedAt: now() });
  else {
    review = { id: id('review'), userId: req.user.id, eventId: req.body.eventId, rating: Number(req.body.rating), title: req.body.title || '', body: req.body.body, isVerified: state.bookings.some((booking) => booking.userId === req.user.id && booking.eventId === req.body.eventId && booking.status === 'CONFIRMED'), createdAt: now() };
    state.reviews.push(review);
  }
  res.json({ success: true, message: 'Review saved', data: { ...review, user: publicUser(req.user) } });
});

router.get('/wishlist', auth, (req, res) => {
  const wishlist = state.wishlist.filter((item) => item.userId === req.user.id).map((item) => ({ ...item, event: attachEventData(state.events.find((event) => event.id === item.eventId)) }));
  res.json({ success: true, data: wishlist });
});
router.post('/wishlist/:eventId', auth, (req, res) => {
  const index = state.wishlist.findIndex((item) => item.userId === req.user.id && item.eventId === req.params.eventId);
  if (index >= 0) {
    state.wishlist.splice(index, 1);
    return res.json({ success: true, data: { wishlisted: false, message: 'Removed from wishlist' } });
  }
  state.wishlist.push({ id: id('wish'), userId: req.user.id, eventId: req.params.eventId, createdAt: now() });
  res.json({ success: true, data: { wishlisted: true, message: 'Added to wishlist' } });
});

router.get('/dashboard/overview', auth, role('ORGANIZER', 'ADMIN'), (req, res) => {
  const events = state.events.filter((event) => event.organizerId === req.user.id);
  const eventIds = events.map((event) => event.id);
  const bookings = state.bookings.filter((booking) => eventIds.includes(booking.eventId) && booking.status === 'CONFIRMED');
  res.json({ success: true, data: {
    totalRevenue: bookings.reduce((sum, booking) => sum + booking.totalAmount, 0),
    totalTicketsSold: bookings.reduce((sum, booking) => sum + state.tickets.filter((ticket) => ticket.bookingId === booking.id).length, 0),
    totalBookings: bookings.length,
    totalCheckIns: state.tickets.filter((ticket) => ticket.status === 'USED' && bookings.some((booking) => booking.id === ticket.bookingId)).length,
    totalEvents: events.length,
    upcomingEvents: events.filter((event) => new Date(event.startDate) > new Date()).length,
    recentBookings: bookings.slice(-10).reverse().map((booking) => ({ ...booking, user: publicUser(state.users.find((user) => user.id === booking.userId)), event: { id: booking.eventId, title: state.events.find((event) => event.id === booking.eventId)?.title } })),
    eventPerformance: events.map((event) => ({ id: event.id, title: event.title, startDate: event.startDate, totalCapacity: event.totalCapacity, bookedCount: event.bookedCount, revenue: event.ticketTypes.reduce((sum, ticket) => sum + ticket.price * ticket.sold, 0), bookingCount: bookings.filter((booking) => booking.eventId === event.id).length })),
    monthlyRevenue: [],
  } });
});
router.get('/users/stats', auth, (req, res) => res.json({ success: true, data: {
  totalBookings: state.bookings.filter((booking) => booking.userId === req.user.id).length,
  totalWishlist: state.wishlist.filter((item) => item.userId === req.user.id).length,
  totalReviews: state.reviews.filter((review) => review.userId === req.user.id).length,
} }));

async function proxyAI(endpoint, body, res) {
  try {
    if (!FLASK_URL) {
      throw new Error('AI service URL is not configured');
    }

    const response = await axios.post(`${FLASK_URL}/ai/${endpoint}`, body, { timeout: 30000 });
    return res.json({ success: true, data: response.data.data || response.data });
  } catch {
    if (endpoint === 'generate-description') {
      return res.json({ success: true, data: {
        shortDescription: `${body.title} brings people together for practical learning and meaningful connections.`,
        fullDescription: `${body.title} is designed for attendees who want useful ideas, strong networking, and an event experience that feels polished from start to finish.\n\nExpect focused sessions, practical takeaways, and a welcoming environment for questions, collaboration, and discovery.`,
        highlights: ['Practical sessions', 'Networking opportunities', 'Expert-led discussions'],
        targetAudience: 'Students, professionals, founders, and enthusiasts',
        callToAction: 'Reserve your spot and be part of the experience.',
      } });
    }
    return res.json({ success: true, data: {
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      totalSessions: 4,
      schedule: [
        { time: '09:00 AM', duration: 30, title: 'Registration and Welcome', type: 'networking', speaker: null, description: 'Guest arrival and orientation.' },
        { time: '10:00 AM', duration: 90, title: `Opening Session: ${body.eventTitle || 'Event'}`, type: 'keynote', speaker: null, description: 'Main theme and context.' },
        { time: '01:00 PM', duration: 60, title: 'Lunch and Networking', type: 'lunch', speaker: null, description: 'Break for food and connections.' },
        { time: '03:00 PM', duration: 90, title: 'Hands-on Session', type: 'workshop', speaker: null, description: 'Interactive learning block.' },
      ],
      tips: ['Keep breaks visible in the agenda', 'Leave buffer time for Q&A'],
    } });
  }
}

router.post('/ai/generate-description', auth, role('ORGANIZER', 'ADMIN'), (req, res) => proxyAI('generate-description', req.body, res));
router.post('/ai/schedule', auth, role('ORGANIZER', 'ADMIN'), (req, res) => proxyAI('schedule', req.body, res));
router.post('/ai/recommendations', auth, (req, res) => proxyAI('recommendations', req.body, res));

module.exports = router;
