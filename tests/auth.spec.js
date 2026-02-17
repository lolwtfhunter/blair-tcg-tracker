// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Auth Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Block ALL external requests — only allow localhost
    await page.route('**/*', route => {
      const url = route.request().url();
      if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) return route.continue();
      return route.fulfill({ body: '', contentType: 'text/plain' });
    });
    // Force auth modal to show by setting a test flag that bypasses Firebase auth
    // and directly calls showAuthModal()
    await page.addInitScript(() => {
      window.__TEST_FORCE_AUTH_MODAL = true;
    });
  });

  test('auth modal renders with sign-in form', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.auth-modal', { timeout: 15000 });
    const modal = page.locator('.auth-modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.auth-modal-title')).toHaveText('Sign In');
  });

  test('auth modal has email, password, and submit', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.auth-modal', { timeout: 15000 });
    await expect(page.locator('#authEmail')).toBeVisible();
    await expect(page.locator('#authPassword')).toBeVisible();
    await expect(page.locator('#authSubmitBtn')).toBeVisible();
  });

  test('auth modal has Google sign-in button', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.auth-modal', { timeout: 15000 });
    await expect(page.locator('#authGoogleBtn')).toBeVisible();
    await expect(page.locator('#authGoogleBtn')).toContainText('Google');
  });

  test('switch to register view', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.auth-modal', { timeout: 15000 });
    await page.locator('#authShowRegister').click();
    await expect(page.locator('.auth-modal-title')).toHaveText('Create Account');
    await expect(page.locator('#authName')).toBeVisible();
  });

  test('switch to forgot password view', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.auth-modal', { timeout: 15000 });
    await page.locator('#authShowForgot').click();
    await expect(page.locator('.auth-modal-title')).toHaveText('Reset Password');
    await expect(page.locator('#authPassword')).toHaveCount(0);
  });

  test('switch views: register then back to login', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.auth-modal', { timeout: 15000 });
    await page.locator('#authShowRegister').click();
    await expect(page.locator('.auth-modal-title')).toHaveText('Create Account');
    await page.locator('#authShowLogin').click();
    await expect(page.locator('.auth-modal-title')).toHaveText('Sign In');
  });

  test('test user bypasses auth modal and renders app', async ({ page }) => {
    // Override the beforeEach script — set test user instead of force-modal
    await page.addInitScript(() => {
      window.__TEST_FORCE_AUTH_MODAL = false;
      window.__TEST_AUTH_USER = { uid: 'test-123', email: 'test@test.com', displayName: 'Test' };
    });
    await page.goto('/');
    await page.waitForFunction(() => document.querySelectorAll('.block-btn').length > 0, null, { timeout: 15000 });
    await expect(page.locator('.auth-modal')).toHaveCount(0);
    await expect(page.locator('#userDisplayName')).toHaveText('Test');
  });
});
