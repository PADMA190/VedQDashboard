import clsx from 'clsx';
import { formatTimeMMSS } from '@/utils/format';
import styles from './Timer.module.scss';

const WARN_RATIO = 0.25;
const DANGER_RATIO = 0.1;

export function Timer({ remainingSec, totalSec, className }) {
  const ratio = totalSec > 0 ? remainingSec / totalSec : 1;
  const tone =
    ratio <= DANGER_RATIO ? 'danger' :
    ratio <= WARN_RATIO ? 'warn' : 'normal';

  return (
    <div
      className={clsx(styles.timer, styles[`tone-${tone}`], className)}
      role="timer"
      aria-live="polite"
    >
      <span className={styles.icon} aria-hidden>⏱</span>
      <span className={styles.value}>{formatTimeMMSS(remainingSec)}</span>
      <span className={styles.label}>remaining</span>
    </div>
  );
}

export default Timer;
