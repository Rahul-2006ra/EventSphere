/**
 * EventSphere - Event Detail Page Logic
 * Loads event, real-time updates via Socket.IO, booking flow, Razorpay
 */

let currentEvent = null;
let selectedTickets = {}; // { ticketTypeId: quantity }
let userRating = 0;
let socket = null;
let isWishlisted = false;

// ── Init ──
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('id') || params.get('slug');

  if (!eventId) {
    Toast.error('Event not found');
    setTimeout(() => window.location.href = '/', 2000);
    return;
  }

  await loadEvent(eventId);
  await loadReviews(eventId);
  initSocket(eventId);
});

// ── Load Event ──
async function loadEvent(idOrSlug) {
  try {
    const res = await API.events.get(idOrSlug);
    currentEvent = res.data;
    renderEvent(currentEvent);
    document.title = `${currentEvent.title} — EventSphere`;
  } catch (err) {
    Toast.error('Failed to load event');
    console.error(err);
  }
}

// ── Render Event ──
function renderEvent(event) {
  // Banner
  if (event.bannerImage) {
    document.getElementById('banner-img').innerHTML =
      `<img src="${event.bannerImage}" alt="${event.title}" class="w-full h-full object-cover" />`;
  }

  // Category badge
  const catBadge = document.getElementById('event-category');
  catBadge.className = `card-badge badge-${event.category}`;
  catBadge.textContent = `${CATEGORY_EMOJI[event.category] || '📌'} ${event.category}`;

  // Status
  const statusBadge = document.getElementById('event-status-badge');
  const statusColors = { PUBLISHED: 'bg-green-500/10 text-green-400', DRAFT: 'bg-yellow-500/10 text-yellow-400', CANCELLED: 'bg-red-500/10 text-red-400', COMPLETED: 'bg-slate-500/10 text-slate-400' };
  statusBadge.className = `card-badge ${statusColors[event.status] || ''}`;
  statusBadge.textContent = event.status;

  // Title
  document.getElementById('event-title').textContent = event.title;

  // Date
  document.getElementById('event-date').querySelector('span').textContent =
    `${formatDateTime(event.startDate)} → ${formatDateTime(event.endDate)}`;

  // Venue
  document.getElementById('event-venue').querySelector('span').textContent =
    event.isOnline ? '🌐 Online Event' : `${event.venue}${event.city ? ', ' + event.city : ''}`;

  // Attendees
  document.getElementById('attendee-count').textContent = `${event.bookedCount} attending`;

  // Availability bar
  if (event.totalCapacity > 0) {
    const avail = event.totalCapacity - event.bookedCount;
    const pct = Math.round((event.bookedCount / event.totalCapacity) * 100);
    const bar = document.getElementById('avail-bar');
    document.getElementById('availability-bar').classList.remove('hidden');
    document.getElementById('avail-text').textContent = `${avail} of ${event.totalCapacity} available`;
    bar.style.width = `${pct}%`;
    bar.className = `h-full rounded-full transition-all duration-500 ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-primary'}`;
  }

  // Description
  document.getElementById('event-description').innerHTML =
    (event.description || '').replace(/\n/g, '<br/>');

  // Tags
  if (event.tags?.length) {
    document.getElementById('event-tags').innerHTML = event.tags
      .map(t => `<span class="px-2.5 py-1 bg-surface-border text-slate-400 text-xs rounded-full">#${t}</span>`)
      .join('');
  }

  // Organizer
  document.getElementById('organizer-name').textContent = event.organizer.name;
  document.getElementById('organizer-avatar').textContent = event.organizer.name.charAt(0).toUpperCase();

  // Speakers tab
  if (event.speakers?.length) {
    document.getElementById('speakers-grid').innerHTML = event.speakers.map(s => `
      <div class="flex items-start gap-3 p-4 bg-surface-card border border-surface-border rounded-xl">
        <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary-light flex-shrink-0">
          ${s.name ? s.name.charAt(0) : '?'}
        </div>
        <div>
          <div class="font-medium text-sm">${s.name || 'Speaker'}</div>
          <div class="text-xs text-slate-400 mt-0.5">${s.title || ''}</div>
          <div class="text-xs text-slate-500 mt-1">${s.bio || ''}</div>
        </div>
      </div>
    `).join('');
  }

  // FAQs
  if (event.faqs?.length) {
    document.getElementById('faq-list').innerHTML = event.faqs.map((f, i) => `
      <div class="border border-surface-border rounded-xl overflow-hidden">
        <button onclick="toggleFaq(${i})" class="w-full text-left flex justify-between items-center p-4 text-sm font-medium hover:bg-surface-border/30 transition-colors">
          ${f.question}
          <svg class="w-4 h-4 text-slate-400 transition-transform faq-icon-${i}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div class="faq-answer-${i} hidden px-4 pb-4 text-sm text-slate-400">${f.answer}</div>
      </div>
    `).join('');
  }

  // Ticket types
  renderTicketTypes(event.ticketTypes);

  // Book btn state
  if (event.status !== 'PUBLISHED' || (event.totalCapacity > 0 && event.bookedCount >= event.totalCapacity)) {
    document.getElementById('book-btn').disabled = true;
    document.getElementById('book-btn').textContent = event.status !== 'PUBLISHED' ? 'Not Available' : 'Sold Out';
  }

  // Live indicator
  document.getElementById('live-indicator').classList.remove('hidden');
}

