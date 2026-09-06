export const CLEAN_SAMPLE_BPM = 120;
export const CLEAN_SAMPLE_NAME = 'Steady 120 BPM reference track';

/**
 * A deterministic reference click track used only by the isolated demo. The
 * first click begins at 500 ms, which gives the onset detector room to inspect
 * its leading window and keeps the intended grid explicit to a maker.
 */
export function makeCleanSample(): { samples: Float32Array; sampleRate: number; duration: number } {
  const sampleRate = 44_100;
  const duration = 8;
  const samples = new Float32Array(sampleRate * duration);
  const beatSeconds = 60 / CLEAN_SAMPLE_BPM;

  for (let beat = 1; beat < 16; beat += 1) {
    const start = Math.round(beat * beatSeconds * sampleRate);
    for (let index = 0; index < 900 && start + index < samples.length; index += 1) {
      const envelope = Math.exp(-index / 160);
      samples[start + index] += Math.sin((2 * Math.PI * 880 * index) / sampleRate) * envelope * 0.85;
    }
  }

  return { samples, sampleRate, duration };
}
