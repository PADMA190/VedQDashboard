'use strict';

const mongoose = require('mongoose');
const { SUBJECT_VALUES } = require('../config/constants');

const topicPerformanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, enum: SUBJECT_VALUES, required: true },
    topic: { type: String, required: true, trim: true },
    totalAttempted: { type: Number, default: 0, min: 0 },
    correctCount: { type: Number, default: 0, min: 0 },
    accuracy: { type: Number, default: 0, min: 0, max: 1 },
    lastAttemptedAt: { type: Date },
    isWeak: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

topicPerformanceSchema.index(
  { userId: 1, subject: 1, topic: 1 },
  { unique: true, name: 'uniq_user_subject_topic' }
);
topicPerformanceSchema.index({ userId: 1, isWeak: 1 });

topicPerformanceSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('TopicPerformance', topicPerformanceSchema);
