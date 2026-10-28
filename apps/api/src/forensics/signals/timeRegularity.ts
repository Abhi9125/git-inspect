import { SignalResult } from '@git-forensics/shared';
import { RawCommit } from '../../github/github.service';

export function analyzeTimeRegularity(commits: RawCommit[]): SignalResult {
  if (commits.length < 3) {
    return {
      id: 'time_regularity',
      name: 'Mechanical Clock & Timing Regularity',
      status: 'INFO',
      scorePenalty: 0,
      summary: 'Insufficient commits to evaluate timing intervals',
      details: { gapCount: 0, stdDevSeconds: 0 },
      explanation: 'More commits required to compute interval statistics.',
    };
  }

  // 1. Analyze Zero-Second & Round-Minute Quantization (AI Clock Simulation Heuristic)
  let validDateCount = 0;
  let zeroSecondsCount = 0;
  let roundMinutesCount = 0;

  for (const c of commits) {
    const d = new Date(c.authorDate);
    if (isNaN(d.getTime())) continue;
    validDateCount++;
    if (d.getSeconds() === 0) zeroSecondsCount++;
    if (d.getMinutes() % 5 === 0) roundMinutesCount++;
  }

  const zeroSecondsRatio = validDateCount > 0 ? zeroSecondsCount / validDateCount : 0;
  const roundMinutesRatio = validDateCount > 0 ? roundMinutesCount / validDateCount : 0;
  const zeroSecondsPercent = Math.round(zeroSecondsRatio * 100);
  const roundMinutesPercent = Math.round(roundMinutesRatio * 100);

  const isQuantizedAlert =
    validDateCount >= 15 &&
    (zeroSecondsRatio >= 0.40 || (roundMinutesRatio >= 0.70 && zeroSecondsRatio >= 0.25));

  const isQuantizedWarning =
    validDateCount >= 15 &&
    !isQuantizedAlert &&
    (zeroSecondsRatio >= 0.20 || roundMinutesRatio >= 0.50);

  // 2. Group commits by day for same-day interval variance (Mechanical loop check)
  const commitsByDay = new Map<string, number[]>();

  for (const c of commits) {
    const timestamp = new Date(c.authorDate).getTime();
    if (isNaN(timestamp)) continue;

    const dayKey = new Date(c.authorDate).toISOString().split('T')[0];
    if (!commitsByDay.has(dayKey)) {
      commitsByDay.set(dayKey, []);
    }
    commitsByDay.get(dayKey)!.push(timestamp);
  }

  const gapsInSeconds: number[] = [];

  for (const [, times] of commitsByDay.entries()) {
    if (times.length < 2) continue;
    times.sort((a, b) => a - b);

    for (let i = 0; i < times.length - 1; i++) {
      const gapSec = (times[i + 1] - times[i]) / 1000;
      if (gapSec >= 0 && gapSec <= 86400) {
        gapsInSeconds.push(gapSec);
      }
    }
  }

  let stdDev = 0;
  let mean = 0;
  let isIntervalAlert = false;
  let isIntervalWarning = false;

  if (gapsInSeconds.length >= 8) {
    const sum = gapsInSeconds.reduce((acc, val) => acc + val, 0);
    mean = sum / gapsInSeconds.length;
    const variance =
      gapsInSeconds.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
      gapsInSeconds.length;
    stdDev = Math.sqrt(variance);

    if (stdDev < 5) isIntervalAlert = true;
    else if (stdDev < 15) isIntervalWarning = true;
  }

  // --- Decision Hierarchy ---

  // Priority 1: ALERT (Quantized clock OR mechanical loop)
  if (isQuantizedAlert) {
    return {
      id: 'time_regularity',
      name: 'Mechanical Clock & Timing Regularity',
      status: 'ALERT',
      scorePenalty: 30,
      summary: `Synthetic AI clock rhythm detected: ${zeroSecondsPercent}% of commits quantized to exact :00s (${roundMinutesPercent}% on 5-min intervals)`,
      details: {
        zeroSecondsCount,
        zeroSecondsPercent,
        roundMinutesPercent,
        quantizedClockDetected: true,
        consecutiveGapStdDevSeconds: gapsInSeconds.length >= 8 ? Number(stdDev.toFixed(1)) : undefined,
        sameDayGapsCount: gapsInSeconds.length,
      },
      explanation:
        'Human commits exhibit random seconds uniformly distributed from 0 to 59. When over 40% of commits land on exact :00 seconds and round 5-minute intervals, it is conclusive evidence of an AI script generating fabricated timestamps.',
    };
  }

  if (isIntervalAlert) {
    return {
      id: 'time_regularity',
      name: 'Mechanical Clock & Timing Regularity',
      status: 'ALERT',
      scorePenalty: 30,
      summary: `Mechanical script rhythm detected: Interval StdDev = ${stdDev.toFixed(1)}s`,
      details: {
        consecutiveGapStdDevSeconds: Number(stdDev.toFixed(1)),
        averageGapSeconds: Math.round(mean),
        sameDayGapsCount: gapsInSeconds.length,
        zeroSecondsPercent,
        scriptedIntervalDetected: true,
      },
      explanation:
        'Humans do not commit code at exact clockwork intervals (e.g., every 60 seconds or every 5 seconds). A standard deviation under 5 seconds is conclusive evidence of an automated script creating commits.',
    };
  }

  // Priority 2: WARNING
  if (isQuantizedWarning) {
    return {
      id: 'time_regularity',
      name: 'Mechanical Clock & Timing Regularity',
      status: 'WARNING',
      scorePenalty: 15,
      summary: `Unnatural timestamp rounding: ${zeroSecondsPercent}% of commits on exact :00s`,
      details: {
        zeroSecondsCount,
        zeroSecondsPercent,
        roundMinutesPercent,
        quantizedClockDetected: true,
      },
      explanation:
        'A significant proportion of commits land on exact minute and round-second boundaries, which is statistically improbable for natural human activity.',
    };
  }

  if (isIntervalWarning) {
    return {
      id: 'time_regularity',
      name: 'Mechanical Clock & Timing Regularity',
      status: 'WARNING',
      scorePenalty: 15,
      summary: `Unusually rigid timing intervals: StdDev = ${stdDev.toFixed(1)}s`,
      details: {
        consecutiveGapStdDevSeconds: Number(stdDev.toFixed(1)),
        averageGapSeconds: Math.round(mean),
        sameDayGapsCount: gapsInSeconds.length,
        scriptedIntervalDetected: false,
      },
      explanation:
        'Intervals between same-day commits show high regularity, which is atypical for manual human typing and problem-solving.',
    };
  }

  // Priority 3: Dispersed days notice (if no same-day data and not quantized)
  if (gapsInSeconds.length < 5) {
    return {
      id: 'time_regularity',
      name: 'Mechanical Clock & Timing Regularity',
      status: 'INFO',
      scorePenalty: 0,
      summary: 'Commits are dispersed across separate calendar days with natural seconds',
      details: {
        sameDayGapsCount: gapsInSeconds.length,
        zeroSecondsPercent,
        insufficientSameDayData: true,
      },
      explanation:
        'Commits generally occurred on distinct days. Timestamp seconds show natural organic variation.',
    };
  }

  // Priority 4: PASS
  return {
    id: 'time_regularity',
    name: 'Mechanical Clock & Timing Regularity',
    status: 'PASS',
    scorePenalty: 0,
    summary: `Natural time variation (StdDev: ${Math.round(stdDev).toLocaleString()}s, ${zeroSecondsPercent}% :00s)`,
    details: {
      consecutiveGapStdDevSeconds: Math.round(stdDev),
      averageGapSeconds: Math.round(mean),
      sameDayGapsCount: gapsInSeconds.length,
      zeroSecondsPercent,
      scriptedIntervalDetected: false,
    },
    explanation:
      'Gaps between commits and second distributions vary naturally according to cognitive thinking, coding, testing, and normal breaks.',
  };
}
