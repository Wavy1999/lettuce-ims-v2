// ============================================================
//  SalesPage  –  Sales feature
// ============================================================

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { SaleFormData, InventoryItem } from '../../shared/types';
import { salesService }     from '../../core/services/SalesService';
import { inventoryService } from '../../core/services/InventoryService';
import { useAppStore }      from '../../core/providers/AppStore';
import { useToast, usePagination, useSelection } from '../../shared/hooks';
import { DataTable, Column } from '../../shared/components/ui/DataTable/DataTable';
import { Modal }             from '../../shared/components/ui/Modal/Modal';
import { Button }            from '../../shared/components/ui/Button/Button';
import styles from './SalesPage.module.css';

const PER_PAGE = 10;

export const SalesPage: React.FC = () => {
  const { farm, settings } = useAppStore(s => ({ farm: s.farm, settings: s.settings }));
  const toast       = useToast();
  const queryClient = useQueryClient();

  const [search,     setSearch]     = useState('');
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');
  const [modalOpen,  setModalOpen]  = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  // Sale form state
  const [selInvId,   setSelInvId]   = useState('');
  const [qty,        setQty]        = useState(1);

  const threshold = settings?.low_stock_threshold ?? 15;

  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ['sales', farm?.id, search, dateFrom, dateTo],
    queryFn:  () => salesService.list(farm!.id, { search, dateFrom, dateTo }).then(r => r.data ?? []),
    enabled:  !!farm?.id,
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory', farm?.id],
    queryFn:  () => inventoryService.list(farm!.id).then(r => r.data ?? []),
    enabled:  !!farm?.id,
  });

  const availableItems = inventory.filter(i => i.quantity > 0);
  const selectedItem   = inventory.find(i => i.id === selInvId) as InventoryItem | undefined;

  const { paged, state, pages, goTo } = usePagination(sales, PER_PAGE);
  const sel = useSelection<string>();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['sales'] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  };

  async function handleSaveSale(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItem) return;
    setSaving(true);

    const formData: SaleFormData = { inventory_item_id: selInvId, quantity_sold: qty };
    const result = await salesService.recordSale(farm!.id, formData, selectedItem, threshold);

    setSaving(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success('Sale recorded!');
    setModalOpen(false);
    setSelInvId('');
    setQty(1);
    invalidate();
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    const result = await salesService.deleteBulk(sel.ids);
    setDeleting(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success(`${sel.ids.length} sale(s) deleted.`);
    sel.clear();
    setDeleteOpen(false);
    invalidate();
  }

  const fmt = (n: number) =>
    `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  const COLUMNS: Column<Record<string, unknown>>[] = [
    { key: 'transaction_id', header: 'TX ID',       sortable: true },
    { key: 'product_name',   header: 'Product',      sortable: true },
    { key: 'quantity_sold',  header: 'Qty Sold',     sortable: true },
    { key: 'unit_price',     header: 'Unit Price',   render: r => fmt(r.unit_price as number) },
    { key: 'total_amount',   header: 'Total',        render: r => fmt(r.total_amount as number) },
    { key: 'sale_date',      header: 'Date',         render: r => new Date(r.sale_date as string).toLocaleDateString() },
  ];

  const totalRevenue = salesService.getTotalRevenue(sales);

  return (
    <section className={styles.page} data-testid="sales-page">
      {/* Revenue summary */}
      <div className={styles.revenueBanner} data-testid="revenue-banner">
        <i className="fa-solid fa-chart-line" />
        <span>Total Revenue: <strong>{fmt(totalRevenue)}</strong></span>
        <span className={styles.revSub}>({sales.length} transactions)</span>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <input
            placeholder="Search product / TX ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="sales-search"
          />
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} data-testid="sales-date-from" />
          <input type="date" value={dateTo}   onChange={e=>setDateTo(e.target.value)}   data-testid="sales-date-to" />
        </div>
        <div className={styles.toolbarRight}>
          {sel.count > 0 && (
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)} data-testid="btn-bulk-delete-sales">
              <i className="fa-solid fa-trash" /> Delete ({sel.count})
            </Button>
          )}
          <Button
            variant="primary" size="sm"
            onClick={() => {
              const csv  = salesService.exportCsv(sales);
              const blob = new Blob([csv], { type: 'text/csv' });
              const a    = document.createElement('a');
              a.href     = URL.createObjectURL(blob);
              a.download = 'sales.csv';
              a.click();
            }}
            data-testid="btn-export-sales"
          >
            <i className="fa-solid fa-download" /> Export
          </Button>
          <Button variant="success" size="sm" onClick={() => setModalOpen(true)} data-testid="btn-add-sale">
            <i className="fa-solid fa-plus" /> New Sale
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
        loading={salesLoading}
        emptyMessage="No sales yet. Record your first sale!"
        testId="sales-table"
      />

      {/* New Sale Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelInvId(''); setQty(1); }}
        title="🛒 New Sales Transaction"
        data-testid="sale-modal"
      >
        <form onSubmit={handleSaveSale} data-testid="sale-form">
          <div className={styles.formGroup}>
            <label>Select Product *</label>
            <select
              value={selInvId}
              onChange={e => { setSelInvId(e.target.value); setQty(1); }}
              required
              data-testid="sale-product-select"
            >
              <option value="">-- Choose a product --</option>
              {availableItems.map(i => (
                <option key={i.id} value={i.id}>
                  {i.name} (in stock: {i.quantity}) — ₱{i.price}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Quantity *</label>
              <input
                type="number"
                value={qty}
                onChange={e => setQty(+e.target.value)}
                min={1}
                max={selectedItem?.quantity}
                required
                data-testid="sale-quantity"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Unit Price (₱)</label>
              <input
                type="text"
                value={selectedItem ? `₱${selectedItem.price}` : ''}
                readOnly
                data-testid="sale-unit-price"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Total Amount (₱)</label>
            <input
              type="text"
              value={selectedItem ? `₱${(selectedItem.price * qty).toFixed(2)}` : ''}
              readOnly
              data-testid="sale-total"
            />
          </div>

          <div className={styles.modalFooter}>
            <Button variant="cancel" type="button" onClick={() => { setModalOpen(false); setSelInvId(''); setQty(1); }} data-testid="btn-cancel-sale">
              Cancel
            </Button>
            <Button variant="success" type="submit" loading={saving} data-testid="btn-confirm-sale">
              Complete Sale
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="⚠️ Confirm Delete"
        maxWidth="400px"
        footer={
          <>
            <Button variant="cancel" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} loading={deleting} data-testid="btn-confirm-delete-sale">Delete</Button>
          </>
        }
      >
        <p>Delete <strong>{sel.count}</strong> sale(s)?</p>
      </Modal>
    </section>
  );
};

export default SalesPage;
