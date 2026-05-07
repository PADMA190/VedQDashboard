'use strict';

const Attempt = require('../models/Attempt');

const attemptRepository = {
  create(data, options = {}) {
    return Attempt.create([data], options).then((arr) => arr[0]);
  },

  findById(id, { lean = true } = {}) {
    const query = Attempt.findById(id);
    return lean ? query.lean() : query;
  },

  listByUser({ userId, skip = 0, limit = 10, sort = { submittedAt: -1, createdAt: -1 } } = {}) {
    return Attempt.find({ userId })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  },

  countByUser(userId) {
    return Attempt.countDocuments({ userId });
  },

  countByUserAndQuiz(userId, quizId) {
    return Attempt.countDocuments({ userId, quizId });
  },
};

module.exports = attemptRepository;
