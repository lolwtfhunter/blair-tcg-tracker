// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Custom Set Editor', () => {
  test.beforeEach(async ({ page }) => {
    // Block ALL external requests — only allow localhost
    await page.route('**/*', route => {
      const url = route.request().url();
      if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) return route.continue();
      return route.fulfill({ body: '', contentType: 'text/plain' });
    });
    await page.addInitScript(() => {
      window.__TEST_AUTH_USER = { uid: 'test-123', email: 'test@test.com', displayName: 'Test' };
    });
    await page.goto('/about.html');
    await page.evaluate(() => {
      localStorage.removeItem('pokemonVariantProgress');
    });
    await page.goto('/');
    await page.waitForFunction(() => document.querySelectorAll('.block-btn').length > 0, null, { timeout: 15000 });
  });

  test('custom sets tab shows set buttons after loading', async ({ page }) => {
    await page.locator('.top-tab', { hasText: 'Custom Sets' }).click();
    await expect(page.locator('#custom-sets-content')).toHaveClass(/active/);

    // Wait for custom sets to load from JSON (test mode)
    await page.waitForFunction(
      () => document.querySelectorAll('#customSetButtons .set-btn').length > 0,
      null,
      { timeout: 10000 }
    );

    const setButtons = page.locator('#customSetButtons .set-btn');
    const count = await setButtons.count();
    // Should have at least 3 legacy sets + 1 "New Set" button
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('new set button exists when logged in', async ({ page }) => {
    await page.locator('.top-tab', { hasText: 'Custom Sets' }).click();
    await page.waitForFunction(
      () => document.querySelectorAll('#customSetButtons .set-btn').length > 0,
      null,
      { timeout: 10000 }
    );

    const newSetBtn = page.locator('.new-set-btn');
    await expect(newSetBtn).toBeVisible();
    await expect(newSetBtn).toContainText('New Set');
  });

  test('clicking new set opens editor modal', async ({ page }) => {
    await page.locator('.top-tab', { hasText: 'Custom Sets' }).click();
    await page.waitForFunction(
      () => document.querySelectorAll('#customSetButtons .set-btn').length > 0,
      null,
      { timeout: 10000 }
    );

    await page.locator('.new-set-btn').click();
    await expect(page.locator('#customSetEditorModal')).toBeVisible();
    await expect(page.locator('#cseSetName')).toBeVisible();
    await expect(page.locator('#cseThemeColor')).toBeVisible();
  });

  test('editor navigates between meta and card picker steps', async ({ page }) => {
    await page.locator('.top-tab', { hasText: 'Custom Sets' }).click();
    await page.waitForFunction(
      () => document.querySelectorAll('#customSetButtons .set-btn').length > 0,
      null,
      { timeout: 10000 }
    );

    await page.locator('.new-set-btn').click();
    await expect(page.locator('#cseStepMeta')).toHaveClass(/active/);

    // Fill in name and go to card picker
    await page.fill('#cseSetName', 'Test Set');
    await page.locator('.cse-btn.primary', { hasText: 'Next: Add Cards' }).click();

    await expect(page.locator('#cseStepCards')).toHaveClass(/active/);
    await expect(page.locator('#cseStepMeta')).not.toHaveClass(/active/);

    // Go back
    await page.locator('.cse-btn.secondary', { hasText: 'Back' }).click();
    await expect(page.locator('#cseStepMeta')).toHaveClass(/active/);
  });

  test('editor requires name before proceeding', async ({ page }) => {
    await page.locator('.top-tab', { hasText: 'Custom Sets' }).click();
    await page.waitForFunction(
      () => document.querySelectorAll('#customSetButtons .set-btn').length > 0,
      null,
      { timeout: 10000 }
    );

    await page.locator('.new-set-btn').click();
    // Don't fill name, try to proceed
    await page.locator('.cse-btn.primary', { hasText: 'Next: Add Cards' }).click();

    // Should still be on meta step
    await expect(page.locator('#cseStepMeta')).toHaveClass(/active/);
    await expect(page.locator('#cseStepCards')).not.toHaveClass(/active/);
  });

  test('close button closes editor modal', async ({ page }) => {
    await page.locator('.top-tab', { hasText: 'Custom Sets' }).click();
    await page.waitForFunction(
      () => document.querySelectorAll('#customSetButtons .set-btn').length > 0,
      null,
      { timeout: 10000 }
    );

    await page.locator('.new-set-btn').click();
    await expect(page.locator('#customSetEditorModal')).toBeVisible();

    await page.locator('.cse-close').click();
    await page.waitForTimeout(300);
    await expect(page.locator('#customSetEditorModal')).toHaveCount(0);
  });

  test('edit and delete buttons appear on set buttons', async ({ page }) => {
    await page.locator('.top-tab', { hasText: 'Custom Sets' }).click();
    await page.waitForFunction(
      () => document.querySelectorAll('#customSetButtons .set-btn[data-custom-set-key]').length > 0,
      null,
      { timeout: 10000 }
    );

    const editBtns = page.locator('.custom-set-action-btn.edit');
    const deleteBtns = page.locator('.custom-set-action-btn.delete');
    expect(await editBtns.count()).toBeGreaterThanOrEqual(1);
    expect(await deleteBtns.count()).toBeGreaterThanOrEqual(1);
  });

  test('set picker dropdown is populated with official sets', async ({ page }) => {
    await page.locator('.top-tab', { hasText: 'Custom Sets' }).click();
    await page.waitForFunction(
      () => document.querySelectorAll('#customSetButtons .set-btn').length > 0,
      null,
      { timeout: 10000 }
    );

    await page.locator('.new-set-btn').click();
    await page.fill('#cseSetName', 'Test');
    await page.locator('.cse-btn.primary', { hasText: 'Next: Add Cards' }).click();

    const options = page.locator('#cseSetSelect option');
    const count = await options.count();
    // Should have many official sets + the placeholder
    expect(count).toBeGreaterThan(10);
  });
});
