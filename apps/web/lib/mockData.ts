import { ForensicReport } from '@git-forensics/shared';

export const MOCK_AUTHENTIC_REPORT: ForensicReport = {
  id: 'scan_auth_01',
  repo: {
    owner: 'kuldeepofficial00',
    name: 'pulseops',
    url: 'https://github.com/kuldeepofficial00/pulseops',
    description: 'Modern distributed infrastructure observability & automated health checking engine.',
    stars: 142,
    forks: 18,
    language: 'TypeScript',
    defaultBranch: 'main'
  },
  score: 92,
  verdict: 'AUTHENTIC',
  confidence: 'HIGH',
  verdictTitle: 'AUTHENTIC HUMAN DEVELOPMENT PATTERN',
  verdictDescription: 'Commit cadence, message entropy, and multi-file code diffs demonstrate organic human problem-solving and software engineering lifecycle.',
  totalCommits: 284,
  totalBotCommits: 14,
  humanAuthors: 3,
  botAuthors: ['dependabot[bot]', 'github-actions[bot]'],
  dateRange: {
    start: '2025-11-12T10:14:22Z',
    end: '2026-10-24T18:30:11Z',
    durationDays: 346
  },
  filesTouched: 64,
  linesChanged: {
    additions: 14850,
    deletions: 4210,
    total: 19060
  },
  signals: [
    {
      id: 'file_diversity',
      name: 'File Diversity & Structural Breadth',
      status: 'PASS',
      scorePenalty: 0,
      summary: '64 unique files modified across 14 directories',
      details: {
        uniqueFiles: 64,
        uniqueDirectories: 14,
        directories: ['src/services', 'src/controllers', 'src/models', 'client/src', 'tests', 'docs'],
        singleFileDominance: false
      },
      explanation: 'Commits touch multiple modules (frontend, backend, configs, tests) showing true modular architecture rather than repetitive single-file edits.'
    },
    {
      id: 'message_entropy',
      name: 'Commit Message Entropy & Semantics',
      status: 'PASS',
      scorePenalty: 0,
      summary: '89.4% unique messages following Conventional Commits',
      details: {
        uniqueMessageRatio: 0.894,
        conventionalCommitPercent: 78.2,
        mostCommonMessage: 'docs(readme): update deployment guide (3 occurrences)'
      },
      explanation: 'High linguistic variety with clear semantic prefixes (feat, fix, refactor, chore) indicating conscious human documentation.'
    },
    {
      id: 'time_regularity',
      name: 'Mechanical Clock & Timing Regularity',
      status: 'PASS',
      scorePenalty: 0,
      summary: 'Natural time variation (StdDev: 2,410s between same-day commits)',
      details: {
        consecutiveGapStdDevSeconds: 2410,
        minGapSeconds: 42,
        medianGapSeconds: 1840,
        scriptedIntervalDetected: false
      },
      explanation: 'No mechanical fixed time interval. Gaps between commits vary naturally according to cognitive thinking and coding time.'
    },
    {
      id: 'date_mismatch',
      name: 'Author vs Committer Date Alignment',
      status: 'PASS',
      scorePenalty: 0,
      summary: '98.6% timestamps aligned within legitimate drift thresholds',
      details: {
        mismatchCount: 4,
        mismatchRatio: 0.014,
        maxDriftHours: 6.2,
        backdatingDetected: false
      },
      explanation: 'Timestamps match git creation time. Minor drift explained by normal git rebase/amend workflows.'
    },
    {
      id: 'working_hours',
      name: 'Diurnal Working Hours Distribution',
      status: 'PASS',
      scorePenalty: 0,
      summary: 'Distributed across natural waking hours (Peak: 2:00 PM – 6:00 PM)',
      details: {
        activeWorkHoursPercent: 86.4,
        graveyardHoursPercent: 6.2,
        detectedTimezoneOffset: '+05:30'
      },
      explanation: 'Commit activity clusters within typical professional daytime and early evening hours.'
    },
    {
      id: 'code_diff',
      name: 'Code Diff Substance & Line Velocity',
      status: 'PASS',
      scorePenalty: 0,
      summary: '19.0K lines modified across multiple file extensions',
      details: {
        additions: 14850,
        deletions: 4210,
        averageLinesPerCommit: 67,
        trivialCommitRatio: 0.05
      },
      explanation: 'Substantive code changes across .ts, .tsx, .json, and .sql files. No ghost commits.'
    },
    {
      id: 'weekend_pattern',
      name: 'Weekend vs Weekday Coding Distribution',
      status: 'PASS',
      scorePenalty: 0,
      summary: 'Balanced split (78% Weekday / 22% Weekend activity)',
      details: {
        weekdayPercent: 78.2,
        weekendPercent: 21.8,
        weekendExclusivity: false
      },
      explanation: 'Activity reflects standard active developer schedule with occasional weekend contributions.'
    },
    {
      id: 'github_push',
      name: 'Server-Side Push Event & Log Integrity',
      status: 'PASS',
      scorePenalty: 0,
      summary: 'Verified incremental delivery (42 distinct server push events logged)',
      details: {
        pushEventsCount: 42,
        avgCommitsPerPush: 6.8,
        verifiedIncremental: true
      },
      explanation: 'GitHub datacenter server logs confirm incremental push activity matching the commit development timeline.'
    }
  ],
  hourDistribution: {
    0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 1, 7: 5,
    8: 12, 9: 22, 10: 28, 11: 34, 12: 19, 13: 15,
    14: 38, 15: 35, 16: 29, 17: 22, 18: 14, 19: 5,
    20: 2, 21: 1, 22: 0, 23: 0
  },
  weekdayDistribution: {
    Mon: 52,
    Tue: 58,
    Wed: 49,
    Thu: 44,
    Fri: 41,
    Sat: 22,
    Sun: 18
  },
  scannedAt: '2026-10-27T14:32:00Z'
};

