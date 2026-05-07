'use strict';

const express = require('express');
const ctrl = require('../controllers/attemptController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const { idParam, paginationQuery } = require('../validators/commonValidators');
const { submitAttemptValidator } = require('../validators/attemptValidators');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(authenticate);

// Submit a quiz attempt — students only.
router.post(
  '/',
  requireRole(ROLES.STUDENT),
  submitAttemptValidator,
  validate,
  ctrl.submit
);

// List the current user's attempts.
router.get('/me', paginationQuery, validate, ctrl.listMine);

// Detail — owner or admin (enforced in service).
router.get('/:id', idParam('id'), validate, ctrl.detail);

module.exports = router;
