// ============================================================
//  BasePage.pom.ts  –  Page Object Model base class
//  Compatible with Playwright (Page) and Cypress (via adapter).
//  Each page-specific POM extends this class.
// ============================================================

import type { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ─────────────────────────────────────────────
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  // ── Element helpers ────────────────────────────────────────
  by(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  byRole(role: Parameters<Page['getByRole']>[0], name: string): Locator {
    return this.page.getByRole(role, { name });
  }

  // ── Toast assertions ───────────────────────────────────────
  async expectToast(type: 'success' | 'error' | 'warning' | 'info'): Promise<void> {
    await this.page.getByTestId(`toast-${type}`).waitFor({ state: 'visible' });
  }

  async expectSuccessToast(): Promise<void> { await this.expectToast('success'); }
  async expectErrorToast():   Promise<void> { await this.expectToast('error');   }

  // ── Modal helpers ──────────────────────────────────────────
  async expectModalOpen(): Promise<void> {
    await this.page.getByTestId('modal').waitFor({ state: 'visible' });
  }

  async closeModal(): Promise<void> {
    await this.page.getByTestId('modal-close').click();
  }

  async expectModalClosed(): Promise<void> {
    await this.page.getByTestId('modal').waitFor({ state: 'hidden' });
  }

  // ── Table helpers ──────────────────────────────────────────
  async getRowCount(tableTestId: string): Promise<number> {
    return this.page.getByTestId(tableTestId)
      .getByTestId('table-body')
      .locator('tr')
      .count();
  }

  async clickColumnHeader(column: string): Promise<void> {
    await this.page.getByTestId(`th-${column}`).click();
  }

  // ── Pagination ─────────────────────────────────────────────
  async goToNextPage(): Promise<void> {
    await this.page.getByTestId('pg-next').click();
  }

  async goToPrevPage(): Promise<void> {
    await this.page.getByTestId('pg-prev').click();
  }

  async goToPage(n: number): Promise<void> {
    await this.page.getByTestId(`pg-${n}`).click();
  }

  // ── Selection ──────────────────────────────────────────────
  async selectAll(): Promise<void> {
    await this.page.getByTestId('select-all').check();
  }

  async selectRow(id: string): Promise<void> {
    await this.page.getByTestId(`check-${id}`).check();
  }

  // ── Delete confirm flow ────────────────────────────────────
  async confirmDelete(): Promise<void> {
    await this.page.getByTestId('btn-confirm-delete').click();
    await this.expectSuccessToast();
  }

  async cancelDelete(): Promise<void> {
    await this.page.getByTestId('btn-cancel-delete').click();
  }

  // ── Navbar ─────────────────────────────────────────────────
  async getPageTitle(): Promise<string> {
    return this.page.getByTestId('page-title').innerText();
  }

  async clickNavItem(page: string): Promise<void> {
    await this.page.getByTestId(`nav-${page}`).click();
  }

  async logout(): Promise<void> {
    await this.page.getByTestId('logout-btn').click();
  }
}
