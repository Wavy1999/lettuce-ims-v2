// ============================================================
//  StatusBadge  –  Inventory/Order status pill
// ============================================================

import React from 'react';
import type { StockStatus, OrderStatus } from '../../../types';
import styles from './StatusBadge.module.css';

type AnyStatus = StockStatus | OrderStatus;

const CONFIG: Record<AnyStatus, { label: string; cls: string }> = {
  'in-stock':    { label: 'In Stock',    cls: 'inStock'    },
  'low-stock':   { label: 'Low Stock',   cls: 'lowStock'   },
  'out-of-stock':{ label: 'Out of Stock',cls: 'outOfStock' },
  'pending':     { label: 'Pending',     cls: 'pending'    },
  'fulfilled':   { label: 'Fulfilled',   cls: 'fulfilled'  },
  'cancelled':   { label: 'Cancelled',   cls: 'cancelled'  },
};

interface StatusBadgeProps {
  status: AnyStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const cfg = CONFIG[status] ?? { label: status, cls: 'inStock' };
  return (
    <span
      className={`${styles.badge} ${styles[cfg.cls]} ${className}`}
      data-testid={`status-badge-${status}`}
    >
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
