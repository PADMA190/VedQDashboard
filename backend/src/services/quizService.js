'use strict';

const quizRepository = require('../repositories/quizRepository');
const questionRepository = require('../repositories/questionRepository');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');
const env = require('../config/env');
const { ROLES } = require('../config/constants');
const { getCache, CacheKeys, hashFilter, Invalidate } = require('./cache');

function buildStudentVisibilityFilter(user) {
  return {
    isPublished: true,
    isRetry: { $ne: true },
    $or: [
      { assignedTo: user.id },
      { assignedClasses: user.class },
      { assignedTo: { $size: 0 }, assignedClasses: { $size: 0 } },
    ],
  };
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildListFilter({ user, subject, class: cls, search }) {
  const filter =
    user.role === ROLES.ADMIN
      ? { isRetry: { $ne: true } }
      : buildStudentVisibilityFilter(user);
  if (subject) filter.subject = subject;
  if (cls) filter.class = cls;
  if (search) filter.title = { $regex: escapeRegex(search), $options: 'i' };
  return filter;
}

async function listQuizzes({ user, subject, classNum, search, page, limit, skip, sort }) {
  const filter = buildListFilter({ user, subject, class: classNum, search });
  const cache = getCache();
  const cacheKey = CacheKeys.quizList({
    role: user.role,
    userId: user.id,
    classNum,
    hash: hashFilter({ subject, classNum, search, page, limit, sort }),
  });

  return cache.wrap(cacheKey, env.cache.quizList, async () => {
    const [items, total] = await Promise.all([
      quizRepository.list({ filter, skip, limit, sort }),
      quizRepository.count(filter),
    ]);
    return { items, page, limit, total };
  });
}

function isStudentAssigned(quiz, user) {
  const noAssignment =
    (!quiz.assignedTo || quiz.assignedTo.length === 0) &&
    (!quiz.assignedClasses || quiz.assignedClasses.length === 0);
  if (noAssignment) return true;
  const assignedToMe = (quiz.assignedTo || []).some(
    (id) => String(id) === user.id
  );
  const assignedToClass = (quiz.assignedClasses || []).includes(user.class);
  return assignedToMe || assignedToClass;
}

function stripAnswers(quiz) {
  const cleaned = { ...quiz };
  cleaned.questions = (quiz.questions || []).map((q) => {
    const { correctOption, explanation, ...rest } = q;
    return rest;
  });
  return cleaned;
}

/**
 * Loads (and caches) the full quiz once. Authorization and answer-stripping
 * happen post-cache, per request, so a single cached entry serves every role.
 */
async function loadQuizCached(quizId) {
  const cache = getCache();
  return cache.wrap(CacheKeys.quizDetail(quizId), env.cache.quizDetail, async () => {
    const quiz = await quizRepository.findById(quizId, {
      populateQuestions: true,
      lean: true,
    });
    return quiz; // null returns are not cached (see CacheService.wrap)
  });
}

async function getQuizForUser(quizId, user) {
  const quiz = await loadQuizCached(quizId);
  if (!quiz) throw AppError.notFound('Quiz not found');

  if (user.role === ROLES.ADMIN) return quiz;

  if (!quiz.isPublished) throw AppError.notFound('Quiz not found');
  if (!isStudentAssigned(quiz, user)) {
    throw AppError.forbidden('You are not assigned to this quiz');
  }
  return stripAnswers(quiz);
}

/**
 * Used by attempt submission — needs correctOption for grading. Always reads
 * fresh from DB (no caching) because grading must reflect the latest state.
 */
async function getQuizWithFullQuestions(quizId) {
  const quiz = await quizRepository.findById(quizId, {
    populateQuestions: true,
    lean: true,
  });
  if (!quiz) throw AppError.notFound('Quiz not found');
  return quiz;
}

async function createQuiz({ adminId, payload }) {
  await assertQuestionsExist(payload.questions);
  const created = await quizRepository.create({ ...payload, createdBy: adminId });
  await Invalidate.quizzes();
  await Invalidate.dashboardStats();
  return created;
}

async function updateQuiz({ quizId, payload }) {
  if (Array.isArray(payload.questions)) {
    await assertQuestionsExist(payload.questions);
  }
  const updated = await quizRepository.updateById(quizId, payload);
  if (!updated) throw AppError.notFound('Quiz not found');
  await Invalidate.quizzes();
  return updated;
}

async function deleteQuiz(quizId) {
  const deleted = await quizRepository.deleteById(quizId);
  if (!deleted) throw AppError.notFound('Quiz not found');
  await Invalidate.quizzes();
  await Invalidate.dashboardStats();
  return deleted;
}

async function assignQuiz({ quizId, studentIds = [], classes = [] }) {
  if (studentIds.length === 0 && classes.length === 0) {
    throw AppError.badRequest('Provide at least one of studentIds or classes');
  }

  if (studentIds.length > 0) {
    const found = await userRepository.findByIds(studentIds, { lean: true });
    const foundIds = new Set(found.map((u) => u._id.toString()));
    const missing = studentIds.filter((id) => !foundIds.has(String(id)));
    if (missing.length > 0) {
      throw AppError.badRequest('Some studentIds do not exist', { missing });
    }
  }

  const updated = await quizRepository.pushAssignment(quizId, { studentIds, classes });
  if (!updated) throw AppError.notFound('Quiz not found');
  await Invalidate.quizzes();
  return updated;
}

async function assertQuestionsExist(questionIds) {
  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    throw AppError.badRequest('Quiz must include at least one question');
  }
  const found = await questionRepository.findByIds(questionIds, { lean: true });
  if (found.length !== questionIds.length) {
    const foundSet = new Set(found.map((q) => q._id.toString()));
    const missing = questionIds.filter((id) => !foundSet.has(String(id)));
    throw AppError.badRequest('Some questionIds do not exist', { missing });
  }
}

module.exports = {
  listQuizzes,
  getQuizForUser,
  getQuizWithFullQuestions,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  assignQuiz,
};
