import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/common';
import styles from './AdminLayout.module.scss';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', end: true, icon: '📊' },
  { to: '/admin/quizzes', label: 'Quizzes', icon: '📝' },
  { to: '/admin/questions', label: 'Questions', icon: '❓' },
  { to: '/admin/questions/bulk', label: 'Bulk import', icon: '⤴️' },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.shell}>
      <aside className={clsx(styles.sidebar, navOpen && styles.open)} aria-label="Admin navigation">
        <div className={styles.brand}>
<Link
  to="/admin"
  className={styles.brandLink}
  onClick={() => setNavOpen(false)}
>
  <img
    src="https://www.vedantu.com/cdn/vsk/images/favicon/favicon-16x16.png"
    alt="Vedantu Logo"
    className={styles.brandDot}
  />

  <span>
    VedQ <span className={styles.brandTag}>Admin</span>
  </span>
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
          <div className={styles.right}>
            <span className={styles.user}>{user?.name}</span>
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

export default AdminLayout;
