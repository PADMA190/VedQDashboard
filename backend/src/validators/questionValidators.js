'use strict';

const { body, query } = require('express-validator');
const {
  SUBJECT_VALUES,
  DIFFICULTY_VALUES,
  CLASSES,
  OPTION_KEYS,
  PAGINATION,
} = require('../config/constants');

function optionsArrayRule(path) {
  return body(path)
    .isArray({ min: 4, max: 4 })
    .withMessage(`${path} must contain exactly 4 options`)
    .bail()
    .custom((options) => {
      const keys = options.map((o) => o && o.key);
      const set = new Set(keys);
      if (set.size !== OPTION_KEYS.length || !OPTION_KEYS.every((k) => set.has(k))) {
        throw new Error(`${path} keys must be exactly A, B, C, D and unique`);
      }
      for (const o of options) {
        if (typeof o.text !== 'string' || o.text.trim().length === 0) {
          throw new Error(`${path}: option text is required`);
        }
      }
      return true;
    });
}

const baseQuestionFields = [
  body('subject').isIn(SUBJECT_VALUES).withMessage('Unknown subject'),
  body('class')
    .isInt({ min: Math.min(...CLASSES), max: Math.max(...CLASSES) })
    .toInt(),
  body('topic').isString().trim().notEmpty().isLength({ max: 120 }),
  body('difficulty').optional().isIn(DIFFICULTY_VALUES),
  body('questionText').isString().trim().notEmpty().isLength({ max: 2000 }),
  optionsArrayRule('options'),
  body('correctOption').isIn(OPTION_KEYS),
  body('explanation').optional().isString().isLength({ max: 4000 }),
];

const createQuestionValidator = baseQuestionFields;

const bulkQuestionsValidator = [
  body('items').isArray({ min: 1, max: 500 }).withMessage('items must be 1–500 entries'),
  body('items.*.subject').isIn(SUBJECT_VALUES),
  body('items.*.class')
    .isInt({ min: Math.min(...CLASSES), max: Math.max(...CLASSES) })
    .toInt(),
  body('items.*.topic').isString().trim().notEmpty().isLength({ max: 120 }),
  body('items.*.difficulty').optional().isIn(DIFFICULTY_VALUES),
  body('items.*.questionText').isString().trim().notEmpty().isLength({ max: 2000 }),
  optionsArrayRule('items.*.options'),
  body('items.*.correctOption').isIn(OPTION_KEYS),
  body('items.*.explanation').optional().isString().isLength({ max: 4000 }),
];

const updateQuestionValidator = [
  body('subject').optional().isIn(SUBJECT_VALUES),
  body('class')
    .optional()
    .isInt({ min: Math.min(...CLASSES), max: Math.max(...CLASSES) })
    .toInt(),
  body('topic').optional().isString().trim().notEmpty().isLength({ max: 120 }),
  body('difficulty').optional().isIn(DIFFICULTY_VALUES),
  body('questionText').optional().isString().trim().notEmpty().isLength({ max: 2000 }),
  body('options').optional().custom((options) => {
    if (!Array.isArray(options) || options.length !== 4) {
      throw new Error('options must contain exactly 4 entries');
    }
    const keys = options.map((o) => o && o.key);
    const set = new Set(keys);
    if (set.size !== OPTION_KEYS.length || !OPTION_KEYS.every((k) => set.has(k))) {
      throw new Error('options keys must be exactly A, B, C, D and unique');
    }
    for (const o of options) {
      if (typeof o.text !== 'string' || o.text.trim().length === 0) {
        throw new Error('option text is required');
      }
    }
    return true;
  }),
  body('correctOption').optional().isIn(OPTION_KEYS),
  body('explanation').optional().isString().isLength({ max: 4000 }),
];

const listQuestionsQuery = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: PAGINATION.MAX_LIMIT }).toInt(),
  query('subject').optional().isIn(SUBJECT_VALUES),
  query('class').optional().isInt().toInt(),
  query('topic').optional().isString().trim(),
  query('difficulty').optional().isIn(DIFFICULTY_VALUES),
  query('search').optional().isString().trim().isLength({ max: 200 }),
];

module.exports = {
  createQuestionValidator,
  updateQuestionValidator,
  bulkQuestionsValidator,
  listQuestionsQuery,
};
