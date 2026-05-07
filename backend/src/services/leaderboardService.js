'use strict';

const mongoose = require('mongoose');
const Attempt = require('../models/Attempt');
const env = require('../config/env');
const { getCache, CacheKeys } = require('./cache');

const PERIOD_DAYS = Object.freeze({
  weekly: 7,
  monthly: 30,
  all: null,
});

const TOP_N = 10;

function periodStart(period) {
  const days = PERIOD_DAYS[period];
  if (days === null || days === undefined) return null;
  return new Date(Date.now() - days * 86_400_000);
}

function buildMatch({ subject, classNum, quizId, period }) {
  const match = { submittedAt: { $exists: true } };
  const start = periodStart(period);
  if (start) match.submittedAt.$gte = start;
  if (quizId) match.quizId = new mongoose.Types.ObjectId(quizId);
  // subject + classNum are properties of Quiz, applied via $lookup (see pipeline)
  void subject;
  void classNum;
  return match;
}

async function getLeaderboard({ subject, classNum, quizId, period = 'all' }) {
  const cache = getCache();
  const key = CacheKeys.leaderboard({ subject, classNum, quizId, period });

  return cache.wrap(key, env.cache.leaderboard, async () => {
    const match = buildMatch({ subject, classNum, quizId, period });

    const pipeline = [
      { $match: match },
      // Per-user best score on each quiz (already filtered by quizId if provided).
      {
        $group: {
          _id: { userId: '$userId', quizId: '$quizId' },
          bestScore: { $max: '$score' },
          bestAccuracy: { $max: '$accuracy' },
          lastAttemptAt: { $max: '$submittedAt' },
        },
      },
      // Join Quiz to filter by subject/class without storing them on Attempt.
      {
        $lookup: {
          from: 'quizzes',
          localField: '_id.quizId',
          foreignField: '_id',
          as: 'quiz',
        },
      },
      { $unwind: { path: '$quiz', preserveNullAndEmptyArrays: false } },
      { $match: { 'quiz.isRetry': { $ne: true } } },
    ];

    const quizFilter = {};
    if (subject) quizFilter['quiz.subject'] = subject;
    if (classNum !== undefined && classNum !== null) quizFilter['quiz.class'] = Number(classNum);
    if (Object.keys(quizFilter).length > 0) pipeline.push({ $match: quizFilter });

    pipeline.push(
      // Aggregate to a single row per user across all qualifying quizzes:
      // average their per-quiz best scores. For a single-quiz leaderboard
      // this is equivalent to that one best score.
      {
        $group: {
          _id: '$_id.userId',
          score: { $avg: '$bestScore' },
          accuracy: { $avg: '$bestAccuracy' },
          quizzesCounted: { $sum: 1 },
          lastAttemptAt: { $max: '$lastAttemptAt' },
        },
      },
      { $sort: { score: -1, accuracy: -1, lastAttemptAt: 1 } },
      { $limit: TOP_N },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$user.name',
          class: '$user.class',
          score: { $round: ['$score', 2] },
          accuracy: { $round: ['$accuracy', 4] },
          quizzesCounted: 1,
          lastAttemptAt: 1,
        },
      }
    );

    const rows = await Attempt.aggregate(pipeline);
    return rows.map((row, idx) => ({
      rank: idx + 1,
      userId: String(row.userId),
      name: row.name,
      class: row.class,
      score: row.score,
      accuracy: row.accuracy,
      quizzesCounted: row.quizzesCounted,
      lastAttemptAt: row.lastAttemptAt,
    }));
  });
}

module.exports = { getLeaderboard };
