/**
 * server.js — Application entry point
 *
 * Initializes SQLite, creates the initial admin if missing,
 * starts the HTTP server, and handles graceful shutdown.
 */
const { env, validateEnv } = require('./src/config/env');
const { initDatabase, db } = require('./src/config/database');
const AuthService = require('./src/services/auth.service');
const logger = require('./src/utils/logger');

// Step 1: Validate environment
validateEnv();

// Step 2: Initialize Database, Admin and Start Server
async function startServer() {
  try {
    // Initialize database tables and indexes
    await initDatabase();

    // Create initial admin only if the account does not exist
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && adminPassword) {
      const existingAdmin = await db.get(
        'SELECT id, role FROM users WHERE LOWER(email) = ?',
        [adminEmail.trim().toLowerCase()]
      );

      if (!existingAdmin) {
        await AuthService.createOrUpdateAdmin({
          email: adminEmail,
          password: adminPassword,
          name: 'EDUSPHERE Administrator',
          role: 'admin',
        });

        logger.info('Initial administrator account created successfully.');
      } else if (existingAdmin.role === 'admin') {
        logger.info('Administrator account already exists. Password unchanged.');
      } else {
        logger.error('Configured admin email belongs to a non-admin user. Manual review required.');
      }
    } else {
      logger.warn('ADMIN_EMAIL or ADMIN_PASSWORD missing. Admin initialization skipped.');
    }

    const app = require('./src/app');

    const server = app.listen(env.PORT, () => {
      logger.info('EduSphere — School Management Backend API v2.0');
      logger.info(`Server running on port ${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info('Database: SQLite');
      logger.info(`Health check: /api/health`);
    });

    // Graceful Shutdown
    function gracefulShutdown(signal) {
      logger.info(`${signal} received — shutting down gracefully...`);

      server.close(async () => {
        try {
          await db.close();
          logger.info('SQLite database connection closed');
        } catch (err) {
          logger.error('Error closing SQLite database:', err.message);
        }
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown — server did not close in time');
        process.exit(1);
      }, 10000);
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Unhandled Rejections & Exceptions
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', {
    reason: reason?.message || reason,
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

module.exports = startServer();