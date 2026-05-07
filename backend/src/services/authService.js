'use strict';

const bcrypt = require('bcrypt');
const env = require('../config/env');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { ROLES } = require('../config/constants');

function sanitizeUser(user) {
  return {
    id: user._id ? user._id.toString() : user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    class: user.class,
    subjects: user.subjects || [],
  };
}

function buildTokens(user) {
  const payload = {
    sub: user._id ? user._id.toString() : user.id,
    role: user.role,
    email: user.email,
    class: user.class,
  };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

async function register({ name, email, password, class: studentClass, subjects = [] }) {
  const exists = await userRepository.exists({ email });
  if (exists) throw AppError.conflict('Email already registered');

  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
  const user = await userRepository.create({
    name,
    email,
    passwordHash,
    role: ROLES.STUDENT,
    class: studentClass,
    subjects,
  });

  const tokens = buildTokens(user);
  return { ...tokens, user: sanitizeUser(user) };
}

async function login({ email, password }) {
  const user = await userRepository.findByEmail(email, { includePassword: true });
  if (!user) throw AppError.unauthorized('Invalid email or password');

  const matched = await bcrypt.compare(password, user.passwordHash);
  if (!matched) throw AppError.unauthorized('Invalid email or password');

  const tokens = buildTokens(user);
  return { ...tokens, user: sanitizeUser(user) };
}

async function refresh(refreshToken) {
  if (!refreshToken) throw AppError.unauthorized('Missing refresh token');
  const payload = verifyRefreshToken(refreshToken);
  const user = await userRepository.findById(payload.sub, { lean: true });
  if (!user) throw AppError.unauthorized('User no longer exists');

  const tokens = buildTokens(user);
  return { ...tokens, user: sanitizeUser(user) };
}

module.exports = {
  register,
  login,
  refresh,
  sanitizeUser,
};
