'use strict';

const env = require('../../config/env');
const logger = require('../../config/logger');
const MemoryCache = require('./MemoryCache');
const RedisCache = require('./RedisCache');

let instance = null;

function buildInstance() {
  if (env.redis.url) {
    // Lazy-require ioredis so memory-only deployments don't pay the load cost.
    const Redis = require('ioredis');
    const client = new Redis(env.redis.url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });
    client.on('error', (err) => logger.error('Redis error', { err: err.message }));
    client.on('connect', () => logger.info('Redis connected'));
    client.on('ready', () => logger.info('Redis ready'));
    return new RedisCache(client);
  }
  logger.warn('REDIS_URL not set — using in-memory cache fallback (single-process only)');
  return new MemoryCache();
}

function getCache() {
  if (!instance) instance = buildInstance();
  return instance;
}

const CacheKeys = Object.freeze({
  quizList: ({ role, userId, classNum, hash }) =>
    `quiz:list:${role}:${userId || 'na'}:${classNum || 'na'}:${hash}`,
  quizDetail: (id) => `quiz:detail:${id}`,
  quizListPattern: () => 'quiz:list:*',
  quizDetailPattern: () => 'quiz:detail:*',

  analyticsOverall: (userId) => `analytics:${userId}:overall`,
  analyticsWeak: (userId) => `analytics:${userId}:weak`,
  analyticsUserPattern: (userId) => `analytics:${userId}:*`,

  leaderboard: ({ subject, classNum, quizId, period }) =>
    `leaderboard:${subject || 'all'}:${classNum || 'all'}:${quizId || 'all'}:${period}`,
  leaderboardPattern: () => 'leaderboard:*',

  dashboardStats: () => 'admin:dashboard-stats',
});

function hashFilter(input) {
  // Stable, order-independent hash for filter objects used in cache keys.
  const obj = input && typeof input === 'object' ? input : {};
  const keys = Object.keys(obj).sort();
  const parts = keys.map((k) => `${k}=${typeof obj[k] === 'object' ? JSON.stringify(obj[k]) : String(obj[k] ?? '')}`);
  return parts.join('|') || 'none';
}

const Invalidate = {
  async quizzes() {
    const cache = getCache();
    return Promise.all([
      cache.delByPattern(CacheKeys.quizListPattern()),
      cache.delByPattern(CacheKeys.quizDetailPattern()),
    ]);
  },
  async quizDetail(id) {
    return getCache().del(CacheKeys.quizDetail(id));
  },
  async analyticsForUser(userId) {
    return getCache().delByPattern(CacheKeys.analyticsUserPattern(userId));
  },
  async leaderboards() {
    return getCache().delByPattern(CacheKeys.leaderboardPattern());
  },
  async dashboardStats() {
    return getCache().del(CacheKeys.dashboardStats());
  },
};

module.exports = {
  getCache,
  CacheKeys,
  hashFilter,
  Invalidate,
};
