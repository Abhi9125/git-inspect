import { Injectable } from '@nestjs/common';
import { SignalResult } from '@git-forensics/shared';
import { RawCommit, GitHubPushEvent } from '../github/github.service';
import { analyzeFileDiversity } from './signals/fileDiversity';
import { analyzeMessageEntropy } from './signals/messageEntropy';
import { analyzeTimeRegularity } from './signals/timeRegularity';
import { analyzeDateMismatch } from './signals/dateMismatch';
import { analyzeWorkingHours } from './signals/workingHours';
import { analyzeCodeDiff } from './signals/codeDiff';
import { analyzeWeekendPattern } from './signals/weekendPattern';
import { analyzeServerEvents } from './signals/serverEvents';

export interface ForensicsAnalysisResult {
  signals: SignalResult[];
  hourDistribution: Record<number, number>;
  weekdayDistribution: Record<string, number>;
  linesChanged: {
    additions: number;
    deletions: number;
    total: number;
  };
  filesTouched: number;
  dateRange: {
    start: string;
    end: string;
    durationDays: number;
  };
  humanAuthorsCount: number;
}

@Injectable()
export class ForensicsService {
  public analyze(
    commits: RawCommit[],
    repoCreatedAt?: string,
    repoPushedAt?: string,
    events: GitHubPushEvent[] = [],
  ): ForensicsAnalysisResult {
    // 1. Run all 8 signals
    const s1 = analyzeFileDiversity(commits);
    const s2 = analyzeMessageEntropy(commits);
    const s3 = analyzeTimeRegularity(commits);
    const s4 = analyzeDateMismatch(commits, repoCreatedAt, repoPushedAt);
    const { signal: s5, hourDistribution } = analyzeWorkingHours(commits);
    const { signal: s6, linesChanged } = analyzeCodeDiff(commits);
    const { signal: s7, weekdayDistribution } = analyzeWeekendPattern(commits);
    const s8 = analyzeServerEvents(commits, events, repoCreatedAt);

    const signals: SignalResult[] = [s1, s2, s3, s4, s5, s6, s7, s8];

    // 2. Compute files touched
    const uniqueFiles = new Set<string>();
    for (const c of commits) {
      if (c.files) {
        for (const f of c.files) uniqueFiles.add(f);
      }
    }

    // 3. Compute date range
    let start = new Date().toISOString();
    let end = new Date().toISOString();
    let durationDays = 1;

    if (commits.length > 0) {
      const timestamps = commits
        .map((c) => new Date(c.authorDate).getTime())
        .filter((t) => !isNaN(t))
        .sort((a, b) => a - b);

      if (timestamps.length > 0) {
        start = new Date(timestamps[0]).toISOString();
        end = new Date(timestamps[timestamps.length - 1]).toISOString();
        const diffMs = timestamps[timestamps.length - 1] - timestamps[0];
        durationDays = Math.max(1, Math.round(diffMs / (1000 * 3600 * 24)));
      }
    }

    // 4. Compute unique human author count
    const authors = new Set<string>();
    for (const c of commits) {
      authors.add(c.authorEmail || c.authorName || 'unknown');
    }

    return {
      signals,
      hourDistribution,
      weekdayDistribution,
      linesChanged,
      filesTouched: uniqueFiles.size,
      dateRange: {
        start,
        end,
        durationDays,
      },
      humanAuthorsCount: Math.max(1, authors.size),
    };
  }
}
