'use strict';

const env = require('../config/env');
const authService = require('../services/authService');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');
const asyncWrap = require('../utils/asyncWrap');
const { ok, created } = require('../utils/response');
const { ttlToMs } = require('../utils/jwt');

const REFRESH_COOKIE = 'qd_refresh';
const REFRESH_COOKIE_PATH = '/api/auth';

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookie.secure,
    sameSite: env.cookie.sameSite,
    domain: env.cookie.domain,
    path: REFRESH_COOKIE_PATH,
    maxAge: ttlToMs(env.jwt.refreshTtl),
  };
}

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions());
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: env.cookie.secure,
    sameSite: env.cookie.sameSite,
    domain: env.cookie.domain,
    path: REFRESH_COOKIE_PATH,
  });
}

const register = asyncWrap(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.register(req.body);
  setRefreshCookie(res, refreshToken);
  return created(res, { accessToken, user }, 'Account created');
});

const login = asyncWrap(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.login(req.body);
  setRefreshCookie(res, refreshToken);
  return ok(res, { accessToken, user }, 'Logged in');
});

const refresh = asyncWrap(async (req, res) => {
  const token = req.cookies && req.cookies[REFRESH_COOKIE];
  const { accessToken, refreshToken, user } = await authService.refresh(token);
  setRefreshCookie(res, refreshToken);
  return ok(res, { accessToken, user });
});

const logout = asyncWrap(async (_req, res) => {
  clearRefreshCookie(res);
  return ok(res, null, 'Logged out');
});

const me = asyncWrap(async (req, res) => {
  const user = await userRepository.findById(req.user.id, { lean: true });
  if (!user) throw AppError.notFound('User not found');
  return ok(res, { user: authService.sanitizeUser(user) });
});

module.exports = { register, login, refresh, logout, me };
