'use strict';

const attemptRepository = require('../repositories/attemptRepository');
const topicPerformanceRepository = require('../repositories/topicPerformanceRepository');
const questionRepository = require('../repositories/questionRepository');
const quizService = require('./quizService');
const AppError = require('../utils/AppError');
const { withTransaction } = require('../utils/withTransaction');
const { scoreAttempt } = require('../utils/scoreAttempt');
const { ROLES } = require('../config/constants');
const { Invalidate } = require('./cache');

function computeDuration(startedAt, submittedAt) {
  if (!startedAt) return 0;
  const start = new Date(startedAt).getTime();
  const end = submittedAt.getTime();
  if (!Number.isFinite(start) || start > end) return 0;
  return Math.floor((end - start) / 1000);
}

async function submitAttempt({ user, payload }) {
  const { quizId, answers = [], startedAt } = payload;

  const quiz = await quizService.getQuizWithFullQuestions(quizId);

  if (!quiz.isPublished) {
    throw AppError.forbidden('Quiz is not published');
  }

  if (!quiz.questions || quiz.questions.length === 0) {
    throw AppError.badRequest('Quiz has no questions to grade');
  }

  // Reject answers referring to questions not in this quiz.
  const allowedIds = new Set(quiz.questions.map((q) => String(q._id)));
  for (const a of answers) {
    if (!allowedIds.has(String(a.questionId))) {
      throw AppError.badRequest('Answer references a question that is not part of this quiz', {
        questionId: a.questionId,
      });
    }
  }

  const graded = scoreAttempt(quiz.questions, answers);
  const submittedAt = new Date();
  const durationSec = computeDuration(startedAt, submittedAt);

  const attemptDoc = {
    userId: user.id,
    quizId,
    answers: graded.answers,
    score: graded.score,
    totalQuestions: graded.totalQuestions,
    correctCount: graded.correctCount,
    accuracy: graded.accuracy,
    startedAt: startedAt ? new Date(startedAt) : submittedAt,
    submittedAt,
    durationSec,
  };

  const attempt = await withTransaction(async (session) => {
    const opts = session ? { session } : {};
    const created = await attemptRepository.create(attemptDoc, opts);
    await topicPerformanceRepository.applyIncrements({
      userId: user.id,
      topicAggregation: graded.topicAggregation,
      session,
    });
    return created;
  });

  // Invalidate caches that this attempt could have impacted.
  await Promise.all([
    Invalidate.analyticsForUser(user.id),
    Invalidate.leaderboards(),
    Invalidate.dashboardStats(),
  ]);

  // Build the post-submit review payload — answers enriched with the
  // question content + correct option + explanation, since the quiz is over.
  const review = await buildAttemptReview(attempt, quiz);
  return review;
}

async function buildAttemptReview(attempt, quiz) {
  const questionMap = new Map((quiz.questions || []).map((q) => [String(q._id), q]));
  const answers = attempt.answers.map((a) => {
    const q = questionMap.get(String(a.questionId)) || {};
    return {
      questionId: String(a.questionId),
      questionText: q.questionText,
      options: q.options,
      subject: q.subject,
      topic: q.topic,
      difficulty: q.difficulty,
      correctOption: q.correctOption,
      explanation: q.explanation,
      selectedOption: a.selectedOption,
      isCorrect: a.isCorrect,
      timeTakenSec: a.timeTakenSec,
      markedForReview: a.markedForReview,
    };
  });

  return {
    id: attempt._id ? attempt._id.toString() : attempt.id,
    quizId: String(attempt.quizId),
    quizTitle: quiz.title,
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    correctCount: attempt.correctCount,
    accuracy: attempt.accuracy,
    durationSec: attempt.durationSec,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    answers,
  };
}

async function listMyAttempts({ user, page, limit, skip }) {
  const [items, total] = await Promise.all([
    attemptRepository.listByUser({ userId: user.id, skip, limit }),
    attemptRepository.countByUser(user.id),
  ]);
  return { items, page, limit, total };
}

async function getAttemptById({ user, attemptId }) {
  const attempt = await attemptRepository.findById(attemptId);
  if (!attempt) throw AppError.notFound('Attempt not found');
  if (
    user.role !== ROLES.ADMIN &&
    String(attempt.userId) !== user.id
  ) {
    throw AppError.forbidden('You cannot view this attempt');
  }

  // Enrich with question content for the review screen.
  const questionIds = attempt.answers.map((a) => a.questionId);
  const questions = await questionRepository.findByIds(questionIds, { lean: true });
  const questionMap = new Map(questions.map((q) => [String(q._id), q]));

  return {
    id: attempt._id.toString(),
    quizId: String(attempt.quizId),
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    correctCount: attempt.correctCount,
    accuracy: attempt.accuracy,
    durationSec: attempt.durationSec,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    answers: attempt.answers.map((a) => {
      const q = questionMap.get(String(a.questionId)) || {};
      return {
        questionId: String(a.questionId),
        questionText: q.questionText,
        options: q.options,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        correctOption: q.correctOption,
        explanation: q.explanation,
        selectedOption: a.selectedOption,
        isCorrect: a.isCorrect,
        timeTakenSec: a.timeTakenSec,
        markedForReview: a.markedForReview,
      };
    }),
  };
}

module.exports = {
  submitAttempt,
  listMyAttempts,
  getAttemptById,
};
