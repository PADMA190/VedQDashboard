'use strict';

const asyncWrap = require('../utils/asyncWrap');
const { ok } = require('../utils/response');
const leaderboardService = require('../services/leaderboardService');

const get = asyncWrap(async (req, res) => {
  const data = await leaderboardService.getLeaderboard({
    subject: req.query.subject,
    classNum: req.query.class !== undefined ? Number(req.query.class) : undefined,
    quizId: req.query.quizId,
    period: req.query.period || 'all',
  });
  return ok(res, data, undefined, { total: data.length });
});

module.exports = { get };
