'use strict';

const { body } = require('express-validator');
const { isValidObjectId } = require('mongoose');
const { OPTION_KEYS } = require('../config/constants');

const submitAttemptValidator = [
  body('quizId')
    .custom((id) => {
      if (!isValidObjectId(id)) throw new Error('Invalid quizId');
      return true;
    }),
  body('answers').isArray({ min: 0 }).withMessage('answers must be an array'),
  body('answers.*.questionId').custom((id) => {
    if (!isValidObjectId(id)) throw new Error('Invalid questionId in answers');
    return true;
  }),
  body('answers.*.selectedOption')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null) return true;
      if (!OPTION_KEYS.includes(value)) {
        throw new Error('selectedOption must be A, B, C, D, or null');
      }
      return true;
    }),
  body('answers.*.timeTakenSec').optional().isInt({ min: 0, max: 86_400 }).toInt(),
  body('answers.*.markedForReview').optional().isBoolean().toBoolean(),
  body('startedAt').optional().isISO8601().withMessage('startedAt must be ISO8601'),
];

module.exports = { submitAttemptValidator };
