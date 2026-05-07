'use strict';

const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/jwt');

function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw AppError.unauthorized('Missing access token');
    }
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
      class: payload.class,
    };
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { authenticate };
