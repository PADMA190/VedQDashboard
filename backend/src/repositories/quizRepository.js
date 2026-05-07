'use strict';

const Quiz = require('../models/Quiz');

const quizRepository = {
  list({ filter = {}, skip = 0, limit = 10, sort = { createdAt: -1 } } = {}) {
    return Quiz.find(filter)
      .select('-questions')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  },

  count(filter = {}) {
    return Quiz.countDocuments(filter);
  },

  findById(id, { lean = false, populateQuestions = false } = {}) {
    let query = Quiz.findById(id);
    if (populateQuestions) query = query.populate('questions');
    return lean ? query.lean() : query;
  },

  findByIdWithQuestionIds(id) {
    return Quiz.findById(id).select('questions isPublished assignedTo assignedClasses subject class title').lean();
  },

  create(data, options = {}) {
    return Quiz.create([data], options).then((arr) => arr[0]);
  },

  updateById(id, update, options = {}) {
    return Quiz.findByIdAndUpdate(id, update, { new: true, ...options }).lean();
  },

  deleteById(id, options = {}) {
    return Quiz.findByIdAndDelete(id, options).lean();
  },

  pushAssignment(id, { studentIds = [], classes = [] }, options = {}) {
    const update = {};
    if (studentIds.length > 0) update.$addToSet = { ...(update.$addToSet || {}), assignedTo: { $each: studentIds } };
    if (classes.length > 0) {
      update.$addToSet = { ...(update.$addToSet || {}), assignedClasses: { $each: classes } };
    }
    return Quiz.findByIdAndUpdate(id, update, { new: true, ...options }).lean();
  },

  countWithQuestion(questionId) {
    return Quiz.countDocuments({ questions: questionId });
  },
};

module.exports = quizRepository;
