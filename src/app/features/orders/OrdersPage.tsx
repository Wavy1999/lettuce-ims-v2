// ============================================================
//  OrdersPage  –  Orders feature
// ============================================================

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { OrderFormData, OrderStatus, Order } from '../../shared/types';
import { ordersService } from '../../core/services/OrdersService';
import { useAppStore }   from '../../core/providers/AppStore';
import { useToast, usePagination, useSelection } from '../../shared/hooks';
import { DataTable, Column } from '../../shared/components/ui/DataTable/DataTable';
import { Modal }             from '../../shared/components/ui/Modal/Modal';
import { Button }            from '../../shared/components/ui/Button/Button';
import { StatusBadge }       from '../../shared/components/ui/StatusBadge/StatusBadge';
import styles from './OrdersPage.module.css';

const PER_PAGE = 10;

const EMPTY_FORM: OrderFormData = {
  customer_name: '', quantity: 1, price_per_unit: 0, order_date: '',
};

export const OrdersPage: React.FC = () => {
  const { farm }    = useAppStore(s => ({ farm: s.farm }));
  const toast       = useToast();
  const queryClient = useQueryClient();

  const [search,      setSearch]      = useState('');
  const [statusFilter,setStatusFilter]= useState<OrderStatus | ''>('');
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editOrder,   setEditOrder]   = useState<Order | null>(null);
  const [deleteOpen,  setDeleteOpen]  = useState(false);
  const [form,        setForm]        = useState<OrderFormData>(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', farm?.id, search, statusFilter],
    queryFn:  () => ordersService.list(farm!.id, { search, status: statusFilter }).then(r => r.data ?? []),
    enabled:  !!farm?.id,
  });

  const { paged, state, pages, goTo } = usePagination(orders, PER_PAGE);
  const sel = useSelection<string>();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['orders'] });

  function openAdd() {
    setEditOrder(null);
    setForm({ ...EMPTY_FORM, order_date: new Date().toISOString().slice(0,10) });
    setModalOpen(true);
  }

  function openEdit(order: Order) {
    setEditOrder(order);
    setForm({
      customer_name: order.customer_name,
      quantity:      order.quantity,
      price_per_unit: order.price_per_unit,
      order_date:    order.order_date,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const result = editOrder
      ? await ordersService.update(editOrder.id, form)
      : await ordersService.create(farm!.id, form);

    setSaving(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success(editOrder ? 'Order updated!' : 'Order created!');
    setModalOpen(false);
    invalidate();
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    const result = await ordersService.deleteBulk(sel.ids);
    setDeleting(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success(`${sel.ids.length} order(s) deleted.`);
    sel.clear();
    setDeleteOpen(false);
    invalidate();
  }

  async function handleStatusChange(id: string, status: OrderStatus) {
    const result = await ordersService.update(id, { status });
    if (result.error) { toast.error(result.error); return; }
    toast.success(`Order marked as ${status}.`);
    invalidate();
  }

  const fmt = (n: number) =>
    `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  const setField = (k: keyof OrderFormData, v: unknown) =>
    setForm(f => ({ ...f, [k]: v }));

  const COLUMNS: Column<Record<string, unknown>>[] = [
    { key: 'customer_name', header: 'Customer',    sortable: true },
    { key: 'quantity',      header: 'Qty',          sortable: true },
    { key: 'price_per_unit',header: 'Price/Unit',   render: r => fmt(r.price_per_unit as number) },
    { key: 'total_price',   header: 'Total',        render: r => fmt(r.total_price as number) },
    { key: 'order_date',    header: 'Order Date',   sortable: true },
    { key: 'status',        header: 'Status',       render: r => <StatusBadge status={r.status as OrderStatus} /> },
    {
      key: 'actions', header: 'Actions',
      render: r => (
        <div className={styles.actions}>
          <Button size="sm" variant="ghost" onClick={() => openEdit(r as unknown as Order)} data-testid={`edit-order-${r.id}`}>
            <i className="fa-solid fa-pencil" />
          </Button>
          {r.status === 'pending' && (
            <>
              <Button size="sm" variant="success" onClick={() => handleStatusChange(r.id as string, 'fulfilled')} data-testid={`fulfill-${r.id}`}>
                <i className="fa-solid fa-check" />
              </Button>
              <Button size="sm" variant="cancel" onClick={() => handleStatusChange(r.id as string, 'cancelled')} data-testid={`cancel-order-${r.id}`}>
                <i className="fa-solid fa-xmark" />
              </Button>
            </>
          )}
          <Button size="sm" variant="danger" onClick={() => { sel.clear(); sel.toggle(r.id as string); setDeleteOpen(true); }} data-testid={`delete-order-${r.id}`}>
            <i className="fa-solid fa-trash" />
          </Button>
        </div>
      ),
    },
  ];

  const counts = ordersService.countByStatus(orders);

  return (
    <section className={styles.page} data-testid="orders-page">
      <div className={styles.statusSummary}>
        <span className={styles.summaryChip} data-testid="pending-count">
          <i className="fa-solid fa-clock" /> Pending: <strong>{counts.pending}</strong>
        </span>
        <span className={`${styles.summaryChip} ${styles.fulfilled}`} data-testid="fulfilled-count">
          <i className="fa-solid fa-check-circle" /> Fulfilled: <strong>{counts.fulfilled}</strong>
        </span>
        <span className={`${styles.summaryChip} ${styles.cancelled}`} data-testid="cancelled-count">
          <i className="fa-solid fa-xmark-circle" /> Cancelled: <strong>{counts.cancelled}</strong>
        </span>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <input
            placeholder="Search customer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="orders-search"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as OrderStatus | '')}
            data-testid="orders-status-filter"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className={styles.toolbarRight}>
          {sel.count > 0 && (
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)} data-testid="btn-bulk-delete-orders">
              <i className="fa-solid fa-trash" /> Delete ({sel.count})
            </Button>
          )}
          <Button
            variant="primary" size="sm"
            onClick={() => {
              const csv  = ordersService.exportCsv(orders);
              const blob = new Blob([csv], { type:'text/csv' });
              const a    = document.createElement('a');
              a.href     = URL.createObjectURL(blob);
              a.download = 'orders.csv';
              a.click();
            }}
            data-testid="btn-export-orders"
          >
            <i className="fa-solid fa-download" /> Export
          </Button>
          <Button variant="success" size="sm" onClick={openAdd} data-testid="btn-add-order">
            <i className="fa-solid fa-plus" /> New Order
          </Button>
        </div>
      </div>

      <DataTable
        columns={COLUMNS}
        data={paged as unknown as Record<string, unknown>[]}
        rowKey={r => r.id as string}
        pagination={state}
        totalPages={pages}
        onPageChange={goTo}
        selectable
        selected={sel.selected}
        onToggleRow={sel.toggle}
        onToggleAll={sel.toggleAll}
        loading={isLoading}
        emptyMessage="No orders yet. Create your first order!"
        testId="orders-table"
      />

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editOrder ? '✏️ Edit Order' : '🚚 New Order'}
        data-testid="order-modal"
      >
        <form onSubmit={handleSubmit} data-testid="order-form">
          <div className={styles.formGroup}>
            <label>Customer Name *</label>
            <input
              value={form.customer_name}
              onChange={e => setField('customer_name', e.target.value)}
              required
              placeholder="Customer name"
              data-testid="order-customer"
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Quantity *</label>
              <input type="number" value={form.quantity} onChange={e=>setField('quantity',+e.target.value)} required min={1} data-testid="order-quantity"/>
            </div>
            <div className={styles.formGroup}>
              <label>Price / Unit (₱) *</label>
              <input type="number" value={form.price_per_unit} onChange={e=>setField('price_per_unit',+e.target.value)} required min={0} step="0.01" data-testid="order-price"/>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Order Date *</label>
            <input type="date" value={form.order_date} onChange={e=>setField('order_date',e.target.value)} required data-testid="order-date"/>
          </div>
          <div className={styles.formGroup}>
            <label>Total Price (₱)</label>
            <input type="text" value={`₱${(form.quantity * form.price_per_unit).toFixed(2)}`} readOnly data-testid="order-total"/>
          </div>

          <div className={styles.modalFooter}>
            <Button variant="cancel" type="button" onClick={() => setModalOpen(false)} data-testid="btn-cancel-order">Cancel</Button>
            <Button variant="success" type="submit" loading={saving} data-testid="btn-save-order">Save Order</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="⚠️ Confirm Delete" maxWidth="400px"
        footer={
          <>
            <Button variant="cancel" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} loading={deleting} data-testid="btn-confirm-delete-order">Delete</Button>
          </>
        }
      >
        <p>Delete <strong>{sel.count}</strong> order(s)?</p>
      </Modal>
    </section>
  );
};

export default OrdersPage;
