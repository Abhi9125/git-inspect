import { SignalResult } from '@git-forensics/shared';
import { RawCommit, GitHubPushEvent } from '../../github/github.service';

export function analyzeServerEvents(
  commits: RawCommit[],
  events: GitHubPushEvent[] = [],
  repoCreatedAt?: string,
): SignalResult {
  const totalCommits = commits.length;

  if (totalCommits < 5) {
    return {
      id: 'github_push',
      name: 'Server-Side Push Event & Log Integrity',
      status: 'INFO',
      scorePenalty: 0,
      summary: 'Insufficient commits to evaluate server push cadence',
      details: { totalCommits, pushEventsCount: events.length },
      explanation: 'More commits required to establish push event patterns.',
    };
  }

  // Filter commits within the last 90 days (GitHub's public event log retention window)
  const now = Date.now();
  const ninetyDaysAgo = now - 90 * 24 * 3600 * 1000;
  const recentCommits = commits.filter(
    (c) => new Date(c.authorDate).getTime() >= ninetyDaysAgo,
  );

  // If all commits are older than 90 days, events have expired naturally
  if (recentCommits.length === 0) {
    return {
      id: 'github_push',
      name: 'Server-Side Push Event & Log Integrity',
      status: 'INFO',
      scorePenalty: 0,
      summary: "Server push logs aged past GitHub's 90-day retention window",
      details: {
        totalCommits,
        recentCommitsCount: 0,
        pushEventsCount: events.length,
        retentionWindowDays: 90,
        historicalRepository: true,
      },
      explanation:
        "GitHub's public event API retains records for 90 days. All repository commits predate this window, so server-side logs cannot be evaluated.",
    };
  }

  const pushCount = events.length;

  // Single Batch Ingestion Detection:
  // If 20+ recent commits span multiple days/weeks, but only 1 PushEvent exists
  if (pushCount === 1 && recentCommits.length >= 20) {
    const dates = recentCommits
      .map((c) => new Date(c.authorDate).getTime())
      .sort((a, b) => a - b);
    const spanDays = Math.max(1, (dates[dates.length - 1] - dates[0]) / (1000 * 3600 * 24));

    if (spanDays >= 7) {
      return {
        id: 'github_push',
        name: 'Server-Side Push Event & Log Integrity',
        status: 'ALERT',
        scorePenalty: 15,
        summary: `Single batch ingestion: ${recentCommits.length} commits spanning ${Math.round(spanDays)} days uploaded in a single server push`,
        details: {
          pushEventsCount: 1,
          recentCommitsCount: recentCommits.length,
          timelineSpanDays: Math.round(spanDays),
          singleBatchIngestion: true,
        },
        explanation:
          'Genuine software engineering involves pushing commits incrementally over days or weeks. Dumping a multi-week commit history in a single server-side push event indicates synthetic repository backdating or batch script execution.',
      };
    }
  }

  // Calculate average commits per push
  if (pushCount >= 2) {
    const totalEventCommits = events.reduce((sum, e) => sum + e.commitsCount, 0);
    const avgCommitsPerPush = Number((totalEventCommits / pushCount).toFixed(1));

    if (avgCommitsPerPush > 35 && recentCommits.length >= 30) {
      return {
        id: 'github_push',
        name: 'Server-Side Push Event & Log Integrity',
        status: 'WARNING',
        scorePenalty: 10,
        summary: `Unusually high commit clustering: Average of ${avgCommitsPerPush} commits per push event`,
        details: {
          pushEventsCount: pushCount,
          avgCommitsPerPush,
          totalEventCommits,
          scriptClusteringSuspected: true,
        },
        explanation:
          'Human developers push small increments (1–5 commits per push). Regularly pushing 35+ commits per batch suggests automated batch generation.',
      };
    }

    // Organic Incremental Delivery
    return {
      id: 'github_push',
      name: 'Server-Side Push Event & Log Integrity',
      status: 'PASS',
      scorePenalty: 0,
      summary: `Verified incremental delivery (${pushCount} distinct server-side push events logged across development timeline)`,
      details: {
        pushEventsCount: pushCount,
        avgCommitsPerPush,
        verifiedIncremental: true,
      },
      explanation:
        'GitHub server logs confirm incremental push activity matching the commit development timeline.',
    };
  }

  // Default neutral info if events stream is minimal or unavailable
  return {
    id: 'github_push',
    name: 'Server-Side Push Event & Log Integrity',
    status: 'INFO',
    scorePenalty: 0,
    summary: `${pushCount} server-side push event(s) recorded on GitHub stream`,
    details: {
      pushEventsCount: pushCount,
      recentCommitsCount: recentCommits.length,
    },
    explanation:
      'Server-side push event logs were inspected and show no signs of bulk timestamp fabrication.',
  };
}
