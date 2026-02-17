// @ts-check
const { test, expect } = require('@playwright/test');
const { setupPage } = require('./helpers');

test.describe('Custom Set Editor', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await page.locator('.top-tab', { hasText: 'Custom Sets' }).click();
    await page.waitForFunction(
      () => document.querySelectorAll('#customSetButtons .set-btn').length > 0,
      null,
      { timeout: 10000 }
    );
  });

  test('custom sets tab shows set buttons after loading', async ({ page }) => {
    await expect(page.locator('#custom-sets-content')).toHaveClass(/active/);
    const setButtons = page.locator('#customSetButtons .set-btn');
    const count = await setButtons.count();
    // Should have at least 3 legacy sets + 1 "New Set" button
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('new set button exists when logged in', async ({ page }) => {
    const newSetBtn = page.locator('.new-set-btn');
    await expect(newSetBtn).toBeVisible();
    await expect(newSetBtn).toContainText('New Set');
  });

  test('clicking new set opens editor modal', async ({ page }) => {
    await page.locator('.new-set-btn').click();
    await expect(page.locator('#customSetEditorModal')).toBeVisible();
    await expect(page.locator('#cseSetName')).toBeVisible();
    await expect(page.locator('#cseThemeColor')).toBeVisible();
  });

  test('editor shows date and logo URL fields', async ({ page }) => {
    await page.locator('.new-set-btn').click();
    await expect(page.locator('#cseSetDate')).toBeVisible();
    await expect(page.locator('#cseLogoUrl')).toBeVisible();
    await expect(page.locator('#cseLogoPreview')).toBeVisible();
  });

  test('editor navigates between meta and card picker steps', async ({ page }) => {
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
    await page.locator('.new-set-btn').click();
    // Don't fill name, try to proceed
    await page.locator('.cse-btn.primary', { hasText: 'Next: Add Cards' }).click();

    // Should still be on meta step
    await expect(page.locator('#cseStepMeta')).toHaveClass(/active/);
    await expect(page.locator('#cseStepCards')).not.toHaveClass(/active/);
  });

  test('close button closes editor modal', async ({ page }) => {
    await page.locator('.new-set-btn').click();
    await expect(page.locator('#customSetEditorModal')).toBeVisible();

    await page.locator('.cse-close').click();
    await expect(page.locator('#customSetEditorModal')).toHaveCount(0);
  });

  test('edit and delete buttons appear on set buttons', async ({ page }) => {
    const editBtns = page.locator('.custom-set-action-btn.edit');
    const deleteBtns = page.locator('.custom-set-action-btn.delete');
    expect(await editBtns.count()).toBeGreaterThanOrEqual(1);
    expect(await deleteBtns.count()).toBeGreaterThanOrEqual(1);
  });

  test('set picker dropdown includes Pokemon and Lorcana sets', async ({ page }) => {
    await page.locator('.new-set-btn').click();
    await page.fill('#cseSetName', 'Test');
    await page.locator('.cse-btn.primary', { hasText: 'Next: Add Cards' }).click();

    const options = page.locator('#cseSetSelect option');
    const count = await options.count();
    // Should have many official sets + the placeholder
    expect(count).toBeGreaterThan(10);

    // Check that Lorcana optgroup exists
    const lorcanaGroup = page.locator('#cseSetSelect optgroup[label="Disney Lorcana"]');
    await expect(lorcanaGroup).toBeAttached();
    const lorcanaOptions = lorcanaGroup.locator('option');
    expect(await lorcanaOptions.count()).toBeGreaterThanOrEqual(1);
  });

  test('logo preview updates when URL is entered', async ({ page }) => {
    await page.locator('.new-set-btn').click();
    const preview = page.locator('#cseLogoPreview');

    // Initially empty
    await expect(preview).toBeVisible();

    // Enter a URL - preview should get an img element
    await page.fill('#cseLogoUrl', 'https://example.com/logo.png');
    const previewImg = preview.locator('img');
    await expect(previewImg).toBeAttached();
  });
});
