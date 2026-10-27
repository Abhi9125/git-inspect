export type ScanStatus =
  | 'PENDING'
  | 'VALIDATING'
  | 'FETCHING_COMMITS'
  | 'FETCHING_FILE_DETAILS'
  | 'ANALYZING'
  | 'COMPLETED'
  | 'FAILED';

export type SignalId =
  | 'file_diversity'
  | 'message_entropy'
  | 'time_regularity'
  | 'date_mismatch'
  | 'working_hours'
  | 'code_diff'
  | 'weekend_pattern'
  | 'github_push';

export type SignalStatus = 'PASS' | 'WARNING' | 'ALERT' | 'INFO';

export interface SignalResult {
  id: SignalId;
  name: string;
  status: SignalStatus;
  scorePenalty: number;
  summary: string;
  details: Record<string, any>;
  explanation: string;
}

export interface RepoMetadata {
  owner: string;
  name: string;
  url: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  defaultBranch: string;
}

export type Verdict = 'AUTHENTIC' | 'MIXED' | 'SUSPICIOUS';
export type Confidence = 'HIGH' | 'MODERATE' | 'LOW';

export interface ForensicReport {
  id: string;
  repo: RepoMetadata;
  score: number; // 5 - 100
  verdict: Verdict;
  confidence: Confidence;
  verdictTitle: string;
  verdictDescription: string;
  totalCommits: number;
  totalBotCommits: number;
  humanAuthors: number;
  botAuthors: string[];
  dateRange: {
    start: string;
    end: string;
    durationDays: number;
  };
  filesTouched: number;
  linesChanged: {
    additions: number;
    deletions: number;
    total: number;
  };
  signals: SignalResult[];
  hourDistribution: Record<number, number>; // 0..23
  weekdayDistribution: Record<string, number>; // Mon..Sun
  scannedAt: string;
}

export interface ScanProgressState {
  scanId: string;
  repoUrl: string;
  owner: string;
  repo: string;
  status: ScanStatus;
  progressPercent: number;
  currentStepMessage: string;
  completedSteps: string[];
  error?: string;
  report?: ForensicReport;
}
