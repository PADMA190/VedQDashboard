import { useEffect, useRef, useState } from 'react';

/**
 * Quiz timer.
 *  - durationMinutes: total quiz time
 *  - startedAt: ISO string (or Date) marking quiz start
 *  - onExpire: called once when timer hits 0
 * Returns { remainingSec, elapsedSec, expired }.
 */
export function useQuizTimer({ durationMinutes, startedAt, onExpire }) {
  const totalSec = Math.max(0, Math.floor((durationMinutes || 0) * 60));
  const startMs = startedAt ? new Date(startedAt).getTime() : Date.now();
  const expireRef = useRef(false);

  const computeElapsed = () => Math.max(0, Math.floor((Date.now() - startMs) / 1000));

  const [elapsedSec, setElapsedSec] = useState(computeElapsed());

  useEffect(() => {
    const id = setInterval(() => {
      setElapsedSec(computeElapsed());
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startMs]);

  const remainingSec = Math.max(0, totalSec - elapsedSec);
  const expired = totalSec > 0 && remainingSec === 0;

  useEffect(() => {
    if (expired && !expireRef.current) {
      expireRef.current = true;
      onExpire?.();
    }
  }, [expired, onExpire]);

  return { remainingSec, elapsedSec, expired, totalSec };
}
