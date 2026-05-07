import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Badge } from '@/components/common';
import { pluralize } from '@/utils/format';
import styles from './QuizCard.module.scss';

const SUBJECT_TONE = {
  Maths: 'primary',
  Physics: 'info',
  Chemistry: 'success',
  English: 'warning',
  Biology: 'danger',
};

export function QuizCard({ quiz, className }) {
  const questionCount = Array.isArray(quiz.questions) ? quiz.questions.length : (quiz.questionCount ?? null);

  return (
    <article className={clsx(styles.card, className)}>
      <header className={styles.head}>
        <Badge tone={SUBJECT_TONE[quiz.subject] || 'neutral'}>{quiz.subject}</Badge>
        <Badge tone="neutral" size="sm">Class {quiz.class}</Badge>
        {quiz.isRetry && <Badge tone="warning" size="sm">Retry</Badge>}
      </header>
      <h3 className={styles.title}>{quiz.title}</h3>
      {quiz.description && <p className={styles.desc}>{quiz.description}</p>}
      <dl className={styles.meta}>
        <div>
          <dt>Duration</dt>
          <dd>{quiz.durationMinutes} min</dd>
        </div>
        {questionCount !== null && (
          <div>
            <dt>Questions</dt>
            <dd>{questionCount} {pluralize(questionCount, 'item', 'items')}</dd>
          </div>
        )}
      </dl>
      <footer className={styles.foot}>
        <Link to={`/quizzes/${quiz.id || quiz._id}/attempt`} className={styles.cta}>
          Start practice →
        </Link>
      </footer>
    </article>
  );
}

export default QuizCard;
