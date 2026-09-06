import { median } from './math';

export function detectOnsets(samples: Float32Array, sampleRate: number): number[] {
  const hop = 512;
  const windowSize = 1024;
  const energies: number[] = [];
  for (let start = 0; start + windowSize < samples.length; start += hop) {
    let sum = 0;
    for (let index = start; index < start + windowSize; index += 1) sum += samples[index] ** 2;
    energies.push(Math.sqrt(sum / windowSize));
  }
  const flux = energies.map((energy, index) => Math.max(0, energy - (energies[index - 1] ?? energy)));
  const nonZero = flux.filter((value) => value > 0);
  // The global floor rejects quiet noise; the rolling threshold below handles
  // busy material. Keeping this below the median non-zero flux also preserves
  // sparse click tracks, where every meaningful rise has a similar amplitude.
  const threshold = Math.max(0.002, median(nonZero) * 0.4);
  const candidates: number[] = [];
  let last = -Infinity;
  for (let index = 2; index < flux.length - 2; index += 1) {
    const localThreshold = Math.max(threshold, median(flux.slice(Math.max(0, index - 18), index + 19)) * 3);
    if (flux[index] >= localThreshold && flux[index] > flux[index - 1] && flux[index] >= flux[index + 1]) {
      // Energy windows begin slightly before a sharp attack. Refine each
      // candidate against the waveform so steady tracks do not acquire a fake
      // tempo slope from 512-sample frame quantization.
      const windowStart = index * hop;
      const windowEnd = Math.min(samples.length, windowStart + windowSize);
      let peak = 0;
      for (let sample = windowStart; sample < windowEnd; sample += 1) peak = Math.max(peak, Math.abs(samples[sample]));
      const onsetFloor = Math.max(0.015, peak * 0.18);
      let refined = windowStart;
      for (let sample = windowStart; sample < windowEnd; sample += 1) {
        if (Math.abs(samples[sample]) >= onsetFloor) { refined = sample; break; }
      }
      const seconds = refined / sampleRate;
      if (seconds - last >= 0.16) {
        candidates.push(seconds);
        last = seconds;
      }
    }
  }
  return candidates.slice(0, 500);
}

export function waveformPeaks(samples: Float32Array, bins = 180): number[] {
  const stride = Math.max(1, Math.floor(samples.length / bins));
  return Array.from({ length: bins }, (_, bin) => {
    let peak = 0;
    const end = Math.min(samples.length, (bin + 1) * stride);
    for (let index = bin * stride; index < end; index += 1) peak = Math.max(peak, Math.abs(samples[index]));
    return peak;
  });
}
