// ============================================================
//  AG Lettuce Be Fresh – Shared Types
//  Single source of truth for all domain types.
// ============================================================

// ── Auth ─────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  role: "Admin" | "Staff";
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ── Farm ─────────────────────────────────────────────────────
export interface Farm {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

// ── Inventory ─────────────────────────────────────────────────
export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export interface InventoryItem {
  id: string;
  farm_id: string;
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  total_value: number; // computed by DB
  date_harvested: string | null;
  status: StockStatus;
  custom_fields: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface InventoryFormData {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  date_harvested: string;
  custom_fields?: Record<string, string>;
}

export interface InventoryFilter {
  search: string;
  status: StockStatus | "";
  sortColumn: keyof InventoryItem | null;
  sortDirection: "asc" | "desc";
}

// ── Sales ─────────────────────────────────────────────────────
export interface Sale {
  id: string;
  farm_id: string;
  transaction_id: string;
  inventory_item_id: string | null;
  product_name: string;
  product_id: string | null;
  quantity_sold: number;
  unit_price: number;
  total_amount: number; // computed by DB
  sale_date: string;
  created_at: string;
}

export interface SaleFormData {
  inventory_item_id: string;
  quantity_sold: number;
}

export interface SaleFilter {
  search: string;
  dateFrom: string;
  dateTo: string;
}

// ── Orders ────────────────────────────────────────────────────
export type OrderStatus = "pending" | "fulfilled" | "cancelled";

export interface Order {
  id: string;
  farm_id: string;
  customer_name: string;
  quantity: number;
  price_per_unit: number;
  total_price: number; // computed by DB
  order_date: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface OrderFormData {
  customer_name: string;
  quantity: number;
  price_per_unit: number;
  order_date: string;
}

export interface OrderFilter {
  search: string;
  status: OrderStatus | "";
}

// ── Settings ──────────────────────────────────────────────────
export interface CustomColumn {
  name: string;
  key: string;
}

export interface AppSettings {
  id: string;
  farm_id: string;
  app_name: string;
  low_stock_threshold: number;
  currency: string;
  custom_columns: CustomColumn[];
  login_image_url: string | null;
  updated_at: string;
}

// ── Dashboard / Analytics ────────────────────────────────────
export interface DashboardStats {
  totalProducts: number;
  totalInventoryValue: number;
  totalSalesRevenue: number;
  pendingOrders: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

// ── UI / Utility ──────────────────────────────────────────────
export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export interface PaginationState {
  page: number;
  perPage: number;
  total: number;
}

export interface SelectOption<T = string> {
  value: T;
  label: string;
}

// ── Service Result ────────────────────────────────────────────
export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}
