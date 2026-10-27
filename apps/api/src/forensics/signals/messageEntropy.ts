import { SignalResult } from '@git-forensics/shared';
import { RawCommit } from '../../github/github.service';

const CONVENTIONAL_REGEX =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9_-]+\))?:/i;

export function analyzeMessageEntropy(commits: RawCommit[]): SignalResult {
  const totalCommits = commits.length;
  if (totalCommits === 0) {
    return {
      id: 'message_entropy',
      name: 'Commit Message Entropy & Semantics',
      status: 'INFO',
      scorePenalty: 0,
      summary: 'No commits to analyze',
      details: { uniqueRatio: 1, conventionalPercent: 0 },
      explanation: 'Repository has no commit messages.',
    };
  }

  const messageCounts = new Map<string, number>();
  let conventionalCount = 0;

  for (const c of commits) {
    // Subject line only
    const subject = c.message.split('\n')[0].trim().toLowerCase();
    const cleanSubject = subject || 'empty message';
    messageCounts.set(cleanSubject, (messageCounts.get(cleanSubject) || 0) + 1);

    if (CONVENTIONAL_REGEX.test(subject)) {
      conventionalCount++;
    }
  }

  const uniqueCount = messageCounts.size;
  const uniqueRatio = uniqueCount / totalCommits;
  const conventionalPercent = Math.round((conventionalCount / totalCommits) * 100);

  // Find most frequent message
  let topMessage = '';
  let topCount = 0;
  for (const [msg, cnt] of messageCounts.entries()) {
    if (cnt > topCount) {
      topCount = cnt;
      topMessage = msg;
    }
  }

  // Red flag: >80% messages are repetitive (uniqueness < 20%) in 15+ commits
  if (totalCommits >= 15 && uniqueRatio < 0.2) {
    const repeatPercent = Math.round(((totalCommits - uniqueCount) / totalCommits) * 100);
    return {
      id: 'message_entropy',
      name: 'Commit Message Entropy & Semantics',
      status: 'ALERT',
      scorePenalty: 30,
      summary: `${repeatPercent}% of commit messages are repetitive or duplicated`,
      details: {
        uniqueMessageRatio: Number(uniqueRatio.toFixed(3)),
        mostFrequentMessage: `"${topMessage}" (${topCount} times)`,
        conventionalCommitPercent: conventionalPercent,
        uniqueCount,
        totalCommits,
      },
      explanation:
        'Automated activity scripts use simple static strings (like "update", "commit", "activity") over and over. Human developers naturally formulate diverse, descriptive messages as their code evolves.',
    };
  }

  // Warning: uniqueness < 50%
  if (totalCommits >= 15 && uniqueRatio < 0.5) {
    return {
      id: 'message_entropy',
      name: 'Commit Message Entropy & Semantics',
      status: 'WARNING',
      scorePenalty: 15,
      summary: `Moderate message repetition: ${uniqueCount} unique messages across ${totalCommits} commits`,
      details: {
        uniqueMessageRatio: Number(uniqueRatio.toFixed(3)),
        mostFrequentMessage: `"${topMessage}" (${topCount} times)`,
        conventionalCommitPercent: conventionalPercent,
        uniqueCount,
        totalCommits,
      },
      explanation:
        'A significant proportion of commit messages are repeated. While acceptable for minor fixes, high repetition warrants inspection.',
    };
  }

  // Pass: High diversity
  return {
    id: 'message_entropy',
    name: 'Commit Message Entropy & Semantics',
    status: 'PASS',
    scorePenalty: 0,
    summary: `${Math.round(uniqueRatio * 100)}% unique messages with ${conventionalPercent}% conventional syntax`,
    details: {
      uniqueMessageRatio: Number(uniqueRatio.toFixed(3)),
      mostFrequentMessage: `"${topMessage}" (${topCount} times)`,
      conventionalCommitPercent: conventionalPercent,
      uniqueCount,
      totalCommits,
    },
    explanation:
      'High semantic variety and clear conventional commit prefixes (feat, fix, refactor, docs) reflect deliberate human reasoning and code documentation.',
  };
}
