'use strict';

const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

mongoose.set('strictQuery', true);

async function connectDB() {
  await mongoose.connect(env.MONGO_URI, {
    autoIndex: !env.isProd,
    serverSelectionTimeoutMS: 10_000,
  });
  logger.info('MongoDB connected');

  mongoose.connection.on('error', (err) => logger.error('MongoDB connection error', { err: err.message }));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected (graceful)');
}

module.exports = { connectDB, disconnectDB };
