import clsx from 'clsx';
import styles from './Badge.module.scss';

export function Badge({ tone = 'neutral', size = 'md', children, className }) {
  return (
    <span className={clsx(styles.badge, styles[`t-${tone}`], styles[`s-${size}`], className)}>
      {children}
    </span>
  );
}

export default Badge;
