// ============================================================
//  ReportsPage  –  Reports & Analytics feature
// ============================================================

import React, { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { inventoryService } from "../../core/services/InventoryService";
import { salesService } from "../../core/services/SalesService";
import { ordersService } from "../../core/services/OrdersService";
import { useAppStore } from "../../core/providers/AppStore";
import { useToast } from "../../shared/hooks";
import styles from "./ReportsPage.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

// ── Types ──────────────────────────────────────────────────
type ReportTab = "overview" | "sales" | "inventory" | "orders";
type DateRange = "7d" | "30d" | "90d" | "custom";

// ── Helpers ────────────────────────────────────────────────
const fmt = (n: number) =>
  `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });

function getDateBounds(range: DateRange, customFrom: string, customTo: string) {
  const to = new Date();
  const from = new Date();
  if (range === "7d") from.setDate(to.getDate() - 7);
  if (range === "30d") from.setDate(to.getDate() - 30);
  if (range === "90d") from.setDate(to.getDate() - 90);
  if (range === "custom") {
    return { from: customFrom, to: customTo };
  }
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

// ── Summary Card ───────────────────────────────────────────
interface SummaryCardProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  trend?: number;
}
const SummaryCard: React.FC<SummaryCardProps> = ({
  icon,
  label,
  value,
  sub,
  accent = "#40916c",
  trend,
}) => (
  <div className={styles.summaryCard}>
    <div
      className={styles.cardIcon}
      style={{ background: `${accent}22`, color: accent }}
    >
      <i className={`fa-solid ${icon}`} />
    </div>
    <div className={styles.cardBody}>
      <div className={styles.cardLabel}>{label}</div>
      <div className={styles.cardValue}>{value}</div>
      {sub && <div className={styles.cardSub}>{sub}</div>}
    </div>
    {trend !== undefined && (
      <div
        className={`${styles.trend} ${trend >= 0 ? styles.trendUp : styles.trendDown}`}
      >
        <i
          className={`fa-solid ${trend >= 0 ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}`}
        />
        {Math.abs(trend).toFixed(1)}%
      </div>
    )}
  </div>
);

// ── Main Page ──────────────────────────────────────────────
export const ReportsPage: React.FC = () => {
  const { farm, darkMode } = useAppStore((s) => ({
    farm: s.farm,
    darkMode: s.darkMode,
  }));
  const toast = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const [tab, setTab] = useState<ReportTab>("overview");
  const [range, setRange] = useState<DateRange>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // ── Data queries ───────────────────────────────────────────
  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory", farm?.id],
    queryFn: () => inventoryService.list(farm!.id).then((r) => r.data ?? []),
    enabled: !!farm?.id,
  });

  const { data: allSales = [] } = useQuery({
    queryKey: ["sales", farm?.id],
    queryFn: () => salesService.list(farm!.id).then((r) => r.data ?? []),
    enabled: !!farm?.id,
  });

  const { data: allOrders = [] } = useQuery({
    queryKey: ["orders", farm?.id],
    queryFn: () => ordersService.list(farm!.id).then((r) => r.data ?? []),
    enabled: !!farm?.id,
  });

  // ── Filter by date range ───────────────────────────────────
  const bounds = useMemo(
    () => getDateBounds(range, customFrom, customTo),
    [range, customFrom, customTo],
  );

  const sales = useMemo(
    () =>
      allSales.filter((s) => {
        const d = s.sale_date.slice(0, 10);
        return (
          (!bounds.from || d >= bounds.from) && (!bounds.to || d <= bounds.to)
        );
      }),
    [allSales, bounds],
  );

  const orders = useMemo(
    () =>
      allOrders.filter((o) => {
        const d = o.order_date;
        return (
          (!bounds.from || d >= bounds.from) && (!bounds.to || d <= bounds.to)
        );
      }),
    [allOrders, bounds],
  );

  // ── Computed stats ─────────────────────────────────────────
  const totalRevenue = useMemo(
    () => sales.reduce((s, i) => s + i.total_amount, 0),
    [sales],
  );
  const totalOrders = orders.length;
  const fulfilledOrders = orders.filter((o) => o.status === "fulfilled").length;
  const fulfillRate = totalOrders ? (fulfilledOrders / totalOrders) * 100 : 0;
  const avgOrderVal = totalOrders
    ? orders.reduce((s, o) => s + o.total_price, 0) / totalOrders
    : 0;
  const totalInvValue = inventory.reduce((s, i) => s + i.total_value, 0);
  const lowStockCount = inventory.filter(
    (i) => i.status === "low-stock",
  ).length;
  const outStockCount = inventory.filter(
    (i) => i.status === "out-of-stock",
  ).length;

  // ── Chart colors ───────────────────────────────────────────
  const c = {
    grid: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    text: darkMode ? "#b0b8c0" : "#4a5568",
    green: "#40916c",
    greenLight: "#52b788",
    blue: "#3498db",
    orange: "#e67e22",
    red: "#e74c3c",
    purple: "#9b59b6",
  };

  const chartOpts = (title?: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: c.text,
          font: { family: "DM Sans, sans-serif", size: 12 },
        },
      },
      title: title
        ? {
            display: true,
            text: title,
            color: c.text,
            font: { size: 13, weight: "bold" as const },
          }
        : { display: false },
      tooltip: {
        backgroundColor: darkMode ? "#1e2228" : "#fff",
        titleColor: c.text,
        bodyColor: c.text,
        borderColor: darkMode ? "#2d3238" : "#e2e8f0",
        borderWidth: 1,
      },
    },
    scales: {
      x: { ticks: { color: c.text }, grid: { color: c.grid } },
      y: { ticks: { color: c.text }, grid: { color: c.grid } },
    },
  });

  // ── Sales by day (line chart) ──────────────────────────────
  const salesByDay = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach((s) => {
      const d = s.sale_date.slice(0, 10);
      map.set(d, (map.get(d) ?? 0) + s.total_amount);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [sales]);

  const revenueLineData = {
    labels: salesByDay.map(([d]) => fmtDate(d)),
    datasets: [
      {
        label: "Revenue (₱)",
        data: salesByDay.map(([, v]) => v),
        borderColor: c.green,
        backgroundColor: `${c.green}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
    ],
  };

  // ── Top 8 products by revenue ──────────────────────────────
  const topProducts = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach((s) =>
      map.set(s.product_name, (map.get(s.product_name) ?? 0) + s.total_amount),
    );
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
  }, [sales]);

  const topProductsBar = {
    labels: topProducts.map(([n]) => n),
    datasets: [
      {
        label: "Revenue (₱)",
        data: topProducts.map(([, v]) => v),
        backgroundColor: [
          c.green,
          c.greenLight,
          c.blue,
          c.orange,
          c.purple,
          c.red,
          "#1abc9c",
          "#e91e63",
        ],
        borderRadius: 6,
      },
    ],
  };

  // ── Order status doughnut ──────────────────────────────────
  const orderCounts = ordersService.countByStatus(orders);
  const orderDoughnut = {
    labels: ["Pending", "Fulfilled", "Cancelled"],
    datasets: [
      {
        data: [
          orderCounts.pending,
          orderCounts.fulfilled,
          orderCounts.cancelled,
        ],
        backgroundColor: [c.orange, c.green, c.red],
        borderWidth: 0,
      },
    ],
  };

  // ── Inventory status doughnut ──────────────────────────────
  const invDoughnut = {
    labels: ["In Stock", "Low Stock", "Out of Stock"],
    datasets: [
      {
        data: [
          inventory.filter((i) => i.status === "in-stock").length,
          lowStockCount,
          outStockCount,
        ],
        backgroundColor: [c.green, c.orange, c.red],
        borderWidth: 0,
      },
    ],
  };

  // ── Daily sales qty bar ────────────────────────────────────
  const salesQtyByDay = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach((s) => {
      const d = s.sale_date.slice(0, 10);
      map.set(d, (map.get(s.product_name) ?? 0) + s.quantity_sold);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [sales]);

  // ── Export CSV (full report) ───────────────────────────────
  function exportReportCsv() {
    const lines = [
      ["=== AG Lettuce Be Fresh REPORT ==="],
      [`Generated: ${new Date().toLocaleString()}`],
      [`Period: ${bounds.from} to ${bounds.to}`],
      [],
      ["--- SUMMARY ---"],
      ["Total Revenue", fmt(totalRevenue)],
      ["Total Sales Transactions", sales.length],
      ["Total Orders", totalOrders],
      ["Fulfilled Orders", fulfilledOrders],
      ["Fulfillment Rate", `${fulfillRate.toFixed(1)}%`],
      ["Avg Order Value", fmt(avgOrderVal)],
      ["Total Inventory Value", fmt(totalInvValue)],
      ["Low Stock Items", lowStockCount],
      ["Out of Stock Items", outStockCount],
      [],
      ["--- TOP PRODUCTS BY REVENUE ---"],
      ["Product", "Revenue (₱)"],
      ...topProducts.map(([n, v]) => [n, v.toFixed(2)]),
      [],
      ["--- SALES TRANSACTIONS ---"],
      ["Transaction ID", "Product", "Qty", "Unit Price", "Total", "Date"],
      ...sales.map((s) => [
        s.transaction_id,
        s.product_name,
        s.quantity_sold,
        s.unit_price,
        s.total_amount,
        new Date(s.sale_date).toLocaleDateString(),
      ]),
      [],
      ["--- ORDERS ---"],
      ["Customer", "Qty", "Price/Unit", "Total", "Date", "Status"],
      ...orders.map((o) => [
        o.customer_name,
        o.quantity,
        o.price_per_unit,
        o.total_price,
        o.order_date,
        o.status,
      ]),
    ];
    const csv = lines
      .map((r) =>
        Array.isArray(r) ? r.map((v) => `"${v}"`).join(",") : `"${r}"`,
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `lettuce-ims-report-${bounds.from}-to-${bounds.to}.csv`;
    a.click();
    toast.success("Report exported as CSV!");
  }

  // ── Print / PDF ────────────────────────────────────────────
  function printReport() {
    window.print();
    toast.info('Use "Save as PDF" in the print dialog.');
  }

  return (
    <section className={styles.page} data-testid="reports-page" ref={printRef}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>
            <i className="fa-solid fa-chart-bar" /> Reports & Analytics
          </h2>
          <p className={styles.pageSub}>
            Insights across inventory, sales and orders
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.exportBtn}
            onClick={exportReportCsv}
            data-testid="btn-export-report"
          >
            <i className="fa-solid fa-download" /> Export CSV
          </button>
          <button
            className={styles.printBtn}
            onClick={printReport}
            data-testid="btn-print-report"
          >
            <i className="fa-solid fa-print" /> Print / PDF
          </button>
        </div>
      </div>

      {/* ── Date Range Filter ── */}
      <div className={styles.filterBar}>
        <span className={styles.filterLabel}>
          <i className="fa-solid fa-calendar" /> Period:
        </span>
        {(["7d", "30d", "90d", "custom"] as DateRange[]).map((r) => (
          <button
            key={r}
            className={`${styles.rangeBtn} ${range === r ? styles.rangeBtnActive : ""}`}
            onClick={() => setRange(r)}
            data-testid={`range-${r}`}
          >
            {r === "7d"
              ? "Last 7 Days"
              : r === "30d"
                ? "Last 30 Days"
                : r === "90d"
                  ? "Last 90 Days"
                  : "Custom"}
          </button>
        ))}
        {range === "custom" && (
          <div className={styles.customDates}>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              data-testid="custom-from"
            />
            <span>–</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              data-testid="custom-to"
            />
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        {(
          [
            { key: "overview", icon: "fa-gauge-high", label: "Overview" },
            { key: "sales", icon: "fa-receipt", label: "Sales" },
            { key: "inventory", icon: "fa-boxes-stacked", label: "Inventory" },
            { key: "orders", icon: "fa-truck", label: "Orders" },
          ] as { key: ReportTab; icon: string; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
            onClick={() => setTab(t.key)}
            data-testid={`tab-${t.key}`}
          >
            <i className={`fa-solid ${t.icon}`} /> {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════
          OVERVIEW TAB
      ════════════════════════════════ */}
      {tab === "overview" && (
        <div className={styles.tabContent}>
          {/* Summary cards */}
          <div className={styles.summaryGrid}>
            <SummaryCard
              icon="fa-peso-sign"
              label="Total Revenue"
              value={fmt(totalRevenue)}
              accent="#40916c"
            />
            <SummaryCard
              icon="fa-receipt"
              label="Sales Transactions"
              value={sales.length}
              accent="#3498db"
            />
            <SummaryCard
              icon="fa-truck"
              label="Orders"
              value={totalOrders}
              accent="#e67e22"
            />
            <SummaryCard
              icon="fa-circle-check"
              label="Fulfillment Rate"
              value={`${fulfillRate.toFixed(1)}%`}
              accent="#27ae60"
            />
            <SummaryCard
              icon="fa-boxes-stacked"
              label="Inventory Value"
              value={fmt(totalInvValue)}
              accent="#9b59b6"
            />
            <SummaryCard
              icon="fa-triangle-exclamation"
              label="Stock Alerts"
              value={lowStockCount + outStockCount}
              sub={`${lowStockCount} low · ${outStockCount} out`}
              accent="#e74c3c"
            />
          </div>

          {/* Revenue trend + order status */}
          <div className={styles.chartsRow}>
            <div className={styles.chartCard}>
              <h4 className={styles.chartTitle}>
                <i className="fa-solid fa-chart-line" /> Revenue Trend
              </h4>
              <div className={styles.chartWrap}>
                {salesByDay.length > 0 ? (
                  <Line data={revenueLineData} options={chartOpts()} />
                ) : (
                  <p className={styles.noData}>No sales in this period.</p>
                )}
              </div>
            </div>
            <div className={styles.chartCard} style={{ maxWidth: 320 }}>
              <h4 className={styles.chartTitle}>
                <i className="fa-solid fa-circle-half-stroke" /> Order Status
              </h4>
              <div className={styles.chartWrap}>
                {totalOrders > 0 ? (
                  <Doughnut
                    data={orderDoughnut}
                    options={{ ...chartOpts(), scales: undefined } as never}
                  />
                ) : (
                  <p className={styles.noData}>No orders in this period.</p>
                )}
              </div>
            </div>
          </div>

          {/* Top products */}
          <div className={styles.chartCard}>
            <h4 className={styles.chartTitle}>
              <i className="fa-solid fa-ranking-star" /> Top Products by Revenue
            </h4>
            <div className={styles.chartWrap} style={{ height: 260 }}>
              {topProducts.length > 0 ? (
                <Bar data={topProductsBar} options={chartOpts()} />
              ) : (
                <p className={styles.noData}>No sales data.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════
          SALES TAB
      ════════════════════════════════ */}
      {tab === "sales" && (
        <div className={styles.tabContent}>
          <div className={styles.summaryGrid}>
            <SummaryCard
              icon="fa-peso-sign"
              label="Total Revenue"
              value={fmt(totalRevenue)}
              accent="#40916c"
            />
            <SummaryCard
              icon="fa-receipt"
              label="Transactions"
              value={sales.length}
              accent="#3498db"
            />
            <SummaryCard
              icon="fa-box"
              label="Units Sold"
              value={sales.reduce((s, i) => s + i.quantity_sold, 0)}
              accent="#9b59b6"
            />
            <SummaryCard
              icon="fa-calculator"
              label="Avg Sale Value"
              value={fmt(sales.length ? totalRevenue / sales.length : 0)}
              accent="#e67e22"
            />
          </div>

          <div className={styles.chartsRow}>
            <div className={styles.chartCard}>
              <h4 className={styles.chartTitle}>
                <i className="fa-solid fa-chart-line" /> Daily Revenue
              </h4>
              <div className={styles.chartWrap}>
                {salesByDay.length > 0 ? (
                  <Line data={revenueLineData} options={chartOpts()} />
                ) : (
                  <p className={styles.noData}>No sales in this period.</p>
                )}
              </div>
            </div>
            <div className={styles.chartCard}>
              <h4 className={styles.chartTitle}>
                <i className="fa-solid fa-chart-bar" /> Revenue by Product
              </h4>
              <div className={styles.chartWrap}>
                {topProducts.length > 0 ? (
                  <Bar data={topProductsBar} options={chartOpts()} />
                ) : (
                  <p className={styles.noData}>No data.</p>
                )}
              </div>
            </div>
          </div>

          {/* Sales table */}
          <div className={styles.tableCard}>
            <h4 className={styles.chartTitle}>
              <i className="fa-solid fa-table" /> Sales Transactions
            </h4>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>TX ID</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.empty}>
                        No sales in this period.
                      </td>
                    </tr>
                  ) : (
                    sales.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <code className={styles.code}>
                            {s.transaction_id}
                          </code>
                        </td>
                        <td>{s.product_name}</td>
                        <td>{s.quantity_sold}</td>
                        <td>{fmt(s.unit_price)}</td>
                        <td className={styles.bold}>{fmt(s.total_amount)}</td>
                        <td>{new Date(s.sale_date).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {sales.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan={4} className={styles.footLabel}>
                        TOTAL
                      </td>
                      <td className={styles.footTotal}>{fmt(totalRevenue)}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════
          INVENTORY TAB
      ════════════════════════════════ */}
      {tab === "inventory" && (
        <div className={styles.tabContent}>
          <div className={styles.summaryGrid}>
            <SummaryCard
              icon="fa-boxes-stacked"
              label="Total Products"
              value={inventory.length}
              accent="#40916c"
            />
            <SummaryCard
              icon="fa-peso-sign"
              label="Inventory Value"
              value={fmt(totalInvValue)}
              accent="#9b59b6"
            />
            <SummaryCard
              icon="fa-circle-check"
              label="In Stock"
              value={inventory.filter((i) => i.status === "in-stock").length}
              accent="#27ae60"
            />
            <SummaryCard
              icon="fa-triangle-exclamation"
              label="Low Stock"
              value={lowStockCount}
              accent="#e67e22"
            />
            <SummaryCard
              icon="fa-circle-xmark"
              label="Out of Stock"
              value={outStockCount}
              accent="#e74c3c"
            />
          </div>

          <div className={styles.chartsRow}>
            <div className={styles.chartCard} style={{ maxWidth: 320 }}>
              <h4 className={styles.chartTitle}>
                <i className="fa-solid fa-circle-half-stroke" /> Stock Status
              </h4>
              <div className={styles.chartWrap}>
                <Doughnut
                  data={invDoughnut}
                  options={{ ...chartOpts(), scales: undefined } as never}
                />
              </div>
            </div>
            <div className={styles.chartCard}>
              <h4 className={styles.chartTitle}>
                <i className="fa-solid fa-chart-bar" /> Top 8 by Inventory Value
              </h4>
              <div className={styles.chartWrap}>
                {(() => {
                  const top8 = [...inventory]
                    .sort((a, b) => b.total_value - a.total_value)
                    .slice(0, 8);
                  return top8.length > 0 ? (
                    <Bar
                      data={{
                        labels: top8.map((i) => i.name),
                        datasets: [
                          {
                            label: "Value (₱)",
                            data: top8.map((i) => i.total_value),
                            backgroundColor: c.greenLight,
                            borderRadius: 6,
                          },
                        ],
                      }}
                      options={chartOpts()}
                    />
                  ) : (
                    <p className={styles.noData}>No inventory.</p>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className={styles.tableCard}>
            <h4 className={styles.chartTitle}>
              <i className="fa-solid fa-table" /> Full Inventory
            </h4>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Name</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total Value</th>
                    <th>Status</th>
                    <th>Harvested</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.empty}>
                        No inventory items.
                      </td>
                    </tr>
                  ) : (
                    inventory.map((i) => (
                      <tr key={i.id}>
                        <td>
                          <code className={styles.code}>{i.product_id}</code>
                        </td>
                        <td>{i.name}</td>
                        <td>{i.quantity}</td>
                        <td>{fmt(i.price)}</td>
                        <td className={styles.bold}>{fmt(i.total_value)}</td>
                        <td>
                          <span
                            className={`${styles.badge} ${styles[i.status.replace("-", "")]}`}
                          >
                            {i.status}
                          </span>
                        </td>
                        <td>{i.date_harvested ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════
          ORDERS TAB
      ════════════════════════════════ */}
      {tab === "orders" && (
        <div className={styles.tabContent}>
          <div className={styles.summaryGrid}>
            <SummaryCard
              icon="fa-truck"
              label="Total Orders"
              value={totalOrders}
              accent="#e67e22"
            />
            <SummaryCard
              icon="fa-circle-check"
              label="Fulfilled"
              value={fulfilledOrders}
              accent="#27ae60"
            />
            <SummaryCard
              icon="fa-clock"
              label="Pending"
              value={orderCounts.pending}
              accent="#3498db"
            />
            <SummaryCard
              icon="fa-circle-xmark"
              label="Cancelled"
              value={orderCounts.cancelled}
              accent="#e74c3c"
            />
            <SummaryCard
              icon="fa-percent"
              label="Fulfillment Rate"
              value={`${fulfillRate.toFixed(1)}%`}
              accent="#9b59b6"
            />
            <SummaryCard
              icon="fa-calculator"
              label="Avg Order Value"
              value={fmt(avgOrderVal)}
              accent="#40916c"
            />
          </div>

          <div className={styles.chartsRow}>
            <div className={styles.chartCard} style={{ maxWidth: 320 }}>
              <h4 className={styles.chartTitle}>
                <i className="fa-solid fa-circle-half-stroke" /> Order Status
                Breakdown
              </h4>
              <div className={styles.chartWrap}>
                {totalOrders > 0 ? (
                  <Doughnut
                    data={orderDoughnut}
                    options={{ ...chartOpts(), scales: undefined } as never}
                  />
                ) : (
                  <p className={styles.noData}>No orders in this period.</p>
                )}
              </div>
            </div>
            <div className={styles.chartCard}>
              <h4 className={styles.chartTitle}>
                <i className="fa-solid fa-chart-bar" /> Orders by Customer (Top
                8)
              </h4>
              <div className={styles.chartWrap}>
                {(() => {
                  const map = new Map<string, number>();
                  orders.forEach((o) =>
                    map.set(
                      o.customer_name,
                      (map.get(o.customer_name) ?? 0) + o.total_price,
                    ),
                  );
                  const top8 = Array.from(map.entries())
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8);
                  return top8.length > 0 ? (
                    <Bar
                      data={{
                        labels: top8.map(([n]) => n),
                        datasets: [
                          {
                            label: "Order Value (₱)",
                            data: top8.map(([, v]) => v),
                            backgroundColor: c.orange,
                            borderRadius: 6,
                          },
                        ],
                      }}
                      options={chartOpts()}
                    />
                  ) : (
                    <p className={styles.noData}>No orders.</p>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className={styles.tableCard}>
            <h4 className={styles.chartTitle}>
              <i className="fa-solid fa-table" /> Order Details
            </h4>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Qty</th>
                    <th>Price/Unit</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.empty}>
                        No orders in this period.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id}>
                        <td>{o.customer_name}</td>
                        <td>{o.quantity}</td>
                        <td>{fmt(o.price_per_unit)}</td>
                        <td className={styles.bold}>{fmt(o.total_price)}</td>
                        <td>{o.order_date}</td>
                        <td>
                          <span
                            className={`${styles.badge} ${styles[o.status]}`}
                          >
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ReportsPage;
