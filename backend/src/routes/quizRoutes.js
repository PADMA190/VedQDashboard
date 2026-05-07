'use strict';

const express = require('express');
const ctrl = require('../controllers/quizController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validators/commonValidators');
const { listQuizzesQuery } = require('../validators/quizValidators');

const router = express.Router();

router.use(authenticate);

router.get('/', listQuizzesQuery, validate, ctrl.list);
router.get('/:id', idParam('id'), validate, ctrl.detail);

module.exports = router;
