'use strict';

const asyncWrap = require('../utils/asyncWrap');
const { ok } = require('../utils/response');
const analyticsService = require('../services/analyticsService');

const overall = asyncWrap(async (req, res) => {
  const data = await analyticsService.getOverall(req.params.userId, req.user);
  return ok(res, data);
});

const weakTopics = asyncWrap(async (req, res) => {
  const items = await analyticsService.getWeakTopics(req.params.userId, req.user);
  return ok(res, items, undefined, { total: items.length });
});

const retryQuiz = asyncWrap(async (req, res) => {
  const data = await analyticsService.generateRetryQuiz(req.params.userId, req.user);
  return ok(res, data, 'Retry quiz generated');
});

module.exports = { overall, weakTopics, retryQuiz };
