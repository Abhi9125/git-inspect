import { SignalResult } from '@git-forensics/shared';
import { RawCommit } from '../../github/github.service';

export interface WeekendAnalysis {
  signal: SignalResult;
  weekdayDistribution: Record<string, number>;
}

export function analyzeWeekendPattern(commits: RawCommit[]): WeekendAnalysis {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekdayDistribution: Record<string, number> = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0,
  };

  let weekendCount = 0;
  let weekdayCount = 0;

  for (const c of commits) {
    const d = new Date(c.authorDate);
    if (!isNaN(d.getTime())) {
      const dayIndex = d.getUTCDay(); // 0 is Sun, 6 is Sat
      const dayName = days[dayIndex];
      weekdayDistribution[dayName] = (weekdayDistribution[dayName] || 0) + 1;

      if (dayIndex === 0 || dayIndex === 6) {
        weekendCount++;
      } else {
        weekdayCount++;
      }
    }
  }

  const total = commits.length;
  if (total === 0) {
    return {
      signal: {
        id: 'weekend_pattern',
        name: 'Weekend vs Weekday Coding Distribution',
        status: 'INFO',
        scorePenalty: 0,
        summary: 'No commits to analyze',
        details: { weekendPercent: 0, weekdayPercent: 0 },
        explanation: 'No commit timestamps available.',
      },
      weekdayDistribution,
    };
  }

  const weekendPercent = Math.round((weekendCount / total) * 100);
  const weekdayPercent = 100 - weekendPercent;

  // Informational Flag: 100% of 50+ commits happen exclusively on weekends
  if (total >= 50 && weekendCount === total) {
    return {
      signal: {
        id: 'weekend_pattern',
        name: 'Weekend vs Weekday Coding Distribution',
        status: 'WARNING',
        scorePenalty: 5,
        summary: `Weekend exclusivity: 100% of ${total} commits occurred exclusively on Saturdays & Sundays`,
        details: {
          weekendPercent,
          weekdayPercent,
          totalCommits: total,
          weekendExclusivity: true,
        },
        explanation:
          'While weekend hobby development is common, having 100% of 50+ commits exclusively on weekends without a single weekday commit is atypical.',
      },
      weekdayDistribution,
    };
  }

  // Pass: Normal human distribution
  return {
    signal: {
      id: 'weekend_pattern',
      name: 'Weekend vs Weekday Coding Distribution',
      status: 'PASS',
      scorePenalty: 0,
      summary: `Balanced distribution (${weekdayPercent}% Weekday / ${weekendPercent}% Weekend commits)`,
      details: {
        weekendPercent,
        weekdayPercent,
        totalCommits: total,
        weekendExclusivity: false,
      },
      explanation:
        'Activity aligns with standard open-source developer habits, spanning both regular weekdays and occasional weekend sprints.',
    },
    weekdayDistribution,
  };
}
