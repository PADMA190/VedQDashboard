'use strict';

const { body } = require('express-validator');
const { SUBJECT_VALUES, CLASSES } = require('../config/constants');

const passwordRule = body('password')
  .isString()
  .withMessage('Password is required')
  .isLength({ min: 8, max: 128 })
  .withMessage('Password must be 8–128 characters')
  .matches(/[A-Z]/)
  .withMessage('Password must contain an uppercase letter')
  .matches(/[a-z]/)
  .withMessage('Password must contain a lowercase letter')
  .matches(/\d/)
  .withMessage('Password must contain a digit');

const registerValidator = [
  body('name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 120 })
    .withMessage('Name too long'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  passwordRule,
  body('class')
    .isInt({ min: Math.min(...CLASSES), max: Math.max(...CLASSES) })
    .withMessage(`Class must be between ${Math.min(...CLASSES)} and ${Math.max(...CLASSES)}`)
    .toInt(),
  body('subjects').optional().isArray().withMessage('subjects must be an array'),
  body('subjects.*').optional().isIn(SUBJECT_VALUES).withMessage('Unknown subject'),
];

const loginValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

module.exports = { registerValidator, loginValidator };
