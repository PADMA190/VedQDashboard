'use strict';

const TopicPerformance = require('../models/TopicPerformance');
const { WEAK_TOPIC } = require('../config/constants');

const topicPerformanceRepository = {
  /**
   * Apply per-topic increments and recompute accuracy + isWeak. Mongo cannot
   * compute the new ratio in a single $inc op, so we do incRementOnUpsert
   * then update accuracy/isWeak from the returned doc — two ops per topic,
   * still bounded and acceptable inside a transaction.
   */
  async applyIncrements({ userId, topicAggregation, session = null }) {
    const sessionOpt = session ? { session } : {};
    const updates = [];

    for (const item of topicAggregation) {
      const incremented = await TopicPerformance.findOneAndUpdate(
        { userId, subject: item.subject, topic: item.topic },
        {
          $inc: { totalAttempted: item.total, correctCount: item.correct },
          $set: { lastAttemptedAt: new Date() },
        },
        { upsert: true, new: true, ...sessionOpt }
      );

      const accuracy =
        incremented.totalAttempted > 0
          ? incremented.correctCount / incremented.totalAttempted
          : 0;
      const isWeak =
        accuracy < WEAK_TOPIC.ACCURACY_THRESHOLD &&
        incremented.totalAttempted >= WEAK_TOPIC.MIN_ATTEMPTS;

      await TopicPerformance.updateOne(
        { _id: incremented._id },
        { $set: { accuracy, isWeak } },
        sessionOpt
      );

      updates.push({
        subject: item.subject,
        topic: item.topic,
        totalAttempted: incremented.totalAttempted,
        correctCount: incremented.correctCount,
        accuracy,
        isWeak,
      });
    }

    return updates;
  },

  listByUser({ userId, filter = {}, sort = { lastAttemptedAt: -1 } } = {}) {
    return TopicPerformance.find({ userId, ...filter }).sort(sort).lean();
  },

  listWeakByUser(userId) {
    return TopicPerformance.find({ userId, isWeak: true })
      .sort({ accuracy: 1, totalAttempted: -1 })
      .lean();
  },
};

module.exports = topicPerformanceRepository;
