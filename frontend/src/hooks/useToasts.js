import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { pushToast, dismissToast, selectToasts } from '@/store/uiSlice';

export function useToasts() {
  const dispatch = useDispatch();
  const toasts = useSelector(selectToasts);

  const toast = useCallback(
    (kind, message, opts = {}) => dispatch(pushToast({ kind, message, ...opts })),
    [dispatch]
  );

  return {
    toasts,
    success: (message, opts) => toast('success', message, opts),
    info: (message, opts) => toast('info', message, opts),
    warning: (message, opts) => toast('warning', message, opts),
    error: (message, opts) => toast('error', message, opts),
    dismiss: (id) => dispatch(dismissToast(id)),
  };
}
