// ============================================================
//  InventoryService  (Angular-style singleton service)
//  All inventory CRUD, auto-status computation, search/sort.
// ============================================================

import { SupabaseClient } from '@supabase/supabase-js';
import type {
  InventoryItem, InventoryFormData, InventoryFilter,
  StockStatus, ServiceResult,
} from '../../shared/types';
import { supabase } from '../supabase/client';

const TABLE = 'inventory_items';

export class InventoryService {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient = supabase) {
    this.client = client;
  }

  // ── Compute stock status from quantity ─────────────────────
  computeStatus(quantity: number, threshold = 15): StockStatus {
    if (quantity === 0)         return 'out-of-stock';
    if (quantity < threshold)   return 'low-stock';
    return 'in-stock';
  }

  // ── List with optional filters ─────────────────────────────
  async list(
    farmId: string,
    filter?: Partial<InventoryFilter>
  ): Promise<ServiceResult<InventoryItem[]>> {
    let query = this.client
      .from(TABLE)
      .select('*')
      .eq('farm_id', farmId);

    if (filter?.status) {
      query = query.eq('status', filter.status);
    }
    if (filter?.search) {
      query = query.ilike('name', `%${filter.search}%`);
    }
    if (filter?.sortColumn) {
      query = query.order(filter.sortColumn, {
        ascending: filter.sortDirection !== 'desc',
      });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) return { data: null, error: error.message };
    return { data: data as InventoryItem[], error: null };
  }

  // ── Get single item ────────────────────────────────────────
  async getById(id: string): Promise<ServiceResult<InventoryItem>> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as InventoryItem, error: null };
  }

  // ── Create ─────────────────────────────────────────────────
  async create(
    farmId: string,
    formData: InventoryFormData,
    lowStockThreshold = 15
  ): Promise<ServiceResult<InventoryItem>> {
    const status = this.computeStatus(formData.quantity, lowStockThreshold);

    const { data, error } = await this.client
      .from(TABLE)
      .insert({
        farm_id:       farmId,
        product_id:    formData.product_id,
        name:          formData.name,
        quantity:      formData.quantity,
        price:         formData.price,
        date_harvested: formData.date_harvested || null,
        status,
        custom_fields: formData.custom_fields ?? {},
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as InventoryItem, error: null };
  }

  // ── Update ─────────────────────────────────────────────────
  async update(
    id: string,
    formData: Partial<InventoryFormData>,
    lowStockThreshold = 15
  ): Promise<ServiceResult<InventoryItem>> {
    const updates: Record<string, unknown> = { ...formData };

    if (formData.quantity !== undefined) {
      updates.status = this.computeStatus(formData.quantity, lowStockThreshold);
    }

    const { data, error } = await this.client
      .from(TABLE)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as InventoryItem, error: null };
  }

  // ── Delete single ──────────────────────────────────────────
  async delete(id: string): Promise<ServiceResult<void>> {
    const { error } = await this.client
      .from(TABLE)
      .delete()
      .eq('id', id);

    if (error) return { data: null, error: error.message };
    return { data: undefined, error: null };
  }

  // ── Bulk delete ────────────────────────────────────────────
  async deleteBulk(ids: string[]): Promise<ServiceResult<void>> {
    const { error } = await this.client
      .from(TABLE)
      .delete()
      .in('id', ids);

    if (error) return { data: null, error: error.message };
    return { data: undefined, error: null };
  }

  // ── Decrement quantity after a sale ────────────────────────
  async decrementQuantity(
    id: string,
    amount: number,
    lowStockThreshold = 15
  ): Promise<ServiceResult<InventoryItem>> {
    const current = await this.getById(id);
    if (current.error || !current.data) {
      return { data: null, error: current.error ?? 'Item not found' };
    }

    const newQty = Math.max(0, current.data.quantity - amount);
    return this.update(id, { quantity: newQty }, lowStockThreshold);
  }

  // ── Export to CSV string ───────────────────────────────────
  exportCsv(items: InventoryItem[]): string {
    const headers = [
      'Product ID', 'Name', 'Quantity', 'Price (₱)',
      'Total Value (₱)', 'Status', 'Date Harvested',
    ];
    const rows = items.map(i => [
      i.product_id, i.name, i.quantity, i.price,
      i.total_value, i.status, i.date_harvested ?? '',
    ]);
    return [headers, ...rows]
      .map(r => r.map(v => `"${v}"`).join(','))
      .join('\n');
  }
}

export const inventoryService = new InventoryService();
