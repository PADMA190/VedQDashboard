import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { leaderboardApi } from '@/api';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, Select, Spinner, EmptyState, Badge } from '@/components/common';
import { formatPercent } from '@/utils/format';
import styles from './LeaderboardPage.module.scss';

const SUBJECTS = [
  { value: '', label: 'All subjects' },
  ...['Maths', 'Physics', 'Chemistry', 'English', 'Biology'].map((s) => ({ value: s, label: s })),
];

const PERIODS = [
  { value: 'all', label: 'All-time' },
  { value: 'monthly', label: 'Last 30 days' },
  { value: 'weekly', label: 'Last 7 days' },
];

const RANK_TONES = ['warning', 'neutral', 'info'];

export function LeaderboardPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [period, setPeriod] = useState('all');

  const lbQ = useQuery({
    queryKey: ['leaderboard', { subject, period }],
    queryFn: () => leaderboardApi.fetch({ subject, period }),
    keepPreviousData: true,
  });

  const items = lbQ.data?.items || [];

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.title}>Leaderboard</h1>
        <p className={styles.subtitle}>Top performers by average best-score across qualifying quizzes.</p>
      </header>

      <Card padding="md" className={styles.filters}>
        <CardHeader title="Filter" subtitle="Narrow by subject and time window." />
        <div className={styles.filterRow}>
          <Select
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            options={SUBJECTS}
          />
          <Select
            label="Period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={PERIODS}
          />
        </div>
      </Card>

      <Card padding="none">
        {lbQ.isLoading ? (
          <Spinner size="lg" />
        ) : items.length === 0 ? (
          <EmptyState
            icon="🏆"
            title="Leaderboard is empty"
            description="No qualifying attempts in this slice yet. Try a wider period or another subject."
          />
        ) : (
          <ol className={styles.list}>
            {items.map((row) => {
              const isMe = row.userId === user?.id;
              const tone = RANK_TONES[row.rank - 1] || 'neutral';
              return (
                <li key={row.userId} className={isMe ? styles.me : undefined}>
                  <div className={styles.row}>
                    <div className={styles.rankCol}>
                      <Badge tone={tone} size="md">#{row.rank}</Badge>
                    </div>
                    <div className={styles.who}>
                      <strong>{row.name} {isMe && <span className={styles.youTag}>you</span>}</strong>
                      <span className={styles.dim}>Class {row.class}</span>
                    </div>
                    <div className={styles.scoreCol}>
                      <span className={styles.score}>{Math.round(row.score)}</span>
                      <span className={styles.dim}>{formatPercent(row.accuracy)}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </div>
  );
}

export default LeaderboardPage;
