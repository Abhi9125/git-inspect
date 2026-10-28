export const KNOWN_BOTS = [
  'dependabot[bot]',
  'dependabot',
  'renovate[bot]',
  'renovate',
  'github-actions[bot]',
  'github-actions',
  'greenkeeper[bot]',
  'snyk-bot',
  'codecov[bot]',
  'codecov-bot',
  'imgbot[bot]',
  'stale[bot]',
  'allcontributors[bot]'
];

export const SCORE_THRESHOLDS = {
  AUTHENTIC_MIN: 75,
  MIXED_MIN: 50,
  SUSPICIOUS_MAX: 49,
  MIN_SCORE: 5,
  MAX_SCORE: 100
};

export const POPULAR_REPOS = [
  {
    owner: 'facebook',
    repo: 'react',
    label: 'facebook/react',
    tag: 'Authentic Human',
    stars: '230k',
    expectedScore: 94,
  },
  {
    owner: 'torvalds',
    repo: 'linux',
    label: 'torvalds/linux',
    tag: 'High Scale',
    stars: '185k',
    expectedScore: 98,
  },
];

export const DEMO_PRESETS = POPULAR_REPOS;
