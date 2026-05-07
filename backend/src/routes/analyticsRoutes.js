'use strict';

const express = require('express');
const ctrl = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { userIdParam } = require('../validators/analyticsValidators');

const router = express.Router();

router.use(authenticate);

router.get('/:userId', userIdParam, validate, ctrl.overall);
router.get('/:userId/weak-topics', userIdParam, validate, ctrl.weakTopics);
router.get('/:userId/retry-quiz', userIdParam, validate, ctrl.retryQuiz);

module.exports = router;
