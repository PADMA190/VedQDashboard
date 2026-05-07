import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { analyticsApi } from '@/api';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, Badge, Spinner, Button } from '@/components/common';
import { TrendChart } from '@/components/student';
import { formatPercent } from '@/utils/format';
import styles from './ProfilePage.module.scss';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const overallQ = useQuery({
    queryKey: ['analytics', 'overall', user?.id],
    queryFn: () => analyticsApi.overall(user.id),
    enabled: Boolean(user?.id),
  });

  const data = overallQ.data;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.page}>
      <Card padding="md" className={styles.identity}>
        <div className={styles.avatar}>{user?.name?.[0]?.toUpperCase() || '?'}</div>
        <div className={styles.identityText}>
          <h1 className={styles.name}>{user?.name}</h1>
          <p className={styles.meta}>{user?.email}</p>
          <div className={styles.tags}>
            <Badge tone="primary">Class {user?.class}</Badge>
            <Badge tone="neutral">{user?.role}</Badge>
            {(user?.subjects || []).map((s) => (
              <Badge key={s} tone="info" size="sm">{s}</Badge>
            ))}
          </div>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={handleLogout}>Sign out</Button>
        </div>
      </Card>

      <div className={styles.summaryGrid}>
        {overallQ.isLoading ? (
          <Spinner size="lg" />
        ) : data ? (
          <>
            <Stat label="Total attempts" value={data.summary.totalAttempts} />
            <Stat label="Quizzes attempted" value={data.summary.totalQuizzesAttempted} />
            <Stat label="Average score" value={Math.round(data.summary.averageScore)} />
            <Stat label="Average accuracy" value={formatPercent(data.summary.averageAccuracy)} />
            <Stat label="Best score" value={data.summary.bestScore} />
            <Stat label="Weak topics" value={data.summary.weakTopicsCount} tone={data.summary.weakTopicsCount > 0 ? 'warn' : 'ok'} />
          </>
        ) : null}
      </div>

      <TrendChart data={data?.accuracyTrend || []} title="Accuracy trend (30 days)" />

      <Card padding="md">
        <CardHeader title="Subject breakdown" subtitle="Average score and accuracy by subject." />
        {!data?.subjectBreakdown?.length ? (
          <p className={styles.empty}>No subject data yet — take a quiz to populate this.</p>
        ) : (
          <ul className={styles.subjectList}>
            {data.subjectBreakdown.map((s) => (
              <li key={s.subject} className={styles.subjectRow}>
                <Badge tone="primary">{s.subject}</Badge>
                <span className={styles.subjectMeta}>
                  {s.attempts} attempts · {Math.round(s.averageScore)} avg score · {formatPercent(s.averageAccuracy)} accuracy
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, tone = 'default' }) {
  return (
    <Card padding="md" className={styles.statCard}>
      <span className={styles.statLabel}>{label}</span>
      <span className={`${styles.statValue} ${styles[`tone-${tone}`] || ''}`}>{value}</span>
    </Card>
  );
}

export default ProfilePage;
