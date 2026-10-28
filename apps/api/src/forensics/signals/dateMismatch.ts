import { SignalResult } from '@git-forensics/shared';
import { RawCommit } from '../../github/github.service';

export function analyzeDateMismatch(
  commits: RawCommit[],
  repoCreatedAt?: string,
  repoPushedAt?: string,
): SignalResult {
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

  // 1. Author vs. Committer Certificate Drift Check
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

  // 2. Repo Creation Drift Check (Time-Travel Paradox detection)
  let predateDays = 0;
  let predatedCommitsCount = 0;
  let isBackdatedRepoCreation = false;
  let isLegitLocalMigration = false;
  let zeroSecondsCount = 0;
  let pushDeltaSeconds = 999999;

  if (repoCreatedAt) {
    const repoCreatedTime = new Date(repoCreatedAt).getTime();
    if (!isNaN(repoCreatedTime)) {
      const validTimestamps = commits
        .map((c) => new Date(c.authorDate).getTime())
        .filter((t) => !isNaN(t))
        .sort((a, b) => a - b);

      if (validTimestamps.length > 0) {
        const firstCommitTime = validTimestamps[0];
        if (firstCommitTime < repoCreatedTime) {
          predateDays = (repoCreatedTime - firstCommitTime) / (1000 * 3600 * 24);
          predatedCommitsCount = commits.filter(
            (c) => new Date(c.authorDate).getTime() < repoCreatedTime,
          ).length;
        }
      }

      // Check push delta if available
      if (repoPushedAt) {
        const pushedTime = new Date(repoPushedAt).getTime();
        if (!isNaN(pushedTime)) {
          pushDeltaSeconds = Math.abs(pushedTime - repoCreatedTime) / 1000;
        }
      }

      // Check zero-seconds heuristic
      zeroSecondsCount = commits.filter(
        (c) => new Date(c.authorDate).getSeconds() === 0,
      ).length;
      const zeroSecondsRatio = zeroSecondsCount / total;

      const predatedRatio = predatedCommitsCount / total;

      // Compound condition for AI backdated creation:
      // - >50% commits predate GitHub repo creation by >30 days
      // - AND (synthetic clock quantization >= 25% OR pushed in <300s of repo creation)
      if (
        total >= 10 &&
        predatedRatio >= 0.5 &&
        predateDays >= 30 &&
        (zeroSecondsRatio >= 0.25 || (pushDeltaSeconds < 300 && total >= 20))
      ) {
        isBackdatedRepoCreation = true;
      } else if (total >= 10 && predatedRatio >= 0.5 && predateDays >= 30) {
        // Commits predate creation, but authentic human seconds & no rapid AI batch push
        isLegitLocalMigration = true;
      }
    }
  }

  // --- Decision Hierarchy ---

  // Priority 1: ALERT - Severe Author vs Committer desynchronization (>50% commits with >24h drift)
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

  // Priority 2: ALERT - AI Repository Creation Paradox (Batch-Backdating)
  if (isBackdatedRepoCreation) {
    return {
      id: 'date_mismatch',
      name: 'Author vs Committer Date Alignment',
      status: 'ALERT',
      scorePenalty: 20,
      summary: `Batch-backdated history: ${predatedCommitsCount} commits predate GitHub repo creation by ${Math.round(predateDays)} days with synthetic clock indicators`,
      details: {
        predateDays: Math.round(predateDays),
        predatedCommitsCount,
        pushDeltaSeconds: Math.round(pushDeltaSeconds),
        zeroSecondsCount,
        backdatingDetected: true,
      },
      explanation:
        `The repository history predates its GitHub creation by ${Math.round(predateDays)} days and was uploaded in a single rapid batch with synthetic clock indicators. This is a signature characteristic of AI synthetic commit backdating tools.`,
    };
  }

  // Priority 3: WARNING - Moderate author/committer drift (>20% with >24h drift)
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

  // Priority 4: INFO - Legitimate local migration
  if (isLegitLocalMigration) {
    return {
      id: 'date_mismatch',
      name: 'Author vs Committer Date Alignment',
      status: 'INFO',
      scorePenalty: 0,
      summary: `Historical repository migration (${predatedCommitsCount} commits predate GitHub repo creation by ${Math.round(predateDays)} days)`,
      details: {
        predateDays: Math.round(predateDays),
        predatedCommitsCount,
        localMigrationDetected: true,
      },
      explanation:
        'Commits predate the GitHub repository creation date but exhibit organic human seconds and cadence, consistent with migrating an existing local or external git repository.',
    };
  }

  // Priority 5: PASS - Clean alignment
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
