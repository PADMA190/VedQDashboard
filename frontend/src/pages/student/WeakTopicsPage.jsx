import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';

import { analyticsApi } from '@/api';
import { useAuth } from '@/hooks/useAuth';
import { useToasts } from '@/hooks/useToasts';
import { Card, CardHeader, Badge, Spinner, EmptyState, Button } from '@/components/common';
import { formatPercent, formatDateTime } from '@/utils/format';
import { unwrapApiError } from '@/api';
import styles from './WeakTopicsPage.module.scss';

export function WeakTopicsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toasts = useToasts();

  const weakQ = useQuery({
    queryKey: ['analytics', 'weak', user?.id],
    queryFn: () => analyticsApi.weakTopics(user.id),
    enabled: Boolean(user?.id),
  });

  const retry = useMutation({
    mutationFn: () => analyticsApi.retryQuiz(user.id),
    onSuccess: (quiz) => {
      toasts.success(`Generated ${quiz.questions.length}-question retry quiz.`);
      navigate(`/quizzes/${quiz.id}/attempt`);
    },
    onError: (err) => {
      toasts.error(unwrapApiError(err).message);
    },
  });

  const items = weakQ.data || [];

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Weak topics</h1>
          <p className={styles.subtitle}>
            Topics where your accuracy is below 60% (with at least 3 attempts). Generate a focused
            practice quiz from these.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => retry.mutate()}
          isLoading={retry.isPending}
          disabled={items.length === 0}
        >
          Generate retry quiz →
        </Button>
      </header>

      {weakQ.isLoading ? (
        <Spinner size="lg" />
      ) : items.length === 0 ? (
        <EmptyState
          icon="🎉"
          title="No weak topics yet"
          description="Take a few quizzes — once a topic shows under 60% accuracy across 3+ attempts, it'll show up here."
          action={<Link to="/"><Button>Browse quizzes</Button></Link>}
        />
      ) : (
        <ul className={styles.grid}>
          {items.map((tp, i) => (
            <li key={`${tp.subject}-${tp.topic}-${i}`}>
              <Card padding="md" className={styles.card}>
                <div className={styles.cardHead}>
                  <Badge tone="primary" size="sm">{tp.subject}</Badge>
                  <Badge tone="warning" size="sm">{formatPercent(tp.accuracy)}</Badge>
                </div>
                <h3 className={styles.cardTitle}>{tp.topic}</h3>
                <dl className={styles.cardMeta}>
                  <div><dt>Attempted</dt><dd>{tp.totalAttempted}</dd></div>
                  <div><dt>Correct</dt><dd>{tp.correctCount}</dd></div>
                  <div><dt>Last seen</dt><dd>{formatDateTime(tp.lastAttemptedAt)}</dd></div>
                </dl>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default WeakTopicsPage;
