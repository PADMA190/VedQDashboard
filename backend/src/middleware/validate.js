'use strict';

const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const details = result.array({ onlyFirstError: true }).map((e) => ({
    field: e.path || e.param,
    message: e.msg,
    value: e.value,
  }));
  return next(AppError.validation('Request validation failed', details));
}

module.exports = { validate };
