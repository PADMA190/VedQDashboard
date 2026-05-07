'use strict';

/**
 * Wraps an async route handler so any rejection is forwarded to Express's
 * error pipeline via `next(err)`.
 * @param {(req, res, next) => Promise<unknown>} fn
 */
module.exports = function asyncWrap(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
