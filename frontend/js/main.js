/**
 * EventSphere - Home page logic
 * Event listing, search, category filters, pagination, and offline fallback.
 */

let currentPage = 1;
let currentCategory = '';
let currentSearch = '';
let totalPages = 1;

const fallbackEvents = [
  {
    id: 'event_techconf_demo',
    title: 'TechConf India 2026',
    description: 'A flagship technology conference for AI, cloud, product, and startup builders.',
    category: 'CONFERENCE',
    status: 'PUBLISHED',
    city: 'Bangalore',
    venue: 'Bangalore International Exhibition Centre',
    startDate: new Date(Date.now() + 15 * 86400000).toISOString(),
    totalCapacity: 5000,
    bookedCount: 3200,
    ticketTypes: [{ price: 2999 }],
    tags: ['tech', 'ai', 'cloud'],
  },
  {
    id: 'event_ai_workshop_demo',
    title: 'AI & ML Workshop: Build Real Products',
    description: 'A hands-on workshop for building production-ready AI applications.',
    category: 'WORKSHOP',
    status: 'PUBLISHED',
    city: 'Gurugram',
    venue: 'WeWork DLF Cyber City',
    startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    totalCapacity: 50,
    bookedCount: 38,
    ticketTypes: [{ price: 5999 }],
    tags: ['ai', 'ml', 'python'],
  },
  {
    id: 'event_networking_demo',
    title: 'Startup Networking Hyderabad',
    description: 'Connect with founders, investors, and startup builders.',
    category: 'NETWORKING',
    status: 'PUBLISHED',
    city: 'Hyderabad',
    venue: 'T-Hub',
    startDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    totalCapacity: 200,
    bookedCount: 145,
    ticketTypes: [{ price: 0 }],
    tags: ['startup', 'networking'],
  },
];

async function loadEvents() {
  const sort = document.getElementById('sort-select')?.value || 'startDate';
  showSkeleton();

  try {
    const params = {
      page: currentPage,
      limit: 12,
      sort,
      order: sort === 'startDate' ? 'asc' : 'desc',
      status: 'PUBLISHED',
    };
    if (currentCategory) params.category = currentCategory;
    if (currentSearch) params.search = currentSearch;

    let payload;
    try {
      const res = await API.events.list(params);
      payload = res.data;
    } catch (apiErr) {
      console.warn('[Events] API unavailable, using demo fallback:', apiErr.message);
      const events = filterFallbackEvents();
      payload = {
        events,
        pagination: {
          total: events.length,
          page: 1,
          limit: events.length || 12,
          pages: events.length ? 1 : 0,
        },
      };
    }

    const { events, pagination } = payload;
    totalPages = pagination.pages || 1;
    hideSkeleton();

    if (!events.length) {
      showEmpty();
      updateStats(0);
      return;
    }

    renderEvents(events);
    updatePagination(pagination);
    updateStats(pagination.total);
    setEventsCount(`${pagination.total} event${pagination.total !== 1 ? 's' : ''} found`);
  } catch (err) {
    hideSkeleton();
    console.error('[Events] Load error:', err);
    const events = filterFallbackEvents();
    renderEvents(events);
    updateStats(events.length);
    setEventsCount(`${events.length} demo event${events.length !== 1 ? 's' : ''} shown`);
  }
}

function filterFallbackEvents() {
  const q = currentSearch.toLowerCase();
  return fallbackEvents.filter((event) => {
    const text = [
      event.title,
      event.description,
      event.category,
      event.city,
      event.venue,
      ...(event.tags || []),
    ].join(' ').toLowerCase();
    return (!currentCategory || event.category === currentCategory) && (!q || text.includes(q));
  });
}

function renderEvents(events) {
  const grid = document.getElementById('events-grid');
  const empty = document.getElementById('events-empty');
  if (!grid || !empty) return;

  grid.classList.remove('hidden');
  empty.classList.add('hidden');
  grid.innerHTML = events.map(eventCard).join('');
}

