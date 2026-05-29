// ============================================================
//  DataTable  –  Generic sortable, paginated table
// ============================================================

import React from "react";
import type { PaginationState } from "../../../types";
import styles from "./DataTable.module.css";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (row: T) => React.ReactNode;
  /** data-testid suffix */
  testId?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  pagination?: PaginationState;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  sortColumn?: string | null;
  sortDir?: "asc" | "desc";
  onSort?: (col: string) => void;
  selectable?: boolean;
  selected?: Set<string>;
  onToggleRow?: (id: string) => void;
  onToggleAll?: (ids: string[], checked: boolean) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  testId?: string;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  pagination,
  totalPages = 1,
  onPageChange,
  sortColumn,
  sortDir,
  onSort,
  selectable,
  selected,
  onToggleRow,
  onToggleAll,
  loading,
  emptyMessage = "No data found.",
  className = "",
  testId,
}: DataTableProps<T>) {
  const allIds = data.map(rowKey);
  const allChecked =
    selectable && allIds.length > 0 && allIds.every((id) => selected?.has(id));

  return (
    <div className={`${styles.wrapper} ${className}`} data-testid={testId}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {selectable && (
                <th className={styles.checkCell}>
                  <input
                    type="checkbox"
                    checked={!!allChecked}
                    onChange={(e) => onToggleAll?.(allIds, e.target.checked)}
                    data-testid="select-all"
                    aria-label="Select all"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  style={{ width: col.width }}
                  className={col.sortable ? styles.sortable : ""}
                  onClick={
                    col.sortable ? () => onSort?.(String(col.key)) : undefined
                  }
                  data-testid={`th-${String(col.key)}`}
                >
                  {col.header}
                  {col.sortable && (
                    <span className={styles.sortIcon}>
                      {sortColumn === col.key
                        ? sortDir === "asc"
                          ? " ↑"
                          : " ↓"
                        : " ↕"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody data-testid="table-body">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className={styles.empty}
                >
                  <div className="spinner" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className={styles.empty}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const id = rowKey(row);
                return (
                  <tr
                    key={id}
                    className={selected?.has(id) ? styles.selectedRow : ""}
                    data-testid={`row-${id}`}
                  >
                    {selectable && (
                      <td className={styles.checkCell}>
                        <input
                          type="checkbox"
                          checked={selected?.has(id) ?? false}
                          onChange={() => onToggleRow?.(id)}
                          data-testid={`check-${id}`}
                          aria-label={`Select row ${id}`}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        data-testid={
                          col.testId ? `${col.testId}-${id}` : undefined
                        }
                      >
                        {col.render
                          ? col.render(row)
                          : String(
                              (row as Record<string, unknown>)[
                                col.key as string
                              ] ?? "",
                            )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className={styles.pagination} data-testid="pagination">
          <span className={styles.pageInfo}>
            Page {pagination.page} / {totalPages}
            &nbsp;({pagination.total} total)
          </span>
          <div className={styles.pageButtons}>
            <button
              onClick={() => onPageChange?.(1)}
              disabled={pagination.page === 1}
              data-testid="pg-first"
            >
              «
            </button>
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page === 1}
              data-testid="pg-prev"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - pagination.page) <= 2)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => onPageChange?.(p)}
                  className={p === pagination.page ? styles.activePage : ""}
                  data-testid={`pg-${p}`}
                >
                  {p}
                </button>
              ))}
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page === totalPages}
              data-testid="pg-next"
            >
              ›
            </button>
            <button
              onClick={() => onPageChange?.(totalPages)}
              disabled={pagination.page === totalPages}
              data-testid="pg-last"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
