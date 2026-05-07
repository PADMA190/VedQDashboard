// Tiny safe wrapper around localStorage. Survives SSR and disabled storage.

const PREFIX = 'qd:';

export function readJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

export function draftKey(quizId, userId) {
  return `attempt-draft:${quizId}:${userId}`;
}
