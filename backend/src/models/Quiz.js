'use strict';

const mongoose = require('mongoose');
const { SUBJECT_VALUES, CLASSES } = require('../config/constants');

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', trim: true },
    subject: { type: String, enum: SUBJECT_VALUES, required: true },
    class: { type: Number, enum: CLASSES, required: true },
    durationMinutes: { type: Number, required: true, min: 1, max: 240 },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    assignedClasses: [{ type: Number, enum: CLASSES }],
    isPublished: { type: Boolean, default: false },
    isRetry: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

quizSchema.index({ subject: 1, class: 1 });
quizSchema.index({ isPublished: 1, isRetry: 1, createdAt: -1 });
quizSchema.index({ assignedTo: 1 });
quizSchema.index({ assignedClasses: 1 });

quizSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Quiz', quizSchema);
