/**
 * EventSphere - API Client
 * Centralized fetch wrapper with auth headers
 */

var API = window.API = {
  /**
   * Core request method
   */
  async request(method, path, body = null, options = {}) {
    const token = localStorage.getItem('es_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = {
      method,
      headers,
      ...options,
    };
    if (body) config.body = JSON.stringify(body);

    const res = await fetch(`${CONFIG.API_BASE_URL}${path}`, config);
    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await res.json()
      : { success: false, message: await res.text() || `HTTP ${res.status}` };

    if (!res.ok) {
      throw new Error(data.message || `HTTP ${res.status}`);
    }
    return data;
  },

  get: (path) => API.request('GET', path),
  post: (path, body) => API.request('POST', path, body),
  put: (path, body) => API.request('PUT', path, body),
  patch: (path, body) => API.request('PATCH', path, body),
  delete: (path) => API.request('DELETE', path),

  // ── Auth ──
  auth: {
    register: (data) => API.post('/auth/register', data),
    login: (data) => API.post('/auth/login', data),
    getMe: () => API.get('/auth/me'),
    updateProfile: (data) => API.put('/auth/profile', data),
    changePassword: (data) => API.put('/auth/change-password', data),
  },

  // ── Events ──
  events: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return API.get(`/events?${qs}`);
    },
    get: (idOrSlug) => API.get(`/events/${idOrSlug}`),
    create: (data) => API.post('/events', data),
    update: (id, data) => API.put(`/events/${id}`, data),
    delete: (id) => API.delete(`/events/${id}`),
    publish: (id) => API.patch(`/events/${id}/publish`),
    myEvents: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return API.get(`/events/organizer/my-events?${qs}`);
    },
  },

  // ── Bookings ──
  bookings: {
    initiate: (data) => API.post('/bookings/initiate', data),
    verify: (data) => API.post('/bookings/verify', data),
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return API.get(`/bookings?${qs}`);
    },
    get: (id) => API.get(`/bookings/${id}`),
    cancel: (id, reason) => API.post(`/bookings/${id}/cancel`, { reason }),
  },

  // ── Tickets ──
  tickets: {
    verify: (ticketNumber) => API.get(`/tickets/${ticketNumber}/verify`),
    getQR: (id) => API.get(`/tickets/${id}/qr`),
  },

  // ── Reviews ──
  reviews: {
    create: (data) => API.post('/reviews', data),
    list: (eventId) => API.get(`/reviews/event/${eventId}`),
  },

  // ── Notifications ──
  notifications: {
    list: () => API.get('/notifications'),
    markRead: (id) => API.patch(`/notifications/${id}/read`),
    markAllRead: () => API.patch('/notifications/read-all'),
  },

  // ── Wishlist ──
  wishlist: {
    list: () => API.get('/wishlist'),
    toggle: (eventId) => API.post(`/wishlist/${eventId}`),
  },

  // ── Dashboard ──
  dashboard: {
    overview: () => API.get('/dashboard/overview'),
    event: (eventId) => API.get(`/dashboard/event/${eventId}`),
  },

  // ── AI ──
  ai: {
    generateDescription: (data) => API.post('/ai/generate-description', data),
    recommendations: (data) => API.post('/ai/recommendations', data),
    schedule: (data) => API.post('/ai/schedule', data),
  },
};

// Toast notification system
var Toast = window.Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 4000) {
    this.init();
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon text-lg">${icons[type] || icons.info}</span>
      <span class="flex-1 text-sm">${message}</span>
      <button onclick="this.parentElement.remove()" class="text-slate-500 hover:text-white ml-2 text-lg leading-none">×</button>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success: (msg) => Toast.show(msg, 'success'),
  error: (msg) => Toast.show(msg, 'error'),
  info: (msg) => Toast.show(msg, 'info'),
};
