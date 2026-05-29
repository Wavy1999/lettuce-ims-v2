// ============================================================
//  InventoryPage.pom.ts  –  Page Object Model for Inventory
// ============================================================

import type { Page } from '@playwright/test';
import { expect }    from '@playwright/test';
import { BasePage }  from './BasePage.pom';

export interface InventoryFormData {
  productId:     string;
  name:          string;
  quantity:      number;
  price:         number;
  dateHarvested?: string;
}

export class InventoryPagePOM extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Navigation ─────────────────────────────────────────────
  async navigate(): Promise<void> {
    await this.goto('/dashboard');
    await this.clickNavItem('inventory');
    await this.page.waitForSelector('[data-testid="inventory-page"]');
  }

  // ── Toolbar Selectors ──────────────────────────────────────
  get searchInput()    { return this.by('inv-search');         }
  get statusFilter()   { return this.by('inv-status-filter');  }
  get addBtn()         { return this.by('btn-add-inventory');  }
  get exportBtn()      { return this.by('btn-export-inv');     }
  get bulkDeleteBtn()  { return this.by('btn-bulk-delete');    }

  // ── Modal Selectors ────────────────────────────────────────
  get modalProductId() { return this.by('field-product-id'); }
  get modalName()      { return this.by('field-name');        }
  get modalQuantity()  { return this.by('field-quantity');    }
  get modalPrice()     { return this.by('field-price');       }
  get modalDate()      { return this.by('field-date');        }
  get modalSaveBtn()   { return this.by('btn-save-inv');      }
  get modalCancelBtn() { return this.by('btn-cancel-inv');    }

  // ── Table ──────────────────────────────────────────────────
  get table()   { return this.by('inventory-table'); }
  get tableBody(){ return this.table.getByTestId('table-body'); }

  // ── Actions ────────────────────────────────────────────────
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(300); // debounce
  }

  async filterByStatus(status: 'in-stock' | 'low-stock' | 'out-of-stock' | ''): Promise<void> {
    await this.statusFilter.selectOption(status);
  }

  async openAddModal(): Promise<void> {
    await this.addBtn.click();
    await this.expectModalOpen();
  }

  async fillInventoryForm(data: InventoryFormData): Promise<void> {
    await this.modalProductId.fill(data.productId);
    await this.modalName.fill(data.name);
    await this.modalQuantity.fill(String(data.quantity));
    await this.modalPrice.fill(String(data.price));
    if (data.dateHarvested) {
      await this.modalDate.fill(data.dateHarvested);
    }
  }

  async saveInventoryForm(): Promise<void> {
    await this.modalSaveBtn.click();
    await this.expectSuccessToast();
    await this.expectModalClosed();
  }

  /** Full add item flow */
  async addItem(data: InventoryFormData): Promise<void> {
    await this.openAddModal();
    await this.fillInventoryForm(data);
    await this.saveInventoryForm();
  }

  async editItem(id: string): Promise<void> {
    await this.by(`edit-${id}`).click();
    await this.expectModalOpen();
  }

  async deleteItem(id: string): Promise<void> {
    await this.by(`delete-${id}`).click();
    await this.expectModalOpen();
    await this.confirmDelete();
  }

  async bulkDelete(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.selectRow(id);
    }
    await this.bulkDeleteBtn.click();
    await this.expectModalOpen();
    await this.confirmDelete();
  }

  async sortBy(column: string): Promise<void> {
    await this.clickColumnHeader(column);
  }

  // ── Assertions ─────────────────────────────────────────────
  async expectOnPage(): Promise<void> {
    await expect(this.by('inventory-page')).toBeVisible();
  }

  async expectItemVisible(name: string): Promise<void> {
    await expect(this.tableBody.locator(`text=${name}`)).toBeVisible();
  }

  async expectItemNotVisible(name: string): Promise<void> {
    await expect(this.tableBody.locator(`text=${name}`)).not.toBeVisible();
  }

  async expectRowCount(count: number): Promise<void> {
    const rows = await this.getRowCount('inventory-table');
    expect(rows).toBe(count);
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.tableBody.locator('text=No inventory items found')).toBeVisible();
  }

  async expectStatusBadge(itemId: string, status: string): Promise<void> {
    await expect(this.by(`row-${itemId}`).getByTestId(`status-badge-${status}`)).toBeVisible();
  }
}
