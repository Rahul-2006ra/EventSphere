/**
 * EventSphere - Auth Module
 * Session management, login/logout, nav update
 */

var Auth = window.Auth = {
  // Get current user from localStorage
  getUser() {
    try {
      const user = localStorage.getItem('es_user');
      return user ? JSON.parse(user) : null;
    } catch { return null; }
  },

  // Get token
  getToken() {
    return localStorage.getItem('es_token');
  },

  // Check if logged in
  isLoggedIn() {
    return !!this.getToken() && !!this.getUser();
  },

  // Check role
  isOrganizer() {
    const user = this.getUser();
    return user && (user.role === 'ORGANIZER' || user.role === 'ADMIN');
  },

  // Save session after login
  saveSession(user, token) {
    localStorage.setItem('es_user', JSON.stringify(user));
    localStorage.setItem('es_token', token);
    this.updateNav();
  },

  // Clear session on logout
  logout() {
    localStorage.removeItem('es_user');
    localStorage.removeItem('es_token');
    window.location.href = '/';
  },

  // Update navbar based on auth state
  updateNav() {
    const user = this.getUser();
    const navAuth = document.getElementById('nav-auth');
    if (!navAuth) return;

    if (document.body.classList.contains('home-page')) {
      if (user) {
        navAuth.innerHTML = `
          <a href="/pages/my-bookings.html" class="text-link">My Tickets</a>
          ${this.isOrganizer() ? '<a href="/pages/dashboard.html" class="text-link">Dashboard</a>' : ''}
          <button onclick="Auth.logout()" class="btn-secondary">Sign Out</button>
        `;
      } else {
        navAuth.innerHTML = `
          <a href="/pages/login.html" class="text-link">Sign In</a>
          <a href="/pages/register.html" class="btn-primary">Get Started</a>
        `;
      }
      return;
    }

    if (user) {
      navAuth.innerHTML = `
        <div class="relative group">
          <button class="flex items-center gap-2 bg-surface-card border border-surface-border rounded-full pl-2 pr-3 py-1.5 hover:border-primary/40 transition-colors">
            <div class="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary-light">
              ${user.name.charAt(0).toUpperCase()}
            </div>
            <span class="text-sm text-slate-300">${user.name.split(' ')[0]}</span>
            <svg class="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          <div class="absolute right-0 top-full mt-2 w-48 bg-surface-card border border-surface-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div class="p-2">
              <div class="px-3 py-2 text-xs text-slate-500 border-b border-surface-border mb-1">${user.email}</div>
              <a href="/pages/my-bookings.html" class="sidebar-link text-xs">📋 My Bookings</a>
              <a href="/pages/wishlist.html" class="sidebar-link text-xs">❤️ Wishlist</a>
              ${Auth.isOrganizer() ? '<a href="/pages/dashboard.html" class="sidebar-link text-xs">📊 Dashboard</a>' : ''}
              <button onclick="Auth.logout()" class="sidebar-link text-xs w-full text-left text-red-400 hover:text-red-300">🚪 Sign Out</button>
            </div>
          </div>
        </div>
      `;
    } else {
      navAuth.innerHTML = `
        <a href="/pages/login.html" class="text-sm text-slate-300 hover:text-white transition-colors hidden md:block">Sign In</a>
        <a href="/pages/register.html" class="btn-primary text-sm">Get Started</a>
      `;
    }
  },

  // Require auth - redirect to login if not
  requireAuth(redirectBack = true) {
    if (!this.isLoggedIn()) {
      const returnUrl = redirectBack ? `?return=${encodeURIComponent(window.location.pathname)}` : '';
      window.location.href = `/pages/login.html${returnUrl}`;
      return false;
    }
    return true;
  },

  // Require organizer role
  requireOrganizer() {
    if (!this.requireAuth()) return false;
    if (!this.isOrganizer()) {
      Toast.error('Organizer account required. Please login as organizer.');
      localStorage.removeItem('es_user');
      localStorage.removeItem('es_token');
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      setTimeout(() => window.location.href = `/pages/login.html?role=organizer&return=${returnUrl}`, 900);
      return false;
    }
    return true;
  },
};

// Auto-update nav on page load
document.addEventListener('DOMContentLoaded', () => {
  Auth.updateNav();

  // Sticky navbar
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  // Mobile menu
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
});