// ── Ticket Types ──
function renderTicketTypes(ticketTypes) {
  const container = document.getElementById('ticket-types-list');

  if (!ticketTypes?.length) {
    container.innerHTML = '<p class="text-slate-400 text-sm">No tickets available</p>';
    return;
  }

  container.innerHTML = ticketTypes.map(tt => {
    const available = tt.quantity - tt.sold;
    const isSoldOut = available <= 0;
    return `
      <div class="ticket-type-item border ${isSoldOut ? 'border-surface-border opacity-60' : 'border-surface-border hover:border-primary/40'} rounded-xl p-3 transition-all">
        <div class="flex justify-between items-start mb-2">
          <div>
            <div class="font-medium text-sm">${tt.name}</div>
            ${tt.description ? `<div class="text-xs text-slate-400 mt-0.5">${tt.description}</div>` : ''}
            <div class="text-xs text-slate-500 mt-1">${isSoldOut ? '❌ Sold Out' : `${available} left`}</div>
          </div>
          <div class="text-right">
            <div class="font-display font-bold text-primary-light">${formatINR(tt.price)}</div>
          </div>
        </div>
        ${!isSoldOut ? `
        <div class="flex items-center gap-2 mt-2">
          <button onclick="changeQty('${tt.id}', -1)" class="w-8 h-8 rounded-lg bg-surface-border hover:bg-primary/20 text-sm font-bold flex items-center justify-center transition-colors">−</button>
          <span id="qty-${tt.id}" class="w-8 text-center text-sm font-medium">0</span>
          <button onclick="changeQty('${tt.id}', 1)" class="w-8 h-8 rounded-lg bg-surface-border hover:bg-primary/20 text-sm font-bold flex items-center justify-center transition-colors">+</button>
        </div>
        ` : ''}
        ${tt.perks?.length ? `
        <div class="flex flex-wrap gap-1 mt-2">
          ${tt.perks.map(p => `<span class="text-xs bg-surface-border/60 text-slate-400 px-2 py-0.5 rounded-full">✓ ${p}</span>`).join('')}
        </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

// ── Quantity controls ──
function changeQty(ticketTypeId, delta) {
  const tt = currentEvent.ticketTypes.find(t => t.id === ticketTypeId);
  if (!tt) return;

  const current = selectedTickets[ticketTypeId] || 0;
  const available = tt.quantity - tt.sold;
  const newQty = Math.max(0, Math.min(current + delta, available, tt.maxPerOrder));

  selectedTickets[ticketTypeId] = newQty;
  document.getElementById(`qty-${ticketTypeId}`).textContent = newQty;

  updateTotal();
}

function updateTotal() {
  let total = 0;
  Object.entries(selectedTickets).forEach(([ttId, qty]) => {
    const tt = currentEvent.ticketTypes.find(t => t.id === ttId);
    if (tt) total += tt.price * qty;
  });

  document.getElementById('booking-total').textContent = formatINR(total);
}

// ── Initiate Booking ──
async function initiateBooking() {
  if (!Auth.requireAuth()) return;

  const tickets = Object.entries(selectedTickets)
    .filter(([_, qty]) => qty > 0)
    .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));

  if (tickets.length === 0) {
    Toast.error('Please select at least one ticket');
    return;
  }

  // Show attendee details modal
  showBookingModal(tickets);
}

function showBookingModal(tickets) {
  const total = tickets.reduce((sum, t) => {
    const tt = currentEvent.ticketTypes.find(x => x.id === t.ticketTypeId);
    return sum + (tt?.price || 0) * t.quantity;
  }, 0);

  document.getElementById('booking-modal-content').innerHTML = `
    <div class="space-y-4">
      <div class="bg-surface border border-surface-border rounded-xl p-3 space-y-2">
        ${tickets.map(t => {
          const tt = currentEvent.ticketTypes.find(x => x.id === t.ticketTypeId);
          return `<div class="flex justify-between text-sm">
            <span class="text-slate-300">${tt?.name} × ${t.quantity}</span>
            <span class="font-medium">${formatINR((tt?.price || 0) * t.quantity)}</span>
          </div>`;
        }).join('')}
        <div class="flex justify-between pt-2 border-t border-surface-border font-bold">
          <span>Total</span><span class="text-primary-light">${formatINR(total)}</span>
        </div>
      </div>

      <div>
        <label class="form-label">Your Name</label>
        <input id="attendee-name" type="text" class="form-input" value="${Auth.getUser()?.name || ''}" placeholder="Full name" />
      </div>
      <div>
        <label class="form-label">Email</label>
        <input id="attendee-email" type="email" class="form-input" value="${Auth.getUser()?.email || ''}" placeholder="your@email.com" />
      </div>
      <div>
        <label class="form-label">Phone (optional)</label>
        <input id="attendee-phone" type="tel" class="form-input" placeholder="+91 XXXXXXXXXX" />
      </div>

      <button onclick="processPayment(${JSON.stringify(tickets).replace(/"/g, '&quot;')})" class="btn-primary w-full py-3">
        ${total === 0 ? '✓ Confirm Free Booking' : `Pay ${formatINR(total)} with Razorpay`}
      </button>
    </div>
  `;

  openModal('booking-modal');
}

async function processPayment(tickets) {
  const attendeeDetails = {
    name: document.getElementById('attendee-name')?.value,
    email: document.getElementById('attendee-email')?.value,
    phone: document.getElementById('attendee-phone')?.value,
  };

  try {
    const res = await API.bookings.initiate({
      eventId: currentEvent.id,
      tickets,
      attendeeDetails,
    });

    const { bookingId, orderId, amount, keyId, paymentAvailable } = res.data;

    if (amount === 0) {
      // Free booking confirmed
      closeModal('booking-modal');
      showSuccess(res.data);
      return;
    }

    if (!paymentAvailable || !keyId || !orderId) {
      closeModal('booking-modal');
      showPending(
        res.data,
        res.message || res.data.paymentError || 'Payment is pending. Complete payment to confirm tickets.',
      );
      return;
    }

    if (typeof Razorpay === 'undefined') {
      closeModal('booking-modal');
      showPending(res.data, 'Razorpay checkout could not load. Booking is saved under Pending.');
      return;
    }

    // Open Razorpay
    const rzp = new Razorpay({
      key: keyId,
      amount: amount * 100,
      currency: 'INR',
      name: 'EventSphere',
      description: currentEvent.title,
      order_id: orderId,
      prefill: {
        name: attendeeDetails.name,
        email: attendeeDetails.email,
        contact: attendeeDetails.phone,
      },
      theme: { color: '#6366f1' },
      handler: async (response) => {
        // Verify payment
        try {
          const verifyRes = await API.bookings.verify({
            bookingId,
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          closeModal('booking-modal');
          if (verifyRes.data.status === 'CONFIRMED') {
            showSuccess(verifyRes.data);
          } else {
            showPending(verifyRes.data, 'Payment was not confirmed. Booking remains pending.');
          }
        } catch (err) {
          Toast.error('Payment verification failed. Booking remains pending.');
          closeModal('booking-modal');
          showPending({ bookingId, orderId, status: 'PENDING', totalAmount: amount }, 'Payment verification failed. Booking remains pending.');
        }
      },
      modal: { ondismiss: () => Toast.info('Payment cancelled. Booking remains pending.') },
    });

    rzp.open();
  } catch (err) {
    Toast.error(err.message || 'Booking failed');
  }
}

function showSuccess(data) {
  const modal = document.getElementById('success-modal');
  modal.querySelector('h2').textContent = 'Booking Confirmed!';
  modal.querySelector('p').textContent = 'Payment is complete and your tickets have been issued.';
  document.getElementById('booking-summary').innerHTML = `
    <div class="space-y-1 text-sm">
      <div class="flex justify-between"><span class="text-slate-400">Booking Ref</span><span class="font-mono font-medium text-xs">${data.bookingRef || data.bookingId}</span></div>
      <div class="flex justify-between"><span class="text-slate-400">Status</span><span class="text-green-400">✓ Confirmed</span></div>
      <div class="flex justify-between"><span class="text-slate-400">Tickets</span><span>${data.tickets?.length || 0} ticket(s)</span></div>
    </div>
  `;
  openModal('success-modal');
  // Reset selections
  selectedTickets = {};
  updateTotal();
  if (currentEvent) loadEvent(currentEvent.id);
}

// ── Socket.IO Real-time ──
function showPending(data, message = 'Payment is pending. Complete payment to confirm tickets.') {
  const modal = document.getElementById('success-modal');
  modal.querySelector('h2').textContent = 'Booking Pending';
  modal.querySelector('p').textContent = message;
  document.getElementById('booking-summary').innerHTML = `
    <div class="space-y-1 text-sm">
      <div class="flex justify-between"><span class="text-slate-400">Booking Ref</span><span class="font-mono font-medium text-xs">${data.bookingRef || data.bookingId || data.orderId || 'Pending'}</span></div>
      <div class="flex justify-between"><span class="text-slate-400">Status</span><span class="text-yellow-400">Pending Payment</span></div>
      <div class="flex justify-between"><span class="text-slate-400">Amount</span><span>${formatINR(data.totalAmount || data.amount || 0)}</span></div>
      <div class="text-slate-400 pt-2">Tickets and QR codes will appear only after successful payment verification.</div>
    </div>
  `;
  openModal('success-modal');
  selectedTickets = {};
  updateTotal();
  if (currentEvent) loadEvent(currentEvent.id);
}

function initSocket(eventId) {
  socket = io(CONFIG.SOCKET_URL, { transports: ['websocket', 'polling'] });

  socket.on('connect', () => {
    socket.emit('join:event', eventId);
    if (Auth.isLoggedIn()) {
      socket.emit('join:notifications', Auth.getUser().id);
    }
  });

  socket.on('event:stats', (data) => {
    if (data.eventId !== eventId) return;
    document.getElementById('attendee-count').textContent = `${data.bookedCount} attending`;
    const avail = data.available;
    const pct = data.totalCapacity > 0 ? Math.round(((data.totalCapacity - avail) / data.totalCapacity) * 100) : 0;
    const bar = document.getElementById('avail-bar');
    if (bar) bar.style.width = `${pct}%`;
    const text = document.getElementById('avail-text');
    if (text) text.textContent = `${avail} of ${data.totalCapacity} available`;
  });

  socket.on('event:checkin', (data) => {
    Toast.info(`${data.attendeeName} just checked in! 👋`);
  });

  socket.on('notification:new', (notif) => {
    Toast.success(notif.message);
  });
}

// ── Wishlist ──
async function toggleWishlist() {
  if (!Auth.requireAuth()) return;
  try {
    const res = await API.wishlist.toggle(currentEvent.id);
    isWishlisted = res.data.wishlisted;
    const btn = document.getElementById('wishlist-btn');
    btn.textContent = isWishlisted ? '♥ Wishlisted' : '♡ Save to Wishlist';
    btn.classList.toggle('text-red-400', isWishlisted);
    Toast.success(isWishlisted ? 'Added to wishlist!' : 'Removed from wishlist');
  } catch (err) {
    Toast.error('Failed to update wishlist');
  }
}

// ── Reviews ──
async function loadReviews(eventId) {
  try {
    const res = await API.reviews.list(eventId);
    const { reviews, avgRating, total } = res.data;

    // Summary
    document.getElementById('reviews-summary').innerHTML = `
      <div class="text-center px-4">
        <div class="font-display text-4xl font-bold">${avgRating.toFixed(1)}</div>
        <div class="text-amber-400 text-lg">${'★'.repeat(Math.round(avgRating))}${'☆'.repeat(5 - Math.round(avgRating))}</div>
        <div class="text-xs text-slate-400 mt-1">${total} review${total !== 1 ? 's' : ''}</div>
      </div>
    `;

    // List
    const list = document.getElementById('reviews-list');
    if (reviews.length === 0) {
      list.innerHTML = '<p class="text-slate-400 text-sm">No reviews yet. Be the first!</p>';
    } else {
      list.innerHTML = reviews.map(r => `
        <div class="p-4 bg-surface-card border border-surface-border rounded-xl">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary-light">
              ${r.user.name.charAt(0)}
            </div>
            <div>
              <div class="text-sm font-medium">${r.user.name}</div>
              <div class="text-amber-400 text-xs">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
            </div>
            <div class="ml-auto text-xs text-slate-500">${timeAgo(r.createdAt)}</div>
          </div>
          ${r.title ? `<div class="text-sm font-medium mb-1">${r.title}</div>` : ''}
          <p class="text-sm text-slate-400">${r.body}</p>
        </div>
      `).join('');
    }

    // Show review form if logged in
    if (Auth.isLoggedIn()) {
      document.getElementById('review-form').classList.remove('hidden');
    }
  } catch (err) {
    console.error('Reviews load error:', err);
  }
}

function setRating(val) {
  userRating = val;
  document.querySelectorAll('.star-btn').forEach((btn) => {
    btn.classList.toggle('text-amber-400', parseInt(btn.dataset.val) <= val);
    btn.classList.toggle('text-slate-600', parseInt(btn.dataset.val) > val);
  });
}

async function submitReview() {
  if (!Auth.requireAuth()) return;
  if (!userRating) { Toast.error('Please select a rating'); return; }

  const body = document.getElementById('review-body')?.value?.trim();
  if (!body) { Toast.error('Please write a review'); return; }

  try {
    await API.reviews.create({ eventId: currentEvent.id, rating: userRating, body });
    Toast.success('Review submitted!');
    await loadReviews(currentEvent.id);
    document.getElementById('review-body').value = '';
    userRating = 0;
    setRating(0);
  } catch (err) {
    Toast.error(err.message || 'Failed to submit review');
  }
}

// ── Tabs ──
function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
    btn.classList.toggle('border-primary', btn.dataset.tab === tabName);
    btn.classList.toggle('text-white', btn.dataset.tab === tabName);
    btn.classList.toggle('border-transparent', btn.dataset.tab !== tabName);
    btn.classList.toggle('text-slate-400', btn.dataset.tab !== tabName);
  });
  document.getElementById(`tab-${tabName}`)?.classList.remove('hidden');
}

// ── FAQ toggle ──
function toggleFaq(i) {
  const answer = document.querySelector(`.faq-answer-${i}`);
  const icon = document.querySelector(`.faq-icon-${i}`);
  if (answer) answer.classList.toggle('hidden');
  if (icon) icon.style.transform = answer?.classList.contains('hidden') ? '' : 'rotate(180deg)';
}

// ── Share ──
function shareEvent(platform) {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(currentEvent?.title || 'Check out this event!');
  const urls = {
    twitter: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
    whatsapp: `https://wa.me/?text=${title}%20${url}`,
  };
  window.open(urls[platform], '_blank');
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href);
  Toast.success('Link copied to clipboard!');
}

// ── Modal helpers ──
function openModal(id) { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
});
