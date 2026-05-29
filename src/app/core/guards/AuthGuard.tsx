// ============================================================
//  AuthGuard  –  React equivalent of Angular's CanActivate guard.
//  Wraps protected <Route> elements; redirects unauthenticated.
// ============================================================

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../providers/AppStore';

interface AuthGuardProps {
  children: React.ReactNode;
  /** Optional: restrict to specific roles */
  requiredRole?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRole }) => {
  const { user, isLoading } = useAppStore(s => ({ user: s.user, isLoading: s.isLoading }));
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--bg-primary)',
      }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    // Preserve intended destination for post-login redirect
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
