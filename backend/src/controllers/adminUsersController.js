'use strict';

const asyncWrap = require('../utils/asyncWrap');
const { paginated } = require('../utils/response');
const { parsePagination } = require('../utils/pagination');
const userRepository = require('../repositories/userRepository');
const { ROLE_VALUES, SUBJECT_VALUES, CLASSES } = require('../config/constants');

function buildFilter(query) {
  const filter = {};
  if (query.role && ROLE_VALUES.includes(query.role)) filter.role = query.role;
  if (query.class !== undefined) {
    const cls = Number(query.class);
    if (CLASSES.includes(cls)) filter.class = cls;
  }
  if (query.subject && SUBJECT_VALUES.includes(query.subject)) filter.subjects = query.subject;
  if (query.search) {
    const re = new RegExp(String(query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: re }, { email: re }];
  }
  return filter;
}

const list = asyncWrap(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = buildFilter(req.query);
  const [items, total] = await Promise.all([
    userRepository.list({ filter, skip, limit, sort: { name: 1 } }),
    userRepository.count(filter),
  ]);

  // Strip passwordHash defensively even though `select: false` is on the field.
  const cleaned = items.map(({ passwordHash, ...u }) => ({
    ...u,
    id: String(u._id),
  }));

  return paginated(res, cleaned, { page, limit, total });
});

module.exports = { list };
