'use strict';

const { body, query } = require('express-validator');
const { isValidObjectId } = require('mongoose');
const {
  SUBJECT_VALUES,
  CLASSES,
  PAGINATION,
} = require('../config/constants');

const objectIdArray = (field) =>
  body(field)
    .optional()
    .isArray()
    .withMessage(`${field} must be an array`)
    .bail()
    .custom((arr) => {
      for (const id of arr) {
        if (!isValidObjectId(id)) throw new Error(`${field} contains invalid ObjectId`);
      }
      return true;
    });

const requiredObjectIdArray = (field) =>
  body(field)
    .isArray({ min: 1 })
    .withMessage(`${field} must be a non-empty array`)
    .bail()
    .custom((arr) => {
      for (const id of arr) {
        if (!isValidObjectId(id)) throw new Error(`${field} contains invalid ObjectId`);
      }
      return true;
    });

const listQuizzesQuery = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: PAGINATION.MAX_LIMIT })
    .toInt(),
  query('subject').optional().isIn(SUBJECT_VALUES),
  query('class').optional().isInt().toInt(),
  query('search').optional().isString().trim().isLength({ max: 200 }),
  query('sort').optional().isString(),
];

const createQuizValidator = [
  body('title').isString().trim().notEmpty().withMessage('title is required').isLength({ max: 200 }),
  body('description').optional().isString().trim().isLength({ max: 2000 }),
  body('subject').isIn(SUBJECT_VALUES).withMessage('Unknown subject'),
  body('class').isInt({ min: Math.min(...CLASSES), max: Math.max(...CLASSES) }).toInt(),
  body('durationMinutes').isInt({ min: 1, max: 240 }).toInt(),
  requiredObjectIdArray('questions'),
  objectIdArray('assignedTo'),
  body('assignedClasses').optional().isArray(),
  body('assignedClasses.*')
    .optional()
    .isInt({ min: Math.min(...CLASSES), max: Math.max(...CLASSES) })
    .toInt(),
  body('isPublished').optional().isBoolean().toBoolean(),
];

const updateQuizValidator = [
  body('title').optional().isString().trim().notEmpty().isLength({ max: 200 }),
  body('description').optional().isString().trim().isLength({ max: 2000 }),
  body('subject').optional().isIn(SUBJECT_VALUES),
  body('class')
    .optional()
    .isInt({ min: Math.min(...CLASSES), max: Math.max(...CLASSES) })
    .toInt(),
  body('durationMinutes').optional().isInt({ min: 1, max: 240 }).toInt(),
  body('questions').optional().isArray({ min: 1 }),
  body('questions.*')
    .optional()
    .custom((id) => {
      if (!isValidObjectId(id)) throw new Error('questions contains invalid ObjectId');
      return true;
    }),
  objectIdArray('assignedTo'),
  body('assignedClasses').optional().isArray(),
  body('assignedClasses.*')
    .optional()
    .isInt({ min: Math.min(...CLASSES), max: Math.max(...CLASSES) })
    .toInt(),
  body('isPublished').optional().isBoolean().toBoolean(),
];

const assignQuizValidator = [
  objectIdArray('studentIds'),
  body('classes').optional().isArray(),
  body('classes.*')
    .optional()
    .isInt({ min: Math.min(...CLASSES), max: Math.max(...CLASSES) })
    .toInt(),
];

module.exports = {
  listQuizzesQuery,
  createQuizValidator,
  updateQuizValidator,
  assignQuizValidator,
};
