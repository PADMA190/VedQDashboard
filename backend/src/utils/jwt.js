'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('./AppError');
const { ERROR_CODES } = require('../config/constants');

function signAccessToken(payload) {
  return jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessTtl });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshTtl });
}

function mapJwtError(err) {
  if (err && err.name === 'TokenExpiredError') {
    return new AppError('Token expired', { status: 401, code: ERROR_CODES.TOKEN_EXPIRED });
  }
  return new AppError('Invalid token', { status: 401, code: ERROR_CODES.TOKEN_INVALID });
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.jwt.accessSecret);
  } catch (err) {
    throw mapJwtError(err);
  }
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, env.jwt.refreshSecret);
  } catch (err) {
    throw mapJwtError(err);
  }
}

const TTL_UNIT_MS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
const FALLBACK_REFRESH_MS = 7 * 86_400_000;

function ttlToMs(ttl) {
  const match = String(ttl).trim().match(/^(\d+)\s*([smhd])$/i);
  if (!match) return FALLBACK_REFRESH_MS;
  const n = Number(match[1]);
  const unit = match[2].toLowerCase();
  return n * TTL_UNIT_MS[unit];
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  ttlToMs,
};