function eventCard(event) {
  const ticketTypes = event.ticketTypes || [];
  const lowestPrice = ticketTypes.length ? Math.min(...ticketTypes.map((ticket) => Number(ticket.price || 0))) : null;
  const priceDisplay = lowestPrice === null ? 'TBA' : formatINR(lowestPrice);
  const category = event.category || 'OTHER';
  const emoji = CATEGORY_EMOJI[category] || 'ES';
  const totalCapacity = Number(event.totalCapacity || 0);
  const bookedCount = Number(event.bookedCount || 0);
  const available = Math.max(totalCapacity - bookedCount, 0);
  const fillPercent = totalCapacity > 0 ? Math.min(Math.round((bookedCount / totalCapacity) * 100), 100) : 0;

  return `
    <a href="/pages/event-detail.html?id=${event.id}" class="event-card">
      ${event.bannerImage
        ? `<img src="${event.bannerImage}" alt="${event.title}" class="card-img" loading="lazy" />`
        : `<div class="card-img-placeholder"><span>${category}</span></div>`
      }
      <div class="card-body">
        <span class="card-badge badge-${category}">${emoji} ${category}</span>
        <h3 class="card-title">${event.title}</h3>
        <p class="card-summary">${event.description || 'Explore this event and reserve your spot.'}</p>

        <div class="card-meta">
          <span>${formatDate(event.startDate)}</span>
          <span>${event.isOnline ? 'Online' : (event.city || event.venue || 'Venue TBA')}</span>
        </div>

        ${totalCapacity > 0 ? `
          <div class="capacity-meter">
            <div class="capacity-copy">
              <span>${available} seats left</span>
              <span>${fillPercent}% filled</span>
            </div>
            <div class="capacity-track">
              <span style="width:${fillPercent}%"></span>
            </div>
          </div>
        ` : ''}

        <div class="card-footer">
          <span class="card-price">${priceDisplay}</span>
          <span class="attendee-pill">${bookedCount} attending</span>
        </div>
      </div>
    </a>
  `;
}

function searchEvents() {
  currentSearch = document.getElementById('search-input')?.value.trim() || '';
  const selectedCategory = document.getElementById('category-select')?.value || '';
  currentCategory = selectedCategory || currentCategory;
  currentPage = 1;
  syncCategoryUI();
  loadEvents();
}

function filterCategory(cat) {
  currentCategory = cat;
  currentSearch = document.getElementById('search-input')?.value.trim() || '';
  currentPage = 1;
  const select = document.getElementById('category-select');
  if (select) select.value = cat;
  syncCategoryUI();
  loadEvents();
}

function syncCategoryUI() {
  document.querySelectorAll('.filter-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.cat === currentCategory);
  });
}

function changePage(delta) {
  const newPage = currentPage + delta;
  if (newPage < 1 || newPage > totalPages) return;
  currentPage = newPage;
  loadEvents();
  document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
}

function updatePagination(pagination) {
  const container = document.getElementById('pagination');
  const info = document.getElementById('page-info');
  const prev = document.getElementById('prev-btn');
  const next = document.getElementById('next-btn');
  if (!container || !info || !prev || !next) return;

  if ((pagination.pages || 1) <= 1) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  info.textContent = `Page ${pagination.page} of ${pagination.pages}`;
  prev.disabled = pagination.page <= 1;
  next.disabled = pagination.page >= pagination.pages;
}

function showSkeleton() {
  document.getElementById('events-skeleton')?.classList.remove('hidden');
  document.getElementById('events-grid')?.classList.add('hidden');
  document.getElementById('events-empty')?.classList.add('hidden');
  document.getElementById('pagination')?.classList.add('hidden');
}

function hideSkeleton() {
  document.getElementById('events-skeleton')?.classList.add('hidden');
}

function showEmpty() {
  document.getElementById('events-empty')?.classList.remove('hidden');
  document.getElementById('events-grid')?.classList.add('hidden');
  document.getElementById('pagination')?.classList.add('hidden');
  setEventsCount('No events found');
}

function setEventsCount(text) {
  const count = document.getElementById('events-count');
  if (count) count.textContent = text;
}

function updateStats(total) {
  const stat = document.getElementById('stat-events');
  if (stat) stat.textContent = String(total || fallbackEvents.length);
}

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') searchEvents();
    });
  }

  const categorySelect = document.getElementById('category-select');
  if (categorySelect) {
    categorySelect.addEventListener('change', () => filterCategory(categorySelect.value));
  }

  loadEvents();
});
