// ============================================================
//  AppStore  –  Zustand global store
//  Angular equivalent: NgRx store / BehaviorSubject services
// ============================================================

import { create } from 'zustand';
import type {
  User, Farm, AppSettings, Toast, ToastType,
} from '../../shared/types';

// ── Toast helpers ──────────────────────────────────────────
function newToast(type: ToastType, message: string): Toast {
  return { id: `toast_${Date.now()}_${Math.random()}`, type, message };
}

// ── State shape ────────────────────────────────────────────
interface AppState {
  // Auth
  user:          User | null;
  isLoading:     boolean;
  // Farm context
  farm:          Farm | null;
  // Settings
  settings:      AppSettings | null;
  // Dark mode
  darkMode:      boolean;
  // Toasts
  toasts:        Toast[];

  // Actions
  setUser:       (user: User | null) => void;
  setLoading:    (v: boolean) => void;
  setFarm:       (farm: Farm | null) => void;
  setSettings:   (s: AppSettings | null) => void;
  toggleDark:    () => void;
  pushToast:     (type: ToastType, message: string) => void;
  removeToast:   (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user:       null,
  isLoading:  true,
  farm:       null,
  settings:   null,
  darkMode:   localStorage.getItem('lims_dark') === 'true',
  toasts:     [],

  setUser:    (user) => set({ user }),
  setLoading: (v)    => set({ isLoading: v }),
  setFarm:    (farm) => set({ farm }),
  setSettings:(s)    => set({ settings: s }),

  toggleDark: () => {
    const next = !get().darkMode;
    set({ darkMode: next });
    localStorage.setItem('lims_dark', String(next));
    document.body.classList.toggle('dark-mode', next);
  },

  pushToast: (type, message) => {
    const toast = newToast(type, message);
    set(s => ({ toasts: [...s.toasts, toast] }));
    // Auto-dismiss after 3.5 s
    setTimeout(() => get().removeToast(toast.id), 3500);
  },

  removeToast: (id) =>
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));
