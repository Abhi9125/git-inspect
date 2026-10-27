import Link from 'next/link';
import { ShieldCheck, GitFork, Star, ArrowUpRight, Cpu, FileCode2, Clock, CalendarDays, Terminal } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import { RECENT_SCANS } from '../lib/mockData';

export default function HomePage() {
  return (
    <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-12 md:py-20">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium bg-vibrant/10 text-vibrant ring-1 ring-vibrant/25 backdrop-blur-sm">
          <Terminal className="size-3" />
          <span>7-Signal Git History Forensics</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white">
          Detect Spoofed & Bot{' '}
          <span className="bg-gradient-to-r from-vibrant to-blue-400 bg-clip-text text-transparent">
            GitHub Commits
          </span>
        </h1>

        <p className="text-[15px] sm:text-[16px] text-dark-muted max-w-2xl mx-auto leading-relaxed">
          Analyze commit cadence, entropy, time intervals, author certificate drift, and file diversity to determine if repository history was built by a genuine developer.
        </p>
      </div>

      {/* Floating Search Bar */}
      <div className="mt-10">
        <SearchBar />
      </div>

      {/* Recent Scans Bento Grid (Vibrant Style) */}
      <div className="mt-16 sm:mt-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">
              Recent Forensic Scans
            </h2>
            <p className="text-[12px] text-dark-muted">
              Live sample repositories analyzed by our detection engine
            </p>
          </div>
          <Link
            href="/report/demo"
            className="text-[12px] font-medium text-vibrant hover:text-vibrant-hover flex items-center gap-1"
          >
            Open Interactive Demo <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {RECENT_SCANS.map((scan) => {
            const isAuthentic = scan.verdict === 'AUTHENTIC';
            return (
              <Link
                key={`${scan.owner}/${scan.repo}`}
                href="/report/demo"
                className="vibrant-card group relative overflow-hidden rounded-xl bg-dark-card ring-1 ring-dark-border hover:ring-vibrant/40 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-mono text-dark-muted block truncate">
                      {scan.owner}
                    </span>
                    <h3 className="text-[15px] font-semibold text-white tracking-tight group-hover:text-vibrant transition-colors truncate">
                      {scan.repo}
                    </h3>
                  </div>

                  {/* Score Pill */}
                  <div
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold ring-1 flex items-center gap-1.5 ${
                      isAuthentic
                        ? 'bg-authentic/10 text-authentic ring-authentic/30'
                        : 'bg-danger/10 text-danger ring-danger/30'
                    }`}
                  >
                    <span>{scan.score}/100</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-dark-border/50 pt-3 text-[11px] text-dark-muted font-mono">
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-vibrant" />
                    {scan.language}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Star className="size-3 text-amber-400" />
                      {scan.stars}
                    </span>
                    <span>{scan.timeAgo}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 7 Signals Preview Grid */}
      <div className="mt-20 border-t border-dark-border/60 pt-12">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-xl font-bold tracking-tight text-white">
            How The 7 Signals Work
          </h2>
          <p className="text-[13px] text-dark-muted mt-1">
            Zero dependencies. Zero heuristics guesswork. Pure statistical git analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="vibrant-card rounded-xl bg-dark-card p-5 ring-1 ring-dark-border">
            <FileCode2 className="size-5 text-vibrant mb-3" />
            <h4 className="text-[14px] font-semibold text-white">File Diversity</h4>
            <p className="text-[12px] text-dark-muted mt-1 leading-relaxed">
              Detects repos where 50+ commits touch only a single dummy text file, flagging bot activity graphs.
            </p>
          </div>

          <div className="vibrant-card rounded-xl bg-dark-card p-5 ring-1 ring-dark-border">
            <Clock className="size-5 text-vibrant mb-3" />
            <h4 className="text-[14px] font-semibold text-white">Mechanical Clock Detection</h4>
            <p className="text-[12px] text-dark-muted mt-1 leading-relaxed">
              Measures standard deviation between same-day commits. Scripts generate rigid intervals (std-dev &lt; 5s).
            </p>
          </div>

          <div className="vibrant-card rounded-xl bg-dark-card p-5 ring-1 ring-dark-border">
            <Cpu className="size-5 text-vibrant mb-3" />
            <h4 className="text-[14px] font-semibold text-white">Message Entropy</h4>
            <p className="text-[12px] text-dark-muted mt-1 leading-relaxed">
              Scores uniqueness and conventional commit adherence. Penalizes repositories with repetitive template commits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
