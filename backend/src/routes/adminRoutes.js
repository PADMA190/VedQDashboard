'use strict';

const express = require('express');
const adminQuizCtrl = require('../controllers/adminQuizController');
const adminQuestionCtrl = require('../controllers/adminQuestionController');
const adminCtrl = require('../controllers/adminController');
const adminUsersCtrl = require('../controllers/adminUsersController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validators/commonValidators');
const {
  createQuizValidator,
  updateQuizValidator,
  assignQuizValidator,
} = require('../validators/quizValidators');
const {
  createQuestionValidator,
  updateQuestionValidator,
  bulkQuestionsValidator,
  listQuestionsQuery,
} = require('../validators/questionValidators');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(authenticate, requireRole(ROLES.ADMIN));

// ---- Dashboard ----
router.get('/dashboard-stats', adminCtrl.dashboardStats);

// ---- Users ----
router.get('/users', adminUsersCtrl.list);

// ---- Quizzes ----
router.post('/quizzes', createQuizValidator, validate, adminQuizCtrl.create);
router.put('/quizzes/:id', idParam('id'), updateQuizValidator, validate, adminQuizCtrl.update);
router.delete('/quizzes/:id', idParam('id'), validate, adminQuizCtrl.remove);
router.post(
  '/quizzes/:id/assign',
  idParam('id'),
  assignQuizValidator,
  validate,
  adminQuizCtrl.assign
);

// ---- Questions ----
router.get('/questions', listQuestionsQuery, validate, adminQuestionCtrl.list);
router.get('/questions/:id', idParam('id'), validate, adminQuestionCtrl.detail);
router.post('/questions', createQuestionValidator, validate, adminQuestionCtrl.create);
router.post('/questions/bulk', bulkQuestionsValidator, validate, adminQuestionCtrl.bulkCreate);
router.put('/questions/:id', idParam('id'), updateQuestionValidator, validate, adminQuestionCtrl.update);
router.delete('/questions/:id', idParam('id'), validate, adminQuestionCtrl.remove);

module.exports = router;
