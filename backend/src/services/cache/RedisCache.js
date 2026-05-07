'use strict';

class RedisCache {
  constructor(client) {
    this.client = client;
    this.kind = 'redis';
  }

  async get(key) {
    const raw = await this.client.get(key);
    if (raw === null || raw === undefined) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  async set(key, value, ttlSec) {
    const payload = JSON.stringify(value);
    if (ttlSec && ttlSec > 0) {
      await this.client.set(key, payload, 'EX', ttlSec);
    } else {
      await this.client.set(key, payload);
    }
  }

  async del(key) {
    await this.client.del(key);
  }

  /**
   * Remove keys matching a glob pattern using non-blocking SCAN.
   * Never use `KEYS` in production — it blocks the Redis event loop.
   */
  async delByPattern(pattern) {
    let cursor = '0';
    let deleted = 0;
    do {
      const [next, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      if (keys.length > 0) {
        deleted += await this.client.del(...keys);
      }
    } while (cursor !== '0');
    return deleted;
  }

  async wrap(key, ttlSec, producer) {
    const cached = await this.get(key);
    if (cached !== null) return cached;
    const fresh = await producer();
    if (fresh !== null && fresh !== undefined) await this.set(key, fresh, ttlSec);
    return fresh;
  }

  async ping() {
    const reply = await this.client.ping();
    return reply === 'PONG';
  }

  async close() {
    await this.client.quit();
  }
}

module.exports = RedisCache;
