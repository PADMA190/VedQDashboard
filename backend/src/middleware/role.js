'use strict';

const AppError = require('../utils/AppError');

function requireRole(...allowedRoles) {
  return function roleGuard(req, _res, next) {
    if (!req.user) return next(AppError.unauthorized());
    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden('Insufficient permissions'));
    }
    return next();
  };
}

module.exports = { requireRole };
