import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { attemptsApi } from '@/api';
import { Card, CardHeader, Badge, Pagination, Spinner, EmptyState, Button } from '@/components/common';
import { formatPercent, formatDateTime, formatDuration } from '@/utils/format';
import styles from './AttemptsHistoryPage.module.scss';

const PAGE_LIMIT = 10;

export function AttemptsHistoryPage() {
  const [page, setPage] = useState(1);

  const attemptsQ = useQuery({
    queryKey: ['attempts', 'me', { page }],
    queryFn: () => attemptsApi.listMine({ page, limit: PAGE_LIMIT }),
    keepPreviousData: true,
  });

  const items = attemptsQ.data?.items || [];
  const meta = attemptsQ.data?.meta || {};
  const totalPages = meta.totalPages || 1;

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.title}>My attempts</h1>
        <p className={styles.subtitle}>Every quiz you've taken — tap any row to review.</p>
      </header>

      <Card padding="none" className={styles.tableCard}>
        <CardHeader title="History" subtitle={`${meta.total ?? 0} total attempts`} />
        {attemptsQ.isLoading ? (
          <Spinner size="lg" />
        ) : items.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No attempts yet"
            description="Take your first quiz from the dashboard to start building your history."
            action={<Link to="/"><Button>Browse quizzes</Button></Link>}
          />
        ) : (
          <ul className={styles.list}>
            {items.map((a) => (
              <li key={a._id || a.id}>
                <Link to={`/attempts/${a._id || a.id}`} className={styles.row}>
                  <div className={styles.rowMain}>
                    <Badge tone={a.score >= 80 ? 'success' : a.score >= 50 ? 'warning' : 'danger'}>
                      {a.score}%
                    </Badge>
                    <span className={styles.rowMeta}>
                      <strong>{a.correctCount}</strong> / {a.totalQuestions} correct
                      <span className={styles.dot}>·</span>
                      {formatPercent(a.accuracy ?? 0)} accuracy
                    </span>
                  </div>
                  <div className={styles.rowSide}>
                    <span>{formatDuration(a.durationSec)}</span>
                    <span className={styles.dim}>{formatDateTime(a.submittedAt)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </Card>
    </div>
  );
}

export default AttemptsHistoryPage;
