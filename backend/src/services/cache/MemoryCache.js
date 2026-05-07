'use strict';

const NodeCache = require('node-cache');

function globToRegex(pattern) {
  const escaped = String(pattern).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

class MemoryCache {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 0, checkperiod: 60, useClones: false });
    this.kind = 'memory';
  }

  async get(key) {
    const value = this.cache.get(key);
    return value === undefined ? null : value;
  }

  async set(key, value, ttlSec) {
    if (ttlSec && ttlSec > 0) this.cache.set(key, value, ttlSec);
    else this.cache.set(key, value);
  }

  async del(key) {
    this.cache.del(key);
  }

  async delByPattern(pattern) {
    const re = globToRegex(pattern);
    const matched = this.cache.keys().filter((k) => re.test(k));
    if (matched.length > 0) this.cache.del(matched);
    return matched.length;
  }

  async wrap(key, ttlSec, producer) {
    const cached = await this.get(key);
    if (cached !== null) return cached;
    const fresh = await producer();
    if (fresh !== null && fresh !== undefined) await this.set(key, fresh, ttlSec);
    return fresh;
  }

  async ping() {
    return true;
  }

  async close() {
    this.cache.close();
  }
}

module.exports = MemoryCache;
