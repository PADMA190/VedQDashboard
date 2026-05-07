import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { adminApi } from '@/api';
import { Card, Spinner, EmptyState, Badge, Button } from '@/components/common';
import { formatPercent, formatScore } from '@/utils/format';
import shared from './AdminPages.module.scss';
import styles from './AdminDashboardPage.module.scss';

export function AdminDashboardPage() {
  const statsQ = useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: () => adminApi.dashboardStats(),
    staleTime: 60_000,
  });

  if (statsQ.isLoading) return <Spinner size="lg" />;
  if (statsQ.isError || !statsQ.data) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load admin stats"
        description={statsQ.error?.message || 'Try again.'}
        action={<Button onClick={() => statsQ.refetch()}>Retry</Button>}
      />
    );
  }

  const s = statsQ.data;

  return (
    <div className={shared.page}>
      <header className={shared.head}>
        <div>
          <h1 className={shared.title}>Admin overview</h1>
          <p className={shared.subtitle}>
            Snapshot of users, content, and recent activity. Updates every few minutes.
          </p>
        </div>
        <div className={shared.actions}>
          <Link to="/admin/quizzes"><Button variant="secondary">Manage quizzes</Button></Link>
          <Link to="/admin/questions"><Button>Manage questions</Button></Link>
        </div>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>People</h2>
        <div className={styles.grid}>
          <StatCard label="Users" value={s.users.total} />
          <StatCard label="Students" value={s.users.students} />
          <StatCard label="Admins" value={s.users.admins} />
          <StatCard
            label="New signups (7d)"
            value={s.users.recentSignups7d}
            tone={s.users.recentSignups7d > 0 ? 'good' : 'neutral'}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Content</h2>
        <div className={styles.grid}>
          <StatCard label="Published quizzes" value={s.content.quizzes} hint="Excluding retry quizzes" />
          <StatCard label="Question bank" value={s.content.questions} />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Activity</h2>
        <div className={styles.grid}>
          <StatCard label="Total attempts" value={s.activity.totalAttempts} />
          <StatCard label="Last 30 days · attempts" value={s.activity.last30Days.attempts} />
          <StatCard
            label="Last 30 days · avg score"
            value={formatScore(s.activity.last30Days.averageScore)}
            tone="good"
          />
          <StatCard
            label="Last 30 days · avg accuracy"
            value={formatPercent(s.activity.last30Days.averageAccuracy)}
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, hint, tone = 'neutral' }) {
  return (
    <Card padding="md" className={styles.statCard}>
      <span className={styles.statLabel}>{label}</span>
      <span className={`${styles.statValue} ${styles[`tone-${tone}`] || ''}`}>{value}</span>
      {hint && <span className={styles.hint}>{hint}</span>}
    </Card>
  );
}

export default AdminDashboardPage;
