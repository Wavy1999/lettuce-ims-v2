// ============================================================
//  Shared Hooks
// ============================================================

import { useState, useCallback, useMemo } from 'react';
import { useAppStore }   from '../../core/providers/AppStore';
import type { ToastType, PaginationState } from '../types';

// ── useToast ───────────────────────────────────────────────
export function useToast() {
  const { pushToast } = useAppStore(s => ({ pushToast: s.pushToast }));

  return useMemo(() => ({
    success: (msg: string)  => pushToast('success', msg),
    error:   (msg: string)  => pushToast('error',   msg),
    warning: (msg: string)  => pushToast('warning', msg),
    info:    (msg: string)  => pushToast('info',    msg),
    show:    (type: ToastType, msg: string) => pushToast(type, msg),
  }), [pushToast]);
}

// ── usePagination ──────────────────────────────────────────
export function usePagination<T>(items: T[], perPage = 10) {
  const [page, setPage] = useState(1);

  const total    = items.length;
  const pages    = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, pages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, safePage, perPage]);

  const state: PaginationState = { page: safePage, perPage, total };

  const goTo   = useCallback((p: number) => setPage(Math.max(1, Math.min(p, pages))), [pages]);
  const next   = useCallback(() => goTo(safePage + 1), [goTo, safePage]);
  const prev   = useCallback(() => goTo(safePage - 1), [goTo, safePage]);
  const reset  = useCallback(() => setPage(1), []);

  return { paged, state, pages, goTo, next, prev, reset };
}

// ── useSort ────────────────────────────────────────────────
export function useSort<T>(initialColumn: keyof T | null = null) {
  const [column, setColumn]    = useState<keyof T | null>(initialColumn);
  const [direction, setDir]    = useState<'asc' | 'desc'>('asc');

  const sort = useCallback((col: keyof T) => {
    setColumn(prev => {
      if (prev === col) {
        setDir(d => d === 'asc' ? 'desc' : 'asc');
        return col;
      }
      setDir('asc');
      return col;
    });
  }, []);

  const sorted = useCallback((items: T[]): T[] => {
    if (!column) return items;
    return [...items].sort((a, b) => {
      const av = a[column];
      const bv = b[column];
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return direction === 'asc' ? cmp : -cmp;
    });
  }, [column, direction]);

  return { column, direction, sort, sorted };
}

// ── useSelection ──────────────────────────────────────────
export function useSelection<T extends string>() {
  const [selected, setSelected] = useState<Set<T>>(new Set());

  const toggle = useCallback((id: T) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: T[], checked: boolean) => {
    setSelected(checked ? new Set(ids) : new Set());
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  return {
    selected,
    toggle,
    toggleAll,
    clear,
    isSelected: (id: T) => selected.has(id),
    count: selected.size,
    ids: Array.from(selected),
  };
}

// ── useDebounce ────────────────────────────────────────────
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useState(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  });

  return debounced;
}
