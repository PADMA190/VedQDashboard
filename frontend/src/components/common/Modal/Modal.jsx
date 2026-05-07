import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import styles from './Modal.module.scss';

export function Modal({ open, onClose, title, children, footer, size = 'md', closeOnBackdrop = true }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className={styles.backdrop} onMouseDown={() => closeOnBackdrop && onClose?.()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx(styles.modal, styles[`s-${size}`])}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {title && (
          <header className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>×</button>
          </header>
        )}
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}

export default Modal;
