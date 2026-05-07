'use strict';

const ROLES = Object.freeze({
  ADMIN: 'admin',
  STUDENT: 'student',
});

const ROLE_VALUES = Object.freeze(Object.values(ROLES));

const SUBJECTS = Object.freeze({
  MATHS: 'Maths',
  PHYSICS: 'Physics',
  CHEMISTRY: 'Chemistry',
  ENGLISH: 'English',
  BIOLOGY: 'Biology',
});

const SUBJECT_VALUES = Object.freeze(Object.values(SUBJECTS));

const CLASSES = Object.freeze([6, 7, 8, 9, 10, 11, 12]);

const DIFFICULTIES = Object.freeze({
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
});

const DIFFICULTY_VALUES = Object.freeze(Object.values(DIFFICULTIES));

const OPTION_KEYS = Object.freeze(['A', 'B', 'C', 'D']);

const WEAK_TOPIC = Object.freeze({
  ACCURACY_THRESHOLD: 0.6,
  MIN_ATTEMPTS: 3,
});

const ERROR_CODES = Object.freeze({
  VALIDATION: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  BAD_REQUEST: 'BAD_REQUEST',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  INTERNAL: 'INTERNAL_ERROR',
});

const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
});

module.exports = {
  ROLES,
  ROLE_VALUES,
  SUBJECTS,
  SUBJECT_VALUES,
  CLASSES,
  DIFFICULTIES,
  DIFFICULTY_VALUES,
  OPTION_KEYS,
  WEAK_TOPIC,
  ERROR_CODES,
  PAGINATION,
};
