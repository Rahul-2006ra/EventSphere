/**
 * EventSphere - Event Controller
 * Full event management: CRUD, search, filtering
 */

const prisma = require('../utils/prisma');

/**
 * Generate URL-safe slug from title
 */
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() + '-' + Date.now();
};

/**
 * GET /api/v1/events
 * List events with search, filter, pagination
 */
const getEvents = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 12,
      search, category, city,
      startDate, endDate,
      minPrice, maxPrice,
      status = 'PUBLISHED',
      sort = 'startDate',
      order = 'asc',
      featured,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      status,
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
          { city: { contains: search } },
          { tags: { has: search.toLowerCase() } },
        ],
      }),
      ...(category && { category }),
      ...(city && { city: { contains: city } }),
      ...(startDate && { startDate: { gte: new Date(startDate) } }),
      ...(endDate && { endDate: { lte: new Date(endDate) } }),
      ...(featured === 'true' && { isFeatured: true }),
    };

    // Price filter (filter by ticket type price range)
    if (minPrice || maxPrice) {
      where.ticketTypes = {
        some: {
          price: {
            ...(minPrice && { gte: parseFloat(minPrice) }),
            ...(maxPrice && { lte: parseFloat(maxPrice) }),
          },
        },
      };
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sort]: order },
        include: {
          organizer: { select: { id: true, name: true, avatar: true } },
          ticketTypes: { where: { isActive: true }, orderBy: { price: 'asc' } },
          _count: { select: { bookings: true, reviews: true } },
        },
      }),
      prisma.event.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/events/:idOrSlug
 */
const getEvent = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;

    const event = await prisma.event.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        organizer: { select: { id: true, name: true, avatar: true, bio: true } },
        ticketTypes: { where: { isActive: true }, orderBy: { price: 'asc' } },
        reviews: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { bookings: true, reviews: true } },
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Calculate average rating
    const avgRating = event.reviews.length > 0
      ? event.reviews.reduce((sum, r) => sum + r.rating, 0) / event.reviews.length
      : 0;

    res.json({
      success: true,
      data: { ...event, avgRating: Math.round(avgRating * 10) / 10 },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/events
 * Create event (Organizer only)
 */
const createEvent = async (req, res, next) => {
  try {
    const {
      title, description, shortDesc, category,
      venue, address, city, latitude, longitude,
      startDate, endDate, timezone, isOnline, onlineLink,
      bannerImage, faqs, speakers, tags, ticketTypes,
      isFeatured,
    } = req.body;

    const slug = generateSlug(title);

    // Calculate total capacity
    const totalCapacity = ticketTypes
      ? ticketTypes.reduce((sum, tt) => sum + (parseInt(tt.quantity) || 0), 0)
      : 0;

    // Create event with ticket types in transaction
    const event = await prisma.$transaction(async (tx) => {
      const newEvent = await tx.event.create({
        data: {
          title,
          slug,
          description,
          shortDesc,
          category,
          venue,
          address,
          city,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          timezone: timezone || 'Asia/Kolkata',
          isOnline: Boolean(isOnline),
          onlineLink,
          bannerImage,
          faqs: faqs || [],
          speakers: speakers || [],
          tags: tags || [],
          totalCapacity,
          isFeatured: Boolean(isFeatured),
          organizerId: req.user.id,
          status: 'DRAFT',
        },
      });

      // Create ticket types
      if (ticketTypes && ticketTypes.length > 0) {
        await tx.ticketType.createMany({
          data: ticketTypes.map((tt) => ({
            name: tt.name,
            description: tt.description || null,
            price: parseFloat(tt.price),
            quantity: parseInt(tt.quantity),
            maxPerOrder: parseInt(tt.maxPerOrder) || 10,
            salesStart: tt.salesStart ? new Date(tt.salesStart) : null,
            salesEnd: tt.salesEnd ? new Date(tt.salesEnd) : null,
            perks: tt.perks || [],
            eventId: newEvent.id,
          })),
        });
      }

      return tx.event.findUnique({
        where: { id: newEvent.id },
        include: { ticketTypes: true },
      });
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/events/:id
 * Update event (Organizer only, own events)
 */
const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check ownership
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Event not found' });
    if (existing.organizerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this event' });
    }

    const {
      title, description, shortDesc, category, status,
      venue, address, city, latitude, longitude,
      startDate, endDate, timezone, isOnline, onlineLink,
      bannerImage, faqs, speakers, tags, isFeatured,
    } = req.body;

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(title && { title, slug: generateSlug(title) }),
        ...(description !== undefined && { description }),
        ...(shortDesc !== undefined && { shortDesc }),
        ...(category && { category }),
        ...(status && { status }),
        ...(venue && { venue }),
        ...(address !== undefined && { address }),
        ...(city && { city }),
        ...(latitude !== undefined && { latitude: parseFloat(latitude) }),
        ...(longitude !== undefined && { longitude: parseFloat(longitude) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(timezone && { timezone }),
        ...(isOnline !== undefined && { isOnline: Boolean(isOnline) }),
        ...(onlineLink !== undefined && { onlineLink }),
        ...(bannerImage !== undefined && { bannerImage }),
        ...(faqs !== undefined && { faqs }),
        ...(speakers !== undefined && { speakers }),
        ...(tags !== undefined && { tags }),
        ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
      },
      include: { ticketTypes: true },
    });

    // Notify via Socket.IO if published
    if (status === 'PUBLISHED' || status === 'CANCELLED') {
      const io = req.app.get('io');
      io.to(`event:${id}`).emit('event:updated', { eventId: id, status });
    }

    res.json({ success: true, message: 'Event updated', data: event });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/events/:id
 */
const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Event not found' });
    if (existing.organizerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await prisma.event.delete({ where: { id } });

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/events/:id/publish
 */
const publishEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.organizerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updated = await prisma.event.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });

    res.json({ success: true, message: 'Event published!', data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/events/organizer/my-events
 */
const getMyEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      organizerId: req.user.id,
      ...(status && { status }),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          ticketTypes: true,
          _count: { select: { bookings: true, tickets: false } },
        },
      }),
      prisma.event.count({ where }),
    ]);

    res.json({ success: true, data: { events, pagination: { total, page: parseInt(page), limit: parseInt(limit) } } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getEvents, getEvent, createEvent, updateEvent, deleteEvent, publishEvent, getMyEvents };
