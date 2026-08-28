import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function finishVisualVerification(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => {
    const pulse = document.querySelector('#pulse');
    const pad = document.querySelector<HTMLButtonElement>('#verify-pad');
    if (!pulse || !pad) return;
    new MutationObserver(() => { if (pulse.classList.contains('hit')) pad.click(); }).observe(pulse, { attributes: true, attributeFilter: ['class'] });
  });
  await page.getByRole('button', { name: 'Start 20-beat verification' }).click();
  await expect(page.locator('#verify-results')).toBeVisible({ timeout: 15_000 });
}

async function downloadJson(page: import('@playwright/test').Page): Promise<Record<string, any>> {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export calibration JSON' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let contents = '';
  for await (const chunk of stream) contents += chunk.toString();
  return JSON.parse(contents) as Record<string, any>;
}

test('runs sample analysis, manual device input, verification, and export preview', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page).toHaveTitle(/Pulse Check/);
  await expect(page.locator('h1')).toHaveCount(1);
  await page.getByRole('button', { name: 'Use a clean 120 BPM sample' }).click();
  await expect(page.getByText(/analyzed locally/)).toBeVisible();
  const bpm = Number(await page.locator('#bpm').inputValue());
  expect(bpm).toBeGreaterThan(119);
  expect(bpm).toBeLessThan(121);
  await page.getByRole('button', { name: 'Confirm source grid' }).click();
  await expect(page.getByRole('button', { name: 'Start 12-pulse test' })).toBeEnabled();
  await page.getByText('Use a known offset instead of tapping').click();
  await page.locator('#manual-offset').fill('0');
  await page.getByRole('button', { name: 'Use known offset' }).click();
  await page.getByRole('button', { name: 'Use this device offset' }).click();
  await expect(page.getByRole('button', { name: 'Start 20-beat verification' })).toBeEnabled();
  await finishVisualVerification(page);
  await expect(page.locator('#json-preview')).toContainText('in.sociobot.pulse-check/v1');
  expect(errors).toEqual([]);
});

test('invalidates every dependent result and export after a source grid edit', async ({ page }, testInfo) => {
  testInfo.setTimeout(45_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Use a clean 120 BPM sample' }).click();
  await expect(page.getByText(/analyzed locally/)).toBeVisible();
  await page.getByRole('button', { name: 'Confirm source grid' }).click();
  await page.getByText('Use a known offset instead of tapping').click();
  await page.locator('#manual-offset').fill('25');
  await page.getByRole('button', { name: 'Use known offset' }).click();
  await page.getByRole('button', { name: 'Use this device offset' }).click();
  await finishVisualVerification(page);

  const original = await downloadJson(page);
  expect(original.source.bpm).toBeGreaterThan(120);
  expect(original.source.bpm).toBeLessThan(121);
  expect(original.device.observed_offset_ms).toBe(25);
  expect(original.verification.samples).toBe(20);

  await page.locator('#bpm').fill('130');
  await page.getByRole('button', { name: 'Recheck grid' }).click();

  await expect(page.getByRole('button', { name: 'Confirm source grid' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start 12-pulse test' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Start 20-beat verification' })).toBeDisabled();
  await expect(page.locator('#device-results')).toBeHidden();
  await expect(page.locator('#verify-results')).toBeHidden();
  await expect(page.locator('#json-preview')).toBeEmpty();

  let unexpectedDownload = false;
  page.once('download', () => { unexpectedDownload = true; });
  await page.locator('#export-json').dispatchEvent('click');
  await page.waitForTimeout(100);
  expect(unexpectedDownload).toBe(false);
  await expect(page.locator('#verify-status')).toHaveText('Complete and confirm all three passes before exporting.');

  await page.getByRole('button', { name: 'Confirm source grid' }).click();
  await page.locator('#manual-offset').fill('30');
  await page.getByRole('button', { name: 'Use known offset' }).click();
  await page.getByRole('button', { name: 'Use this device offset' }).click();
  await finishVisualVerification(page);

  const repaired = await downloadJson(page);
  expect(repaired.source.bpm).toBe(130);
  expect(repaired.device.observed_offset_ms).toBe(30);
  expect(repaired.verification.samples).toBe(20);
});

test('requires an explicit first-beat anchor instead of treating blank as zero', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Use a clean 120 BPM sample' }).click();
  await expect(page.getByText(/analyzed locally/)).toBeVisible();

  // Establish a non-zero accepted grid so a blank submission cannot pass by
  // silently retaining diagnostics that happened to be based on zero.
  await page.locator('#anchor').fill('125');
  await page.getByRole('button', { name: 'Recheck grid' }).click();
  const acceptedDiagnostics = await page.locator('#source-summary').textContent();
  const acceptedDrift = await page.locator('#drift-rate').textContent();

  await page.locator('#anchor').fill('');
  await page.getByRole('button', { name: 'Recheck grid' }).click();

  await expect(page.locator('#track-status')).toHaveText('Enter a BPM from 30 to 300 and a non-negative anchor time.');
  await expect(page.locator('#track-status')).toHaveClass(/error/);
  await expect(page.locator('#source-summary')).toHaveText(acceptedDiagnostics ?? '');
  await expect(page.locator('#drift-rate')).toHaveText(acceptedDrift ?? '');
  await expect(page.getByRole('button', { name: 'Confirm source grid' })).toBeVisible();

  // An explicit zero is still a valid, intentional source anchor.
  await page.locator('#anchor').fill('0');
  await page.getByRole('button', { name: 'Recheck grid' }).click();
  await expect(page.locator('#track-status')).toHaveText(/Grid updated/);
});

test('requires an explicit manual offset before creating a confirmable device result', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Use a clean 120 BPM sample' }).click();
  await expect(page.getByText(/analyzed locally/)).toBeVisible();
  await page.getByRole('button', { name: 'Confirm source grid' }).click();
  await page.getByText('Use a known offset instead of tapping').click();

  await page.locator('#manual-offset').fill('');
  await page.getByRole('button', { name: 'Use known offset' }).click();

  await expect(page.locator('#device-status')).toHaveText('Enter a known offset between −1000 and 1000 ms.');
  await expect(page.locator('#device-status')).toHaveClass(/error/);
  await expect(page.locator('#device-results')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Start 20-beat verification' })).toBeDisabled();

  // Zero remains allowed when it is actually measured and deliberately entered.
  await page.locator('#manual-offset').fill('0');
  await page.getByRole('button', { name: 'Use known offset' }).click();
  await expect(page.locator('#offset-value')).toHaveText('+0.0 ms');
  await expect(page.getByRole('button', { name: 'Use this device offset' })).toBeVisible();
});

test('has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('footer links meet the 44px touch-target contract', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Privacy', 'Terms', 'Source']) {
    const box = await page.getByRole('link', { name, exact: true }).boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});

test('legal pages are directly available', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy');
  await page.goto('/terms/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Terms');
});

test('application shell works offline after the first visit', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find where the beat went.');
  await expect(page.getByText(/You’re offline/)).toBeVisible();
});
