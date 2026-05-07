import clsx from 'clsx';
import styles from './Button.module.scss';

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  fullWidth = false,
  isLoading = false,
  iconLeft,
  iconRight,
  className,
  children,
  disabled,
  ...rest
}) {
  return (
    <button
      type={type}
      className={clsx(
        styles.btn,
        styles[`v-${variant}`],
        styles[`s-${size}`],
        fullWidth && styles.full,
        isLoading && styles.loading,
        className
      )}
      disabled={disabled || isLoading}
      {...rest}
    >
      {iconLeft && <span className={styles.icon} aria-hidden>{iconLeft}</span>}
      <span className={styles.label}>{children}</span>
      {iconRight && <span className={styles.icon} aria-hidden>{iconRight}</span>}
    </button>
  );
}

export default Button;
