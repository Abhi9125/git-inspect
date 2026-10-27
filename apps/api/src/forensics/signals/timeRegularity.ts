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

  // Group commits by day
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

  // Calculate gaps between consecutive commits on the same day
  const gapsInSeconds: number[] = [];

  for (const [, times] of commitsByDay.entries()) {
    if (times.length < 2) continue;
    // Sort chronologically
    times.sort((a, b) => a - b);

    for (let i = 0; i < times.length - 1; i++) {
      const gapSec = (times[i + 1] - times[i]) / 1000;
      if (gapSec >= 0 && gapSec <= 86400) {
        gapsInSeconds.push(gapSec);
      }
    }
  }

  // If fewer than 5 same-day pairs, not enough data for mechanical clock check
  if (gapsInSeconds.length < 5) {
    return {
      id: 'time_regularity',
      name: 'Mechanical Clock & Timing Regularity',
      status: 'INFO',
      scorePenalty: 0,
      summary: 'Commits are dispersed across separate calendar days',
      details: {
        sameDayGapsCount: gapsInSeconds.length,
        insufficientSameDayData: true,
      },
      explanation:
        'Commits generally occurred on distinct days. No rapid same-day burst was available for mechanical clock analysis.',
    };
  }

  // Calculate mean and standard deviation
  const sum = gapsInSeconds.reduce((acc, val) => acc + val, 0);
  const mean = sum / gapsInSeconds.length;

  const variance =
    gapsInSeconds.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
    gapsInSeconds.length;
  const stdDev = Math.sqrt(variance);

  // Red Flag: Standard deviation < 5s across 8+ pairs (e.g. exactly 60s or 1s intervals)
  if (gapsInSeconds.length >= 8 && stdDev < 5) {
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
        scriptedIntervalDetected: true,
      },
      explanation:
        'Humans do not commit code at exact clockwork intervals (e.g., every 60 seconds or every 5 seconds). A standard deviation under 5 seconds is conclusive evidence of an automated script creating commits.',
    };
  }

  // Warning: StdDev < 15s
  if (gapsInSeconds.length >= 8 && stdDev < 15) {
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

  // Pass: Natural human variance
  return {
    id: 'time_regularity',
    name: 'Mechanical Clock & Timing Regularity',
    status: 'PASS',
    scorePenalty: 0,
    summary: `Natural time variation (StdDev: ${Math.round(stdDev).toLocaleString()}s between consecutive commits)`,
    details: {
      consecutiveGapStdDevSeconds: Math.round(stdDev),
      averageGapSeconds: Math.round(mean),
      sameDayGapsCount: gapsInSeconds.length,
      scriptedIntervalDetected: false,
    },
    explanation:
      'Gaps between commits vary naturally according to cognitive thinking, coding, testing, and normal breaks.',
  };
}
