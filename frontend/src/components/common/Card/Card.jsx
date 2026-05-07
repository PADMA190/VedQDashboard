import clsx from 'clsx';
import styles from './Card.module.scss';

export function Card({ as: Tag = 'div', padding = 'lg', className, children, ...rest }) {
  return (
    <Tag className={clsx(styles.card, styles[`p-${padding}`], className)} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, actions, className }) {
  return (
    <header className={clsx(styles.header, className)}>
      <div className={styles.headerText}>
        {title && <h2 className={styles.title}>{title}</h2>}
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}

export default Card;
