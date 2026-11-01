/**
 * ecosystem.config.js — PM2 Process Manager Configuration
 *
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 start ecosystem.config.js --env staging
 *   pm2 reload ecosystem.config.js --env production  (zero-downtime reload)
 *
 * Commands:
 *   pm2 status          — View process status
 *   pm2 logs            — View real-time logs
 *   pm2 monit           — Monitor CPU/memory
 *   pm2 restart all     — Restart all processes
 *   pm2 stop all        — Stop all processes
 *   pm2 delete all      — Remove all processes
 */
module.exports = {
  apps: [
    {
      name: 'edusphere-backend',
      script: 'server.js',

      // ─── Single Instance (SQLite) ─────────────────────
      // SQLite only supports one concurrent writer.
      // Running multiple instances causes SQLITE_BUSY locking errors.
      // Use instances: 1 with 'fork' mode until migrated to PostgreSQL.
      instances: 1,
      exec_mode: 'fork',

      // ─── Auto-Restart Behavior ─────────────────────
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,

      // ─── Memory Management ─────────────────────────
      // Restart if memory exceeds 300MB (prevents memory leaks)
      max_memory_restart: '300M',

      // ─── Watch (disabled in production) ────────────
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],

      // ─── Logs ──────────────────────────────────────
      log_file: './logs/pm2-combined.log',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      // ─── Graceful Shutdown ─────────────────────────
      kill_timeout: 10000,        // 10s to finish ongoing requests
      listen_timeout: 8000,       // 8s to wait for app to signal ready
      shutdown_with_message: true, // Send SIGINT instead of SIGKILL

      // ─── Environment Defaults ──────────────────────
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5000,
        LOG_LEVEL: 'debug',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        LOG_LEVEL: 'info',
        REQUEST_TIMEOUT_MS: 30000,
        CACHE_MAX_AGE: 300,
      },
    },
  ],
};
