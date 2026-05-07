'use strict';

const asyncWrap = require('../utils/asyncWrap');
const { ok, created, paginated, noContent } = require('../utils/response');
const { parsePagination } = require('../utils/pagination');
const questionService = require('../services/questionService');

function buildFilter(query) {
  const filter = {};
  if (query.subject) filter.subject = query.subject;
  if (query.class !== undefined) filter.class = Number(query.class);
  if (query.topic) filter.topic = query.topic;
  if (query.difficulty) filter.difficulty = query.difficulty;
  if (query.search) {
    filter.questionText = { $regex: escapeRegex(query.search), $options: 'i' };
  }
  return filter;
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const list = asyncWrap(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = buildFilter(req.query);
  const result = await questionService.listQuestions({
    filter,
    skip,
    limit,
    sort: { createdAt: -1 },
    page,
  });
  return paginated(res, result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
  });
});

const detail = asyncWrap(async (req, res) => {
  const question = await questionService.getQuestion(req.params.id);
  return ok(res, question);
});

const create = asyncWrap(async (req, res) => {
  const question = await questionService.createQuestion({
    adminId: req.user.id,
    payload: req.body,
  });
  return created(res, question, 'Question created');
});

const bulkCreate = asyncWrap(async (req, res) => {
  const result = await questionService.bulkCreate({
    adminId: req.user.id,
    items: req.body.items,
  });
  return created(res, result, `${result.inserted} questions created`);
});

const update = asyncWrap(async (req, res) => {
  const question = await questionService.updateQuestion({
    id: req.params.id,
    payload: req.body,
  });
  return ok(res, question, 'Question updated');
});

const remove = asyncWrap(async (req, res) => {
  await questionService.deleteQuestion(req.params.id);
  return noContent(res);
});

module.exports = { list, detail, create, bulkCreate, update, remove };
