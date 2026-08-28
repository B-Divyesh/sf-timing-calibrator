import './style.css';
import { detectOnsets, waveformPeaks } from './analyzer';
import { diagnoseDrift, estimateBpm, mad, median } from './math';

const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element: ${id}`);
  return element as T;
};

type SourceState = {
  name: string;
  duration: number;
  samples: Float32Array;
  peaks: number[];
  onsets: number[];
  bpm: number;
  anchorMs: number;
  confirmed: boolean;
};

type DeviceState = {
  label: string;
  offsetMs: number;
  jitterMs: number;
  samples: number[];
  cue: string;
  method: 'tap' | 'manual';
  confirmed: boolean;
};

type VerificationState = {
  residualsMs: number[];
  medianAbsoluteMs: number;
  p90Ms: number;
  within20: number;
};

type ActiveTest = {
  kind: 'device' | 'verify';
  required: number;
  scheduledMs: number[];
  errorsMs: number[];
  used: Set<number>;
  timers: number[];
  endTimer: number;
};

let source: SourceState | null = null;
let device: DeviceState | null = null;
let verification: VerificationState | null = null;
let activeTest: ActiveTest | null = null;
let audioContext: AudioContext | null = null;
let sourceRevision = 0;

const trackStatus = byId<HTMLDivElement>('track-status');
const deviceStatus = byId<HTMLDivElement>('device-status');
const verifyStatus = byId<HTMLDivElement>('verify-status');
const audioFile = byId<HTMLInputElement>('audio-file');
const trackResults = byId<HTMLElement>('track-results');
const deviceResults = byId<HTMLElement>('device-results');
const verifyResults = byId<HTMLElement>('verify-results');
const startTest = byId<HTMLButtonElement>('start-test');
const tapPad = byId<HTMLButtonElement>('tap-pad');
const startVerify = byId<HTMLButtonElement>('start-verify');
const verifyPad = byId<HTMLButtonElement>('verify-pad');

function setStatus(element: HTMLElement, message: string, kind: 'neutral' | 'error' | 'success' = 'neutral'): void {
  element.textContent = message;
  element.className = `status-line${kind === 'neutral' ? '' : ` ${kind}`}`;
}

/**
 * Number('') is zero, which is useful in very few form flows and unsafe for a
 * timing measurement. Keep absence distinct from an explicitly entered zero.
 */
function readRequiredNumber(input: HTMLInputElement): number | null {
  const raw = input.value.trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function currentCue(): string {
  return document.querySelector<HTMLInputElement>('input[name="cue-mode"]:checked')?.value ?? 'both';
}

function cancelActiveTest(): void {
  if (activeTest) {
    window.clearTimeout(activeTest.endTimer);
    activeTest.timers.forEach(window.clearTimeout);
    activeTest = null;
  }
  tapPad.disabled = true;
  verifyPad.disabled = true;
  byId<HTMLButtonElement>('stop-test').hidden = true;
  byId<HTMLButtonElement>('stop-verify').hidden = true;
  byId('pulse').classList.remove('hit');
}

function clearVerification(message = 'Complete a fresh device measurement before verifying again.'): void {
  verification = null;
  verifyResults.hidden = true;
  verifyResults.classList.remove('pass-report', 'fail-report');
  startVerify.disabled = true;
  byId('verify-instruction').textContent = 'Confirm Passes 01 and 02 to unlock verification.';
  byId('json-preview').textContent = '';
  setStatus(verifyStatus, message);
}

function clearDeviceAndVerification(sourceChanged = Boolean(source || device || verification)): void {
  cancelActiveTest();
  device = null;
  deviceResults.hidden = true;
  byId<HTMLButtonElement>('confirm-device').textContent = 'Use this device offset';
  startTest.disabled = true;
  clearVerification(sourceChanged
    ? 'Source timing changed. Confirm it, then make a fresh device measurement and proof.'
    : 'Verification not started.');
  document.querySelector('.manual-entry')?.classList.remove('ready');
  setStatus(deviceStatus, sourceChanged
    ? 'Source timing changed. Confirm the new grid before measuring this device again.'
    : 'Complete Pass 01 before measuring the device.');
}

function invalidateSourceDependencies(): void {
  if (source) source.confirmed = false;
  clearDeviceAndVerification();
  byId<HTMLButtonElement>('confirm-track').textContent = 'Confirm source grid';
}

function prepareForNewSource(): number {
  sourceRevision += 1;
  invalidateSourceDependencies();
  source = null;
  trackResults.hidden = true;
  return sourceRevision;
}

function invalidateVerificationForDeviceChange(): void {
  cancelActiveTest();
  clearVerification('Device estimate changed. Confirm it, then run a fresh 20-beat proof.');
}

function hasCompleteCalibration(): boolean {
  return Boolean(source?.confirmed && device?.confirmed && verification);
}

function makeSample(): { samples: Float32Array; sampleRate: number } {
  const sampleRate = 44_100;
  const samples = new Float32Array(sampleRate * 8);
  for (let beat = 0; beat < 16; beat += 1) {
    const start = Math.round(beat * 0.5 * sampleRate);
    for (let index = 0; index < 900; index += 1) {
      const envelope = Math.exp(-index / 160);
      samples[start + index] += Math.sin((2 * Math.PI * 880 * index) / sampleRate) * envelope * 0.85;
    }
  }
  return { samples, sampleRate };
}

async function loadFile(file: File): Promise<void> {
  if (file.size > 50 * 1024 * 1024) {
    setStatus(trackStatus, 'That file is over 50 MB. Choose a shorter excerpt or an uncompressed clip under the limit.', 'error');
    return;
  }
  const revision = prepareForNewSource();
  setStatus(trackStatus, `Reading ${file.name}…`);
  try {
    audioContext ??= new AudioContext();
    const buffer = await audioContext.decodeAudioData(await file.arrayBuffer());
    if (revision !== sourceRevision) return;
    analyze(buffer.getChannelData(0), buffer.sampleRate, file.name, buffer.duration, revision);
  } catch {
    if (revision !== sourceRevision) return;
    setStatus(trackStatus, 'This browser could not decode that audio file. Try WAV, MP3, M4A, OGG, or a shorter export.', 'error');
  }
}

function analyze(samples: Float32Array, sampleRate: number, name: string, duration: number, revision = prepareForNewSource()): void {
  setStatus(trackStatus, 'Finding onset candidates…');
  window.setTimeout(() => {
    if (revision !== sourceRevision) return;
    const onsets = detectOnsets(samples, sampleRate);
    if (onsets.length < 4) {
      setStatus(trackStatus, 'Fewer than four clear onsets were found. Try a more percussive section or use the clean sample to learn the workflow.', 'error');
      trackResults.hidden = true;
      return;
    }
    source = {
      name,
      duration,
      samples,
      peaks: waveformPeaks(samples),
      onsets,
      bpm: estimateBpm(onsets),
      anchorMs: Math.round(onsets[0] * 1000),
      confirmed: false,
    };
    byId<HTMLInputElement>('bpm').value = String(source.bpm);
    byId<HTMLInputElement>('anchor').value = String(source.anchorMs);
    renderSource();
    trackResults.hidden = false;
    setStatus(trackStatus, `${name} analyzed locally. Review the proposed grid below.`, 'success');
    trackResults.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  }, 20);
}

function renderSource(): void {
  if (!source) return;
  const diagnosis = diagnoseDrift(source.onsets, source.bpm, source.anchorMs / 1000);
  const isDrifting = diagnosis.diagnosis === 'drifting';
  byId('source-stamp').textContent = isDrifting ? 'Possible source drift' : 'Source grid is steady';
  byId('source-summary').textContent = isDrifting
    ? `Onsets move about ${Math.abs(diagnosis.driftMsPerMinute).toFixed(1)} ms per minute against this grid. Correct the BPM or anchor before blaming playback.`
    : 'The detected onsets stay near a regular beat grid. Continue to the device pass to isolate output delay.';
  byId('onset-count').textContent = String(source.onsets.length);
  byId('drift-rate').textContent = `${diagnosis.driftMsPerMinute >= 0 ? '+' : ''}${diagnosis.driftMsPerMinute.toFixed(1)} ms`;
  byId('track-error').textContent = `${diagnosis.medianErrorMs.toFixed(1)} ms`;
  byId('wave-text').textContent = `${source.onsets.length} onsets detected across ${source.duration.toFixed(1)} seconds. Median distance from the ${source.bpm.toFixed(1)} BPM grid is ${diagnosis.medianErrorMs.toFixed(1)} milliseconds.`;
  const list = byId<HTMLOListElement>('onset-list');
  list.replaceChildren(...source.onsets.slice(0, 60).map((time) => {
    const item = document.createElement('li');
    item.textContent = `${time.toFixed(3)} s`;
    return item;
  }));
  drawWaveform();
}

function drawWaveform(): void {
  if (!source) return;
  const canvas = byId<HTMLCanvasElement>('waveform');
  const context = canvas.getContext('2d');
  if (!context) return;
  const { width, height } = canvas;
  context.fillStyle = '#fffcf5';
  context.fillRect(0, 0, width, height);
  context.strokeStyle = '#a9a69d';
  context.lineWidth = 1;
  context.beginPath();
  source.peaks.forEach((peak, index) => {
    const x = (index / (source!.peaks.length - 1)) * width;
    context.moveTo(x, height / 2 - peak * height * 0.42);
    context.lineTo(x, height / 2 + peak * height * 0.42);
  });
  context.stroke();
  const beatSeconds = 60 / source.bpm;
  context.strokeStyle = '#151512';
  context.lineWidth = 1;
  for (let time = source.anchorMs / 1000; time <= source.duration; time += beatSeconds) {
    const x = (time / source.duration) * width;
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
  }
  context.strokeStyle = '#b42318';
  context.lineWidth = 2;
  source.onsets.forEach((time) => {
    const x = (time / source!.duration) * width;
    context.beginPath(); context.moveTo(x, height * .34); context.lineTo(x, height * .66); context.stroke();
  });
}

function confirmSource(): void {
  if (!source) return;
  source.confirmed = true;
  byId<HTMLButtonElement>('confirm-track').textContent = 'Source grid confirmed ✓';
  startTest.disabled = false;
  setStatus(deviceStatus, 'Source grid confirmed. Label this device and run the pulse test.');
  document.querySelector('.manual-entry')?.classList.add('ready');
  byId('device').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function getAudioContext(): AudioContext {
  audioContext ??= new AudioContext();
  return audioContext;
}

function scheduleClick(context: AudioContext, time: number): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 1100;
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.3, time + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.055);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(time);
  oscillator.stop(time + 0.06);
}

async function runTest(kind: 'device' | 'verify'): Promise<void> {
  if (activeTest || !source?.confirmed || (kind === 'verify' && !device?.confirmed)) return;
  const required = kind === 'device' ? 12 : 20;
  const cue = currentCue();
  const context = getAudioContext();
  await context.resume();
  const delay = 1200;
  const interval = 60000 / Math.min(140, Math.max(70, source.bpm));
  const basePerf = performance.now() + delay;
  const baseAudio = context.currentTime + delay / 1000;
  const scheduledMs = Array.from({ length: required }, (_, index) => basePerf + index * interval);
  const timers: number[] = [];
  const pulse = byId('pulse');
  scheduledMs.forEach((scheduled, index) => {
    if (cue !== 'visual') scheduleClick(context, baseAudio + (index * interval) / 1000);
    if (cue !== 'audio') {
      timers.push(window.setTimeout(() => {
        pulse.classList.add('hit');
        window.setTimeout(() => pulse.classList.remove('hit'), 150);
      }, Math.max(0, scheduled - performance.now())));
    }
  });
  const endTimer = window.setTimeout(() => finishTest(), delay + required * interval + 650);
  activeTest = { kind, required, scheduledMs, errorsMs: [], used: new Set(), timers, endTimer };
  const isDevice = kind === 'device';
  (isDevice ? tapPad : verifyPad).disabled = false;
  (isDevice ? startTest : startVerify).disabled = true;
  byId<HTMLButtonElement>(isDevice ? 'stop-test' : 'stop-verify').hidden = false;
  byId(isDevice ? 'tap-count' : 'verify-count').textContent = `0 / ${required}`;
  setStatus(isDevice ? deviceStatus : verifyStatus, `Get ready… ${required} pulses begin in one second.`);
  (isDevice ? tapPad : verifyPad).focus();
}

function recordTap(): void {
  if (!activeTest) return;
  const now = performance.now();
  let nearest = -1;
  let distance = Infinity;
  activeTest.scheduledMs.forEach((scheduled, index) => {
    const nextDistance = Math.abs(now - scheduled);
    if (!activeTest!.used.has(index) && nextDistance < distance) {
      nearest = index;
      distance = nextDistance;
    }
  });
  if (nearest < 0 || distance > 480) return;
  activeTest.used.add(nearest);
  activeTest.errorsMs.push(now - activeTest.scheduledMs[nearest]);
  const counter = byId(activeTest.kind === 'device' ? 'tap-count' : 'verify-count');
  counter.textContent = `${activeTest.errorsMs.length} / ${activeTest.required}`;
  if (activeTest.errorsMs.length === activeTest.required) finishTest();
}

function finishTest(cancelled = false): void {
  if (!activeTest) return;
  const test = activeTest;
  activeTest = null;
  window.clearTimeout(test.endTimer);
  test.timers.forEach(window.clearTimeout);
  const isDevice = test.kind === 'device';
  (isDevice ? tapPad : verifyPad).disabled = true;
  (isDevice ? startTest : startVerify).disabled = false;
  byId<HTMLButtonElement>(isDevice ? 'stop-test' : 'stop-verify').hidden = true;
  if (cancelled) {
    setStatus(isDevice ? deviceStatus : verifyStatus, 'Test stopped. Start again when you are ready.');
    return;
  }
  const minimum = isDevice ? 6 : 10;
  if (test.errorsMs.length < minimum) {
    setStatus(isDevice ? deviceStatus : verifyStatus, `Only ${test.errorsMs.length} valid taps were captured. Try again and tap once per pulse.`, 'error');
    return;
  }
  if (isDevice) renderDeviceResult(test.errorsMs);
  else renderVerification(test.errorsMs);
}

function renderDeviceResult(samples: number[], manual = false): void {
  invalidateVerificationForDeviceChange();
  const label = byId<HTMLInputElement>('device-name').value.trim() || 'Unnamed target device';
  const offsetMs = manual ? samples[0] : median(samples);
  device = {
    label,
    offsetMs,
    jitterMs: manual ? 0 : mad(samples, offsetMs),
    samples,
    cue: currentCue(),
    method: manual ? 'manual' : 'tap',
    confirmed: false,
  };
  byId('offset-value').textContent = `${offsetMs >= 0 ? '+' : ''}${offsetMs.toFixed(1)} ms`;
  byId('jitter-value').textContent = `${device.jitterMs.toFixed(1)} ms`;
  byId('sample-value').textContent = manual ? 'manual' : String(samples.length);
  byId('device-summary').textContent = manual
    ? `${label} will use the externally measured ${offsetMs.toFixed(1)} ms offset.`
    : `${label} landed ${Math.abs(offsetMs).toFixed(1)} ms ${offsetMs >= 0 ? 'after' : 'before'} the browser clock, with ${device.jitterMs.toFixed(1)} ms median tap jitter.`;
  deviceResults.hidden = false;
  setStatus(deviceStatus, 'Device estimate ready. Review it, then confirm the offset.', 'success');
}

function confirmDevice(): void {
  if (!device) return;
  device.confirmed = true;
  byId<HTMLButtonElement>('confirm-device').textContent = 'Device offset confirmed ✓';
  startVerify.disabled = false;
  byId('verify-instruction').textContent = `Ready to verify ${device.label} with a ${device.offsetMs >= 0 ? '+' : ''}${device.offsetMs.toFixed(1)} ms correction.`;
  setStatus(verifyStatus, 'Device offset confirmed. Run the 20-beat proof.');
  byId('verify').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function renderVerification(errors: number[]): void {
  if (!device) return;
  const residualsMs = errors.map((error) => error - device!.offsetMs);
  const absolute = residualsMs.map(Math.abs).sort((a, b) => a - b);
  const medianAbsoluteMs = median(absolute);
  const p90Ms = absolute[Math.min(absolute.length - 1, Math.ceil(absolute.length * .9) - 1)];
  const within20 = absolute.filter((value) => value < 20).length;
  verification = { residualsMs, medianAbsoluteMs, p90Ms, within20 };
  const passed = medianAbsoluteMs < 20;
  verifyResults.classList.toggle('pass-report', passed);
  verifyResults.classList.toggle('fail-report', !passed);
  byId('verify-stamp').textContent = passed ? 'Pass · under 20 ms' : 'Recheck · over 20 ms';
  byId('verify-summary').textContent = passed
    ? `The calibrated median error is ${medianAbsoluteMs.toFixed(1)} ms. This setup meets the pilot target.`
    : `The calibrated median error is ${medianAbsoluteMs.toFixed(1)} ms. Repeat the device test in the same cue and output configuration before shipping.`;
  byId('verify-error').textContent = `${medianAbsoluteMs.toFixed(1)} ms`;
  byId('verify-p90').textContent = `${p90Ms.toFixed(1)} ms`;
  byId('verify-hits').textContent = `${within20} / ${errors.length}`;
  byId('json-preview').textContent = exportPayload();
  verifyResults.hidden = false;
  setStatus(verifyStatus, `Verification complete: ${passed ? 'target met' : 'target not yet met'}.`, passed ? 'success' : 'error');
}

function exportPayload(): string {
  if (!source?.confirmed || !device?.confirmed || !verification) return '{}';
  const diagnosis = diagnoseDrift(source.onsets, source.bpm, source.anchorMs / 1000);
  const engine = byId<HTMLSelectElement>('engine').value;
  const engineSettings = engine === 'godot'
    ? { audio_offset_seconds: Number((-device.offsetMs / 1000).toFixed(6)), apply_as: 'subtract from AudioServer playback position' }
    : engine === 'unity'
      ? { dsp_offset_seconds: Number((-device.offsetMs / 1000).toFixed(6)), apply_as: 'add when scheduling against AudioSettings.dspTime' }
      : { correction_ms: Number((-device.offsetMs).toFixed(2)), apply_as: 'add to the chart playback clock' };
  return JSON.stringify({
    schema: 'in.sociobot.pulse-check/v1',
    generated_at: new Date().toISOString(),
    engine,
    source: {
      file: source.name,
      duration_seconds: Number(source.duration.toFixed(3)),
      bpm: source.bpm,
      first_beat_anchor_ms: source.anchorMs,
      detected_onsets: source.onsets.length,
      drift_ms_per_minute: Number(diagnosis.driftMsPerMinute.toFixed(2)),
    },
    device: {
      label: device.label,
      cue_mode: device.cue,
      measurement: device.method,
      observed_offset_ms: Number(device.offsetMs.toFixed(2)),
      jitter_mad_ms: Number(device.jitterMs.toFixed(2)),
    },
    verification: {
      samples: verification.residualsMs.length,
      median_absolute_error_ms: Number(verification.medianAbsoluteMs.toFixed(2)),
      p90_absolute_error_ms: Number(verification.p90Ms.toFixed(2)),
      beats_within_20_ms: verification.within20,
      target_met: verification.medianAbsoluteMs < 20,
    },
    engine_settings: engineSettings,
    caveat: 'Browser timing estimate; validate release-critical timing with a physical loopback.',
  }, null, 2);
}

function downloadExport(): void {
  if (!hasCompleteCalibration()) {
    setStatus(verifyStatus, 'Complete and confirm all three passes before exporting.', 'error');
    return;
  }
  const payload = exportPayload();
  const engine = byId<HTMLSelectElement>('engine').value;
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `pulse-check-${engine}-${(device?.label ?? 'device').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

audioFile.addEventListener('change', () => { const file = audioFile.files?.[0]; if (file) void loadFile(file); });
byId('sample-button').addEventListener('click', () => { const sample = makeSample(); analyze(sample.samples, sample.sampleRate, 'Pulse Check clean sample', 8); });
const dropZone = byId('drop-zone');
dropZone.addEventListener('dragover', (event) => { event.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (event) => {
  event.preventDefault(); dropZone.classList.remove('dragover');
  const file = event.dataTransfer?.files[0]; if (file) void loadFile(file);
});
byId<HTMLFormElement>('grid-form').addEventListener('submit', (event) => {
  event.preventDefault();
  if (!source) return;
  const bpm = readRequiredNumber(byId<HTMLInputElement>('bpm'));
  const anchorMs = readRequiredNumber(byId<HTMLInputElement>('anchor'));
  if (bpm === null || bpm < 30 || bpm > 300 || anchorMs === null || anchorMs < 0) {
    setStatus(trackStatus, 'Enter a BPM from 30 to 300 and a non-negative anchor time.', 'error'); return;
  }
  invalidateSourceDependencies();
  source.bpm = bpm; source.anchorMs = anchorMs; renderSource();
  setStatus(trackStatus, 'Grid updated. Review the new alignment, then confirm it.', 'success');
});
byId('confirm-track').addEventListener('click', confirmSource);
startTest.disabled = true;
startTest.addEventListener('click', () => void runTest('device'));
tapPad.addEventListener('click', recordTap);
byId('stop-test').addEventListener('click', () => finishTest(true));
byId('apply-manual').addEventListener('click', () => {
  if (!source?.confirmed) { setStatus(deviceStatus, 'Confirm the source grid before applying a device offset.', 'error'); return; }
  const value = readRequiredNumber(byId<HTMLInputElement>('manual-offset'));
  if (value === null || value < -1000 || value > 1000) { setStatus(deviceStatus, 'Enter a known offset between −1000 and 1000 ms.', 'error'); return; }
  renderDeviceResult([value], true);
});
byId('confirm-device').addEventListener('click', confirmDevice);
startVerify.addEventListener('click', () => void runTest('verify'));
verifyPad.addEventListener('click', recordTap);
byId('stop-verify').addEventListener('click', () => finishTest(true));
document.addEventListener('keydown', (event) => {
  if (!activeTest || (event.code !== 'Space' && event.code !== 'Enter')) return;
  const target = event.target as HTMLElement;
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;
  event.preventDefault(); recordTap();
});
byId('engine').addEventListener('change', () => { byId('json-preview').textContent = exportPayload(); });
byId('export-json').addEventListener('click', downloadExport);
byId('copy-json').addEventListener('click', async () => {
  if (!hasCompleteCalibration()) { setStatus(verifyStatus, 'Complete and confirm all three passes before copying.', 'error'); return; }
  try { await navigator.clipboard.writeText(exportPayload()); setStatus(verifyStatus, 'Calibration JSON copied to the clipboard.', 'success'); }
  catch { setStatus(verifyStatus, 'Clipboard access was blocked. Open the preview and copy the JSON manually.', 'error'); }
});

const offlineNote = byId('offline-note');
const updateNetwork = (): void => { offlineNote.hidden = navigator.onLine; };
window.addEventListener('online', updateNetwork);
window.addEventListener('offline', updateNetwork);
updateNetwork();
if ('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js'));
