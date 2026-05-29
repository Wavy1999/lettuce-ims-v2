// ============================================================
//  OrdersService  (Angular-style singleton service)
// ============================================================

import { SupabaseClient } from '@supabase/supabase-js';
import type {
  Order, OrderFormData, OrderFilter,
  OrderStatus, ServiceResult,
} from '../../shared/types';
import { supabase } from '../supabase/client';

const TABLE = 'orders';

export class OrdersService {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient = supabase) {
    this.client = client;
  }

  async list(
    farmId: string,
    filter?: Partial<OrderFilter>
  ): Promise<ServiceResult<Order[]>> {
    let query = this.client
      .from(TABLE)
      .select('*')
      .eq('farm_id', farmId)
      .order('order_date', { ascending: false });

    if (filter?.status) {
      query = query.eq('status', filter.status);
    }
    if (filter?.search) {
      query = query.ilike('customer_name', `%${filter.search}%`);
    }

    const { data, error } = await query;
    if (error) return { data: null, error: error.message };
    return { data: data as Order[], error: null };
  }

  async getById(id: string): Promise<ServiceResult<Order>> {
    const { data, error } = await this.client
      .from(TABLE).select('*').eq('id', id).single();
    if (error) return { data: null, error: error.message };
    return { data: data as Order, error: null };
  }

  async create(
    farmId: string,
    formData: OrderFormData
  ): Promise<ServiceResult<Order>> {
    const { data, error } = await this.client
      .from(TABLE)
      .insert({
        farm_id:       farmId,
        customer_name: formData.customer_name,
        quantity:      formData.quantity,
        price_per_unit: formData.price_per_unit,
        order_date:    formData.order_date,
        status:        'pending',
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Order, error: null };
  }

  async update(
    id: string,
    formData: Partial<OrderFormData & { status: OrderStatus }>
  ): Promise<ServiceResult<Order>> {
    const { data, error } = await this.client
      .from(TABLE).update(formData).eq('id', id).select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as Order, error: null };
  }

  async delete(id: string): Promise<ServiceResult<void>> {
    const { error } = await this.client.from(TABLE).delete().eq('id', id);
    if (error) return { data: null, error: error.message };
    return { data: undefined, error: null };
  }

  async deleteBulk(ids: string[]): Promise<ServiceResult<void>> {
    const { error } = await this.client.from(TABLE).delete().in('id', ids);
    if (error) return { data: null, error: error.message };
    return { data: undefined, error: null };
  }

  countByStatus(orders: Order[]): Record<OrderStatus, number> {
    return orders.reduce(
      (acc, o) => { acc[o.status]++; return acc; },
      { pending: 0, fulfilled: 0, cancelled: 0 }
    );
  }

  exportCsv(orders: Order[]): string {
    const headers = [
      'Customer', 'Qty', 'Price/Unit (₱)',
      'Total (₱)', 'Order Date', 'Status',
    ];
    const rows = orders.map(o => [
      o.customer_name, o.quantity, o.price_per_unit,
      o.total_price, o.order_date, o.status,
    ]);
    return [headers, ...rows]
      .map(r => r.map(v => `"${v}"`).join(','))
      .join('\n');
  }
}

export const ordersService = new OrdersService();
