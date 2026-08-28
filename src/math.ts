export const median = (values: number[]): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

export const mad = (values: number[], center = median(values)): number =>
  median(values.map((value) => Math.abs(value - center)));

export type Diagnosis = 'steady' | 'drifting' | 'insufficient';

export function diagnoseDrift(onsets: number[], bpm: number, anchorSeconds: number): {
  diagnosis: Diagnosis;
  driftMsPerMinute: number;
  medianErrorMs: number;
  errorsMs: number[];
} {
  if (onsets.length < 4 || bpm <= 0) {
    return { diagnosis: 'insufficient', driftMsPerMinute: 0, medianErrorMs: 0, errorsMs: [] };
  }
  const beat = 60 / bpm;
  const errorsMs = onsets.map((time) => {
    const beatNumber = Math.round((time - anchorSeconds) / beat);
    return (time - (anchorSeconds + beatNumber * beat)) * 1000;
  });
  const xs = onsets.map((time) => time - onsets[0]);
  const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
  const meanY = errorsMs.reduce((a, b) => a + b, 0) / errorsMs.length;
  const numerator = xs.reduce((sum, x, index) => sum + (x - meanX) * (errorsMs[index] - meanY), 0);
  const denominator = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
  const driftMsPerMinute = denominator ? (numerator / denominator) * 60 : 0;
  return {
    diagnosis: Math.abs(driftMsPerMinute) > 15 ? 'drifting' : 'steady',
    driftMsPerMinute,
    medianErrorMs: median(errorsMs.map(Math.abs)),
    errorsMs,
  };
}

export function estimateBpm(onsets: number[]): number {
  if (onsets.length < 2) return 120;
  const intervals = onsets.slice(1).map((time, index) => time - onsets[index]).filter((value) => value > 0.18 && value < 2);
  if (!intervals.length) return 120;
  let bpm = 60 / median(intervals);
  while (bpm < 70) bpm *= 2;
  while (bpm > 190) bpm /= 2;
  return Math.round(bpm * 10) / 10;
}
