'use strict';

const { query } = require('express-validator');
const { isValidObjectId } = require('mongoose');
const { SUBJECT_VALUES, CLASSES } = require('../config/constants');

const PERIODS = ['weekly', 'monthly', 'all'];

const leaderboardQuery = [
  query('subject').optional().isIn(SUBJECT_VALUES),
  query('class')
    .optional()
    .isInt({ min: Math.min(...CLASSES), max: Math.max(...CLASSES) })
    .toInt(),
  query('quizId')
    .optional()
    .custom((v) => {
      if (!isValidObjectId(v)) throw new Error('Invalid quizId');
      return true;
    }),
  query('period').optional().isIn(PERIODS).withMessage(`period must be one of ${PERIODS.join(', ')}`),
];

module.exports = { leaderboardQuery };
