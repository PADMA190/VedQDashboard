'use strict';

const express = require('express');
const ctrl = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimit');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerValidator, loginValidator } = require('../validators/authValidators');

const router = express.Router();

router.post('/register', authLimiter, registerValidator, validate, ctrl.register);
router.post('/login', authLimiter, loginValidator, validate, ctrl.login);
router.post('/refresh', authLimiter, ctrl.refresh);
router.post('/logout', ctrl.logout);
router.get('/me', authenticate, ctrl.me);

module.exports = router;
