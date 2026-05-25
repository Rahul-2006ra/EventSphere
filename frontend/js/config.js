/**
 * EventSphere - Frontend Configuration
 * Production values are generated into js/env.js during Vercel builds.
 */

const publicEnv = window.EVENTSPHERE_ENV || {};
const isLocal = window.location.hostname === 'localhost'
  || window.location.hostname === '127.0.0.1'
  || window.location.protocol === 'file:';
const trimTrailingSlash = (value) => String(value || '').replace(/\/$/, '');
const withApiPrefix = (value) => {
  const baseUrl = trimTrailingSlash(value);
  if (!baseUrl) return '';
  return baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
};

const configuredApiUrl = publicEnv.API_BASE_URL || (isLocal ? 'http://localhost:5000/api/v1' : '');
const apiOrigin = withApiPrefix(configuredApiUrl);
const socketOrigin = trimTrailingSlash(
  publicEnv.SOCKET_URL
  || apiOrigin.replace(/\/api\/v1$/, '')
  || (isLocal ? 'http://localhost:5000' : window.location.origin),
);

window.CONFIG = {
  API_BASE_URL: apiOrigin || '/api/v1',
  SOCKET_URL: socketOrigin,
  RAZORPAY_KEY: publicEnv.RAZORPAY_KEY || '',
};

// Category emoji mapping
window.CATEGORY_EMOJI = {
  CONFERENCE: '🎤', CONCERT: '🎵', WORKSHOP: '🛠', SEMINAR: '📚',
  MEETUP: '🤝', FESTIVAL: '🎉', SPORTS: '⚽', NETWORKING: '🌐', OTHER: '📌',
};

// Format currency
var formatINR = window.formatINR = (amount) => {
  if (amount === 0) return 'FREE';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

// Format date
var formatDate = window.formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
};

// Format date time
var formatDateTime = window.formatDateTime = (dateStr) => {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

// Relative time
var timeAgo = window.timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};
