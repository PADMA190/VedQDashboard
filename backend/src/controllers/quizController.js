'use strict';

const asyncWrap = require('../utils/asyncWrap');
const { ok, paginated } = require('../utils/response');
const { parsePagination } = require('../utils/pagination');
const quizService = require('../services/quizService');

function parseSort(input, defaultSort = { createdAt: -1 }) {
  if (!input) return defaultSort;
  const trimmed = String(input).trim();
  const desc = trimmed.startsWith('-');
  const field = desc ? trimmed.slice(1) : trimmed;
  return { [field]: desc ? -1 : 1 };
}

const list = asyncWrap(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = parseSort(req.query.sort);

  const result = await quizService.listQuizzes({
    user: req.user,
    subject: req.query.subject,
    classNum: req.query.class !== undefined ? Number(req.query.class) : undefined,
    search: req.query.search,
    page,
    limit,
    skip,
    sort,
  });
  return paginated(res, result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
  });
});

const detail = asyncWrap(async (req, res) => {
  const quiz = await quizService.getQuizForUser(req.params.id, req.user);
  return ok(res, quiz);
});

module.exports = { list, detail };
