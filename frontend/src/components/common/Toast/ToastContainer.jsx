import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import clsx from 'clsx';
import { dismissToast } from '@/store/uiSlice';
import { useToasts } from '@/hooks/useToasts';
import styles from './Toast.module.scss';

function Toast({ toast }) {
  const dispatch = useDispatch();
  const { id, kind, message, ttlMs } = toast;

  useEffect(() => {
    if (!ttlMs) return undefined;
    const timer = setTimeout(() => dispatch(dismissToast(id)), ttlMs);
    return () => clearTimeout(timer);
  }, [id, ttlMs, dispatch]);

  return (
    <div role="status" aria-live="polite" className={clsx(styles.toast, styles[`k-${kind}`])}>
      <span className={styles.dot} aria-hidden />
      <span className={styles.msg}>{message}</span>
      <button
        type="button"
        className={styles.close}
        aria-label="Dismiss"
        onClick={() => dispatch(dismissToast(id))}
      >
        ×
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToasts();
  if (toasts.length === 0) return null;
  return (
    <div className={styles.container} aria-label="Notifications">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  );
}

export default ToastContainer;
