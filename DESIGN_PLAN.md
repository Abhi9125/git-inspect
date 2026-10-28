# 🔍 Git Forensics — Web App Design Plan (Final)

> **Architecture:** Monorepo — Next.js (Frontend) + NestJS (Backend API)  
> **Data Source:** GitHub REST API (no git clone needed on server)  
> **Database:** PostgreSQL (Prisma ORM)  
> **Design Reference:** [vibrant.design](https://vibrant.design/) (clean, data-dense, dark/light, micro-interactions, `#3074FE` accent)  
> **Development Strategy:** UI-First Prototype with realistic dummy data (Figma-reference feel) before full-stack API integration  
> **Features V1:** Scan by URL, 7 Forensic Signals, Charts, Shareable Reports  
> **Target Cost:** ₹0/month (free tier possible)

---

## 📁 Monorepo Structure

```
git-forensics/
├── apps/
│   ├── web/                          # Next.js Frontend
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Landing page with search bar
│   │   │   ├── scan/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Live scanning progress page
│   │   │   ├── report/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx      # Shareable report page
│   │   │   └── api/                  # Next.js API routes (proxy to backend if needed)
│   │   ├── components/
│   │   │   ├── ui/                   # Shadcn / Vibrant UI components
│   │   │   ├── SearchBar.tsx
│   │   │   ├── ScanProgress.tsx
│   │   │   ├── ScoreGauge.tsx        # Speedometer chart (0-100)
│   │   │   ├── SignalCard.tsx        # Individual signal result card
│   │   │   ├── HourChart.tsx         # 24-hour commit distribution
│   │   │   ├── WeekdayChart.tsx      # Mon-Sun distribution
│   │   │   ├── TimelineChart.tsx     # Commit timeline
│   │   │   ├── FileDiversityTree.tsx # Treemap of files/dirs
│   │   │   ├── ReportHeader.tsx      # Score banner + repo info
│   │   │   └── DemoSwitcher.tsx      # Toggle between Authentic vs Bot mock report
│   │   ├── lib/
│   │   │   ├── api.ts               # API client (fetch wrapper)
│   │   │   └── mockData.ts          # Realistic dummy datasets (Authentic vs Bot)
│   │   ├── tailwind.config.ts
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── api/                          # NestJS Backend
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── scan/
│       │   │   ├── scan.controller.ts    # POST /scan, GET /scan/:id
│       │   │   ├── scan.service.ts       # Orchestrates scanning
│       │   │   └── scan.module.ts
│       │   ├── github/
│       │   │   ├── github.service.ts     # GitHub API client
│       │   │   └── github.module.ts
│       │   ├── forensics/
│       │   │   ├── forensics.service.ts  # Runs all 7 signals
│       │   │   ├── forensics.module.ts
│       │   │   └── signals/
│       │   │       ├── fileDiversity.ts
│       │   │       ├── messageEntropy.ts
│       │   │       ├── timeRegularity.ts
│       │   │       ├── dateMismatch.ts
│       │   │       ├── workingHours.ts
│       │   │       ├── codeDiff.ts
│       │   │       └── weekendPattern.ts
│       │   ├── scoring/
│       │   │   └── scorer.service.ts     # Score calculation
│       │   ├── bot-filter/
│       │   │   └── bot-filter.service.ts # Exclude bot authors
│       │   └── prisma/
│       │       ├── prisma.service.ts
│       │       └── prisma.module.ts
│       ├── prisma/
│       │   └── schema.prisma
│       ├── nest-cli.json
│       └── package.json
│
├── packages/
│   └── shared/                       # Shared types between frontend & backend
│       ├── types.ts                  # SignalResult, ScanStatus, ReportData etc.
│       └── constants.ts              # Score tiers, bot patterns, etc.
│
├── package.json                      # Root workspace config
├── turbo.json                        # Turborepo config (monorepo task runner)
├── .gitignore
└── README.md
```

**Monorepo Tool:** [Turborepo](https://turbo.build/) — fast, zero-config, works with npm workspaces.

---

## 🎨 Design System Specification (Inspired by vibrant.design)

### 1. Aesthetic & Palette
- **Canvas:** Crisp high-contrast surface (`bg-[#0c0d0e]` in dark mode / `bg-[#fafafa]` in light mode).
- **Primary Accent:** Electric Vibrant Royal Blue (`#3074FE` / `#2563EB`) for brand highlights, buttons, and active indicators.
- **Semantic Indicators:**
  - 🟢 **Authentic Human:** Emerald Green (`#10B981`)
  - 🟡 **Mixed / Warning:** Amber (`#F59E0B`)
  - 🔴 **Bot / Suspicious:** Ruby Crimson (`#EF4444`)
- **Borders & Rings:** Hairline micro-rings (`ring-1 ring-border/50` or `border-black/5` dark: `border-white/10`) with subtle elevations (`shadow-sm shadow-black/5`).

### 2. Typography & Micro-Interactions
- **Font Stack:** Modern Sans (`Inter / Geist` variable font).
- **Scale:** Compact 44px (`h-11`) navigation bar, `text-[13px]` body details, `h-7` rounded-full tag pills.
- **Card Physics:** Smooth lift on hover (`transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`).

### 3. Dummy Data Suite (`mockData.ts`)
To preview the UI like a live Figma interactive prototype before connecting the backend:
- **Dataset A (Authentic Dev):** e.g. `facebook/react` or `kuldeepofficial00/pulseops`
  - Score: **92/100** (🟢 High Confidence)
  - Natural 24-hr curve, 47+ files across 12 dirs, 89% unique conventional messages.
- **Dataset B (Bot / Spoofed):** e.g. `activity-bot/fake-streak`
  - Score: **12/100** (🚨 High Probability of Bot)
  - 250 commits touching only `activity.txt`, identical commit messages ("update"), std-dev 1.2s (mechanical clock).
- **Interactive Switcher:** Sticky pill toggle on `/report/demo` allowing one-click switching between Dataset A and B.

---

## 🔄 Complete System Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant F as Next.js Frontend
    participant B as NestJS Backend
    participant G as GitHub API
    participant D as PostgreSQL DB

    U->>F: Pastes GitHub repo URL
    F->>B: POST /api/scan { repoUrl: "owner/repo" }
    B->>D: Create scan record (status: PENDING)
    B-->>F: { scanId: "abc123", status: "PENDING" }
    F->>F: Redirect to /scan/abc123 (progress page)

    Note over B: Background processing starts

    B->>G: GET /repos/owner/repo (validate repo exists)
    B->>D: Update status: FETCHING_COMMITS
    B->>G: GET /repos/owner/repo/commits?per_page=100&page=1
    B->>G: GET /repos/owner/repo/commits?per_page=100&page=2
    B->>G: ... (paginate all commits)
    B->>D: Update status: FETCHING_FILE_DETAILS

    B->>G: GET /repos/owner/repo/commits/{sha} (sampled commits for file details)
    B->>D: Update status: ANALYZING

    Note over B: Run 7 forensic signals on collected data

    B->>B: Signal 1: File Diversity
    B->>B: Signal 2: Message Entropy
    B->>B: Signal 3: Time Regularity
    B->>B: Signal 4: Date Mismatch
    B->>B: Signal 5: Working Hours
    B->>B: Signal 6: Code Diff
    B->>B: Signal 7: Weekend Pattern
    B->>B: Calculate Authenticity Score

    B->>D: Save complete report (status: COMPLETED)

    F->>B: GET /api/scan/abc123 (polling every 2s)
    B->>D: Fetch scan
    B-->>F: { status: "COMPLETED", report: {...} }
    F->>F: Render beautiful dashboard

    Note over U: User can share: git-forensics.app/report/owner-repo
    U->>F: Shares link
    F->>B: GET /api/report/owner-repo
    B->>D: Fetch cached report
    B-->>F: Full report data
```

---

## 📡 GitHub REST API Strategy

### API Endpoints We'll Use:

| # | Endpoint | What it gives us | Used by | Rate Cost |
|---|----------|-----------------|---------|-----------|
| 1 | `GET /repos/{owner}/{repo}` | Repo metadata (exists? public?) | Validation | 1 call |
| 2 | `GET /repos/{owner}/{repo}/commits?per_page=100` | Commit list: sha, message, author date, committer date, author info | Signal 2,3,4,5,7 | ~5 calls per 500 commits |
| 3 | `GET /repos/{owner}/{repo}/commits/{sha}` | Single commit with file list + stats (additions/deletions) | Signal 1, 6 | Sampled (see below) |
| 4 | `GET /repos/{owner}/{repo}/stats/code_frequency` | Weekly additions/deletions | Signal 6 (supplement) | 1 call |
| 5 | `GET /repos/{owner}/{repo}/events` | Push events (last 90 days) | Signal 8 (optional) | 1 call |

### Smart Sampling Strategy (Saves API Calls):

For Signal 1 (file diversity) and Signal 6 (diff stats), we need per-commit details. But fetching details for ALL 500 commits = 500 API calls = BAD.

**Solution: Intelligent Sampling**

```typescript
function getSampleCommits(totalCommits: number): number[] {
  if (totalCommits <= 50) {
    return allCommitIndices;    // Fetch ALL if small repo
  }
  if (totalCommits <= 200) {
    return every2ndCommit;      // 50% sample
  }
  // Large repo: sample ~100 commits evenly spread
  const step = Math.floor(totalCommits / 100);
  return Array.from({ length: 100 }, (_, i) => i * step);
}
```

| Repo Size | Commits to fetch details for | API calls | Accuracy |
|-----------|------------------------------|-----------|----------|
| ≤ 50 commits | All 50 | 50 | 100% |
| 51-200 | Every 2nd = ~100 | ~100 | 95%+ |
| 200-1000 | Sample 100 | 100 | 90%+ |
| 1000+ | Sample 100 | 100 | 85%+ |

> [!IMPORTANT]
> **Rate Limit:** GitHub allows **5,000 requests/hour** with a personal access token. Even fetching ALL commit details for a 500-commit repo (500 + 5 + 2 = ~507 calls) is well within limits. Sampling is for very large repos (1000+ commits) to keep scans fast.

### Authentication Strategy:

```
Without token: 60 requests/hour  → Can scan ~1 small repo
With token:    5,000 requests/hour → Can scan ~50 repos/hour easily
```

**For V1:** We'll use a server-side GitHub token (stored in `.env`). Users don't need to login.

**Future:** Add GitHub OAuth so users authenticate and use their own rate limit.

---

## 🔬 Signal Adaptations for GitHub API

All 7 signals work with API data. Here's what changes:

### Signal 1: File Diversity (via API)

**API Data:** `GET /repos/{owner}/{repo}/commits/{sha}` returns `files[]` array with `filename` field.

```typescript
// From each sampled commit response:
commit.files.forEach(file => {
  uniqueFiles.add(file.filename);
  uniqueDirs.add(file.filename.split('/')[0]);
});
```

**Same scoring logic as CLI version.** No changes needed.

### Signal 2: Message Entropy (via API)

**API Data:** Commit list gives `commit.message` directly.

```typescript
// From commits list:
commits.map(c => c.commit.message.split('\n')[0]); // First line = subject
```

**Same scoring logic.** No changes.

### Signal 3: Time Regularity (via API)

**API Data:** `commit.author.date` gives ISO timestamp like `"2024-03-15T14:30:00Z"`.

**One difference:** GitHub API returns UTC time. The git CLI gave us the author's local timezone. For time regularity (gap between commits), this doesn't matter — gaps are the same in any timezone.

**Same scoring logic.** No changes.

### Signal 4: Date Mismatch (via API)

**API Data:** Both `commit.author.date` and `commit.committer.date` are available.

**Same scoring logic.** No changes.

### Signal 5: Working Hours (via API)

**API Data:** `commit.author.date` is in UTC.

> [!WARNING]
> **Timezone Issue:** GitHub API returns all dates in UTC. A developer in India (UTC+5:30) committing at 2 PM IST shows as 8:30 AM UTC. This affects the hour histogram.
>
> **Solution:** We'll try to detect the developer's timezone from their GitHub profile's `location` field (`GET /users/{username}`), or look at the most common commit hour offset. If we can't determine timezone, we analyze in UTC and note it in the report.

### Signal 6: Code Diff (via API)

**API Data:** Two sources:
1. Per-commit stats from `GET /repos/{owner}/{repo}/commits/{sha}`: `stats.additions`, `stats.deletions`
2. Weekly aggregates from `GET /repos/{owner}/{repo}/stats/code_frequency`: `[timestamp, additions, deletions]`

**We use both:** Sampled per-commit stats for accuracy + weekly aggregates as supplement.

### Signal 7: Weekend Pattern (via API)

**API Data:** Parse day-of-week from `commit.author.date`.

**Same scoring logic.** No changes.

---

## 🗄️ Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Scan {
  id          String     @id @default(cuid())
  repoOwner   String                            // "kuldeepofficial00"
  repoName    String                            // "pulseops"
  repoUrl     String                            // Full GitHub URL
  status      ScanStatus @default(PENDING)
  
  // Repo metadata
  description String?
  stars       Int?
  forks       Int?
  language    String?
  
  // Results
  totalCommits      Int?
  totalBotCommits   Int?
  humanAuthors      Int?
  botAuthors        String[]                    // ["dependabot[bot]", "renovate[bot]"]
  dateRangeStart    DateTime?
  dateRangeEnd      DateTime?
  
  // Final score
  score             Int?                        // 5-100
  verdict           String?                     // "AUTHENTIC" | "MIXED" | "SUSPICIOUS"
  
  // Signal results (stored as JSON)
  signals           Json?                       // Array of SignalResult objects
  
  // Chart data (stored as JSON for frontend)
  hourDistribution  Json?                       // {0: 2, 1: 1, ..., 23: 3}
  weekdayDistribution Json?                     // {Mon: 15, Tue: 22, ...}
  
  // Timestamps
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  completedAt DateTime?
  
  // Unique constraint: one report per repo (cache)
  @@unique([repoOwner, repoName])
  @@index([repoOwner, repoName])
}

enum ScanStatus {
  PENDING
  VALIDATING
  FETCHING_COMMITS
  FETCHING_FILE_DETAILS
  ANALYZING
  COMPLETED
  FAILED
}
```

### Caching Strategy:

```typescript
// Before starting a new scan:
const existing = await prisma.scan.findUnique({
  where: { repoOwner_repoName: { repoOwner, repoName } }
});

if (existing && existing.status === 'COMPLETED') {
  const age = Date.now() - existing.completedAt.getTime();
  if (age < 24 * 60 * 60 * 1000) {  // Less than 24 hours old
    return existing;  // Return cached report!
  }
}
// Else: start new scan
```

---

## 🛣️ API Endpoints (NestJS)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| `POST` | `/api/scan` | Start a new scan | `{ repoUrl: "https://github.com/owner/repo" }` | `{ scanId: "abc123", status: "PENDING" }` |
| `GET` | `/api/scan/:id` | Get scan status + results | — | `{ status: "ANALYZING", progress: 60 }` or full report |
| `GET` | `/api/report/:owner/:repo` | Get cached report by repo | — | Full report data or 404 |
| `GET` | `/api/health` | Health check | — | `{ status: "ok" }` |

### POST `/api/scan` — Flow:

```typescript
@Post('scan')
async startScan(@Body() body: { repoUrl: string }) {
  // 1. Validate URL format (must be github.com)
  // 2. Extract owner/repo from URL
  // 3. Check cache (existing report < 24h old?)
  // 4. If cached → return existing scanId
  // 5. If not → create Scan record → trigger background analysis
  // 6. Return { scanId, status }
}
```

### GET `/api/scan/:id` — Polling:

Frontend polls this every 2 seconds. Response changes as scan progresses:

```json
// Stage 1:
{ "status": "FETCHING_COMMITS", "progress": 20, "message": "Fetching commits (page 3/7)..." }

// Stage 2:
{ "status": "FETCHING_FILE_DETAILS", "progress": 50, "message": "Analyzing file diversity (45/100 commits)..." }

// Stage 3:
{ "status": "ANALYZING", "progress": 80, "message": "Running forensic signal 5/7..." }

// Final:
{ "status": "COMPLETED", "progress": 100, "report": { ... full report data ... } }
```

---

## 🎨 Frontend Pages & Components

### Page 1: Landing Page (`/`)

```
┌────────────────────────────────────────────────────────┐
│ [Navbar: 🔍 GitForensics    #3074FE    GitHub  Theme]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│            🔍 Git Forensics                            │
│                                                        │
│     Detect fake GitHub contribution graphs.            │
│     Paste any public repo URL to analyze.              │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  https://github.com/username/repo            🔍  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│            [ Analyze Repository ]                      │
│                                                        │
│   Presets: [facebook/react] [linux] [fake-activity]    │
│  ─────────────────────────────────────────────────     │
│                                                        │
│   Recent Scans: (Vibrant Bento Card Grid)              │
│   ┌─────────────────────┬───────┬──────────────────┐  │
│   │ torvalds/linux      │ 98/100│ ✅ Authentic     │  │
│   │ fake-user/activity  │  8/100│ 🚨 Suspicious   │  │
│   │ john/portfolio      │ 67/100│ ⚠️ Mixed        │  │
│   └─────────────────────┴───────┴──────────────────┘  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Page 2: Scan Progress (`/scan/[id]`)

```
┌────────────────────────────────────────────────────────┐
│  🔍 Scanning: kuldeepofficial00/pulseops               │
│                                                        │
│  ████████████████████████░░░░░░░░  65%                 │
│                                                        │
│  ✅ Validating repository              (done)          │
│  ✅ Fetching commits (247 found)       (done)          │
│  🔄 Analyzing file diversity           (in progress)   │
│  ○  Checking commit message patterns   (waiting)       │
│  ○  Detecting timing anomalies         (waiting)       │
│  ○  Comparing author/committer dates   (waiting)       │
│  ○  Analyzing working hours            (waiting)       │
│  ○  Measuring code substance           (waiting)       │
│  ○  Checking weekend patterns          (waiting)       │
│  ○  Calculating authenticity score     (waiting)       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Page 3: Report Dashboard (`/report/[owner]-[repo]`) — Shareable URL

```
┌────────────────────────────────────────────────────────┐
│ [Demo Switcher: 🟢 Authentic Dev View | 🔴 Bot View]   │
├────────────────────────────────────────────────────────┤
│  🔍 Forensic Report: kuldeepofficial00/pulseops        │
│  📅 Scanned: Oct 22, 2026  │  🔗 Share  │  📋 Copy   │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │            AUTHENTICITY SCORE                    │  │
│  │                                                  │  │
│  │               ┌─────┐                            │  │
│  │            92 │/100 │  🟢 HIGH CONFIDENCE        │  │
│  │               └─────┘                            │  │
│  │     ✅ AUTHENTIC HUMAN DEVELOPMENT               │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│  │ Commits │ │ Authors │ │Duration │ │ Files   │    │
│  │   247   │ │    3    │ │279 days │ │   47    │    │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
│                                                        │
│  ── Signal Cards (Vibrant Hairline Rings & Lift) ──    │
│                                                        │
│  ┌─────────────────────┐ ┌─────────────────────────┐  │
│  │ ✅ File Diversity   │ │ ✅ Message Entropy      │  │
│  │ 47 files, 12 dirs   │ │ 89% unique messages     │  │
│  │ Penalty: 0          │ │ Penalty: 0              │  │
│  └─────────────────────┘ └─────────────────────────┘  │
│  ┌─────────────────────┐ ┌─────────────────────────┐  │
│  │ ✅ Time Regularity  │ │ ✅ Date Consistency     │  │
│  │ StdDev: 2847s       │ │ 2% mismatch             │  │
│  │ Penalty: 0          │ │ Penalty: 0              │  │
│  └─────────────────────┘ └─────────────────────────┘  │
│  ┌─────────────────────┐ ┌─────────────────────────┐  │
│  │ ✅ Working Hours    │ │ ✅ Code Substance       │  │
│  │ Peak: 2 PM          │ │ 12.8K+ lines changed    │  │
│  │ Penalty: 0          │ │ Penalty: 0              │  │
│  └─────────────────────┘ └─────────────────────────┘  │
│  ┌─────────────────────┐                               │
│  │ ✅ Weekend Pattern  │                               │
│  │ 22% weekend commits │                               │
│  │ Penalty: 0          │                               │
│  └─────────────────────┘                               │
│                                                        │
│  ── Charts ────────────────────────────────────────    │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │       24-Hour Commit Distribution (Bar Chart)    │  │
│  │  ▐                                               │  │
│  │  ▐    ▐                                          │  │
│  │  ▐  ▐ ▐ ▐                                       │  │
│  │  ▐  ▐ ▐ ▐ ▐ ▐                                   │  │
│  │  ▐ ▐▐ ▐ ▐ ▐ ▐ ▐ ▐                               │  │
│  │  0  3  6  9  12 15 18 21                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │     Weekday Distribution (Pie/Donut Chart)       │  │
│  │         Mon: 15% | Tue: 18% | ...                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ── GitHub Badge ──────────────────────────────────    │
│  Copy this to your README:                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [![Authenticity](git-forensics.app/badge/...)]   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 💰 Server Cost Breakdown

### Option A: 100% Free Tier (₹0/month) — Recommended for Portfolio

| Service | Provider | Free Tier Limits | Cost |
|---------|----------|-----------------|------|
| **Frontend** | Vercel | 100GB bandwidth, unlimited deploys | **₹0** |
| **Backend** | Render | 750 hours/month, spins down after 15min inactivity | **₹0** |
| **Database** | Neon PostgreSQL | 0.5GB storage, 190 compute hours/month | **₹0** |
| **Total** | | | **₹0/month** |

> [!TIP]
> **Render Free Tier Caveat:** Server "sleeps" after 15 min of no traffic. First request after sleep takes ~30 seconds to wake up. This is fine for a portfolio project.

### Option B: Always-On Budget ($5-7/month ≈ ₹420-580/month)

| Service | Provider | Plan | Cost |
|---------|----------|------|------|
| **Frontend** | Vercel | Free | ₹0 |
| **Backend** | Railway | Starter ($5 credit/month) | ~₹420 |
| **Database** | Railway (included) | PostgreSQL included | ₹0 (included) |
| **Total** | | | **~₹420/month** |

### Option C: Production-Ready ($15-25/month ≈ ₹1,250-2,080/month)

| Service | Provider | Plan | Cost |
|---------|----------|------|------|
| **Frontend** | Vercel | Free (or Pro ₹1,650 if needed) | ₹0 |
| **Backend** | Railway or Fly.io | Dedicated | ~₹500-830 |
| **Database** | Supabase Pro or Neon | Scaled | ~₹420-830 |
| **Redis Cache** | Upstash | Pay-as-you-go | ~₹80-200 |
| **Domain** | Any registrar | .app or .dev domain | ~₹830/year |
| **Total** | | | **~₹1,250-2,080/month** |

### Cost Comparison Summary:

| Plan | Monthly Cost | Best For |
|------|-------------|----------|
| **🟢 Free Tier** | ₹0 | Portfolio showcase, interviews, demo |
| **🟡 Budget** | ~₹420 | Always-on personal project |
| **🔴 Production** | ~₹1,250-2,080 | If it becomes a real product with users |

> [!IMPORTANT]
> **Recommendation:** Start with **Free Tier (₹0)**. It's more than enough for a portfolio project. You can upgrade later if it gets real users. **The 30-second cold start on Render is completely acceptable for demos.**

### GitHub API Cost: ₹0 (always free)

| Auth Level | Rate Limit | Enough for |
|------------|-----------|------------|
| No token | 60 req/hour | ~1 scan/hour |
| Personal Access Token | 5,000 req/hour | ~50 scans/hour |
| GitHub App | 15,000 req/hour | ~150 scans/hour |

**For V1:** Use a Personal Access Token (free, takes 2 min to create). Stored as `GITHUB_TOKEN` in `.env`.

---

## 🔐 Environment Variables

```env
# apps/api/.env
DATABASE_URL="postgresql://user:pass@host:5432/gitforensics"
GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"
PORT=3001
FRONTEND_URL="http://localhost:3000"

# apps/web/.env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

---

## 🛡️ Rate Limiting & Abuse Prevention

```typescript
// NestJS rate limiting (built-in @nestjs/throttler)
@Throttle({ default: { limit: 10, ttl: 60000 } })  // 10 scans per minute per IP
@Controller('scan')
export class ScanController { ... }
```

| Protection | Implementation |
|-----------|---------------|
| API rate limit | 10 scans/minute per IP |
| GitHub URL validation | Only accept `github.com` URLs |
| Private repo rejection | GitHub API returns 404 → we show "Repo not found or private" |
| Scan queue | Max 5 concurrent scans (prevent GitHub rate limit exhaustion) |
| Cache | Same repo not re-scanned within 24 hours |

---

## 🚀 Implementation Roadmap (22 Steps — UI-First Execution)

### Phase 1: Foundation & UI Prototype (Steps 1–6)
*Goal: Scaffold monorepo and build interactive Figma-grade UI with realistic dummy data.*

| Step | Task | Files |
|------|------|-------|
| 1 | Initialize monorepo (Turborepo + npm workspaces) | Root `package.json`, `turbo.json` |
| 2 | Set up shared types package | `packages/shared/types.ts`, `constants.ts` |
| 3 | Scaffold Next.js frontend with Tailwind CSS & Lucide | `apps/web/` |
| 4 | Create Vibrant Design System UI components & `mockData.ts` | `components/ui/`, `mockData.ts` |
| 5 | Build 3 Interactive Prototype Pages (`/`, `/scan/[id]`, `/report/[slug]` with Authentic vs Bot switcher) | `app/page.tsx`, `scan/`, `report/` |
| 6 | Set up NestJS backend skeleton & Prisma DB schema | `apps/api/`, `prisma/schema.prisma` |

### Phase 2: Backend Core (Steps 7–15)
*Goal: Build the GitHub API extractor, Bot filter, and 7 forensic signal detectors.*

| Step | Task | Files |
|------|------|-------|
| 7 | GitHub API service (fetch commits, files, stats with sampling) | `github.service.ts` |
| 8 | Bot filter service (exclude Dependabot, Renovate, Actions) | `bot-filter.service.ts` |
| 9 | Signal 1: File Diversity | `signals/fileDiversity.ts` |
| 10 | Signal 2: Message Entropy | `signals/messageEntropy.ts` |
| 11 | Signal 3: Time Regularity (Mechanical clock) | `signals/timeRegularity.ts` |
| 12 | Signal 4: Date Mismatch (Backdating check) | `signals/dateMismatch.ts` |
| 13 | Signal 5: Working Hours Distribution | `signals/workingHours.ts` |
| 14 | Signal 6: Code Diff Substance | `signals/codeDiff.ts` |
| 15 | Signal 7: Weekend Pattern | `signals/weekendPattern.ts` |

### Phase 3: Backend Assembly (Steps 16–18)
*Goal: Assemble signal orchestrator, scoring engine, background scan worker, and caching.*

| Step | Task | Files |
|------|------|-------|
| 16 | Forensics orchestrator (runs all 7 signals concurrently) | `forensics.service.ts` |
| 17 | Scorer service (calculates 0–100 score + verdict) | `scorer.service.ts` |
| 18 | Scan controller + service (POST `/api/scan`, GET `/api/scan/:id`, caching) | `scan.controller.ts`, `scan.service.ts` |

### Phase 4: Full-Stack Integration (Steps 19–21)
*Goal: Connect the prototype frontend to the live NestJS API.*

| Step | Task | Files |
|------|------|-------|
| 19 | Connect search bar & scanning progress to live NestJS API polling | `apps/web/lib/api.ts`, `ScanProgress.tsx` |
| 20 | Wire live report data into ScoreGauge, SignalCards, and Charts | `app/report/[slug]/page.tsx` |
| 21 | Add error handling (invalid URL, private repo, rate limits) | Error toast & banners |

### Phase 5: Polish & Deployment (Step 22)

| Step | Task |
|------|------|
| 22 | Shareable URLs, GitHub badge generator, mobile responsive, README, deploy |

---

## 🤖 Phase 6: Advanced AI Synthetic Commit Detection (Steps 23–26)

### The Problem: Sophisticated AI-Generated Backdated Repositories
Traditional streak detectors assume scripts are simplistic (committing to `streak.txt` with duplicate messages and 2-second intervals). However, modern LLM-assisted backdating scripts can generate:
- 60+ modular source code files (bypassing File Diversity)
- 80+ unique Conventional Commits (bypassing Message Entropy)
- Timestamps spaced across 118 calendar days (bypassing naive same-day time regularity)
- Matched `GIT_AUTHOR_DATE` and `GIT_COMMITTER_DATE` down to the millisecond (bypassing basic author-committer drift)

### The Solution: Two Mathematical Smoking Guns
1. **Signal 3 Upgrade — Quantized Clock Detection (Zero-Second & Round-Minute Heuristic):**
   - Natural human commits have randomly distributed seconds ($P(\text{second} = 0) \approx 1.67\%$).
   - AI scripts generate formatted strings with round seconds (`:00`) and round 5-minute boundaries (`:00, :05, :10, :15, ...`).
   - If total commits $\ge 15$ and $>40\%$ commits have `:00` seconds (or $>70\%$ on 5-min multiples):
     - **ALERT (-30 pts)**: `Synthetic AI clock rhythm detected: XX% of commits quantized to exact :00s`
   - If $>20\%$ commits have `:00` seconds:
     - **WARNING (-15 pts)**: `Unnatural timestamp rounding: XX% of commits on exact :00s`

2. **Signal 4 Upgrade — Repository Creation Drift (Time-Travel Paradox):**
   - Compares the earliest commit timestamp against GitHub's `created_at` timestamp.
   - **Compound Detection:** If $>50\%$ of commits predate the GitHub repository's creation by $>30$ days **AND** exhibit synthetic clock quantization (or were uploaded in a single rapid batch-push):
     - **ALERT (-20 pts)**: `Batch-backdated history: Commits predate GitHub repo creation by XX days with synthetic clock simulation`
   - If commits predate GitHub creation but have normal random human seconds:
     - **INFO (0 pts)**: `Historical import: Repository contains commits predating GitHub creation, consistent with local or external git migration.`

3. **Orchestrator & Invalidation Updates:**
   - Add `{ force: true }` parameter to `POST /api/scan` to bypass the 24-hour cache when users click "Re-analyze".
   - Pass GitHub repository `created_at` and `pushed_at` metadata into `analyzeDateMismatch`.
   - Invalidate cached 100/100 score for `developertdsl-prog/finvault-treasury` to verify that its score drops to SUSPICIOUS (<60/100).

### Implementation Roadmap (Steps 23–26):

| Step | Task | Target Files |
|------|------|--------------|
| 23 | Implement Quantized Zero-Second Clock Heuristic in Signal 3 | `apps/api/src/forensics/signals/timeRegularity.ts` |
| 24 | Implement Compound Repo Creation Drift in Signal 4 & pass repo metadata | `apps/api/src/forensics/signals/dateMismatch.ts`, `forensics.service.ts` |
| 25 | Add force cache-bypass to API and wire frontend Re-analyze button | `apps/api/src/scan/scan.service.ts`, `apps/web/app/report/[slug]/page.tsx` |
| 26 | Invalidate old Neon DB record, re-scan `finvault-treasury`, and verify drop to SUSPICIOUS | Neon PostgreSQL, Live Verification |

---

## 🛰️ Phase 7: Server-Side Push Event Integrity & Code Churn Realism (Steps 27–30)

### Motivation & Tamper-Proof Architecture
Git commit timestamps (`GIT_AUTHOR_DATE`, `GIT_COMMITTER_DATE`) are client-side variables that can be modified with environment variables. In contrast, GitHub's server-side event logs (`GET /repos/{owner}/{repo}/events`) record `PushEvent.created_at` generated directly on GitHub's secure datacenter servers.

### The 2 Core Enhancements:
1. **Signal 8: Server-Side Push Event & Log Integrity (`github_push`):**
   - Cross-checks whether commits were pushed organically over the claimed development timeline or ingested in a single massive `PushEvent`.
   - **Single Batch Ingestion (ALERT, -15 pts):** Commits spanning weeks/months uploaded in 1 push event.
   - **Organic Incremental Delivery (PASS, 0 pts):** Verified multiple distinct `PushEvent` timestamps distributed over days/weeks matching commit timestamps.
   - **Historical Grace Window (INFO, 0 pts):** For older repos whose events aged past GitHub's 90-day retention window.
2. **Signal 6 Upgrade: Code Churn & Refactoring Realism (`codeDiff`):**
   - Natural human engineering features refactoring and dead code removal ($15\% - 40\%$ deletions).
   - AI bot repos that generate green streaks are purely additive ($>98\%$ additions, $<2\%$ deletions).
   - If total commits $\ge 25$, additions $>1,500$, and deletions are $< 3\%$, flag as **WARNING (-10 pts)**.

### Implementation Roadmap (Steps 27–30):

| Step | Task | Target Files |
|------|------|--------------|
| 27 | Implement GitHub PushEvents fetcher in GitHub service | `apps/api/src/github/github.service.ts` |
| 28 | Implement Signal 8 (`serverEvents.ts`) & upgrade Signal 6 (`codeDiff.ts`) | `apps/api/src/forensics/signals/serverEvents.ts`, `codeDiff.ts` |
| 29 | Wire Signal 8 into Forensics orchestrator, Scan service, and Web UI | `apps/api/src/forensics/forensics.service.ts`, `apps/web/` |
| 30 | Re-scan `finvault-treasury`, test 8-signal UI rendering, and commit | Full stack verification |

---

## 🚀 Phase 8: Multi-Tenant GitHub OAuth & Rate-Limit Elimination (Steps 31–34)

### The Vision: True Open-Source Multi-Tenant Scale
Instead of sharing a single server IP quota (which is capped at 60 unauthenticated requests/hour), GitForensics integrates **"Sign in with GitHub" (OAuth)**. Every visitor who signs in brings their own personal **5,000 requests/hour** quota directly from GitHub.
- **1,000 signed-in users = 5,000,000 requests/hour.**
- Zero server IP rate limits.
- Zero copy-pasting of tokens required by visitors.
- Strictly requests `read:user` scope (zero access to private code, guaranteeing 100% user trust).

### Technical Flow:
1. **Frontend Authentication (`apps/web`):** Built-in Next.js 15 OAuth handlers (`/api/auth/github`, `/api/auth/callback/github`, `/api/auth/me`, `/api/auth/logout`) with encrypted HTTP-only session cookies.
2. **Auth Context & Navbar Pill (`apps/web`):** `AuthContext` provides user state. Navbar renders a sleek `"Sign in with GitHub"` button when logged out, and user avatar + `"5,000 Quota Active"` pill when logged in.
3. **Token Forwarding (`apps/web/lib/api.ts`):** Client passes user's GitHub token in `Authorization: Bearer <token>` on `POST /api/scan`.
4. **Backend Prioritization (`apps/api`):** NestJS backend extracts `userToken` and uses it for all GitHub API requests during that scan.

### Implementation Roadmap (Steps 31–34):

| Step | Task | Target Files |
|------|------|--------------|
| 31 | Implement Next.js 15 GitHub OAuth route handlers (`github`, `callback`, `me`, `logout`) | `apps/web/app/api/auth/` |
| 32 | Build AuthContext, Session Provider, and Navbar Sign-In UI | `apps/web/context/AuthContext.tsx`, `Navbar.tsx` |
| 33 | Forward user OAuth token from frontend and prioritize in backend GitHubService | `apps/web/lib/api.ts`, `apps/api/src/scan/`, `github.service.ts` |
| 34 | Verify full multi-tenant flow, test fallback on rate-limit screen, and commit | Full stack verification |

---

## ✅ V1 Feature Checklist

| Feature | Included |
|---------|----------|
| Scan any public GitHub repo by URL | ✅ |
| 8 forensic signal analysis (7 Client-Side + 1 GitHub Server Log) | ✅ |
| Authenticity score (0-100) | ✅ |
| Bot author auto-exclusion | ✅ |
| Interactive charts (hours, weekdays) | ✅ |
| Signal cards with pass/fail/warning | ✅ |
| Shareable report URL | ✅ |
| Cached reports (48h) | ✅ |
| Rate limiting resilience | ✅ |
| Mobile responsive | ✅ |
| Recent scans on landing page | ✅ |
| GitHub badge for README | ✅ |
| Dark mode | ✅ (Vibrant Design System) |
| Interactive Figma-style Demo Switcher | ✅ |
| GitHub OAuth login ("Sign in with GitHub" - 5k req/hr/user) | ✅ (Phase 8) |
| Private repo scanning | ❌ (V2) |
| Profile-level analysis | ❌ (V2) |
| Compare two repos | ❌ (V2) |
