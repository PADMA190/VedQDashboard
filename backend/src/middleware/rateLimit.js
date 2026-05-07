'use strict';

const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const { ERROR_CODES } = require('../config/constants');

const rateLimitedBody = {
  success: false,
  error: {
    code: ERROR_CODES.RATE_LIMITED,
    message: 'Too many requests. Please try again later.',
  },
};

const authLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.auth,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitedBody,
});

const generalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.general,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitedBody,
});

module.exports = { authLimiter, generalLimiter };
