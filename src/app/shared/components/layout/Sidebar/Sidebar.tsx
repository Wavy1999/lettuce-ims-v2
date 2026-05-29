// ============================================================
//  Sidebar  –  Navigation layout component
// ============================================================

import React from "react";
import { useAppStore } from "../../../../core/providers/AppStore";
import styles from "./Sidebar.module.css";

export interface NavItem {
  page: string;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { page: "dashboard", icon: "fa-gauge-high", label: "Dashboard" },
  { page: "inventory", icon: "fa-boxes-stacked", label: "Inventory" },
  { page: "sales", icon: "fa-receipt", label: "Sales" },
  { page: "orders", icon: "fa-truck", label: "Orders" },
  { page: "reports", icon: "fa-chart-bar", label: "Reports" },
  { page: "settings", icon: "fa-gear", label: "Settings" },
];

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  open: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  open,
  onClose,
}) => {
  const { settings } = useAppStore((s) => ({ settings: s.settings }));
  const appName = settings?.app_name ?? "AG Lettuce Be Fresh";
  const subtitle = "Inventory Management System";
  console.log("settings:", settings);
  console.log("app_name:", settings?.app_name);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className={styles.overlay}
          onClick={onClose}
          data-testid="sidebar-overlay"
          aria-hidden
        />
      )}

      <aside
        className={`${styles.sidebar} ${open ? styles.open : ""}`}
        data-testid="sidebar"
        aria-label="Main navigation"
      >
        <div className={styles.header}>
          <span className={styles.logo}>🥬</span>
          <div>
            <div className={styles.title}>{appName}</div>
            <div className={styles.subtitle}>{subtitle}</div>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Pages">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.page}
              className={activePage === item.page ? styles.active : ""}
              onClick={() => {
                onNavigate(item.page);
                onClose();
              }}
              data-testid={`nav-${item.page}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onNavigate(item.page)}
              aria-current={activePage === item.page ? "page" : undefined}
            >
              <i className={`fa-solid ${item.icon}`} aria-hidden />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <footer className={styles.footer}>
          <p className={styles.footerCopy}>
            © {new Date().getFullYear()} AG Lettuce Be Fresh. All rights
            reserved.{" "}
            <span className={styles.footerPowered}>Powered by Wave</span>
          </p>
        </footer>
      </aside>
    </>
  );
};

export default Sidebar;
