'use strict';

const env = require('../config/env');
const AppError = require('../utils/AppError');
const analyticsRepository = require('../repositories/analyticsRepository');
const topicPerformanceRepository = require('../repositories/topicPerformanceRepository');
const questionRepository = require('../repositories/questionRepository');
const userRepository = require('../repositories/userRepository');
const quizRepository = require('../repositories/quizRepository');
const { ROLES } = require('../config/constants');
const { getCache, CacheKeys, Invalidate } = require('./cache');

const RETRY_QUIZ = Object.freeze({
  TOTAL_QUESTIONS: 10,
  DURATION_MINUTES: 10,
  TITLE: 'Weak Topics Practice',
});

function assertCanAccess(targetUserId, requester) {
  if (requester.role === ROLES.ADMIN) return;
  if (requester.id !== String(targetUserId)) {
    throw AppError.forbidden('You can only view your own analytics');
  }
}

async function getOverall(targetUserId, requester) {
  assertCanAccess(targetUserId, requester);
  const cache = getCache();
  return cache.wrap(CacheKeys.analyticsOverall(targetUserId), env.cache.analytics, async () => {
    const user = await userRepository.findById(targetUserId, { lean: true });
    if (!user) throw AppError.notFound('User not found');

    const [overallArr, subjectBreakdown, trend, weakTopics] = await Promise.all([
      analyticsRepository.overallStats(targetUserId),
      analyticsRepository.subjectBreakdown(targetUserId),
      analyticsRepository.accuracyTrend(targetUserId, 30),
      topicPerformanceRepository.listWeakByUser(targetUserId),
    ]);

    const overall = overallArr[0] || emptyOverall();

    return {
      user: {
        id: String(user._id),
        name: user.name,
        class: user.class,
      },
      summary: {
        totalAttempts: overall.totalAttempts || 0,
        totalQuizzesAttempted: overall.totalQuizzesAttempted || 0,
        averageScore: round2(overall.averageScore),
        averageAccuracy: round4(overall.averageAccuracy),
        bestScore: overall.bestScore || 0,
        totalQuestions: overall.totalQuestions || 0,
        totalCorrect: overall.totalCorrect || 0,
        weakTopicsCount: weakTopics.length,
      },
      subjectBreakdown: subjectBreakdown.map((s) => ({
        subject: s.subject,
        attempts: s.attempts,
        averageScore: round2(s.averageScore),
        averageAccuracy: round4(s.averageAccuracy),
        totalQuestions: s.totalQuestions,
        totalCorrect: s.totalCorrect,
      })),
      accuracyTrend: trend,
    };
  });
}

async function getWeakTopics(targetUserId, requester) {
  assertCanAccess(targetUserId, requester);
  const cache = getCache();
  return cache.wrap(CacheKeys.analyticsWeak(targetUserId), env.cache.analytics, async () => {
    const items = await topicPerformanceRepository.listWeakByUser(targetUserId);
    return items.map((tp) => ({
      subject: tp.subject,
      topic: tp.topic,
      accuracy: round4(tp.accuracy),
      totalAttempted: tp.totalAttempted,
      correctCount: tp.correctCount,
      lastAttemptedAt: tp.lastAttemptedAt,
    }));
  });
}

/**
 * Generate a focused practice quiz from the user's weak topics. Persists as
 * a Quiz with `isRetry: true, assignedTo: [userId]` so the standard attempt
 * flow handles submission and topic-performance updates without special-casing.
 */
async function generateRetryQuiz(targetUserId, requester) {
  assertCanAccess(targetUserId, requester);

  const user = await userRepository.findById(targetUserId, { lean: true });
  if (!user) throw AppError.notFound('User not found');

  const weakTopics = await topicPerformanceRepository.listWeakByUser(targetUserId);
  if (weakTopics.length === 0) {
    throw AppError.badRequest(
      'No weak topics yet. Attempt a few quizzes first so we can identify where to focus.'
    );
  }

  const incorrectRows = await analyticsRepository.incorrectlyAnsweredQuestionIds(targetUserId);
  const incorrectSet = new Set(incorrectRows.map((r) => String(r.questionId)));

  const perTopic = Math.max(1, Math.ceil(RETRY_QUIZ.TOTAL_QUESTIONS / weakTopics.length));
  const sampled = await sampleWeakTopicQuestions({
    weakTopics,
    perTopic,
    incorrectSet,
  });

  if (sampled.length === 0) {
    throw AppError.badRequest('No questions available for your weak topics');
  }

  const selected = sampled.slice(0, RETRY_QUIZ.TOTAL_QUESTIONS);

  const subjectsTouched = Array.from(new Set(selected.map((q) => q.subject)));
  const primarySubject = subjectsTouched[0];
  const cls = user.class || (selected[0] && selected[0].class) || 9;

  const quiz = await quizRepository.create({
    title: `${RETRY_QUIZ.TITLE} — ${new Date().toISOString().slice(0, 10)}`,
    description: `Targeted practice across ${weakTopics.length} weak topic${
      weakTopics.length === 1 ? '' : 's'
    }: ${weakTopics
      .slice(0, 4)
      .map((wt) => wt.topic)
      .join(', ')}${weakTopics.length > 4 ? '…' : ''}`,
    subject: primarySubject,
    class: cls,
    durationMinutes: RETRY_QUIZ.DURATION_MINUTES,
    questions: selected.map((q) => q._id),
    createdBy: targetUserId,
    assignedTo: [targetUserId],
    assignedClasses: [],
    isPublished: true,
    isRetry: true,
  });

  await Invalidate.analyticsForUser(targetUserId);

  // Strip answers — student is about to attempt this.
  const stripped = selected.map((q) => {
    const { correctOption, explanation, ...rest } = q;
    return rest;
  });

  return {
    id: String(quiz._id),
    title: quiz.title,
    description: quiz.description,
    subject: quiz.subject,
    class: quiz.class,
    durationMinutes: quiz.durationMinutes,
    isRetry: true,
    questions: stripped,
    weakTopics: weakTopics.map((wt) => ({ subject: wt.subject, topic: wt.topic })),
  };
}

async function sampleWeakTopicQuestions({ weakTopics, perTopic, incorrectSet }) {
  const result = [];
  const taken = new Set();

  for (const wt of weakTopics) {
    const candidates = await questionRepository.list({
      filter: { subject: wt.subject, topic: wt.topic },
      limit: 50,
    });
    if (candidates.length === 0) continue;

    const preferred = candidates.filter((q) => incorrectSet.has(String(q._id)));
    const others = candidates.filter((q) => !incorrectSet.has(String(q._id)));
    shuffle(preferred);
    shuffle(others);

    let picked = 0;
    for (const q of [...preferred, ...others]) {
      if (picked >= perTopic) break;
      const id = String(q._id);
      if (taken.has(id)) continue;
      taken.add(id);
      result.push(q);
      picked += 1;
    }
  }
  return result;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function emptyOverall() {
  return {
    totalAttempts: 0,
    totalQuizzesAttempted: 0,
    averageScore: 0,
    averageAccuracy: 0,
    bestScore: 0,
    totalQuestions: 0,
    totalCorrect: 0,
  };
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
function round4(n) {
  return Math.round((Number(n) || 0) * 10000) / 10000;
}

module.exports = {
  getOverall,
  getWeakTopics,
  generateRetryQuiz,
};
