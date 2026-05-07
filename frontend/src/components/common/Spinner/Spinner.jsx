import clsx from 'clsx';
import styles from './Spinner.module.scss';

export function Spinner({ size = 'md', label = 'Loading…', className, inline = false }) {
  return (
    <span
      className={clsx(styles.wrap, styles[`s-${size}`], inline && styles.inline, className)}
      role="status"
      aria-live="polite"
    >
      <span className={styles.spinner} />
      <span className={styles.label}>{label}</span>
    </span>
  );
}

export default Spinner;
