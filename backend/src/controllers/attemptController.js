'use strict';

const asyncWrap = require('../utils/asyncWrap');
const { ok, created, paginated } = require('../utils/response');
const { parsePagination } = require('../utils/pagination');
const attemptService = require('../services/attemptService');

const submit = asyncWrap(async (req, res) => {
  const review = await attemptService.submitAttempt({ user: req.user, payload: req.body });
  return created(res, review, 'Attempt submitted');
});

const listMine = asyncWrap(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const result = await attemptService.listMyAttempts({ user: req.user, page, limit, skip });
  return paginated(res, result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
  });
});

const detail = asyncWrap(async (req, res) => {
  const attempt = await attemptService.getAttemptById({
    user: req.user,
    attemptId: req.params.id,
  });
  return ok(res, attempt);
});

module.exports = { submit, listMine, detail };