export const MOCK_BOT_REPORT: ForensicReport = {
  id: 'scan_bot_02',
  repo: {
    owner: 'activity-bot',
    name: 'spoofed-streak',
    url: 'https://github.com/activity-bot/spoofed-streak',
    description: 'Automated script to maintain daily green GitHub contribution squares.',
    stars: 3,
    forks: 0,
    language: 'Python',
    defaultBranch: 'main'
  },
  score: 12,
  verdict: 'SUSPICIOUS',
  confidence: 'HIGH',
  verdictTitle: 'HIGH PROBABILITY OF AUTOMATED BOT / SPOOFED COMMITS',
  verdictDescription: 'Severe forensic anomalies detected: single-file manipulation, zero message entropy, and mechanical clock interval consistency.',
  totalCommits: 365,
  totalBotCommits: 365,
  humanAuthors: 1,
  botAuthors: [],
  dateRange: {
    start: '2025-01-01T00:00:00Z',
    end: '2025-12-31T23:59:00Z',
    durationDays: 365
  },
  filesTouched: 1,
  linesChanged: {
    additions: 365,
    deletions: 0,
    total: 365
  },
  signals: [
    {
      id: 'file_diversity',
      name: 'File Diversity & Structural Breadth',
      status: 'ALERT',
      scorePenalty: 35,
      summary: '365 commits exclusively modified 1 single file (activity.txt)',
      details: {
        uniqueFiles: 1,
        uniqueDirectories: 1,
        directories: ['root'],
        singleFileDominance: true
      },
      explanation: 'Classic green-square bot signature: All commits across the entire repo history alter only a single dummy text file.'
    },
    {
      id: 'message_entropy',
      name: 'Commit Message Entropy & Semantics',
      status: 'ALERT',
      scorePenalty: 30,
      summary: '96.2% identical commit messages ("daily activity update")',
      details: {
        uniqueMessageRatio: 0.038,
        conventionalCommitPercent: 0,
        mostCommonMessage: 'daily activity update (351 occurrences)'
      },
      explanation: 'Repetitive robotic messages lacking human descriptive variation.'
    },
    {
      id: 'time_regularity',
      name: 'Mechanical Clock & Timing Regularity',
      status: 'ALERT',
      scorePenalty: 30,
      summary: 'Scripted clock detected: Standard deviation = 1.1s',
      details: {
        consecutiveGapStdDevSeconds: 1.1,
        minGapSeconds: 60,
        medianGapSeconds: 60,
        scriptedIntervalDetected: true
      },
      explanation: 'Commits were created at rigid 60-second mechanical intervals without human delay.'
    },
    {
      id: 'date_mismatch',
      name: 'Author vs Committer Date Alignment',
      status: 'ALERT',
      scorePenalty: 20,
      summary: 'Synthetic timestamps backdated artificially into past dates',
      details: {
        mismatchCount: 365,
        mismatchRatio: 1.0,
        maxDriftHours: 8760,
        backdatingDetected: true
      },
      explanation: 'Author dates span past calendar years while committer certificates indicate batch injection.'
    },
    {
      id: 'working_hours',
      name: 'Diurnal Working Hours Distribution',
      status: 'WARNING',
      scorePenalty: 10,
      summary: '100% commits triggered at exactly 00:01 AM via cron job',
      details: {
        activeWorkHoursPercent: 0,
        graveyardHoursPercent: 100,
        detectedTimezoneOffset: '+00:00'
      },
      explanation: 'Robotic execution scheduled precisely at midnight every day without natural variance.'
    },
    {
      id: 'code_diff',
      name: 'Code Diff Substance & Line Velocity',
      status: 'ALERT',
      scorePenalty: 20,
      summary: '365 commits produced only 365 trivial lines (+1 line per commit)',
      details: {
        additions: 365,
        deletions: 0,
        averageLinesPerCommit: 1,
        trivialCommitRatio: 1.0
      },
      explanation: 'Zero real engineering logic. Every commit appends a single timestamp line.'
    },
    {
      id: 'weekend_pattern',
      name: 'Weekend vs Weekday Coding Distribution',
      status: 'INFO',
      scorePenalty: 0,
      summary: 'Perfect 100% daily continuity (365/365 days without break)',
      details: {
        weekdayPercent: 71.4,
        weekendPercent: 28.6,
        weekendExclusivity: false
      },
      explanation: 'Unbroken daily streak spanning 365 days, a common pattern in automated activity generators.'
    },
    {
      id: 'github_push',
      name: 'Server-Side Push Event & Log Integrity',
      status: 'ALERT',
      scorePenalty: 15,
      summary: 'Single batch ingestion: 365 commits uploaded in 1 push event',
      details: {
        pushEventsCount: 1,
        recentCommitsCount: 365,
        timelineSpanDays: 365,
        singleBatchIngestion: true
      },
      explanation: 'Server push history reveals all 365 commits were uploaded in a single server push event, confirming automated backdated streak injection.'
    }
  ],
  hourDistribution: {
    0: 365, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0,
    8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0,
    15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0,
    22: 0, 23: 0
  },
  weekdayDistribution: {
    Mon: 52,
    Tue: 52,
    Wed: 53,
    Thu: 52,
    Fri: 52,
    Sat: 52,
    Sun: 52
  },
  scannedAt: '2026-10-27T14:35:00Z'
};

