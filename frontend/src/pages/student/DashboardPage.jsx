import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { quizzesApi, analyticsApi } from '@/api';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Card, CardHeader, Input, Select, Pagination, Spinner, EmptyState, Button, Badge,
} from '@/components/common';
import { QuizCard } from '@/components/student';
import { formatPercent } from '@/utils/format';
import styles from './DashboardPage.module.scss';

const SUBJECTS = ['Maths', 'Physics', 'Chemistry', 'English', 'Biology'];
const PAGE_LIMIT = 9;

export function DashboardPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 350);

  const quizzesQ = useQuery({
    queryKey: ['quizzes', { subject, search: debouncedSearch, page }],
    queryFn: () =>
      quizzesApi.list({
        page,
        limit: PAGE_LIMIT,
        subject: subject || undefined,
        search: debouncedSearch || undefined,
      }),
    keepPreviousData: true,
  });

  const summaryQ = useQuery({
    queryKey: ['analytics', 'overall', user?.id],
    queryFn: () => analyticsApi.overall(user.id),
    enabled: Boolean(user?.id),
  });

  const items = quizzesQ.data?.items || [];
  const meta = quizzesQ.data?.meta || {};
  const totalPages = meta.totalPages || 1;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <h1 className={styles.title}>Hi {user?.name?.split(' ')[0] || 'there'} 👋</h1>
          <p className={styles.subtitle}>
            Pick a quiz to practice or jump into a focused weak-topics session.
          </p>
        </div>
        <SummaryStrip data={summaryQ.data} loading={summaryQ.isLoading} />
      </header>

      <Card padding="md" className={styles.filters}>
        <CardHeader title="Available quizzes" subtitle="Filter by subject or search by title." />
        <div className={styles.filterRow}>
          <Input
            placeholder="Search quizzes…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            fullWidth
          />
          <Select
            value={subject}
            onChange={(e) => { setSubject(e.target.value); setPage(1); }}
            placeholder="All subjects"
            options={SUBJECTS.map((s) => ({ value: s, label: s }))}
            fullWidth={false}
          />
        </div>
      </Card>

      {quizzesQ.isLoading ? (
        <Spinner size="lg" />
      ) : quizzesQ.isError ? (
        <EmptyState
          icon="⚠️"
          title="Couldn't load quizzes"
          description={quizzesQ.error?.message || 'Try refreshing the page.'}
          action={<Button onClick={() => quizzesQ.refetch()}>Retry</Button>}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon="📭"
          title="No quizzes match your filters"
          description="Try clearing the filters or asking your teacher to assign a quiz."
        />
      ) : (
        <>
          <div className={styles.grid}>
            {items.map((quiz) => (
              <QuizCard key={quiz.id || quiz._id} quiz={quiz} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

function SummaryStrip({ data, loading }) {
  if (loading || !data) {
    return <div className={styles.summary} aria-hidden />;
  }
  const s = data.summary || {};
  return (
    <div className={styles.summary}>
      <Stat label="Attempts" value={s.totalAttempts ?? 0} />
      <Stat label="Avg score" value={s.averageScore != null ? Math.round(s.averageScore) : '—'} />
      <Stat label="Avg accuracy" value={formatPercent(s.averageAccuracy ?? 0)} />
      <Stat
        label="Weak topics"
        value={s.weakTopicsCount ?? 0}
        emphasis={s.weakTopicsCount > 0 ? 'warning' : 'neutral'}
      />
    </div>
  );
}

function Stat({ label, value, emphasis = 'neutral' }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>
        {value} {emphasis === 'warning' && Number(value) > 0 && <Badge tone="warning" size="sm">focus</Badge>}
      </div>
    </div>
  );
}

export default DashboardPage;
