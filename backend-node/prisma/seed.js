/**
 * EventSphere - Database Seed
 * Creates demo users and sample events
 * Run: node prisma/seed.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding EventSphere database...');

  // ── Create demo users ──
  const hashedPassword = await bcrypt.hash('demo1234', 12);

  const attendee = await prisma.user.upsert({
    where: { email: 'attendee@demo.com' },
    update: {},
    create: {
      name: 'Alex Johnson',
      email: 'attendee@demo.com',
      password: hashedPassword,
      role: 'ATTENDEE',
      bio: 'Tech enthusiast and event lover',
    },
  });

  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@demo.com' },
    update: {},
    create: {
      name: 'Priya Sharma',
      email: 'organizer@demo.com',
      password: hashedPassword,
      role: 'ORGANIZER',
      bio: 'Event organizer with 5+ years experience',
    },
  });

  console.log('✓ Users created:', attendee.email, organizer.email);

  // ── Create sample events ──
  const events = [
    {
      title: 'TechConf India 2025',
      slug: 'techconf-india-2025',
      description: 'The largest technology conference in India. Join 5000+ developers, designers, and tech leaders for 3 days of cutting-edge talks, workshops, and networking. Featuring speakers from Google, Microsoft, and top Indian startups.',
      shortDesc: 'India\'s premier tech conference with 5000+ attendees',
      category: 'CONFERENCE',
      status: 'PUBLISHED',
      venue: 'Bangalore International Exhibition Centre',
      address: 'Tumkur Road, Bangalore',
      city: 'Bangalore',
      startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000),
      totalCapacity: 5000,
      bookedCount: 3200,
      isFeatured: true,
      tags: ['tech', 'ai', 'cloud', 'startup', 'innovation'],
      faqs: [
        { question: 'Is food included?', answer: 'Yes, lunch and refreshments are provided on all conference days.' },
        { question: 'Is there parking?', answer: 'Free parking is available at BIEC with 2000+ spots.' },
        { question: 'Can I get a refund?', answer: 'Refunds are available up to 7 days before the event.' },
      ],
      speakers: [
        { name: 'Sundar Reddy', title: 'CTO, TechCorp India', bio: '20+ years in software architecture' },
        { name: 'Neha Kapoor', title: 'AI Research Lead, DeepMind', bio: 'Pioneer in machine learning applications' },
        { name: 'Raj Patel', title: 'Founder, StartupX', bio: 'Built 3 successful unicorns' },
      ],
      organizerId: organizer.id,
      ticketTypes: [
        { name: 'Early Bird', price: 1999, quantity: 1000, sold: 1000, maxPerOrder: 5, perks: ['All sessions', 'Lunch', 'Conference kit'] },
        { name: 'Standard', price: 2999, quantity: 3000, sold: 2000, maxPerOrder: 5, perks: ['All sessions', 'Lunch', 'Conference kit'] },
        { name: 'VIP', price: 7999, quantity: 500, sold: 200, maxPerOrder: 2, perks: ['All sessions', 'VIP lounge', 'Speaker meet', 'Premium kit', 'Dinner'] },
        { name: 'Workshop', price: 4999, quantity: 500, sold: 0, maxPerOrder: 3, perks: ['Hands-on workshop', 'Materials', 'Certificate'] },
      ],
    },
    {
      title: 'Mumbai Design Week 2025',
      slug: 'mumbai-design-week-2025',
      description: 'Celebrating creativity and design excellence across all disciplines. From UI/UX to industrial design, architecture to fashion — join Mumbai\'s most vibrant design festival.',
      shortDesc: 'Mumbai\'s annual celebration of creativity and design',
      category: 'FESTIVAL',
      status: 'PUBLISHED',
      venue: 'NSCI Dome',
      address: 'Worli, Mumbai',
      city: 'Mumbai',
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      totalCapacity: 10000,
      bookedCount: 4500,
      isFeatured: true,
      tags: ['design', 'creative', 'art', 'ux', 'fashion'],
      faqs: [
        { question: 'Is this suitable for beginners?', answer: 'Absolutely! We have sessions for all skill levels.' },
      ],
      speakers: [
        { name: 'Aarav Mehta', title: 'Design Director, Airbnb India', bio: 'Award-winning product designer' },
      ],
      organizerId: organizer.id,
      ticketTypes: [
        { name: 'Day Pass', price: 499, quantity: 5000, sold: 2000, maxPerOrder: 10, perks: ['1-day access', 'Exhibitions'] },
        { name: 'Full Pass', price: 1499, quantity: 3000, sold: 1500, maxPerOrder: 5, perks: ['5-day access', 'All workshops', 'Networking events'] },
        { name: 'Student', price: 199, quantity: 2000, sold: 1000, maxPerOrder: 3, perks: ['Full access with valid student ID'] },
      ],
    },
    {
      title: 'AI & ML Workshop: Build Real Products',
      slug: 'ai-ml-workshop-build-real-products',
      description: 'A hands-on 2-day workshop where you\'ll build production-ready AI applications. Learn to work with LLMs, fine-tuning, RAG systems, and deployment. Limited to 50 participants for personalized attention.',
      shortDesc: 'Build real AI products in 2 days with expert guidance',
      category: 'WORKSHOP',
      status: 'PUBLISHED',
      venue: 'WeWork DLF Cyber City',
      address: 'DLF Cyber City, Phase 3, Gurugram',
      city: 'Gurugram',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      totalCapacity: 50,
      bookedCount: 38,
      isFeatured: false,
      tags: ['ai', 'ml', 'llm', 'python', 'workshop'],
      faqs: [
        { question: 'What should I bring?', answer: 'Bring your laptop with Python 3.9+ installed. We\'ll provide API credits.' },
        { question: 'What\'s the prerequisite?', answer: 'Basic Python knowledge required. No ML experience needed.' },
      ],
      speakers: [
        { name: 'Dr. Kiran Rao', title: 'ML Engineer, Google', bio: 'PhD in ML, 8+ years experience' },
      ],
      organizerId: organizer.id,
      ticketTypes: [
        { name: 'Participant', price: 5999, quantity: 50, sold: 38, maxPerOrder: 2, perks: ['2-day workshop', 'Lunch both days', 'Course material', 'Certificate', '1-month mentorship'] },
      ],
    },
    {
      title: 'Startup Networking Hyderabad',
      slug: 'startup-networking-hyderabad',
      description: 'Connect with 200+ founders, investors, and startup enthusiasts in Hyderabad\'s growing tech ecosystem. Pitch competitions, investor meets, and informal networking.',
      shortDesc: 'Connect with Hyderabad\'s startup ecosystem',
      category: 'NETWORKING',
      status: 'PUBLISHED',
      venue: 'T-Hub',
      address: 'IIIT-H Campus, Gachibowli, Hyderabad',
      city: 'Hyderabad',
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
      totalCapacity: 200,
      bookedCount: 145,
      isFeatured: false,
      tags: ['startup', 'networking', 'entrepreneur', 'investor', 'funding'],
      faqs: [],
      speakers: [],
      organizerId: organizer.id,
      ticketTypes: [
        { name: 'General', price: 0, quantity: 150, sold: 145, maxPerOrder: 2, perks: ['Networking access', 'Refreshments'] },
        { name: 'Investor Pass', price: 999, quantity: 50, sold: 0, maxPerOrder: 1, perks: ['Priority seating', 'Pitch session access', 'Dinner'] },
      ],
    },
    {
      title: 'ReactConf Pune 2025',
      slug: 'reactconf-pune-2025',
      description: 'The biggest React and frontend conference in Western India. Deep dives into React 19, Server Components, Next.js App Router, and modern web development practices.',
      shortDesc: 'Western India\'s biggest React & frontend conference',
      category: 'CONFERENCE',
      status: 'PUBLISHED',
      venue: 'Koregaon Park Convention Hall',
      address: 'Koregaon Park, Pune',
      city: 'Pune',
      startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 46 * 24 * 60 * 60 * 1000),
      totalCapacity: 800,
      bookedCount: 320,
      isFeatured: false,
      tags: ['react', 'frontend', 'javascript', 'nextjs', 'web'],
      faqs: [
        { question: 'Are talks recorded?', answer: 'Yes, all talks will be available on YouTube within 2 weeks.' },
      ],
      speakers: [
        { name: 'Tanmay Bhat', title: 'React Core Team Contributor', bio: 'Open source enthusiast' },
        { name: 'Shruti Kapoor', title: 'Staff Engineer, Slack', bio: 'Frontend performance expert' },
      ],
      organizerId: organizer.id,
      ticketTypes: [
        { name: 'Standard', price: 1499, quantity: 600, sold: 320, maxPerOrder: 5, perks: ['All talks', 'Lunch', 'Swag bag'] },
        { name: 'VIP', price: 3999, quantity: 200, sold: 0, maxPerOrder: 2, perks: ['All talks', 'VIP lounge', 'Speaker dinner', 'Premium swag'] },
      ],
    },
  ];

  for (const eventData of events) {
    const { ticketTypes, ...eventFields } = eventData;

    const event = await prisma.event.upsert({
      where: { slug: eventFields.slug },
      update: {},
      create: {
        ...eventFields,
        faqs: eventFields.faqs || [],
        speakers: eventFields.speakers || [],
        tags: eventFields.tags || [],
        ticketTypes: {
          create: ticketTypes.map((tt) => ({
            name: tt.name,
            price: tt.price,
            quantity: tt.quantity,
            sold: tt.sold || 0,
            maxPerOrder: tt.maxPerOrder || 10,
            perks: tt.perks || [],
            isActive: true,
          })),
        },
      },
    });

    console.log(`✓ Event: ${event.title}`);
  }

  // ── Sample booking for attendee ──
  const sampleEvent = await prisma.event.findFirst({
    where: { organizerId: organizer.id },
    include: { ticketTypes: true },
  });

  if (sampleEvent && sampleEvent.ticketTypes.length > 0) {
    const existingBooking = await prisma.booking.findFirst({
      where: { userId: attendee.id, eventId: sampleEvent.id },
    });

    if (!existingBooking) {
      const tt = sampleEvent.ticketTypes[0];
      const QRCode = require('qrcode');
      const ticketNumber = `EVS-DEMO-${Date.now()}`;
      const qrData = JSON.stringify({ ticketNumber, eventId: sampleEvent.id, demo: true });
      const qrCode = await QRCode.toDataURL(qrData);

      await prisma.booking.create({
        data: {
          status: 'CONFIRMED',
          totalAmount: tt.price,
          userId: attendee.id,
          eventId: sampleEvent.id,
          paymentId: 'pay_demo_001',
          paidAt: new Date(),
          tickets: {
            create: [{
              ticketNumber,
              qrCode,
              qrData,
              status: 'ACTIVE',
              attendeeName: attendee.name,
              attendeeEmail: attendee.email,
              ticketTypeId: tt.id,
            }],
          },
        },
      });

      console.log(`✓ Sample booking created for ${attendee.email}`);
    }
  }

  console.log(`
✅ Database seeded successfully!

Demo accounts:
  Attendee:  attendee@demo.com  / demo1234
  Organizer: organizer@demo.com / demo1234
  `);
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