export const RECENT_SCANS = [
  {
    owner: 'facebook',
    repo: 'react',
    score: 94,
    verdict: 'AUTHENTIC' as const,
    stars: '230k',
    timeAgo: '12m ago',
    language: 'JavaScript'
  },
  {
    owner: 'activity-bot',
    repo: 'spoofed-streak',
    score: 12,
    verdict: 'SUSPICIOUS' as const,
    stars: '3',
    timeAgo: '34m ago',
    language: 'Python'
  },
  {
    owner: 'torvalds',
    repo: 'linux',
    score: 98,
    verdict: 'AUTHENTIC' as const,
    stars: '185k',
    timeAgo: '1h ago',
    language: 'C'
  },
  {
    owner: 'kuldeepofficial00',
    repo: 'pulseops',
    score: 92,
    verdict: 'AUTHENTIC' as const,
    stars: '142',
    timeAgo: '2h ago',
    language: 'TypeScript'
  },
  {
    owner: 'streak-booster',
    repo: 'github-green',
    score: 18,
    verdict: 'SUSPICIOUS' as const,
    stars: '9',
    timeAgo: '3h ago',
    language: 'Shell'
  },
  {
    owner: 'vercel',
    repo: 'next.js',
    score: 96,
    verdict: 'AUTHENTIC' as const,
    stars: '128k',
    timeAgo: '4h ago',
    language: 'TypeScript'
  }
];
