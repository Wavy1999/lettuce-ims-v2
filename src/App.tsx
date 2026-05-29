// ============================================================
//  App.tsx  –  Root router + layout shell
// ============================================================

import React, { useState, useCallback } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AppProvider } from "./app/core/providers/AppProvider";
import { AuthGuard } from "./app/core/guards/AuthGuard";

import { Sidebar } from "./app/shared/components/layout/Sidebar/Sidebar";
import { Navbar } from "./app/shared/components/layout/Navbar/Navbar";
import { ToastContainer } from "./app/shared/components/ui/Toast/Toast";

import { LoginPage } from "./app/features/auth/LoginPage";
import { DashboardPage } from "./app/features/dashboard/DashboardPage";
import { InventoryPage } from "./app/features/inventory/InventoryPage";
import { SalesPage } from "./app/features/sales/SalesPage";
import { OrdersPage } from "./app/features/orders/OrdersPage";
import { ReportsPage } from "./app/features/reports/ReportsPage";
import { SettingsPage } from "./app/features/settings/SettingsPage";

import "./styles/variables.css";
import "./styles/globals.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

// ── AppShell  (authenticated layout) ─────────────────────
const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activePage = location.pathname.replace("/", "") || "dashboard";

  const onNavigate = useCallback(
    (page: string) => {
      navigate(`/${page}`);
    },
    [navigate],
  );

  return (
    <div className="app-container" data-testid="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="main-content">
        <Navbar
          activePage={activePage}
          onHamburger={() => setSidebarOpen((s) => !s)}
        />
        <div className="page-content">
          <Routes>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

// ── Root App ──────────────────────────────────────────────
const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <AuthGuard>
                <AppShell />
              </AuthGuard>
            }
          />
        </Routes>
        <ToastContainer />
      </AppProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
