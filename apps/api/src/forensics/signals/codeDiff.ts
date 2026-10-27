import { SignalResult } from '@git-forensics/shared';
import { RawCommit } from '../../github/github.service';

export interface CodeDiffAnalysis {
  signal: SignalResult;
  linesChanged: {
    additions: number;
    deletions: number;
    total: number;
  };
}

export function analyzeCodeDiff(commits: RawCommit[]): CodeDiffAnalysis {
  let additions = 0;
  let deletions = 0;
  let trivialCount = 0;
  let sampledCount = 0;

  for (const c of commits) {
    if (c.stats) {
      sampledCount++;
      additions += c.stats.additions || 0;
      deletions += c.stats.deletions || 0;
      const commitDelta = (c.stats.additions || 0) + (c.stats.deletions || 0);
      if (commitDelta <= 1) {
        trivialCount++;
      }
    }
  }

  const totalLines = additions + deletions;
  const totalCommits = commits.length;
  const avgLinesPerCommit = sampledCount > 0 ? Math.round(totalLines / sampledCount) : 0;
  const trivialRatio = sampledCount > 0 ? trivialCount / sampledCount : 0;

  // Red Flag: 30+ commits resulting in <= 10 lines, or >90% commits are 1-line appends
  if (totalCommits >= 30 && (totalLines <= 10 || (sampledCount >= 10 && trivialRatio > 0.9))) {
    return {
      signal: {
        id: 'code_diff',
        name: 'Code Diff Substance & Line Velocity',
        status: 'ALERT',
        scorePenalty: 20,
        summary: `Trivial code velocity: ${totalCommits} commits produced only ${totalLines} total lines changed`,
        details: {
          sampledAdditions: additions,
          sampledDeletions: deletions,
          totalLinesSampled: totalLines,
          trivialCommitPercent: Math.round(trivialRatio * 100),
          averageLinesPerCommit: avgLinesPerCommit,
        },
        explanation:
          'Automated contribution bots typically append a single character, timestamp, or whitespace to a file per commit to generate fake streaks without writing real code.',
      },
      linesChanged: { additions, deletions, total: totalLines },
    };
  }

  // Warning: Unusually low code delta
  if (totalCommits >= 30 && avgLinesPerCommit < 3) {
    return {
      signal: {
        id: 'code_diff',
        name: 'Code Diff Substance & Line Velocity',
        status: 'WARNING',
        scorePenalty: 10,
        summary: `Low code substance: Average of only ${avgLinesPerCommit} lines changed per commit`,
        details: {
          sampledAdditions: additions,
          sampledDeletions: deletions,
          totalLinesSampled: totalLines,
          trivialCommitPercent: Math.round(trivialRatio * 100),
          averageLinesPerCommit: avgLinesPerCommit,
        },
        explanation:
          'Commits contain minimal line changes. While refactorings can be concise, prolonged micro-commits without substantive logic are suspect.',
      },
      linesChanged: { additions, deletions, total: totalLines },
    };
  }

  // Pass: Substantive development
  return {
    signal: {
      id: 'code_diff',
      name: 'Code Diff Substance & Line Velocity',
      status: 'PASS',
      scorePenalty: 0,
      summary: `${totalLines.toLocaleString()} lines modified across sampled history (${avgLinesPerCommit} lines/commit)`,
      details: {
        sampledAdditions: additions,
        sampledDeletions: deletions,
        totalLinesSampled: totalLines,
        trivialCommitPercent: Math.round(trivialRatio * 100),
        averageLinesPerCommit: avgLinesPerCommit,
      },
      explanation:
        'Meaningful volume of insertions and deletions across file revisions confirms genuine software development.',
    },
    linesChanged: { additions, deletions, total: totalLines },
  };
}
