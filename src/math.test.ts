import { describe, expect, it } from 'vitest';
import { diagnoseDrift, estimateBpm, mad, median } from './math';
import { detectOnsets } from './analyzer';

describe('timing statistics', () => {
  it('calculates robust centers', () => {
    expect(median([100, 12, 10, 14, 16])).toBe(14);
    expect(mad([10, 12, 14, 16, 100])).toBe(2);
  });

  it('estimates BPM from onset gaps', () => {
    expect(estimateBpm([0, 0.5, 1, 1.5, 2])).toBe(120);
  });

  it('recognizes a stable grid', () => {
    const result = diagnoseDrift([0, 0.5, 1, 1.5, 2, 2.5], 120, 0);
    expect(result.diagnosis).toBe('steady');
    expect(result.medianErrorMs).toBe(0);
  });

  it('recognizes accumulating drift', () => {
    const result = diagnoseDrift([0, 0.505, 1.01, 1.515, 2.02, 2.525], 120, 0);
    expect(result.diagnosis).toBe('drifting');
    expect(result.driftMsPerMinute).toBeGreaterThan(500);
  });

  it('finds sparse click onsets', () => {
    const rate = 8000;
    const samples = new Float32Array(rate * 3);
    for (const second of [0.5, 1, 1.5, 2, 2.5]) {
      for (let index = 0; index < 80; index += 1) samples[Math.round(second * rate) + index] = Math.exp(-index / 20);
    }
    expect(detectOnsets(samples, rate)).toHaveLength(5);
  });
});
