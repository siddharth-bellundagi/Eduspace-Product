/**
 * server.js — Application entry point
 *
 * Validates environment, initializes SQLite database schema,
 * starts the HTTP server, and handles graceful shutdown.
 */
const { env, validateEnv } = require('./src/config/env');
const { initDatabase, db } = require('./src/config/database');
const logger = require('./src/utils/logger');

// Step 1: Validate environment
validateEnv();

// Step 2: Initialize Database and Start Server
async function startServer() {
  try {
    // Auto-create SQLite tables and indexes if not exists
    await initDatabase();

    const app = require('./src/app');

    const server = app.listen(env.PORT, () => {
      logger.info('🚀 ═══════════════════════════════════════════');
      logger.info('🏫 EduSphere — School Management Backend API v2.0');
      logger.info(`📡 Server running on http://localhost:${env.PORT}`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
      logger.info(`💾 Database: SQLite`);
      logger.info(`🔗 Health check: http://localhost:${env.PORT}/api/health`);
      logger.info('🚀 ═══════════════════════════════════════════');
    });

    // Graceful Shutdown
    function gracefulShutdown(signal) {
      logger.info(`\n⚠️  ${signal} received — shutting down gracefully...`);
      server.close(async () => {
        logger.info('✅ HTTP server closed');
        try {
          await db.close();
          logger.info('✅ SQLite database connection closed');
        } catch (err) {
          logger.error('⚠️  Error closing SQLite database:', err.message);
        }
        logger.info('👋 Goodbye!');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('⏰ Forced shutdown — server did not close in time');
        process.exit(1);
      }, 10000);
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (err) {
    logger.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Unhandled Rejections & Exceptions
process.on('unhandledRejection', (reason) => {
  logger.error('❌ Unhandled Promise Rejection:', { reason: reason?.message || reason });
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

module.exports = startServer();
