'use strict';

const mongoose = require('mongoose');
const {
  SUBJECT_VALUES,
  CLASSES,
  DIFFICULTY_VALUES,
  DIFFICULTIES,
  OPTION_KEYS,
} = require('../config/constants');

const optionSchema = new mongoose.Schema(
  {
    key: { type: String, enum: OPTION_KEYS, required: true },
    text: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    subject: { type: String, enum: SUBJECT_VALUES, required: true, index: true },
    class: { type: Number, enum: CLASSES, required: true, index: true },
    topic: { type: String, required: true, trim: true, index: true },
    difficulty: { type: String, enum: DIFFICULTY_VALUES, default: DIFFICULTIES.MEDIUM },
    questionText: { type: String, required: true, trim: true },
    options: {
      type: [optionSchema],
      validate: [
        (arr) => Array.isArray(arr) && arr.length === 4,
        'Exactly 4 options are required',
      ],
    },
    correctOption: { type: String, enum: OPTION_KEYS, required: true },
    explanation: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

questionSchema.pre('validate', function ensureUniqueOptionKeys(next) {
  const keys = (this.options || []).map((o) => o.key);
  const set = new Set(keys);
  if (set.size !== OPTION_KEYS.length || !OPTION_KEYS.every((k) => set.has(k))) {
    return next(new Error('Options must have unique keys A, B, C, D'));
  }
  return next();
});

questionSchema.index({ subject: 1, class: 1, topic: 1 });

questionSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Question', questionSchema);
