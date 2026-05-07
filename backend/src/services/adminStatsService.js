'use strict';

const env = require('../config/env');
const userRepository = require('../repositories/userRepository');
const quizRepository = require('../repositories/quizRepository');
const questionRepository = require('../repositories/questionRepository');
const Attempt = require('../models/Attempt');
const { ROLES } = require('../config/constants');
const { getCache, CacheKeys } = require('./cache');

const SEVEN_DAYS_MS = 7 * 86_400_000;
const THIRTY_DAYS_MS = 30 * 86_400_000;

async function getDashboardStats() {
  const cache = getCache();
  return cache.wrap(CacheKeys.dashboardStats(), env.cache.analytics, async () => {
    const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS);
    const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);

    const [
      totalUsers,
      totalStudents,
      totalAdmins,
      recentSignups,
      totalQuizzes,
      totalQuestions,
      totalAttempts,
      recentAttemptStats,
    ] = await Promise.all([
      userRepository.count(),
      userRepository.countByRole(ROLES.STUDENT),
      userRepository.countByRole(ROLES.ADMIN),
      userRepository.count({ createdAt: { $gte: sevenDaysAgo } }),
      quizRepository.count({ isRetry: { $ne: true } }),
      questionRepository.count(),
      Attempt.countDocuments(),
      Attempt.aggregate([
        { $match: { submittedAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            avgScore: { $avg: '$score' },
            avgAccuracy: { $avg: '$accuracy' },
          },
        },
      ]),
    ]);

    const recent = recentAttemptStats[0] || { count: 0, avgScore: 0, avgAccuracy: 0 };

    return {
      users: {
        total: totalUsers,
        students: totalStudents,
        admins: totalAdmins,
        recentSignups7d: recentSignups,
      },
      content: {
        quizzes: totalQuizzes,
        questions: totalQuestions,
      },
      activity: {
        totalAttempts,
        last30Days: {
          attempts: recent.count,
          averageScore: round2(recent.avgScore),
          averageAccuracy: round4(recent.avgAccuracy),
        },
      },
    };
  });
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
function round4(n) {
  return Math.round((Number(n) || 0) * 10000) / 10000;
}

module.exports = { getDashboardStats };
