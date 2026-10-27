import { SignalResult } from '@git-forensics/shared';
import { RawCommit } from '../../github/github.service';

export interface WorkingHoursAnalysis {
  signal: SignalResult;
  hourDistribution: Record<number, number>;
}

export function analyzeWorkingHours(commits: RawCommit[]): WorkingHoursAnalysis {
  const hourDistribution: Record<number, number> = {};
  for (let i = 0; i < 24; i++) {
    hourDistribution[i] = 0;
  }

  for (const c of commits) {
    const d = new Date(c.authorDate);
    if (!isNaN(d.getTime())) {
      const h = d.getUTCHours();
      hourDistribution[h] = (hourDistribution[h] || 0) + 1;
    }
  }

  const total = commits.length;
  if (total === 0) {
    return {
      signal: {
        id: 'working_hours',
        name: 'Diurnal Working Hours Distribution',
        status: 'INFO',
        scorePenalty: 0,
        summary: 'No commits to evaluate hour distribution',
        details: { peakHour: null, graveyardPercent: 0 },
        explanation: 'No commit timestamps available.',
      },
      hourDistribution,
    };
  }

  // Find peak hour
  let peakHour = 0;
  let peakCount = 0;
  for (let h = 0; h < 24; h++) {
    if (hourDistribution[h] > peakCount) {
      peakCount = hourDistribution[h];
      peakHour = h;
    }
  }

  // Count graveyard hours (UTC midnight to 5 AM)
  const graveyardCommits =
    (hourDistribution[1] || 0) +
    (hourDistribution[2] || 0) +
    (hourDistribution[3] || 0) +
    (hourDistribution[4] || 0);

  const graveyardPercent = Math.round((graveyardCommits / total) * 100);

  // If >70% of commits happen during graveyard hours
  if (total >= 20 && graveyardPercent > 70) {
    return {
      signal: {
        id: 'working_hours',
        name: 'Diurnal Working Hours Distribution',
        status: 'WARNING',
        scorePenalty: 10,
        summary: `Unusual circadian rhythm: ${graveyardPercent}% of commits occur in deep graveyard hours (1 AM – 5 AM UTC)`,
        details: {
          peakHourUtc: `${peakHour}:00`,
          graveyardPercent,
          totalCommits: total,
        },
        explanation:
          'While developers often work late, an overwhelming concentration (>70%) during early morning hours frequently indicates automated nightly cron triggers or synthetic scheduling.',
      },
      hourDistribution,
    };
  }

  // Pass: Natural distribution
  return {
    signal: {
      id: 'working_hours',
      name: 'Diurnal Working Hours Distribution',
      status: 'PASS',
      scorePenalty: 0,
      summary: `Distributed across natural hours (Peak: ${peakHour}:00 UTC with ${graveyardPercent}% late-night activity)`,
      details: {
        peakHourUtc: `${peakHour}:00`,
        graveyardPercent,
        totalCommits: total,
      },
      explanation:
        'Commit cadence reflects natural daytime and evening focus blocks typical of human software development.',
    },
    hourDistribution,
  };
}
