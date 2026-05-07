'use strict';

const mongoose = require('mongoose');
const Attempt = require('../models/Attempt');

const oid = (id) => new mongoose.Types.ObjectId(id);

const analyticsRepository = {
  /**
   * Top-line stats for a user, computed in a single aggregation pass.
   */
  overallStats(userId) {
    return Attempt.aggregate([
      { $match: { userId: oid(userId), submittedAt: { $exists: true } } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          uniqueQuizzes: { $addToSet: '$quizId' },
          totalScore: { $sum: '$score' },
          totalAccuracy: { $sum: '$accuracy' },
          bestScore: { $max: '$score' },
          totalQuestions: { $sum: '$totalQuestions' },
          totalCorrect: { $sum: '$correctCount' },
        },
      },
      {
        $project: {
          _id: 0,
          totalAttempts: 1,
          totalQuizzesAttempted: { $size: '$uniqueQuizzes' },
          averageScore: {
            $cond: [
              { $gt: ['$totalAttempts', 0] },
              { $divide: ['$totalScore', '$totalAttempts'] },
              0,
            ],
          },
          averageAccuracy: {
            $cond: [
              { $gt: ['$totalAttempts', 0] },
              { $divide: ['$totalAccuracy', '$totalAttempts'] },
              0,
            ],
          },
          bestScore: { $ifNull: ['$bestScore', 0] },
          totalQuestions: 1,
          totalCorrect: 1,
        },
      },
    ]);
  },

  /**
   * Per-subject breakdown. Joins to Quiz to read the subject because Attempt
   * doesn't store subject directly.
   */
  subjectBreakdown(userId) {
    return Attempt.aggregate([
      { $match: { userId: oid(userId), submittedAt: { $exists: true } } },
      {
        $lookup: {
          from: 'quizzes',
          localField: 'quizId',
          foreignField: '_id',
          as: 'quiz',
        },
      },
      { $unwind: { path: '$quiz', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: '$quiz.subject',
          attempts: { $sum: 1 },
          totalScore: { $sum: '$score' },
          totalAccuracy: { $sum: '$accuracy' },
          totalQuestions: { $sum: '$totalQuestions' },
          totalCorrect: { $sum: '$correctCount' },
        },
      },
      {
        $project: {
          _id: 0,
          subject: '$_id',
          attempts: 1,
          averageScore: { $divide: ['$totalScore', '$attempts'] },
          averageAccuracy: { $divide: ['$totalAccuracy', '$attempts'] },
          totalQuestions: 1,
          totalCorrect: 1,
        },
      },
      { $sort: { subject: 1 } },
    ]);
  },

  /**
   * Day-by-day accuracy/score trend for the last `days` days.
   */
  accuracyTrend(userId, days = 30) {
    const since = new Date(Date.now() - days * 86_400_000);
    return Attempt.aggregate([
      {
        $match: {
          userId: oid(userId),
          submittedAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
          attempts: { $sum: 1 },
          avgScore: { $avg: '$score' },
          avgAccuracy: { $avg: '$accuracy' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          attempts: 1,
          score: { $round: ['$avgScore', 2] },
          accuracy: { $round: ['$avgAccuracy', 4] },
        },
      },
    ]);
  },

  /**
   * IDs of questions the user has answered incorrectly at least once.
   * Used to bias the retry-quiz toward known weak spots.
   */
  incorrectlyAnsweredQuestionIds(userId) {
    return Attempt.aggregate([
      { $match: { userId: oid(userId) } },
      { $unwind: '$answers' },
      { $match: { 'answers.isCorrect': false } },
      { $group: { _id: '$answers.questionId' } },
      { $project: { _id: 0, questionId: '$_id' } },
    ]);
  },
};

module.exports = analyticsRepository;
