// ============================================================
//  InventoryPage  –  Inventory feature
// ============================================================

import React, { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  InventoryItem,
  InventoryFormData,
  StockStatus,
} from "../../shared/types";
import { inventoryService } from "../../core/services/InventoryService";
import { useAppStore } from "../../core/providers/AppStore";
import {
  useToast,
  usePagination,
  useSort,
  useSelection,
} from "../../shared/hooks";
import {
  DataTable,
  Column,
} from "../../shared/components/ui/DataTable/DataTable";
import { Modal } from "../../shared/components/ui/Modal/Modal";
import { Button } from "../../shared/components/ui/Button/Button";
import { StatusBadge } from "../../shared/components/ui/StatusBadge/StatusBadge";
import styles from "./InventoryPage.module.css";

const PER_PAGE = 10;

// ── Inventory Modal Form ───────────────────────────────────
interface InventoryModalProps {
  open: boolean;
  onClose: () => void;
  item?: InventoryItem | null;
  customCols: { name: string; key: string }[];
  onSaved: () => void;
  farmId: string;
  threshold: number;
}

const InventoryModal: React.FC<InventoryModalProps> = ({
  open,
  onClose,
  item,
  customCols,
  onSaved,
  farmId,
  threshold,
}) => {
  const toast = useToast();
  const [form, setForm] = useState<InventoryFormData>({
    product_id: "",
    name: "",
    quantity: 0,
    price: 0,
    date_harvested: "",
    custom_fields: {},
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        product_id: item.product_id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        date_harvested: item.date_harvested ?? "",
        custom_fields: item.custom_fields ?? {},
      });
    } else {
      setForm({
        product_id: "",
        name: "",
        quantity: 0,
        price: 0,
        date_harvested: "",
        custom_fields: {},
      });
    }
  }, [item, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const result = item
      ? await inventoryService.update(item.id, form, threshold)
      : await inventoryService.create(farmId, form, threshold);

    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(item ? "Item updated!" : "Item added!");
    onSaved();
    onClose();
  }

  const set = (field: keyof InventoryFormData, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? "✏️ Edit Item" : "➕ Add Inventory Item"}
      data-testid="inventory-modal"
    >
      <form onSubmit={handleSubmit} data-testid="inventory-form">
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Product ID *</label>
            <input
              value={form.product_id}
              onChange={(e) => set("product_id", e.target.value)}
              required
              placeholder="e.g. 001"
              data-testid="field-product-id"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Product Name *</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              placeholder="Romaine Lettuce"
              data-testid="field-name"
            />
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Quantity *</label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => set("quantity", +e.target.value)}
              required
              min={0}
              data-testid="field-quantity"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Price (₱) *</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => set("price", +e.target.value)}
              required
              min={0}
              step="0.01"
              data-testid="field-price"
            />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label>Date Harvested</label>
          <input
            type="date"
            value={form.date_harvested ?? ""}
            onChange={(e) => set("date_harvested", e.target.value)}
            data-testid="field-date"
          />
        </div>

        {customCols.map((col) => (
          <div className={styles.formGroup} key={col.key}>
            <label>{col.name}</label>
            <input
              value={form.custom_fields?.[col.key] ?? ""}
              onChange={(e) =>
                set("custom_fields", {
                  ...form.custom_fields,
                  [col.key]: e.target.value,
                })
              }
              data-testid={`field-custom-${col.key}`}
            />
          </div>
        ))}

        <div className={styles.modalFooter}>
          <Button
            variant="cancel"
            type="button"
            onClick={onClose}
            data-testid="btn-cancel-inv"
          >
            Cancel
          </Button>
          <Button
            variant="success"
            type="submit"
            loading={saving}
            data-testid="btn-save-inv"
          >
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ── Main Page ──────────────────────────────────────────────
export const InventoryPage: React.FC = () => {
  const { farm, settings } = useAppStore((s) => ({
    farm: s.farm,
    settings: s.settings,
  }));
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockStatus | "">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const threshold = settings?.low_stock_threshold ?? 15;
  const customCols = settings?.custom_columns ?? [];

  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ["inventory", farm?.id, search, statusFilter],
    queryFn: () =>
      inventoryService
        .list(farm!.id, { search, status: statusFilter })
        .then((r) => r.data ?? []),
    enabled: !!farm?.id,
  });

  const {
    sort,
    sorted,
    column: sortCol,
    direction: sortDir,
  } = useSort<InventoryItem>("name");
  const sortedItems = sorted(allItems);
  const { paged, state, pages, goTo } = usePagination(sortedItems, PER_PAGE);
  const sel = useSelection<string>();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["inventory"] });

  const openAdd = () => {
    setEditItem(null);
    setModalOpen(true);
  };
  const openEdit = (item: InventoryItem) => {
    setEditItem(item);
    setModalOpen(true);
  };

  async function handleDeleteConfirm() {
    setDeleting(true);
    const result = await inventoryService.deleteBulk(sel.ids);
    setDeleting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`${sel.ids.length} item(s) deleted.`);
    sel.clear();
    setDeleteOpen(false);
    invalidate();
  }

  const COLUMNS: Column<InventoryItem>[] = [
    { key: "product_id", header: "Product ID", sortable: true },
    { key: "name", header: "Product Name", sortable: true },
    { key: "quantity", header: "Qty", sortable: true },
    {
      key: "price",
      header: "Price (₱)",
      sortable: true,
      render: (r) =>
        `₱${Number(r.price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
    },
    {
      key: "total_value",
      header: "Total Value",
      sortable: true,
      render: (r) =>
        `₱${Number(r.total_value).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
    },
    { key: "date_harvested", header: "Harvested", sortable: true },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    ...customCols.map((c) => ({
      key: `custom_fields.${c.key}` as keyof InventoryItem,
      header: c.name,
      render: (r: InventoryItem) => r.custom_fields?.[c.key] ?? "",
    })),
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className={styles.actions}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openEdit(r)}
            data-testid={`edit-${r.id}`}
          >
            <i className="fa-solid fa-pencil" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              sel.clear();
              sel.toggle(r.id);
              setDeleteOpen(true);
            }}
            data-testid={`delete-${r.id}`}
          >
            <i className="fa-solid fa-trash" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <section className={styles.page} data-testid="inventory-page">
      <div className={styles.toolbar} data-testid="inv-toolbar">
        <div className={styles.filters}>
          <input
            className={styles.search}
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="inv-search"
          />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as StockStatus | "")
            }
            data-testid="inv-status-filter"
          >
            <option value="">All Status</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>

        <div className={styles.toolbarRight}>
          {sel.count > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              data-testid="btn-bulk-delete"
            >
              <i className="fa-solid fa-trash" /> Delete ({sel.count})
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              const csv = inventoryService.exportCsv(allItems);
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "inventory.csv";
              a.click();
            }}
            data-testid="btn-export-inv"
          >
            <i className="fa-solid fa-download" /> Export
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={openAdd}
            data-testid="btn-add-inventory"
          >
            <i className="fa-solid fa-plus" /> Add Item
          </Button>
        </div>
      </div>

      <DataTable<InventoryItem>
        columns={COLUMNS}
        data={paged}
        rowKey={(r) => r.id}
        pagination={state}
        totalPages={pages}
        onPageChange={goTo}
        sortColumn={sortCol}
        sortDir={sortDir}
        onSort={(col) => sort(col as keyof InventoryItem)}
        selectable
        selected={sel.selected}
        onToggleRow={sel.toggle}
        onToggleAll={sel.toggleAll}
        loading={isLoading}
        emptyMessage="No inventory items found. Add your first item!"
        testId="inventory-table"
      />

      <InventoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        item={editItem}
        customCols={customCols}
        onSaved={invalidate}
        farmId={farm?.id ?? ""}
        threshold={threshold}
      />

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="⚠️ Confirm Delete"
        maxWidth="400px"
        data-testid="delete-confirm-modal"
        footer={
          <>
            <Button
              variant="cancel"
              onClick={() => setDeleteOpen(false)}
              data-testid="btn-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              loading={deleting}
              data-testid="btn-confirm-delete"
            >
              Delete
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to delete <strong>{sel.count}</strong> item(s)?
        </p>
      </Modal>
    </section>
  );
};

export default InventoryPage;
