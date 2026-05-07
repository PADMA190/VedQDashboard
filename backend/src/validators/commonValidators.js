'use strict';

const { param, query } = require('express-validator');
const { isValidObjectId } = require('mongoose');
const { PAGINATION } = require('../config/constants');

function idParam(name = 'id') {
  return param(name).custom((value) => {
    if (!isValidObjectId(value)) {
      throw new Error(`Invalid ${name}: not a valid ObjectId`);
    }
    return true;
  });
}

const paginationQuery = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: PAGINATION.MAX_LIMIT })
    .toInt(),
];

const sortQuery = (allowedFields = []) =>
  query('sort')
    .optional()
    .isString()
    .custom((value) => {
      const trimmed = value.replace(/^-/, '');
      if (allowedFields.length > 0 && !allowedFields.includes(trimmed)) {
        throw new Error(`sort must be one of: ${allowedFields.join(', ')}`);
      }
      return true;
    });

module.exports = { idParam, paginationQuery, sortQuery };
