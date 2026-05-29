// ============================================================
//  AuthService  (Angular-style singleton service)
//  Handles Supabase Auth: sign-in, sign-out, session watch.
// ============================================================

import { SupabaseClient, Session } from '@supabase/supabase-js';
import type { User, ServiceResult } from '../../shared/types';
import { supabase } from '../supabase/client';

export class AuthService {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient = supabase) {
    this.client = client;
  }

  // ── Sign In ────────────────────────────────────────────────
  async signIn(email: string, password: string): Promise<ServiceResult<User>> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return { data: null, error: error?.message ?? 'Login failed' };
    }

    return {
      data: this.mapUser(data.user),
      error: null,
    };
  }

  // ── Sign Out ───────────────────────────────────────────────
  async signOut(): Promise<ServiceResult<void>> {
    const { error } = await this.client.auth.signOut();
    if (error) return { data: null, error: error.message };
    return { data: undefined, error: null };
  }

  // ── Get Current Session ────────────────────────────────────
  async getSession(): Promise<Session | null> {
    const { data } = await this.client.auth.getSession();
    return data.session;
  }

  // ── Get Current User ───────────────────────────────────────
  async getCurrentUser(): Promise<User | null> {
    const { data } = await this.client.auth.getUser();
    return data.user ? this.mapUser(data.user) : null;
  }

  // ── Update Password ────────────────────────────────────────
  async updatePassword(newPassword: string): Promise<ServiceResult<void>> {
    const { error } = await this.client.auth.updateUser({
      password: newPassword,
    });
    if (error) return { data: null, error: error.message };
    return { data: undefined, error: null };
  }

  // ── Session Change Listener ────────────────────────────────
  onAuthStateChange(callback: (user: User | null) => void) {
    return this.client.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ? this.mapUser(session.user) : null);
    });
  }

  // ── Private mapper ─────────────────────────────────────────
  private mapUser(raw: { id: string; email?: string }): User {
    return {
      id: raw.id,
      email: raw.email ?? '',
      role: 'Admin',           // extend with user_metadata when needed
    };
  }
}

// Singleton instance (Angular's providedIn: 'root' equivalent)
export const authService = new AuthService();
