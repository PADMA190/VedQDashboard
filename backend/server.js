'use strict';

const env = require('./src/config/env');
const logger = require('./src/config/logger');
const { connectDB, disconnectDB } = require('./src/config/db');
const { buildApp } = require('./src/app');
const { getCache } = require('./src/services/cache');

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function start() {
  await connectDB();

  // Initialize cache eagerly so Redis connection issues surface at startup,
  // not on first request.
  const cache = getCache();
  logger.info(`Cache backend: ${cache.kind}`);

  const app = buildApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`API server listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  function shutdown(signal) {
    logger.info(`${signal} received, shutting down...`);
    const forceExit = setTimeout(() => {
      logger.error('Forcing exit after shutdown timeout');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();

    server.close(async (err) => {
      if (err) logger.error('Error closing HTTP server', { err: err.message });
      try {
        await cache.close();
      } catch (cacheErr) {
        logger.error('Error closing cache', { err: cacheErr.message });
      }
      try {
        await disconnectDB();
      } catch (dbErr) {
        logger.error('Error closing DB connection', { err: dbErr.message });
      }
      clearTimeout(forceExit);
      process.exit(err ? 1 : 0);
    });
  }

  ['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', {
      reason: reason instanceof Error ? reason.message : reason,
    });
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception, exiting', { err: err.message, stack: err.stack });
    process.exit(1);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
  process.exit(1);
});
