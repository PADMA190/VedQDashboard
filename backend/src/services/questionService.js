'use strict';

const questionRepository = require('../repositories/questionRepository');
const quizRepository = require('../repositories/quizRepository');
const AppError = require('../utils/AppError');
const { Invalidate } = require('./cache');

async function listQuestions({ filter, skip, limit, sort, page }) {
  const [items, total] = await Promise.all([
    questionRepository.list({ filter, skip, limit, sort }),
    questionRepository.count(filter),
  ]);
  return { items, page, limit, total };
}

async function getQuestion(id) {
  const question = await questionRepository.findById(id);
  if (!question) throw AppError.notFound('Question not found');
  return question;
}

async function createQuestion({ adminId, payload }) {
  const created = await questionRepository.create({ ...payload, createdBy: adminId });
  await Invalidate.dashboardStats();
  return created;
}

async function bulkCreate({ adminId, items }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw AppError.badRequest('Provide a non-empty array of questions');
  }
  const docs = items.map((q) => ({ ...q, createdBy: adminId }));
  const inserted = await questionRepository.insertMany(docs);
  await Invalidate.dashboardStats();
  return { inserted: inserted.length };
}

async function updateQuestion({ id, payload }) {
  const updated = await questionRepository.updateById(id, payload);
  if (!updated) throw AppError.notFound('Question not found');
  // Question text/options changed → quiz detail caches that include this question are stale.
  await Invalidate.quizzes();
  return updated;
}

async function deleteQuestion(id) {
  const referencingQuizzes = await quizRepository.countWithQuestion(id);
  if (referencingQuizzes > 0) {
    throw AppError.conflict(
      'Question is referenced by one or more quizzes. Remove it from those quizzes before deleting.',
      { referencingQuizzes }
    );
  }
  const deleted = await questionRepository.deleteById(id);
  if (!deleted) throw AppError.notFound('Question not found');
  await Invalidate.dashboardStats();
  return deleted;
}

module.exports = {
  listQuestions,
  getQuestion,
  createQuestion,
  bulkCreate,
  updateQuestion,
  deleteQuestion,
};
