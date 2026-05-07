'use strict';

const asyncWrap = require('../utils/asyncWrap');
const { ok } = require('../utils/response');
const adminStatsService = require('../services/adminStatsService');

const dashboardStats = asyncWrap(async (_req, res) => {
  const stats = await adminStatsService.getDashboardStats();
  return ok(res, stats);
});

module.exports = { dashboardStats };
