'use strict';

const asyncWrap = require('../utils/asyncWrap');
const { ok, created, noContent } = require('../utils/response');
const quizService = require('../services/quizService');

const create = asyncWrap(async (req, res) => {
  const quiz = await quizService.createQuiz({ adminId: req.user.id, payload: req.body });
  return created(res, quiz, 'Quiz created');
});

const update = asyncWrap(async (req, res) => {
  const quiz = await quizService.updateQuiz({ quizId: req.params.id, payload: req.body });
  return ok(res, quiz, 'Quiz updated');
});

const remove = asyncWrap(async (req, res) => {
  await quizService.deleteQuiz(req.params.id);
  return noContent(res);
});

const assign = asyncWrap(async (req, res) => {
  const quiz = await quizService.assignQuiz({
    quizId: req.params.id,
    studentIds: req.body.studentIds || [],
    classes: req.body.classes || [],
  });
  return ok(res, quiz, 'Assignment updated');
});

module.exports = { create, update, remove, assign };
