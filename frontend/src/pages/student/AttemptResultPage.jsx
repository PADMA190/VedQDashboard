import { useMemo } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { attemptsApi } from '@/api';
import { Card, Button, Badge, Spinner, EmptyState } from '@/components/common';
import { AttemptReviewCard } from '@/components/student';
import { formatPercent, formatDuration, formatDateTime } from '@/utils/format';
import styles from './AttemptResultPage.module.scss';

export function AttemptResultPage() {
  const { id } = useParams();
  const location = useLocation();
  const fromState = location.state?.review;

  const attemptQ = useQuery({
    queryKey: ['attempt', id],
    queryFn: () => attemptsApi.detail(id),
    initialData: fromState && fromState.id === id ? fromState : undefined,
    staleTime: 60_000,
  });

  const attempt = attemptQ.data;
  const summary = useMemo(() => {
    if (!attempt) return null;
    const correct = attempt.correctCount ?? 0;
    const total = attempt.totalQuestions ?? attempt.answers?.length ?? 0;
    const wrong = (attempt.answers || []).filter((a) => a.selectedOption && !a.isCorrect).length;
    const skipped = total - correct - wrong;
    return { correct, wrong, skipped, total };
  }, [attempt]);

  if (attemptQ.isLoading && !attempt) return <Spinner size="lg" />;
  if (attemptQ.isError || !attempt) {
    return (
      <EmptyState
        icon="🚫"
        title="Couldn't load this attempt"
        description={attemptQ.error?.message || 'Try again from your attempts history.'}
        action={<Link to="/attempts"><Button>Back to attempts</Button></Link>}
      />
    );
  }

  const score = attempt.score;
  const tone = score >= 80 ? 'success' : score >= 50 ? 'warning' : 'danger';

  return (
    <div className={styles.page}>
      <Card padding="md" className={styles.heroCard}>
        <div>
          <Badge tone={tone}>Score {score}%</Badge>
          <h1 className={styles.title}>{attempt.quizTitle || 'Attempt Result'}</h1>
          <p className={styles.meta}>
            Submitted {formatDateTime(attempt.submittedAt)} · Duration {formatDuration(attempt.durationSec)}
          </p>
        </div>
        <div className={styles.statRow}>
          <Stat label="Correct" value={summary.correct} tone="success" />
          <Stat label="Wrong" value={summary.wrong} tone="danger" />
          <Stat label="Skipped" value={summary.skipped} tone="neutral" />
          <Stat label="Accuracy" value={formatPercent(attempt.accuracy ?? 0)} />
        </div>
        <div className={styles.actions}>
          <Link to="/"><Button variant="secondary">Back to dashboard</Button></Link>
          <Link to="/weak-topics"><Button>See weak topics →</Button></Link>
        </div>
      </Card>

      <h2 className={styles.sectionTitle}>Question-by-question review</h2>
      <div className={styles.list}>
        {(attempt.answers || []).map((a, i) => (
          <AttemptReviewCard key={a.questionId || i} index={i} answer={a} />
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, tone = 'neutral' }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statLabel}>{label}</div>
      <div className={`${styles.statValue} ${styles[`tone-${tone}`]}`}>{value}</div>
    </div>
  );
}

export default AttemptResultPage;
