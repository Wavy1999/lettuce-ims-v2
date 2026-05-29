// ============================================================
//  AppProvider  –  Root initializer (Angular APP_INITIALIZER equiv.)
//  Subscribes to Supabase auth state; loads farm + settings.
// ============================================================

import React, { useEffect } from 'react';
import { authService }     from '../services/AuthService';
import { settingsService } from '../services/SettingsService';
import { supabase }        from '../supabase/client';
import { useAppStore }     from './AppStore';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { setUser, setFarm, setSettings, setLoading, toggleDark, darkMode } =
    useAppStore(s => ({
      setUser:     s.setUser,
      setFarm:     s.setFarm,
      setSettings: s.setSettings,
      setLoading:  s.setLoading,
      toggleDark:  s.toggleDark,
      darkMode:    s.darkMode,
    }));

  // Apply initial dark-mode class
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  // Bootstrap: resolve session → load farm + settings
  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      setLoading(true);

      // 1. Check existing session
      const user = await authService.getCurrentUser();
      if (!mounted) return;

      setUser(user);

      if (user) {
        await loadFarmContext(user.id);
      }

      setLoading(false);
    }

    // 2. Listen for auth changes
    const { data: listener } = authService.onAuthStateChange(async (user) => {
      if (!mounted) return;
      setUser(user);

      if (user) {
        await loadFarmContext(user.id);
      } else {
        setFarm(null);
        setSettings(null);
      }
    });

    bootstrap();

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadFarmContext(userId: string) {
    // Look up or create farm for this user
    const { data: farms } = await supabase
      .from('farms')
      .select('*')
      .eq('owner_id', userId)
      .limit(1);

    let farm = farms?.[0] ?? null;

    if (!farm) {
      const { data: newFarm } = await supabase
        .from('farms')
        .insert({ name: 'My Farm', owner_id: userId })
        .select()
        .single();
      farm = newFarm;
    }

    if (farm) {
      setFarm(farm);
      const settingsResult = await settingsService.getOrCreate(farm.id);
      if (settingsResult.data) setSettings(settingsResult.data);
    }
  }

  return <>{children}</>;
};
