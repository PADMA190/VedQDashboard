import { useEffect, useRef, useState } from 'react';

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

/**
 * Returns a stable debounced callback. Latest args win; the timer resets on
 * each call. Useful for save-as-you-type style auto-saves.
 */
export function useDebouncedCallback(fn, delay = 500) {
  const fnRef = useRef(fn);
  const timerRef = useRef();

  useEffect(() => { fnRef.current = fn; }, [fn]);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (...args) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fnRef.current(...args), delay);
  };
}
