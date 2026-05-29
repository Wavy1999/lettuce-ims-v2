// ============================================================
//  e2e/lettuce-ims.spec.ts  –  End-to-end tests using POMs
//  Run: npx playwright test
// ============================================================

import { test, expect } from '@playwright/test';
import {
  LoginPagePOM,
  DashboardPagePOM,
  InventoryPagePOM,
  SalesPagePOM,
  OrdersPagePOM,
  SettingsPagePOM,
} from '../src/pom';

// ── Shared fixtures ────────────────────────────────────────
const TEST_EMAIL    = process.env.TEST_EMAIL    ?? 'test@lettuceims.local';
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'test1234';

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    const loginPage = new LoginPagePOM(page);
    await loginPage.navigate();
    await loginPage.expectOnLoginPage();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    const loginPage = new LoginPagePOM(page);
    await loginPage.navigate();
    await loginPage.login('wrong@example.com', 'wrongpassword');
    await loginPage.expectLoginError();
  });

  test('toggles password visibility', async ({ page }) => {
    const loginPage = new LoginPagePOM(page);
    await loginPage.navigate();
    await loginPage.fillPassword('secret123');
    await loginPage.expectPasswordHidden();
    await loginPage.togglePasswordVisibility();
    await loginPage.expectPasswordVisible();
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    const loginPage = new LoginPagePOM(page);
    await loginPage.navigate();
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
    await loginPage.expectLoginSuccess();

    const dashboard = new DashboardPagePOM(page);
    await dashboard.expectOnPage();
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPagePOM(page);
    await loginPage.navigate();
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
  });

  test('shows all stat cards', async ({ page }) => {
    const dashboard = new DashboardPagePOM(page);
    await dashboard.navigate();
    await expect(dashboard.statsGrid).toBeVisible();
    await expect(dashboard.totalProductsStat).toBeVisible();
    await expect(dashboard.revenueStat).toBeVisible();
    await expect(dashboard.pendingOrdersStat).toBeVisible();
  });

  test('shows revenue and top products charts', async ({ page }) => {
    const dashboard = new DashboardPagePOM(page);
    await dashboard.navigate();
    await expect(dashboard.revenueChart).toBeVisible();
    await expect(dashboard.topProductsChart).toBeVisible();
  });
});

test.describe('Inventory', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPagePOM(page);
    await loginPage.navigate();
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
  });

  test('renders inventory page', async ({ page }) => {
    const inv = new InventoryPagePOM(page);
    await inv.navigate();
    await inv.expectOnPage();
    await expect(inv.table).toBeVisible();
  });

  test('can add a new inventory item', async ({ page }) => {
    const inv = new InventoryPagePOM(page);
    await inv.navigate();
    await inv.addItem({
      productId:     'TEST-001',
      name:          'E2E Romaine Lettuce',
      quantity:      100,
      price:         50,
      dateHarvested: '2024-01-15',
    });
    await inv.expectItemVisible('E2E Romaine Lettuce');
  });

  test('can search inventory items', async ({ page }) => {
    const inv = new InventoryPagePOM(page);
    await inv.navigate();
    await inv.search('Romaine');
    // filtered results should only show romaine variants
  });

  test('can filter by status', async ({ page }) => {
    const inv = new InventoryPagePOM(page);
    await inv.navigate();
    await inv.filterByStatus('low-stock');
    // Only low stock items visible
  });

  test('can sort by name', async ({ page }) => {
    const inv = new InventoryPagePOM(page);
    await inv.navigate();
    await inv.sortBy('name');
    // Re-clicking reverses
    await inv.sortBy('name');
  });
});

test.describe('Sales', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPagePOM(page);
    await loginPage.navigate();
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
  });

  test('renders sales page', async ({ page }) => {
    const sales = new SalesPagePOM(page);
    await sales.navigate();
    await sales.expectOnPage();
    await expect(sales.revenueBanner).toBeVisible();
    await expect(sales.table).toBeVisible();
  });

  test('can filter by date range', async ({ page }) => {
    const sales = new SalesPagePOM(page);
    await sales.navigate();
    await sales.filterByDateRange('2024-01-01', '2024-12-31');
  });
});

test.describe('Orders', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPagePOM(page);
    await loginPage.navigate();
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
  });

  test('renders orders page', async ({ page }) => {
    const orders = new OrdersPagePOM(page);
    await orders.navigate();
    await orders.expectOnPage();
  });

  test('can create a new order', async ({ page }) => {
    const orders = new OrdersPagePOM(page);
    await orders.navigate();
    await orders.addOrder({
      customerName: 'E2E Test Customer',
      quantity:     25,
      pricePerUnit: 80,
      orderDate:    '2024-06-15',
    });
  });
});

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPagePOM(page);
    await loginPage.navigate();
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
  });

  test('renders settings page', async ({ page }) => {
    const settings = new SettingsPagePOM(page);
    await settings.navigate();
    await settings.expectOnPage();
  });

  test('can update app name', async ({ page }) => {
    const settings = new SettingsPagePOM(page);
    await settings.navigate();
    await settings.updateAppName('E2E Lettuce Farm');
  });

  test('can add and remove custom column', async ({ page }) => {
    const settings = new SettingsPagePOM(page);
    await settings.navigate();
    await settings.addCustomColumn('Supplier');
    await settings.expectColumnVisible('supplier');
    await settings.removeCustomColumn('supplier');
    await settings.expectColumnNotVisible('supplier');
  });

  test('can toggle dark mode', async ({ page }) => {
    const settings = new SettingsPagePOM(page);
    await settings.navigate();
    await settings.toggleDarkMode();
    await expect(page.locator('body')).toHaveClass(/dark-mode/);
  });
});
