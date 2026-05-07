import clsx from 'clsx';
import styles from './EmptyState.module.scss';

export function EmptyState({ icon, title, description, action, className }) {
  return (
    <div className={clsx(styles.empty, className)}>
      {icon && <div className={styles.icon} aria-hidden>{icon}</div>}
      {title && <h3 className={styles.title}>{title}</h3>}
      {description && <p className={styles.desc}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

export default EmptyState;
