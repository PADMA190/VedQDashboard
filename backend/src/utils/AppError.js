'use strict';

const { ERROR_CODES } = require('../config/constants');

class AppError extends Error {
  constructor(message, { status = 500, code = ERROR_CODES.INTERNAL, details } = {}) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    if (details !== undefined) this.details = details;
    this.isOperational = true;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, AppError);
    }
  }

  static badRequest(message, details) {
    return new AppError(message, { status: 400, code: ERROR_CODES.BAD_REQUEST, details });
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError(message, { status: 401, code: ERROR_CODES.UNAUTHORIZED });
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(message, { status: 403, code: ERROR_CODES.FORBIDDEN });
  }

  static notFound(message = 'Resource not found') {
    return new AppError(message, { status: 404, code: ERROR_CODES.NOT_FOUND });
  }

  static conflict(message, details) {
    return new AppError(message, { status: 409, code: ERROR_CODES.CONFLICT, details });
  }

  static validation(message, details) {
    return new AppError(message, { status: 422, code: ERROR_CODES.VALIDATION, details });
  }
}

module.exports = AppError;
