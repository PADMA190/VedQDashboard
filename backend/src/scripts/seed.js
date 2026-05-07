'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const env = require('../config/env');
const logger = require('../config/logger');
const { connectDB } = require('../config/db');

const { User, Quiz, Question, Attempt, TopicPerformance } = require('../models');
const { ROLES, SUBJECTS, OPTION_KEYS, WEAK_TOPIC } = require('../config/constants');

const QUESTION_BANK = require('./seedData/questions');

const STUDENT_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun',
  'Ananya', 'Diya', 'Riya', 'Saanvi', 'Pari',
];

const STUDENT_PASSWORD = 'Student@12345';
const QUIZ_DURATION_MINUTES = 20;
const QUESTIONS_PER_QUIZ = 8;

// Avoid look-alikes (0/O, 1/l/I).
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function generateRandomPassword(length = 14) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += PASSWORD_ALPHABET[bytes[i] % PASSWORD_ALPHABET.length];
  }
  // Guarantee character classes the validators require.
  return `${out}A1z`;
}

async function clearAll() {
  await Promise.all([
    User.deleteMany({}),
    Quiz.deleteMany({}),
    Question.deleteMany({}),
    Attempt.deleteMany({}),
    TopicPerformance.deleteMany({}),
  ]);
}

function pickSubjects(rng) {
  const all = Object.values(SUBJECTS);
  const count = 2 + Math.floor(rng() * 3);
  return [...all].sort(() => rng() - 0.5).slice(0, count);
}

async function createAdmins(saltRounds) {
  const credentials = [];
  const admins = [];
  for (let i = 1; i <= 2; i += 1) {
    const password = generateRandomPassword();
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const email = `admin${i}@quizdash.local`;
    const admin = await User.create({
      name: `Admin ${i}`,
      email,
      passwordHash,
      role: ROLES.ADMIN,
    });
    admins.push(admin);
    credentials.push({ email, password });
  }
  return { admins, credentials };
}

async function createStudents(saltRounds) {
  const passwordHash = await bcrypt.hash(STUDENT_PASSWORD, saltRounds);
  const students = [];
  // Mulberry32 — deterministic-ish randomness for reproducible seeds (not crypto).
  let s = 12345;
  const rng = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let i = 0; i < STUDENT_NAMES.length; i += 1) {
    const name = STUDENT_NAMES[i];
    const studentClass = 8 + (i % 5); // classes 8..12
    const subjects = pickSubjects(rng);
    const student = await User.create({
      name,
      email: `${name.toLowerCase()}@quizdash.local`,
      passwordHash,
      role: ROLES.STUDENT,
      class: studentClass,
      subjects,
    });
    students.push(student);
  }
  return students;
}

async function createQuestions(adminId) {
  const docs = QUESTION_BANK.map((q) => ({ ...q, createdBy: adminId }));
  return Question.insertMany(docs);
}

async function createQuizzes(adminId, questions) {
  const specs = [
    { title: 'Algebra Foundations', subject: SUBJECTS.MATHS, class: 9 },
    { title: 'Newtonian Mechanics', subject: SUBJECTS.PHYSICS, class: 11 },
    { title: 'Atoms & Molecules', subject: SUBJECTS.CHEMISTRY, class: 9 },
    { title: 'Reading & Grammar Drill', subject: SUBJECTS.ENGLISH, class: 10 },
    { title: 'Cell Biology Basics', subject: SUBJECTS.BIOLOGY, class: 9 },
  ];

  const quizzes = [];
  for (const spec of specs) {
    const pool = questions.filter(
      (q) => q.subject === spec.subject && q.class === spec.class
    );
    if (pool.length === 0) continue;
    const selected = pool.slice(0, QUESTIONS_PER_QUIZ).map((q) => q._id);
    const quiz = await Quiz.create({
      ...spec,
      description: `Practice quiz on ${spec.subject} for class ${spec.class}.`,
      durationMinutes: QUIZ_DURATION_MINUTES,
      questions: selected,
      createdBy: adminId,
      assignedClasses: [spec.class],
      isPublished: true,
    });
    quizzes.push(quiz);
  }
  return quizzes;
}

function pickIncorrectOption(correctKey) {
  return OPTION_KEYS.find((k) => k !== correctKey);
}

