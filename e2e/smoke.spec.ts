import { expect, test } from '@playwright/test';

test.describe('Smoke', () => {
  test('home renders main content', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('unknown route shows not-found UI', async ({ page }) => {
    const res = await page.goto('/route-that-should-not-exist-kbk');
    expect(res?.status()).toBe(404);
    await expect(
      page.getByRole('heading', { name: /this page slipped past us/i }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /go home/i })).toBeVisible();
  });
});
