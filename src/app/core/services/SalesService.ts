// ============================================================
//  SalesService  (Angular-style singleton service)
// ============================================================

import { SupabaseClient } from '@supabase/supabase-js';
import type {
  Sale, SaleFormData, SaleFilter,
  InventoryItem, ChartDataPoint, ServiceResult,
} from '../../shared/types';
import { supabase } from '../supabase/client';
import { inventoryService } from './InventoryService';

const TABLE = 'sales';

let _txCounter = 1;

function generateTxId(): string {
  const pad = String(_txCounter++).padStart(4, '0');
  return `TRX-${pad}-${Date.now()}`;
}

export class SalesService {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient = supabase) {
    this.client = client;
  }

  // ── List with optional filters ─────────────────────────────
  async list(
    farmId: string,
    filter?: Partial<SaleFilter>
  ): Promise<ServiceResult<Sale[]>> {
    let query = this.client
      .from(TABLE)
      .select('*')
      .eq('farm_id', farmId)
      .order('sale_date', { ascending: false });

    if (filter?.search) {
      query = query.or(
        `product_name.ilike.%${filter.search}%,transaction_id.ilike.%${filter.search}%`
      );
    }
    if (filter?.dateFrom) {
      query = query.gte('sale_date', filter.dateFrom);
    }
    if (filter?.dateTo) {
      query = query.lte('sale_date', `${filter.dateTo}T23:59:59Z`);
    }

    const { data, error } = await query;
    if (error) return { data: null, error: error.message };
    return { data: data as Sale[], error: null };
  }

  // ── Record a new sale (also decrements inventory) ──────────
  async recordSale(
    farmId: string,
    formData: SaleFormData,
    inventoryItem: InventoryItem,
    lowStockThreshold = 15
  ): Promise<ServiceResult<Sale>> {
    if (formData.quantity_sold > inventoryItem.quantity) {
      return { data: null, error: 'Insufficient stock' };
    }

    const { data, error } = await this.client
      .from(TABLE)
      .insert({
        farm_id:           farmId,
        transaction_id:    generateTxId(),
        inventory_item_id: formData.inventory_item_id,
        product_name:      inventoryItem.name,
        product_id:        inventoryItem.product_id,
        quantity_sold:     formData.quantity_sold,
        unit_price:        inventoryItem.price,
        sale_date:         new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    // Decrement inventory
    await inventoryService.decrementQuantity(
      formData.inventory_item_id,
      formData.quantity_sold,
      lowStockThreshold
    );

    return { data: data as Sale, error: null };
  }

  // ── Delete single ──────────────────────────────────────────
  async delete(id: string): Promise<ServiceResult<void>> {
    const { error } = await this.client.from(TABLE).delete().eq('id', id);
    if (error) return { data: null, error: error.message };
    return { data: undefined, error: null };
  }

  // ── Bulk delete ────────────────────────────────────────────
  async deleteBulk(ids: string[]): Promise<ServiceResult<void>> {
    const { error } = await this.client.from(TABLE).delete().in('id', ids);
    if (error) return { data: null, error: error.message };
    return { data: undefined, error: null };
  }

  // ── Analytics ──────────────────────────────────────────────
  getSalesByDay(sales: Sale[]): ChartDataPoint[] {
    const map = new Map<string, number>();
    sales.forEach(s => {
      const day = s.sale_date.slice(0, 10);
      map.set(day, (map.get(day) ?? 0) + s.total_amount);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, value]) => ({ label, value }));
  }

  getTotalRevenue(sales: Sale[]): number {
    return sales.reduce((sum, s) => sum + s.total_amount, 0);
  }

  exportCsv(sales: Sale[]): string {
    const headers = [
      'Transaction ID', 'Product', 'Product ID',
      'Qty Sold', 'Unit Price (₱)', 'Total (₱)', 'Date',
    ];
    const rows = sales.map(s => [
      s.transaction_id, s.product_name, s.product_id ?? '',
      s.quantity_sold, s.unit_price, s.total_amount,
      new Date(s.sale_date).toLocaleString(),
    ]);
    return [headers, ...rows]
      .map(r => r.map(v => `"${v}"`).join(','))
      .join('\n');
  }
}

export const salesService = new SalesService();
