import { SignalResult } from '@git-forensics/shared';
import { RawCommit } from '../../github/github.service';

export function analyzeDateMismatch(commits: RawCommit[]): SignalResult {
  const total = commits.length;
  if (total === 0) {
    return {
      id: 'date_mismatch',
      name: 'Author vs Committer Date Alignment',
      status: 'INFO',
      scorePenalty: 0,
      summary: 'No commits to analyze',
      details: { mismatchCount: 0, mismatchRatio: 0 },
      explanation: 'No commits available for timestamp auditing.',
    };
  }

  let mismatchCount = 0;
  let maxDriftHours = 0;

  for (const c of commits) {
    const aTime = new Date(c.authorDate).getTime();
    const cTime = new Date(c.committerDate).getTime();

    if (!isNaN(aTime) && !isNaN(cTime)) {
      const diffHours = Math.abs(cTime - aTime) / (1000 * 3600);
      if (diffHours > maxDriftHours) {
        maxDriftHours = diffHours;
      }
      // Flag as mismatch if drift is greater than 24 hours
      if (diffHours > 24) {
        mismatchCount++;
      }
    }
  }

  const mismatchRatio = mismatchCount / total;
  const mismatchPercent = Math.round(mismatchRatio * 100);

  // Red Flag: >50% commits with >24h drift
  if (total >= 10 && mismatchRatio > 0.5) {
    return {
      id: 'date_mismatch',
      name: 'Author vs Committer Date Alignment',
      status: 'ALERT',
      scorePenalty: 20,
      summary: `${mismatchPercent}% of commits show severe author/committer date desynchronization`,
      details: {
        mismatchCount,
        mismatchRatio: Number(mismatchRatio.toFixed(3)),
        maxDriftHours: Math.round(maxDriftHours),
        backdatingDetected: true,
      },
      explanation:
        'Author date and committer date diverge significantly across the majority of commits. This occurs when automated scripts forge author timestamps back into past dates to falsify contribution calendars.',
    };
  }

  // Warning: >20% commits with >24h drift
  if (total >= 10 && mismatchRatio > 0.2) {
    return {
      id: 'date_mismatch',
      name: 'Author vs Committer Date Alignment',
      status: 'WARNING',
      scorePenalty: 10,
      summary: `Moderate timestamp drift: ${mismatchPercent}% commits differ by >24 hours`,
      details: {
        mismatchCount,
        mismatchRatio: Number(mismatchRatio.toFixed(3)),
        maxDriftHours: Math.round(maxDriftHours),
        backdatingDetected: false,
      },
      explanation:
        'Noticeable drift between authorship and committer certificates. Could be caused by substantial rebasing, branch merging, or partial timestamp rewriting.',
    };
  }

  // Pass: Clean alignment
  return {
    id: 'date_mismatch',
    name: 'Author vs Committer Date Alignment',
    status: 'PASS',
    scorePenalty: 0,
    summary: `${100 - mismatchPercent}% timestamps strictly aligned within legitimate drift thresholds`,
    details: {
      mismatchCount,
      mismatchRatio: Number(mismatchRatio.toFixed(3)),
      maxDriftHours: Math.round(maxDriftHours),
      backdatingDetected: false,
    },
    explanation:
      'Author and committer timestamps are closely coupled, confirming commits were recorded in real-time as development progressed.',
  };
}
