// ============================================================
//  DashboardPage  –  Analytics overview
// ============================================================

import React, { useMemo } from 'react';
import { useQuery }        from '@tanstack/react-query';
import { Line, Bar }       from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { inventoryService } from '../../core/services/InventoryService';
import { salesService }     from '../../core/services/SalesService';
import { ordersService }    from '../../core/services/OrdersService';
import { useAppStore }      from '../../core/providers/AppStore';
import type { DashboardStats } from '../../shared/types';
import styles from './DashboardPage.module.css';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
);

// ── Stats Card ─────────────────────────────────────────────
interface StatsCardProps {
  icon:    string;
  label:   string;
  value:   string | number;
  sub?:    string;
  accent?: string;
  testId?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon, label, value, sub, accent = '#40916c', testId,
}) => (
  <div className={styles.statCard} data-testid={testId}>
    <div className={styles.statIcon} style={{ background: `${accent}22`, color: accent }}>
      <i className={`fa-solid ${icon}`} />
    </div>
    <div className={styles.statBody}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue} data-testid={`${testId}-value`}>{value}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  </div>
);

// ── Main Page ──────────────────────────────────────────────
export const DashboardPage: React.FC = () => {
  const { farm, settings, darkMode } = useAppStore(s => ({
    farm:     s.farm,
    settings: s.settings,
    darkMode: s.darkMode,
  }));

  const farmId    = farm?.id ?? '';
  const threshold = settings?.low_stock_threshold ?? 15;

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory', farmId],
    queryFn:  () => inventoryService.list(farmId).then(r => r.data ?? []),
    enabled:  !!farmId,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales', farmId],
    queryFn:  () => salesService.list(farmId).then(r => r.data ?? []),
    enabled:  !!farmId,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders', farmId],
    queryFn:  () => ordersService.list(farmId).then(r => r.data ?? []),
    enabled:  !!farmId,
  });

  const stats: DashboardStats = useMemo(() => ({
    totalProducts:       inventory.length,
    totalInventoryValue: inventory.reduce((s, i) => s + i.total_value, 0),
    totalSalesRevenue:   salesService.getTotalRevenue(sales),
    pendingOrders:       orders.filter(o => o.status === 'pending').length,
    lowStockCount:       inventory.filter(i => i.status === 'low-stock').length,
    outOfStockCount:     inventory.filter(i => i.status === 'out-of-stock').length,
  }), [inventory, sales, orders]);

  const salesByDay = useMemo(
    () => salesService.getSalesByDay(sales.slice(0, 30)),
    [sales]
  );

  const chartColors = {
    grid:   darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    text:   darkMode ? '#b0b8c0' : '#4a5568',
    line:   '#40916c',
    fill:   darkMode ? 'rgba(64,145,108,0.18)' : 'rgba(64,145,108,0.12)',
    bar:    '#52b788',
  };

  const lineData = {
    labels:   salesByDay.map(d => d.label),
    datasets: [{
      label:           'Revenue (₱)',
      data:            salesByDay.map(d => d.value),
      borderColor:     chartColors.line,
      backgroundColor: chartColors.fill,
      fill:            true,
      tension:         0.4,
      pointRadius:     4,
      pointHoverRadius: 7,
    }],
  };

  // Top 5 products by inventory value
  const top5 = [...inventory]
    .sort((a, b) => b.total_value - a.total_value)
    .slice(0, 5);

  const barData = {
    labels:   top5.map(i => i.name),
    datasets: [{
      label:           'Total Value (₱)',
      data:            top5.map(i => i.total_value),
      backgroundColor: chartColors.bar,
      borderRadius:    6,
    }],
  };

  const chartOptions = {
    responsive:          true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: chartColors.text, font: { family: 'DM Sans, sans-serif' } } },
    },
    scales: {
      x: { ticks: { color: chartColors.text }, grid: { color: chartColors.grid } },
      y: { ticks: { color: chartColors.text }, grid: { color: chartColors.grid } },
    },
  };

  const fmt = (n: number) =>
    `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  return (
    <section className={styles.page} data-testid="dashboard-page">
      {/* Stats grid */}
      <div className={styles.statsGrid} data-testid="stats-grid">
        <StatsCard
          icon="fa-boxes-stacked" label="Total Products"
          value={stats.totalProducts}
          testId="stat-products"
        />
        <StatsCard
          icon="fa-peso-sign" label="Inventory Value"
          value={fmt(stats.totalInventoryValue)}
          testId="stat-inv-value"
        />
        <StatsCard
          icon="fa-chart-line" label="Sales Revenue"
          value={fmt(stats.totalSalesRevenue)}
          accent="#3498db"
          testId="stat-revenue"
        />
        <StatsCard
          icon="fa-truck" label="Pending Orders"
          value={stats.pendingOrders}
          accent="#e67e22"
          testId="stat-pending-orders"
        />
        <StatsCard
          icon="fa-triangle-exclamation" label="Low Stock"
          value={stats.lowStockCount}
          accent="#f39c12"
          sub={`${stats.outOfStockCount} out of stock`}
          testId="stat-low-stock"
        />
      </div>

      {/* Charts row */}
      <div className={styles.chartsRow}>
        <div className={styles.chartCard} data-testid="revenue-chart">
          <h3 className={styles.chartTitle}>
            <i className="fa-solid fa-chart-line" /> Daily Sales Revenue
          </h3>
          <div className={styles.chartWrap}>
            {salesByDay.length > 0
              ? <Line data={lineData} options={chartOptions} />
              : <p className={styles.noData}>No sales data yet.</p>
            }
          </div>
        </div>

        <div className={styles.chartCard} data-testid="top-products-chart">
          <h3 className={styles.chartTitle}>
            <i className="fa-solid fa-ranking-star" /> Top Products by Value
          </h3>
          <div className={styles.chartWrap}>
            {top5.length > 0
              ? <Bar data={barData} options={chartOptions} />
              : <p className={styles.noData}>No inventory data yet.</p>
            }
          </div>
        </div>
      </div>

      {/* Recent Sales table */}
      <div className={styles.recentCard} data-testid="recent-sales">
        <h3 className={styles.chartTitle}>
          <i className="fa-solid fa-receipt" /> Recent Sales
        </h3>
        <table className={styles.recentTable}>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {sales.slice(0, 8).map(s => (
              <tr key={s.id} data-testid={`recent-sale-${s.id}`}>
                <td><code>{s.transaction_id}</code></td>
                <td>{s.product_name}</td>
                <td>{s.quantity_sold}</td>
                <td>{fmt(s.total_amount)}</td>
                <td>{new Date(s.sale_date).toLocaleDateString()}</td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign:'center', padding:24, opacity:0.5 }}>No sales yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default DashboardPage;
