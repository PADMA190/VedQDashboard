'use strict';

const mongoose = require('mongoose');
const logger = require('../config/logger');

/**
 * Run `work(session)` inside a Mongo transaction when supported, otherwise
 * fall back to a non-transactional run (single-node Mongo, dev convenience).
 *
 * The work function MUST accept a session argument and pass it to every
 * Mongoose call it makes — the helper will emit `null` when transactions are
 * not available, in which case writes simply run without a session.
 *
 * @template T
 * @param {(session: import('mongoose').ClientSession | null) => Promise<T>} work
 * @returns {Promise<T>}
 */
async function withTransaction(work) {
  let session;
  try {
    session = await mongoose.startSession();
  } catch (err) {
    logger.warn('Could not start Mongo session, running without transaction', {
      err: err.message,
    });
    return work(null);
  }

  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (err) {
    if (isTxnUnsupported(err)) {
      logger.warn(
        'Transactions unsupported on this Mongo deployment; running sequentially. ' +
          'Use a replica set or Atlas for atomic writes in production.'
      );
      return work(null);
    }
    throw err;
  } finally {
    await session.endSession();
  }
}

function isTxnUnsupported(err) {
  if (!err) return false;
  const msg = err.message || '';
  return (
    err.code === 20 ||
    err.codeName === 'IllegalOperation' ||
    /Transaction numbers are only allowed on a replica set/i.test(msg) ||
    /Transactions are not supported/i.test(msg)
  );
}

module.exports = { withTransaction };
