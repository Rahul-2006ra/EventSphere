/**
 * EventSphere - PM2 Ecosystem Config
 * Manages Node.js backend process
 * Usage: pm2 start ecosystem.config.js
 */

module.exports = {
  apps: [
    {
      name: 'eventsphere-api',
      script: './backend-node/src/server.js',
      cwd: '/var/www/eventsphere',
      instances: 'max',          // Use all CPU cores
      exec_mode: 'cluster',      // Cluster mode for load balancing
      watch: false,              // Disable in production
      max_memory_restart: '1G',

      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },

      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // Logging
      log_file: '/var/log/eventsphere/combined.log',
      out_file: '/var/log/eventsphere/out.log',
      error_file: '/var/log/eventsphere/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Auto restart settings
      autorestart: true,
      restart_delay: 4000,
      max_restarts: 10,

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
