import { forwardRef, useId } from 'react';
import clsx from 'clsx';
import styles from './Select.module.scss';

export const Select = forwardRef(function Select(
  { label, hint, error, id: idProp, options = [], placeholder, className, fullWidth = true, ...rest },
  ref
) {
  const generated = useId();
  const id = idProp || `sel-${generated}`;

  return (
    <div className={clsx(styles.wrapper, fullWidth && styles.full, className)}>
      {label && <label className={styles.label} htmlFor={id}>{label}</label>}
      <div className={clsx(styles.selectShell, error && styles.invalid)}>
        <select id={id} ref={ref} className={styles.select} {...rest}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg className={styles.chev} viewBox="0 0 20 20" fill="none" aria-hidden>
          <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {error ? <span className={styles.error}>{error}</span> : hint ? <span className={styles.hint}>{hint}</span> : null}
    </div>
  );
});

export default Select;
