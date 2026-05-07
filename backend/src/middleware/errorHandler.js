'use strict';

const AppError = require('../utils/AppError');
const env = require('../config/env');
const logger = require('../config/logger');
const { ERROR_CODES } = require('../config/constants');

function notFoundHandler(req, _res, next) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let appErr = err;

  if (err && err.name === 'ValidationError' && err.errors) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    appErr = AppError.validation('Validation failed', details);
  } else if (err && err.name === 'CastError') {
    appErr = AppError.badRequest(`Invalid ${err.path}: ${err.value}`);
  } else if (err && err.code === 11000) {
    const fields = Object.keys(err.keyValue || {});
    appErr = AppError.conflict('Duplicate value', { fields });
  } else if (!(err instanceof AppError)) {
    appErr = new AppError(err.message || 'Internal server error', {
      status: 500,
      code: ERROR_CODES.INTERNAL,
    });
  }

  const logLevel = appErr.status >= 500 ? 'error' : 'warn';
  logger[logLevel]('Request error', {
    method: req.method,
    path: req.originalUrl,
    code: appErr.code,
    status: appErr.status,
    message: appErr.message,
    ...(env.isProd ? {} : { stack: err.stack }),
  });

  const body = {
    success: false,
    error: {
      code: appErr.code,
      message: appErr.message,
      ...(appErr.details !== undefined && { details: appErr.details }),
      ...(env.isProd ? {} : { stack: err.stack }),
    },
  };

  res.status(appErr.status || 500).json(body);
}

module.exports = { notFoundHandler, errorHandler };
