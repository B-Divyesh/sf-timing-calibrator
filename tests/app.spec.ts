import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { Buffer } from 'node:buffer';

type Page = import('@playwright/test').Page;

async function waitForDemoAnalysis(page: Page): Promise<void> {
  await page.goto('/demo');
  await expect(page.getByText(/analyzed locally/)).toBeVisible();
  await expect(page.locator('#track-results')).toBeVisible();
}

async function confirmDemoSource(page: Page): Promise<void> {
  await waitForDemoAnalysis(page);
  await page.getByRole('button', { name: 'Confirm source grid' }).click();
  await expect(page.getByRole('button', { name: 'Start 12-pulse test' })).toBeEnabled();
}

async function useKnownOffset(page: Page, offset = '0'): Promise<void> {
  await page.getByText('Use a known offset instead of tapping').click();
  await page.locator('#manual-offset').fill(offset);
  await page.getByRole('button', { name: 'Use known offset' }).click();
  await page.getByRole('button', { name: 'Use this device offset' }).click();
}

async function finishVisualVerification(page: Page): Promise<void> {
  await page.evaluate(() => {
    const pulse = document.querySelector('#pulse');
    const pad = document.querySelector<HTMLButtonElement>('#verify-pad');
    if (!pulse || !pad) return;
    new MutationObserver(() => { if (pulse.classList.contains('hit')) pad.click(); }).observe(pulse, { attributes: true, attributeFilter: ['class'] });
  });
  await page.getByRole('button', { name: 'Start 20-beat verification' }).click();
  await expect(page.locator('#verify-results')).toBeVisible({ timeout: 15_000 });
}

async function finishDeviceTapTest(page: Page): Promise<void> {
  await page.evaluate(() => {
    const pulse = document.querySelector('#pulse');
    const pad = document.querySelector<HTMLButtonElement>('#tap-pad');
    if (!pulse || !pad) return;
    new MutationObserver(() => { if (pulse.classList.contains('hit')) pad.click(); }).observe(pulse, { attributes: true, attributeFilter: ['class'] });
  });
  await page.getByRole('button', { name: 'Start 12-pulse test' }).click();
  await expect(page.locator('#device-results')).toBeVisible({ timeout: 12_000 });
}

async function downloadJson(page: Page): Promise<Record<string, unknown>> {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export calibration JSON' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let contents = '';
  for await (const chunk of stream!) contents += chunk.toString();
  return JSON.parse(contents) as Record<string, unknown>;
}

function wavClickTrack(): Buffer {
  const rate = 8_000;
  const seconds = 3;
  const frames = rate * seconds;
  const buffer = Buffer.alloc(44 + frames * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + frames * 2, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24);
  buffer.writeUInt32LE(rate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(frames * 2, 40);
  for (const beat of [0.5, 1, 1.5, 2, 2.5]) {
    const start = Math.round(beat * rate);
    for (let index = 0; index < 100; index += 1) buffer.writeInt16LE(Math.round(Math.exp(-index / 22) * 26000), 44 + (start + index) * 2);
  }
  return buffer;
}

test('@claim:demo-one-click opens a populated sample result without setup', async ({ page }) => {
  await waitForDemoAnalysis(page);
  await expect(page).toHaveTitle('Demo — Pulse Check');
  await expect(page.getByText('Demo — sample data, nothing is saved.')).toBeVisible();
  await expect(page.locator('#source-stamp')).toHaveText('Source grid is steady');
  await expect(page.locator('#onset-count')).toHaveText('15');
});

test('@claim:demo-isolation keeps demo state separate and discards it on exit', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('pulse-check:real-sentinel', 'keep-me'));
  await waitForDemoAnalysis(page);
  expect(await page.evaluate(() => localStorage.getItem('pulse-check:real-sentinel'))).toBe('keep-me');
  expect(await page.evaluate(() => localStorage.getItem('demo:pulse-check:session'))).toContain('steady-120-bpm');

  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('#source-stamp')).toHaveText('Source grid is steady');
  await page.getByRole('button', { name: 'Start for real' }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#track-status')).toHaveText('Choose a local audio file to start a calibration.');
  expect(await page.evaluate(() => localStorage.getItem('demo:pulse-check:session'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('pulse-check:real-sentinel'))).toBe('keep-me');
});

