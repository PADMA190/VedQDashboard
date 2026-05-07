import { forwardRef, useId } from 'react';
import clsx from 'clsx';
import styles from './Input.module.scss';

export const Input = forwardRef(function Input(
  { label, hint, error, id: idProp, type = 'text', className, fullWidth = true, ...rest },
  ref
) {
  const generated = useId();
  const id = idProp || `in-${generated}`;
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;

  return (
    <div className={clsx(styles.wrapper, fullWidth && styles.full, className)}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        type={type}
        className={clsx(styles.input, error && styles.invalid)}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {error ? (
        <span id={`${id}-err`} className={styles.error}>{error}</span>
      ) : hint ? (
        <span id={`${id}-hint`} className={styles.hint}>{hint}</span>
      ) : null}
    </div>
  );
});

export default Input;
