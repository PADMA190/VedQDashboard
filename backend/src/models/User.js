'use strict';

const mongoose = require('mongoose');
const { ROLE_VALUES, ROLES, SUBJECT_VALUES, CLASSES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ROLE_VALUES,
      default: ROLES.STUDENT,
      index: true,
    },
    class: {
      type: Number,
      enum: CLASSES,
      required: function requireClassForStudents() {
        return this.role === ROLES.STUDENT;
      },
    },
    subjects: {
      type: [{ type: String, enum: SUBJECT_VALUES }],
      default: [],
    },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
