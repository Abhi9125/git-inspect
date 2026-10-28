'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, ArrowUpRight, Activity } from 'lucide-react';
import { RECENT_SCANS } from '../lib/mockData';
import { getRecentScans } from '../lib/api';

interface ScanItem {
  owner: string;
  repo: string;
  score: number;
  verdict: 'AUTHENTIC' | 'MIXED' | 'SUSPICIOUS';
  stars: number | string;
  timeAgo: string;
  language: string;
  isLive?: boolean;
}

export default function RecentScans() {
  const [scans, setScans] = useState<ScanItem[]>(RECENT_SCANS);
  const [hasLive, setHasLive] = useState(false);

  useEffect(() => {
    getRecentScans()
      .then((liveScans) => {
        if (liveScans && liveScans.length > 0) {
          const formattedLive: ScanItem[] = liveScans.map((s: any) => ({
            owner: s.owner,
            repo: s.repo,
            score: s.score,
            verdict: s.verdict || (s.score >= 75 ? 'AUTHENTIC' : s.score >= 50 ? 'MIXED' : 'SUSPICIOUS'),
            stars: s.stars,
            timeAgo: s.timeAgo || 'Recently',
            language: s.language || 'Code',
            isLive: true,
          }));

          // Merge live scans at front, followed by unique showcase scans
          const existingKeys = new Set(formattedLive.map((item) => `${item.owner}/${item.repo}`));
          const remainingDemo = RECENT_SCANS.filter(
            (item) => !existingKeys.has(`${item.owner}/${item.repo}`)
          );

          setScans([...formattedLive, ...remainingDemo].slice(0, 6));
          setHasLive(true);
        }
      })
      .catch(() => {
        // Fallback to initial mock list
      });
  }, []);

  return (
    <div className="mt-16 sm:mt-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-white">
              Recent Forensic Scans
            </h2>
            {hasLive && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-authentic bg-authentic/10 px-2 py-0.5 rounded-full ring-1 ring-authentic/30">
                <span className="size-1.5 rounded-full bg-authentic animate-pulse" />
                Live Sync
              </span>
            )}
          </div>
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
        {scans.map((scan) => {
          const isAuthentic = scan.verdict === 'AUTHENTIC';
          const isMixed = scan.verdict === 'MIXED';
          const href = scan.isLive
            ? `/report/${encodeURIComponent(scan.owner)}--${encodeURIComponent(scan.repo)}`
            : '/report/demo';

          return (
            <Link
              key={`${scan.owner}/${scan.repo}`}
              href={href}
              className="vibrant-card group relative overflow-hidden rounded-xl bg-dark-card ring-1 ring-dark-border hover:ring-vibrant/40 p-4 shadow-sm transition-all"
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
                      : isMixed
                      ? 'bg-warning/10 text-warning ring-warning/30'
                      : 'bg-danger/10 text-danger ring-danger/30'
                  }`}
                >
                  <span>{scan.score}/100</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-dark-border/50 pt-3 text-[11px] text-dark-muted font-mono">
                <span className="flex items-center gap-1.5">
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
  );
}
