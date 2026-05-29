// ============================================================
//  LoginPage.pom.ts  –  Page Object Model for Login
// ============================================================

import type { Page } from '@playwright/test';
import { expect }    from '@playwright/test';
import { BasePage }  from './BasePage.pom';

export class LoginPagePOM extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Selectors ─────────────────────────────────────────────
  get emailInput()    { return this.by('email-input');      }
  get passwordInput() { return this.by('password-input');   }
  get submitBtn()     { return this.by('submit-btn');       }
  get togglePassBtn() { return this.by('toggle-password'); }
  get errorAlert()    { return this.by('login-error');     }
  get loginForm()     { return this.by('login-form');      }

  // ── Navigation ─────────────────────────────────────────────
  async navigate(): Promise<void> {
    await this.goto('/login');
    await this.page.waitForSelector('[data-testid="login-page"]');
  }

  // ── Actions ────────────────────────────────────────────────
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitBtn.click();
  }

  /** Full login flow: fill + submit */
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  async togglePasswordVisibility(): Promise<void> {
    await this.togglePassBtn.click();
  }

  // ── Assertions ─────────────────────────────────────────────
  async expectOnLoginPage(): Promise<void> {
    await expect(this.by('login-page')).toBeVisible();
  }

  async expectLoginError(): Promise<void> {
    await expect(this.errorAlert).toBeVisible();
  }

  async expectLoginSuccess(): Promise<void> {
    // After successful login, redirected away from /login
    await this.page.waitForURL(/\/(dashboard|inventory)/);
  }

  async expectPasswordVisible(): Promise<void> {
    await expect(this.passwordInput).toHaveAttribute('type', 'text');
  }

  async expectPasswordHidden(): Promise<void> {
    await expect(this.passwordInput).toHaveAttribute('type', 'password');
  }

  async expectSubmitLoading(): Promise<void> {
    await expect(this.submitBtn).toBeDisabled();
  }
}
