'use strict';

const Question = require('../models/Question');

const questionRepository = {
  list({ filter = {}, skip = 0, limit = 20, sort = { createdAt: -1 } } = {}) {
    return Question.find(filter).sort(sort).skip(skip).limit(limit).lean();
  },

  count(filter = {}) {
    return Question.countDocuments(filter);
  },

  findById(id, { lean = true } = {}) {
    const query = Question.findById(id);
    return lean ? query.lean() : query;
  },

  findByIds(ids, { lean = true } = {}) {
    const query = Question.find({ _id: { $in: ids } });
    return lean ? query.lean() : query;
  },

  create(data) {
    return Question.create(data);
  },

  insertMany(docs, options = {}) {
    return Question.insertMany(docs, { ordered: true, ...options });
  },

  updateById(id, update) {
    return Question.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
  },

  deleteById(id) {
    return Question.findByIdAndDelete(id).lean();
  },

  distinctTopics({ subject, class: cls } = {}) {
    const filter = {};
    if (subject) filter.subject = subject;
    if (cls) filter.class = cls;
    return Question.distinct('topic', filter);
  },
};

module.exports = questionRepository;
