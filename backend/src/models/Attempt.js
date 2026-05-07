'use strict';

const mongoose = require('mongoose');
const { OPTION_KEYS } = require('../config/constants');

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedOption: { type: String, enum: [...OPTION_KEYS, null], default: null },
    isCorrect: { type: Boolean, default: false },
    timeTakenSec: { type: Number, default: 0, min: 0 },
    markedForReview: { type: Boolean, default: false },
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    answers: { type: [answerSchema], default: [] },
    score: { type: Number, default: 0, min: 0, max: 100 },
    totalQuestions: { type: Number, required: true, min: 0 },
    correctCount: { type: Number, default: 0, min: 0 },
    accuracy: { type: Number, default: 0, min: 0, max: 1 },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    durationSec: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

attemptSchema.index({ userId: 1, quizId: 1 });
attemptSchema.index({ userId: 1, submittedAt: -1 });
attemptSchema.index({ quizId: 1, score: -1 });

attemptSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Attempt', attemptSchema);
