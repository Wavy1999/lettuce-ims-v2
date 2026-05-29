// ============================================================
//  Navbar  –  Top navigation bar
// ============================================================

import React from 'react';
import { useAppStore }  from '../../../../core/providers/AppStore';
import { authService }  from '../../../../core/services/AuthService';
import { useToast }     from '../../../hooks';
import styles from './Navbar.module.css';

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  inventory: 'Inventory',
  sales:     'Sales',
  orders:    'Orders',
  settings:  'Settings',
};

interface NavbarProps {
  activePage:      string;
  onHamburger:     () => void;
  lowStockCount?:  number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage, onHamburger, lowStockCount = 0,
}) => {
  const { user, darkMode, toggleDark } = useAppStore(s => ({
    user:       s.user,
    darkMode:   s.darkMode,
    toggleDark: s.toggleDark,
  }));
  const toast = useToast();

  async function handleLogout() {
    await authService.signOut();
    toast.info('Logged out.');
  }

  return (
    <header className={styles.navbar} data-testid="navbar">
      <div className={styles.left}>
        <button
          className={styles.hamburger}
          onClick={onHamburger}
          aria-label="Toggle navigation"
          data-testid="hamburger"
        >
          <i className="fa-solid fa-bars" />
        </button>
        <span className={styles.pageTitle} data-testid="page-title">
          {PAGE_TITLES[activePage] ?? activePage}
        </span>
      </div>

      <div className={styles.right}>
        {/* Low stock alert */}
        {lowStockCount > 0 && (
          <button
            className={styles.notifBtn}
            title={`${lowStockCount} items low/out of stock`}
            data-testid="notif-btn"
            aria-label={`${lowStockCount} stock alerts`}
          >
            <i className="fa-solid fa-bell" />
            <span className={styles.notifBadge}>{lowStockCount}</span>
          </button>
        )}

        {/* Theme toggle */}
        <button
          className={styles.themeBtn}
          onClick={toggleDark}
          aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
          data-testid="theme-toggle"
        >
          <i className={`fa-solid ${darkMode ? 'fa-sun' : 'fa-moon'}`} />
        </button>

        {/* User + logout */}
        <div className={styles.userArea} data-testid="user-area">
          <span className={styles.userInitial} aria-hidden>
            {user?.email?.[0]?.toUpperCase() ?? 'U'}
          </span>
          <span className={styles.userEmail}>{user?.email ?? 'User'}</span>
          <button
            className={styles.logoutBtn}
            onClick={handleLogout}
            title="Log out"
            data-testid="logout-btn"
            aria-label="Log out"
          >
            <i className="fa-solid fa-right-from-bracket" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