test('@claim:steady-reference-track reports the displayed 120 BPM sample as steady', async ({ page }) => {
  await waitForDemoAnalysis(page);
  await expect(page.locator('#bpm')).toHaveValue('120');
  await expect(page.locator('#source-stamp')).toHaveText('Source grid is steady');
  await expect(page.locator('#source-summary')).toContainText('regular beat grid');
  await expect(page.locator('#drift-rate')).toHaveText(/^[+]?0\.0 ms$/);
});

test('@claim:local-audio-onsets analyzes a selected local WAV in the browser', async ({ page }) => {
  await waitForDemoAnalysis(page);
  await page.locator('#audio-file').setInputFiles({ name: 'maker-clicks.wav', mimeType: 'audio/wav', buffer: wavClickTrack() });
  await expect(page.locator('#track-status')).toContainText('maker-clicks.wav analyzed locally');
  await expect(page.locator('#onset-count')).toHaveText('5');
  await expect(page.locator('#wave-text')).toContainText('5 onsets detected');
});

test('@claim:audio-size-limit rejects a local audio file above 50 MB before decoding', async ({ page }) => {
  await waitForDemoAnalysis(page);
  await page.evaluate(() => {
    const input = document.querySelector<HTMLInputElement>('#audio-file')!;
    const file = new File([new Uint8Array(50 * 1024 * 1024 + 1)], 'too-large.wav', { type: 'audio/wav' });
    const data = new DataTransfer();
    data.items.add(file);
    input.files = data.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#track-status')).toHaveText('That file is over 50 MB. Choose a shorter excerpt or an uncompressed clip under the limit.');
  await expect(page.locator('#track-results')).toBeVisible();
});

test('@claim:device-tap measures a 12-pulse tap result', async ({ page }, testInfo) => {
  testInfo.setTimeout(25_000);
  await confirmDemoSource(page);
  await finishDeviceTapTest(page);
  await expect(page.locator('#sample-value')).toHaveText('12');
  await expect(page.locator('#device-summary')).toContainText('browser clock');
});

test('@claim:manual-offset accepts an accessible known-offset measurement', async ({ page }) => {
  await confirmDemoSource(page);
  await useKnownOffset(page, '-25');
  await expect(page.locator('#offset-value')).toHaveText('-25.0 ms');
  await expect(page.locator('#sample-value')).toHaveText('manual');
  await expect(page.getByRole('button', { name: 'Start 20-beat verification' })).toBeEnabled();
});

test('@claim:twenty-beat-proof @claim:engine-json-export @claim:local-privacy completes a proof, exports engine settings, and sends no third-party request', async ({ page }, testInfo) => {
  testInfo.setTimeout(45_000);
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await confirmDemoSource(page);
  await useKnownOffset(page, '0');
  await finishVisualVerification(page);

  await expect(page.locator('#verify-hits')).toHaveText('20 / 20');
  await expect(page.locator('#verify-error')).toContainText('ms');
  await page.locator('#engine').selectOption('godot');
  await expect(page.locator('#json-preview')).toContainText('audio_offset_seconds');
  await page.locator('#engine').selectOption('unity');
  await expect(page.locator('#json-preview')).toContainText('dsp_offset_seconds');
  await page.locator('#engine').selectOption('generic');
  const exported = await downloadJson(page);
  expect(exported.engine).toBe('generic');
  expect(JSON.stringify(exported)).toContain('correction_ms');
  expect(JSON.stringify(exported)).not.toContain('audio_data');
  expect((await page.context().cookies()).length).toBe(0);
  expect(requests.every((url) => new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true);
});

test('@claim:offline-reload works offline after the first visit', async ({ browser }) => {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await waitForDemoAnalysis(page);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload();
    await context.setOffline(true);
    await page.reload();
    await expect(page).toHaveTitle('Demo — Pulse Check');
    await expect(page.getByText(/You’re offline/)).toBeVisible();
    await expect(page.locator('#source-stamp')).toHaveText('Source grid is steady');
  } finally {
    await context.close();
  }
});

test('@claim:no-account-sample runs the sample without account or payment details', async ({ page }) => {
  await waitForDemoAnalysis(page);
  await expect(page.getByRole('button', { name: 'Reset demo' })).toBeVisible();
  await expect(page.locator('input[type="email"], input[type="password"], input[autocomplete="cc-number"]')).toHaveCount(0);
});

test('@claim:required-measurements rejects blank timing measurements while allowing explicit boundaries', async ({ page }) => {
  await confirmDemoSource(page);
  await page.getByText('Use a known offset instead of tapping').click();
  await page.locator('#manual-offset').fill('');
  await page.getByRole('button', { name: 'Use known offset' }).click();
  await expect(page.locator('#device-status')).toHaveClass(/error/);
  await expect(page.locator('#device-results')).toBeHidden();
  await page.locator('#manual-offset').fill('-1000');
  await page.getByRole('button', { name: 'Use known offset' }).click();
  await expect(page.locator('#offset-value')).toHaveText('-1000.0 ms');
});

test('does not alter an accepted source grid when an anchor is blank', async ({ page }) => {
  await waitForDemoAnalysis(page);
  await page.locator('#anchor').fill('125');
  await page.getByRole('button', { name: 'Recheck grid' }).click();
  const accepted = await page.locator('#source-summary').textContent();
  await page.locator('#anchor').fill('');
  await page.getByRole('button', { name: 'Recheck grid' }).click();
  await expect(page.locator('#track-status')).toHaveClass(/error/);
  await expect(page.locator('#source-summary')).toHaveText(accepted ?? '');
});

test('@claim:dependent-results-reset clears device, proof, and export state after a confirmed source grid edit', async ({ page }, testInfo) => {
  testInfo.setTimeout(45_000);
  await confirmDemoSource(page);
  await useKnownOffset(page, '25');
  await finishVisualVerification(page);
  await page.locator('#bpm').fill('130');
  await page.getByRole('button', { name: 'Recheck grid' }).click();
  await expect(page.getByRole('button', { name: 'Start 12-pulse test' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Start 20-beat verification' })).toBeDisabled();
  await expect(page.locator('#device-results')).toBeHidden();
  await expect(page.locator('#verify-results')).toBeHidden();
  await expect(page.locator('#json-preview')).toBeEmpty();
});

test('supports keyboard taps, reduced motion, focus, mobile width, and accessible landmarks', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await confirmDemoSource(page);
  await page.getByRole('button', { name: 'Start 12-pulse test' }).click();
  await page.locator('#tap-pad').focus();
  for (let index = 0; index < 12; index += 1) {
    await page.waitForFunction(() => document.querySelector('#pulse')?.classList.contains('hit') === true);
    await page.keyboard.press(index % 2 ? 'Enter' : 'Space');
    await page.waitForFunction(() => document.querySelector('#pulse')?.classList.contains('hit') === false);
  }
  await expect(page.locator('#device-results')).toBeVisible();
  expect(await page.locator('#pulse span').evaluate((node) => getComputedStyle(node).transform)).toBe('none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.goto('/');
  await expect(page.locator('#demo-banner')).toBeHidden();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Separate track drift from device delay');
  await page.keyboard.press('Tab');
  await expect(page.getByText('Skip to calibration')).toBeFocused();
});

test('has no serious accessibility violations on desktop or mobile demo', async ({ page }) => {
  await waitForDemoAnalysis(page);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('serves legal pages and a designed not-found page with route titles', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page).toHaveTitle('Privacy — Pulse Check');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy at Pulse Check');
  await page.goto('/terms/');
  await expect(page).toHaveTitle('Terms — Pulse Check');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Terms for Pulse Check');
  await page.goto('/404.html');
  await expect(page).toHaveTitle('Page not found — Pulse Check');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page was not found');
});
