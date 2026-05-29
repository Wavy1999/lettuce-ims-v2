// ============================================================
//  DashboardPage.pom.ts
// ============================================================

import type { Page } from '@playwright/test';
import { expect }    from '@playwright/test';
import { BasePage }  from './BasePage.pom';

export class DashboardPagePOM extends BasePage {
  constructor(page: Page) { super(page); }

  async navigate(): Promise<void> {
    await this.goto('/dashboard');
    await this.page.waitForSelector('[data-testid="dashboard-page"]');
  }

  // Stats cards
  get statsGrid()         { return this.by('stats-grid');              }
  get totalProductsStat() { return this.by('stat-products-value');     }
  get invValueStat()      { return this.by('stat-inv-value-value');    }
  get revenueStat()       { return this.by('stat-revenue-value');      }
  get pendingOrdersStat() { return this.by('stat-pending-orders-value');}
  get lowStockStat()      { return this.by('stat-low-stock-value');    }

  // Charts
  get revenueChart()      { return this.by('revenue-chart');           }
  get topProductsChart()  { return this.by('top-products-chart');      }

  // Recent sales
  get recentSales()       { return this.by('recent-sales');            }

  async expectOnPage(): Promise<void> {
    await expect(this.by('dashboard-page')).toBeVisible();
  }

  async expectStatCard(testId: string, value: string): Promise<void> {
    await expect(this.by(`${testId}-value`)).toContainText(value);
  }
}

// ============================================================
//  SalesPage.pom.ts
// ============================================================
export class SalesPagePOM extends BasePage {
  constructor(page: Page) { super(page); }

  async navigate(): Promise<void> {
    await this.goto('/dashboard');
    await this.clickNavItem('sales');
    await this.page.waitForSelector('[data-testid="sales-page"]');
  }

  get searchInput()     { return this.by('sales-search');            }
  get dateFromInput()   { return this.by('sales-date-from');         }
  get dateToInput()     { return this.by('sales-date-to');           }
  get addSaleBtn()      { return this.by('btn-add-sale');            }
  get exportBtn()       { return this.by('btn-export-sales');        }
  get revenueBanner()   { return this.by('revenue-banner');          }
  get table()           { return this.by('sales-table');             }

  // Modal
  get productSelect()   { return this.by('sale-product-select');     }
  get quantityInput()   { return this.by('sale-quantity');           }
  get unitPriceInput()  { return this.by('sale-unit-price');         }
  get totalInput()      { return this.by('sale-total');              }
  get confirmSaleBtn()  { return this.by('btn-confirm-sale');        }
  get cancelSaleBtn()   { return this.by('btn-cancel-sale');         }

  async openNewSaleModal(): Promise<void> {
    await this.addSaleBtn.click();
    await this.expectModalOpen();
  }

  async recordSale(productId: string, quantity: number): Promise<void> {
    await this.openNewSaleModal();
    await this.productSelect.selectOption(productId);
    await this.quantityInput.fill(String(quantity));
    await this.confirmSaleBtn.click();
    await this.expectSuccessToast();
  }

  async filterByDateRange(from: string, to: string): Promise<void> {
    await this.dateFromInput.fill(from);
    await this.dateToInput.fill(to);
  }

  async expectOnPage(): Promise<void> {
    await expect(this.by('sales-page')).toBeVisible();
  }

  async expectRevenueBannerContains(text: string): Promise<void> {
    await expect(this.revenueBanner).toContainText(text);
  }
}

// ============================================================
//  OrdersPage.pom.ts
// ============================================================
export interface OrderFormData {
  customerName:  string;
  quantity:      number;
  pricePerUnit:  number;
  orderDate:     string;
}

export class OrdersPagePOM extends BasePage {
  constructor(page: Page) { super(page); }

  async navigate(): Promise<void> {
    await this.goto('/dashboard');
    await this.clickNavItem('orders');
    await this.page.waitForSelector('[data-testid="orders-page"]');
  }

  get searchInput()    { return this.by('orders-search');             }
  get statusFilter()   { return this.by('orders-status-filter');      }
  get addBtn()         { return this.by('btn-add-order');             }
  get table()          { return this.by('orders-table');              }

  // Modal
  get customerInput()  { return this.by('order-customer');            }
  get quantityInput()  { return this.by('order-quantity');            }
  get priceInput()     { return this.by('order-price');               }
  get dateInput()      { return this.by('order-date');                }
  get saveBtn()        { return this.by('btn-save-order');            }

  async openAddModal(): Promise<void> {
    await this.addBtn.click();
    await this.expectModalOpen();
  }

  async fillOrderForm(data: OrderFormData): Promise<void> {
    await this.customerInput.fill(data.customerName);
    await this.quantityInput.fill(String(data.quantity));
    await this.priceInput.fill(String(data.pricePerUnit));
    await this.dateInput.fill(data.orderDate);
  }

  async addOrder(data: OrderFormData): Promise<void> {
    await this.openAddModal();
    await this.fillOrderForm(data);
    await this.saveBtn.click();
    await this.expectSuccessToast();
  }

  async fulfillOrder(id: string): Promise<void> {
    await this.by(`fulfill-${id}`).click();
    await this.expectSuccessToast();
  }

  async cancelOrder(id: string): Promise<void> {
    await this.by(`cancel-order-${id}`).click();
    await this.expectSuccessToast();
  }

  async expectOnPage(): Promise<void> {
    await expect(this.by('orders-page')).toBeVisible();
  }

  async expectPendingCount(count: number): Promise<void> {
    await expect(this.by('pending-count')).toContainText(String(count));
  }
}

// ============================================================
//  SettingsPage.pom.ts
// ============================================================
export class SettingsPagePOM extends BasePage {
  constructor(page: Page) { super(page); }

  async navigate(): Promise<void> {
    await this.goto('/dashboard');
    await this.clickNavItem('settings');
    await this.page.waitForSelector('[data-testid="settings-page"]');
  }

  get appNameInput()     { return this.by('setting-app-name');       }
  get thresholdInput()   { return this.by('setting-threshold');      }
  get currencyInput()    { return this.by('setting-currency');       }
  get saveGeneralBtn()   { return this.by('btn-save-general');       }
  get darkModeToggle()   { return this.by('dark-mode-toggle').locator('input'); }
  get newColumnInput()   { return this.by('new-column-name');        }
  get addColumnBtn()     { return this.by('btn-add-column');         }
  get newPasswordInput() { return this.by('new-password');           }
  get changePassBtn()    { return this.by('btn-change-password');    }

  async updateAppName(name: string): Promise<void> {
    await this.appNameInput.fill(name);
    await this.saveGeneralBtn.click();
    await this.expectSuccessToast();
  }

  async addCustomColumn(name: string): Promise<void> {
    await this.newColumnInput.fill(name);
    await this.addColumnBtn.click();
    await this.expectSuccessToast();
  }

  async removeCustomColumn(key: string): Promise<void> {
    await this.by(`remove-col-${key}`).click();
  }

  async toggleDarkMode(): Promise<void> {
    await this.darkModeToggle.click();
  }

  async expectOnPage(): Promise<void> {
    await expect(this.by('settings-page')).toBeVisible();
  }

  async expectColumnVisible(key: string): Promise<void> {
    await expect(this.by(`custom-col-${key}`)).toBeVisible();
  }

  async expectColumnNotVisible(key: string): Promise<void> {
    await expect(this.by(`custom-col-${key}`)).not.toBeVisible();
  }
}
