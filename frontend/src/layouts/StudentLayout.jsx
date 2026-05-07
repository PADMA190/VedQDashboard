import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/common';
import styles from './StudentLayout.module.scss';

const NAV_ITEMS = [
  { to: '/', label: 'Assigned Quizzes', end: true, icon: '📋' },
  { to: '/attempts', label: 'My Attempts', icon: '📜' },
  { to: '/weak-topics', label: 'Weak Topics', icon: '🎯' },
  { to: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
];

export function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.shell}>
      <aside className={clsx(styles.sidebar, navOpen && styles.open)} aria-label="Primary">
        <div className={styles.brand}>
          <Link to="/" className={styles.brandLink} onClick={() => setNavOpen(false)}>
  <img
    src="https://www.vedantu.com/cdn/vsk/images/favicon/favicon-16x16.png"
    alt="Vedantu Logo"
    className={styles.brandDot}
  />
            VedQ
          </Link>

        </div>
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setNavOpen(false)}
              className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
            >
              <span className={styles.icon} aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.burger}
            aria-label="Toggle navigation"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((v) => !v)}
          >
            ☰
          </button>
          <div className={styles.topbarRight}>
            <Link to="/profile" className={styles.profileLink} aria-label="View profile">
              <div className={styles.userMeta}>
                <span className={styles.userName}>{user?.name || 'You'}</span>
                {user?.class && <span className={styles.userClass}>Class {user.class}</span>}
              </div>
              <span className={styles.profileAvatar} aria-hidden>
                {user?.name?.[0]?.toUpperCase() || '?'}
              </span>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>Sign out</Button>
          </div>
        </header>

        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default StudentLayout;
