'use strict';

const User = require('../models/User');

const userRepository = {
  findByEmail(email, { includePassword = false, lean = false } = {}) {
    let query = User.findOne({ email });
    if (includePassword) query = query.select('+passwordHash');
    return lean ? query.lean() : query;
  },

  findById(id, { lean = false } = {}) {
    const query = User.findById(id);
    return lean ? query.lean() : query;
  },

  findByIds(ids, { lean = true } = {}) {
    const query = User.find({ _id: { $in: ids } });
    return lean ? query.lean() : query;
  },

  create(data) {
    return User.create(data);
  },

  exists(filter) {
    return User.exists(filter);
  },

  countByRole(role) {
    return User.countDocuments({ role });
  },

  list({ filter = {}, skip = 0, limit = 20, sort = { createdAt: -1 } } = {}) {
    return User.find(filter).sort(sort).skip(skip).limit(limit).lean();
  },

  count(filter = {}) {
    return User.countDocuments(filter);
  },
};

module.exports = userRepository;
