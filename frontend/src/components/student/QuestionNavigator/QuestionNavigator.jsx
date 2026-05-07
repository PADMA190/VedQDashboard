import clsx from 'clsx';
import styles from './QuestionNavigator.module.scss';

/**
 * Visual grid of question buttons with state badges.
 *
 * Status per question:
 *   - 'current'  — viewing now
 *   - 'answered' — has selectedOption (and not marked)
 *   - 'marked'   — marked for review (whether or not answered)
 *   - 'blank'    — not yet answered
 */
function statusFor(answer, isCurrent) {
  if (isCurrent) return 'current';
  if (answer?.markedForReview) return 'marked';
  if (answer?.selectedOption) return 'answered';
  return 'blank';
}

export function QuestionNavigator({ questions, answers, currentIndex, onJump, className }) {
  return (
    <div className={clsx(styles.wrapper, className)}>
      <div className={styles.grid} role="list">
        {questions.map((q, i) => {
          const status = statusFor(answers[q.id || q._id], i === currentIndex);
          return (
            <button
              key={q.id || q._id}
              type="button"
              role="listitem"
              className={clsx(styles.cell, styles[`s-${status}`])}
              aria-current={status === 'current' ? 'true' : undefined}
              aria-label={`Question ${i + 1}, ${status}`}
              onClick={() => onJump(i)}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <Legend />
    </div>
  );
}

function Legend() {
  return (
    <ul className={styles.legend}>
      <li><span className={clsx(styles.swatch, styles['s-current'])} /> Current</li>
      <li><span className={clsx(styles.swatch, styles['s-answered'])} /> Answered</li>
      <li><span className={clsx(styles.swatch, styles['s-marked'])} /> For review</li>
      <li><span className={clsx(styles.swatch, styles['s-blank'])} /> Blank</li>
    </ul>
  );
}

export default QuestionNavigator;
