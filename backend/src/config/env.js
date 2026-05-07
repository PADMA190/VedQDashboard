'use strict';

require('dotenv').config();

const REQUIRED_KEYS = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const PLACEHOLDER = '__FILL_ME__';

const missing = REQUIRED_KEYS.filter(
  (key) => !process.env[key] || process.env[key] === PLACEHOLDER
);

if (missing.length > 0) {
  // eslint-disable-next-line no-console
  console.error(
    [
      '',
      '[FATAL] Missing required environment variables:',
      ...missing.map((k) => `  - ${k}`),
      '',
      'Copy backend/.env.example to backend/.env and replace every __FILL_ME__ value.',
      '',
    ].join('\n')
  );
  process.exit(1);
}

function num(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
}

const NODE_ENV = process.env.NODE_ENV || 'development';

const env = Object.freeze({
  NODE_ENV,
  isProd: NODE_ENV === 'production',
  isDev: NODE_ENV === 'development',
  isTest: NODE_ENV === 'test',

  PORT: num(process.env.PORT, 5000),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

  MONGO_URI: process.env.MONGO_URI,

  jwt: Object.freeze({
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL || '7d',
  }),

  cookie: Object.freeze({
    secure: bool(process.env.COOKIE_SECURE, false),
    sameSite: process.env.COOKIE_SAME_SITE || 'strict',
    domain: process.env.COOKIE_DOMAIN || undefined,
  }),

  redis: Object.freeze({
    url: process.env.REDIS_URL || null,
  }),

  cache: Object.freeze({
    quizList: num(process.env.CACHE_TTL_QUIZ_LIST, 300),
    quizDetail: num(process.env.CACHE_TTL_QUIZ_DETAIL, 600),
    analytics: num(process.env.CACHE_TTL_ANALYTICS, 300),
    leaderboard: num(process.env.CACHE_TTL_LEADERBOARD, 600),
  }),

  rateLimit: Object.freeze({
    windowMs: num(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    auth: num(process.env.RATE_LIMIT_MAX_AUTH, 10),
    general: num(process.env.RATE_LIMIT_MAX_GENERAL, 100),
  }),

  log: Object.freeze({
    level: process.env.LOG_LEVEL || 'info',
  }),

  bcryptRounds: num(process.env.BCRYPT_SALT_ROUNDS, 10),
});

module.exports = env;