async function generateAttempts(students, quizzes) {
  // First 3 students attempt the first 2 quizzes — gives analytics something to chew on.
  const sampleStudents = students.slice(0, 3);
  const sampleQuizzes = quizzes.slice(0, 2);

  for (const student of sampleStudents) {
    for (const quiz of sampleQuizzes) {
      const quizQuestions = await Question.find({ _id: { $in: quiz.questions } }).lean();
      if (quizQuestions.length === 0) continue;

      const answers = quizQuestions.map((q) => {
        const isCorrect = Math.random() > 0.4;
        const selectedOption = isCorrect ? q.correctOption : pickIncorrectOption(q.correctOption);
        return {
          questionId: q._id,
          selectedOption,
          isCorrect,
          timeTakenSec: 30 + Math.floor(Math.random() * 60),
          markedForReview: false,
        };
      });

      const totalQuestions = answers.length;
      const correctCount = answers.filter((a) => a.isCorrect).length;
      const accuracy = totalQuestions > 0 ? correctCount / totalQuestions : 0;
      const score = Math.round(accuracy * 100);
      const submittedAt = new Date();
      const startedAt = new Date(submittedAt.getTime() - 15 * 60_000);

      await Attempt.create({
        userId: student._id,
        quizId: quiz._id,
        answers,
        score,
        totalQuestions,
        correctCount,
        accuracy,
        startedAt,
        submittedAt,
        durationSec: Math.floor((submittedAt - startedAt) / 1000),
      });

      // Update topic performance per topic seen in this attempt.
      const byTopic = new Map();
      for (let i = 0; i < quizQuestions.length; i += 1) {
        const q = quizQuestions[i];
        const a = answers[i];
        const key = `${q.subject}|${q.topic}`;
        const prev = byTopic.get(key) || {
          subject: q.subject,
          topic: q.topic,
          total: 0,
          correct: 0,
        };
        prev.total += 1;
        if (a.isCorrect) prev.correct += 1;
        byTopic.set(key, prev);
      }

      for (const v of byTopic.values()) {
        const existing = await TopicPerformance.findOne({
          userId: student._id,
          subject: v.subject,
          topic: v.topic,
        });
        const totalAttempted = (existing ? existing.totalAttempted : 0) + v.total;
        const correctTotal = (existing ? existing.correctCount : 0) + v.correct;
        const newAccuracy = totalAttempted > 0 ? correctTotal / totalAttempted : 0;
        const isWeak =
          newAccuracy < WEAK_TOPIC.ACCURACY_THRESHOLD &&
          totalAttempted >= WEAK_TOPIC.MIN_ATTEMPTS;

        await TopicPerformance.findOneAndUpdate(
          { userId: student._id, subject: v.subject, topic: v.topic },
          {
            $set: {
              totalAttempted,
              correctCount: correctTotal,
              accuracy: newAccuracy,
              isWeak,
              lastAttemptedAt: new Date(),
            },
          },
          { upsert: true }
        );
      }
    }
  }
}

async function run() {
  if (env.isProd) {
    // eslint-disable-next-line no-console
    console.error('Refusing to seed in production (NODE_ENV=production).');
    process.exit(1);
  }

  await connectDB();
  logger.info('Clearing existing data...');
  await clearAll();

  logger.info('Creating admins...');
  const { admins, credentials: adminCreds } = await createAdmins(env.bcryptRounds);

  logger.info('Creating students...');
  const students = await createStudents(env.bcryptRounds);

  logger.info('Inserting questions...');
  const questions = await createQuestions(admins[0]._id);

  logger.info('Creating quizzes...');
  const quizzes = await createQuizzes(admins[0]._id, questions);

  logger.info('Generating sample attempts and topic performance...');
  await generateAttempts(students, quizzes);

  // eslint-disable-next-line no-console
  console.log(
    [
      '',
      '======================================================',
      '  Seed complete',
      '======================================================',
      '',
      'ADMINS  (save these now — they will not be shown again):',
      ...adminCreds.map((c) => `  ${c.email}   /   ${c.password}`),
      '',
      `STUDENTS  (${students.length} accounts, all share password: ${STUDENT_PASSWORD}):`,
      ...students.map((s) => `  ${s.email}   (class ${s.class})`),
      '',
      `Questions inserted : ${questions.length}`,
      `Quizzes published  : ${quizzes.length}`,
      '======================================================',
      '',
    ].join('\n')
  );

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  logger.error('Seed failed', { err: err.message, stack: err.stack });
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
