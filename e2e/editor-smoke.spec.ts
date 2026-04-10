import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoEditor(page: Page) {
  await page.goto('/editor');
  await expect(page.getByTestId('page-surface')).toBeVisible();
}

function block(page: Page, blockId: string): Locator {
  return page.locator(`[data-block-id="${blockId}"]`);
}

async function setLayoutInput(page: Page, key: 'x' | 'y' | 'w' | 'h', value: number) {
  const input = page.getByTestId(`layout-input-${key}`);
  await input.click();
  await input.fill(String(value));
  await input.press('Tab');
}

test.describe('editor smoke', () => {
  test('host-provided custom renderer is visible and selectable', async ({ page }) => {
    await gotoEditor(page);

    await expect(page.getByTestId('demo-questions-renderer')).toBeVisible();
    await expect(page.getByTestId('demo-callout-renderer')).toBeVisible();
    await block(page, 'demo-questions-block').click();
    await expect(page.getByTestId('custom-renderer-selected-state')).toContainText('selected');
  });

  test('moving a block into a collision through layout controls shows collision feedback', async ({ page }) => {
    await gotoEditor(page);

    await block(page, 'block-2').click();
    await setLayoutInput(page, 'y', 0);

    await expect(page.getByTestId('collision-feedback')).toContainText('overlap');
    await expect(block(page, 'block-2')).toHaveAttribute('data-block-id', 'block-2');
  });

  test('resizing a block into a collision through layout controls shows collision feedback', async ({ page }) => {
    await gotoEditor(page);

    await block(page, 'block-1').click();
    await setLayoutInput(page, 'h', 7);

    await expect(page.getByTestId('collision-feedback')).toContainText('overlap');
    await expect(block(page, 'block-1')).toHaveAttribute('data-block-id', 'block-1');
  });

  test('undo and redo visibly restore editor state', async ({ page }) => {
    await gotoEditor(page);

    await expect(page.locator('[data-block-id]')).toHaveCount(4);
    await page.getByRole('button', { name: /add image/i }).click();
    await expect(page.locator('[data-block-id]')).toHaveCount(5);

    await page.getByTestId('undo-fab').click();
    await expect(page.locator('[data-block-id]')).toHaveCount(4);

    await page.getByTestId('redo-fab').click();
    await expect(page.locator('[data-block-id]')).toHaveCount(5);
  });
});
