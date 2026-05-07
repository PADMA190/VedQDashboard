import { Outlet, Link } from 'react-router-dom';
import styles from './AuthLayout.module.scss';

export function AuthLayout() {
  return (
    <div className={styles.shell}>
      <aside className={styles.brandPane} aria-hidden>
        <div className={styles.brandInner}>
          <Link to="/" className={styles.brand}>
            {/* <span className={styles.dot} /> */}
            Student Quiz Dashboard
          </Link>
          <h1 className={styles.tagline}>Practice smarter. Track every weak topic.</h1>
          <p className={styles.lede}>
            Multi-subject quiz practice for classes 6–12 with personalized weak-topic retry,
            attempt analytics, and live leaderboards.
          </p>
          <ul className={styles.bullets}>
            <li>Server-graded attempts</li>
            <li>Weak-topic detection &amp; retry quizzes</li>
            <li>Subject &amp; class leaderboards</li>
          </ul>
        </div>
      </aside>
      <main className={styles.formPane}>
        <div className={styles.formInner}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AuthLayout;
