import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('./'); });

test('counter persists and destructive reset requires confirmation', async ({ page }) => {
  await page.getByRole('button', { name: '点击 +1' }).click({ clickCount: 3 });
  await expect(page.locator('#count')).toHaveText('3');
  await page.reload(); await expect(page.locator('#count')).toHaveText('3');
  await page.getByRole('button', { name: '计数减一' }).click();
  await expect(page.locator('#count')).toHaveText('2');
  await page.getByRole('button', { name: '重置计数' }).click();
  await page.getByRole('button', { name: '保留计数' }).click();
  await expect(page.locator('#count')).toHaveText('2');
  await page.getByRole('button', { name: '重置计数' }).click();
  await page.getByRole('button', { name: '确认清零' }).click();
  await expect(page.locator('#count')).toHaveText('0');
  await expect(page.getByRole('button', { name: '计数减一' })).toBeDisabled();
});

test('dice produces real pips, records history, and survives reload', async ({ page }) => {
  await page.getByRole('button', { name: '掷一枚骰子' }).click();
  await expect(page.locator('#die')).toHaveAttribute('aria-label', /骰子点数：[1-6]/);
  const face = await page.locator('#die').getAttribute('data-face');
  const pips = await page.locator('#die .pip').evaluateAll(nodes => nodes.filter(node => getComputedStyle(node).opacity === '1').length);
  expect(pips).toBe(Number(face));
  await expect(page.locator('#dice-history li')).toHaveCount(1);
  await page.reload(); await expect(page.locator('#die')).toHaveAttribute('data-face', face);
  await expect(page.locator('#rolls')).toHaveText('1 次');
});

test('timer supports custom duration, pause, reload, resume, and reset', async ({ page }) => {
  await page.getByRole('button', { name: '自定义', exact: true }).click();
  await page.getByLabel('专注时长（1–180 分钟）').fill('3');
  await page.getByRole('button', { name: '设定时长' }).click();
  await expect(page.locator('#timer')).toHaveText('03:00');
  await page.clock.install();
  await page.getByRole('button', { name: '开始专注' }).click();
  await page.clock.fastForward(3000);
  await expect(page.locator('#timer')).toHaveText('02:57');
  await page.getByRole('button', { name: '暂停专注' }).click();
  await page.clock.fastForward(10000);
  await expect(page.locator('#timer')).toHaveText('02:57');
  await page.reload(); await expect(page.locator('#timer')).toHaveText('02:57');
  await page.getByRole('button', { name: '继续专注' }).click();
  await expect(page.getByRole('button', { name: '暂停专注' })).toBeVisible();
  await page.getByRole('button', { name: '重置计时器' }).click();
  await expect(page.locator('#timer')).toHaveText('03:00');
});

test('expired saved timer is counted once when reopening', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('duo-pocket-lab:v1', JSON.stringify({ version: 1, count: 0, dice: [], rolls: 0, minutes: 1, remainingMs: 60000, endsAt: Date.now() - 1000, sessions: 2 })));
  await page.reload();
  await expect(page.locator('#timer')).toHaveText('00:00');
  await expect(page.locator('#sessions')).toHaveText('3');
  await expect(page.locator('#completion')).toBeVisible();
  await page.reload(); await expect(page.locator('#sessions')).toHaveText('3');
});

test('invalid saved data and denied storage do not crash the tools', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('duo-pocket-lab:v1', 'broken-json'));
  await page.reload(); await expect(page.locator('#count')).toHaveText('0');
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); }; });
  await page.reload();
  await page.getByRole('button', { name: '点击 +1' }).click();
  await expect(page.locator('#count')).toHaveText('1');
  await expect(page.locator('#storage-warning')).toBeVisible();
});

test('iPhone installation instructions and home-screen assets are available', async ({ page, request }) => {
  await page.getByRole('button', { name: '安装到主屏幕' }).click();
  await expect(page.getByRole('dialog', { name: '把实验室带到主屏幕' })).toBeVisible();
  await expect(page.locator('.install-steps')).toContainText('Safari');
  await page.getByRole('button', { name: '知道了' }).click();
  const manifest = await request.get('manifest.webmanifest'); expect(manifest.ok()).toBeTruthy();
  const data = await manifest.json(); expect(data.start_url).toBe('./'); expect(data.scope).toBe('./'); expect(data.display).toBe('standalone');
  for (const icon of [...data.icons, { src: './icons/apple-touch-icon.png' }]) {
    const response = await request.get(icon.src); expect(response.ok()).toBeTruthy(); expect(response.headers()['content-type']).toBe('image/png');
  }
});

test('small and large viewports have no horizontal overflow', async ({ page }) => {
  for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `viewport ${width}`).toBeTruthy();
  }
});

test('core tools still work after going offline and reloading the Pages subpath', async ({ page, context }) => {
  await expect(page.locator('#connection-text')).toHaveText('离线已就绪');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.getByRole('button', { name: '点击 +1' }).click();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#connection-text')).toHaveText('离线使用中');
  await expect(page.locator('#count')).toHaveText('1');
  await page.getByRole('button', { name: '点击 +1' }).click();
  await expect(page.locator('#count')).toHaveText('2');
  await page.getByRole('button', { name: '掷一枚骰子' }).click();
  await expect(page.locator('#die')).toHaveAttribute('data-face', /[1-6]/);
  await page.getByRole('button', { name: '开始专注' }).click();
  await expect(page.getByRole('button', { name: '暂停专注' })).toBeVisible();
  await context.setOffline(false);
});

test('page loads without browser errors', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.reload();
  await page.getByRole('button', { name: '点击 +1' }).click();
  await page.getByRole('button', { name: '掷一枚骰子' }).click();
  expect(errors).toEqual([]);
});
