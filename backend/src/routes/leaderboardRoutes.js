'use strict';

const express = require('express');
const ctrl = require('../controllers/leaderboardController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { leaderboardQuery } = require('../validators/leaderboardValidators');

const router = express.Router();

router.use(authenticate);

router.get('/', leaderboardQuery, validate, ctrl.get);

module.exports = router;
