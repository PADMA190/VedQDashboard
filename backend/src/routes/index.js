'use strict';

const express = require('express');
const authRoutes = require('./authRoutes');
const quizRoutes = require('./quizRoutes');
const attemptRoutes = require('./attemptRoutes');
const adminRoutes = require('./adminRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const leaderboardRoutes = require('./leaderboardRoutes');

const router = express.Router();

router.get('/health', (_req, res) =>
  res.json({
    success: true,
    data: {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  })
);

router.use('/auth', authRoutes);
router.use('/quizzes', quizRoutes);
router.use('/attempts', attemptRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
