import clsx from 'clsx';
import { Badge } from '@/components/common';
import { formatDuration } from '@/utils/format';
import styles from './AttemptReviewCard.module.scss';

export function AttemptReviewCard({ index, answer, className }) {
  const correct = answer.isCorrect;
  const status = answer.selectedOption ? (correct ? 'correct' : 'wrong') : 'skipped';

  return (
    <article className={clsx(styles.card, styles[`s-${status}`], className)}>
      <header className={styles.head}>
        <span className={styles.index}>Q{index + 1}</span>
        <Badge tone={correct ? 'success' : answer.selectedOption ? 'danger' : 'neutral'}>
          {correct ? 'Correct' : answer.selectedOption ? 'Incorrect' : 'Skipped'}
        </Badge>
        {answer.topic && <span className={styles.topic}>{answer.subject} · {answer.topic}</span>}
        {answer.timeTakenSec > 0 && (
          <span className={styles.time}>{formatDuration(answer.timeTakenSec)}</span>
        )}
      </header>

      <p className={styles.question}>{answer.questionText}</p>

      <ul className={styles.options}>
        {(answer.options || []).map((opt) => {
          const isCorrect = opt.key === answer.correctOption;
          const wasSelected = opt.key === answer.selectedOption;
          return (
            <li
              key={opt.key}
              className={clsx(
                styles.option,
                isCorrect && styles.correctOpt,
                wasSelected && !isCorrect && styles.wrongOpt,
                wasSelected && styles.selectedOpt
              )}
            >
              <span className={styles.optKey}>{opt.key}</span>
              <span className={styles.optText}>{opt.text}</span>
              {isCorrect && <span className={styles.optTag}>Correct answer</span>}
              {wasSelected && !isCorrect && <span className={styles.optTag}>Your answer</span>}
            </li>
          );
        })}
      </ul>

      {answer.explanation && (
        <details className={styles.explanation}>
          <summary>Explanation</summary>
          <p>{answer.explanation}</p>
        </details>
      )}
    </article>
  );
}

export default AttemptReviewCard;
