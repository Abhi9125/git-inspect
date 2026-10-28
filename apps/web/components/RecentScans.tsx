'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, ShieldCheck, History } from 'lucide-react';
import { getRecentScans, getUserScans } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface ScanItem {
  owner: string;
  repo: string;
  score: number;
  verdict: 'AUTHENTIC' | 'MIXED' | 'SUSPICIOUS';
  stars: number | string;
  timeAgo: string;
  language: string;
}

export default function RecentScans() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (isAuthenticated && user?.login) {
      // User is logged in: Fetch strict personal scan history
      getUserScans(user.login)
        .then((userScans) => {
          if (!isMounted) return;
          const formatted: ScanItem[] = (userScans || []).map((s: any) => ({
            owner: s.owner,
            repo: s.repo,
            score: s.score,
            verdict: s.verdict || (s.score >= 75 ? 'AUTHENTIC' : s.score >= 50 ? 'MIXED' : 'SUSPICIOUS'),
            stars: s.stars,
            timeAgo: s.timeAgo || 'Recently',
            language: s.language || 'Code',
          }));
          setScans(formatted);
          setHasLoaded(true);
        })
        .catch(() => {
          if (isMounted) {
            setScans([]);
            setHasLoaded(true);
          }
        });
    } else if (!isLoading) {
      // Guest: Fetch public recent database scans
      getRecentScans()
        .then((liveScans) => {
          if (!isMounted) return;
          if (liveScans && liveScans.length > 0) {
            const formattedLive: ScanItem[] = liveScans.map((s: any) => ({
              owner: s.owner,
              repo: s.repo,
              score: s.score,
              verdict: s.verdict || (s.score >= 75 ? 'AUTHENTIC' : s.score >= 50 ? 'MIXED' : 'SUSPICIOUS'),
              stars: s.stars,
              timeAgo: s.timeAgo || 'Recently',
              language: s.language || 'Code',
            }));
            setScans(formattedLive.slice(0, 6));
          } else {
            setScans([]);
          }
          setHasLoaded(true);
        })
        .catch(() => {
          if (isMounted) {
            setScans([]);
            setHasLoaded(true);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.login, isLoading]);

  return (
    <div className="mt-16 sm:mt-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <History className="size-4 text-vibrant" />
                <h2 className="text-lg font-bold tracking-tight text-white">
                  My Audit History
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-vibrant bg-vibrant/10 px-2 py-0.5 rounded-full ring-1 ring-vibrant/30">
                  @{user?.login}
                </span>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold tracking-tight text-white">
                  Recent Forensic Scans
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-authentic bg-authentic/10 px-2 py-0.5 rounded-full ring-1 ring-authentic/30">
                  <span className="size-1.5 rounded-full bg-authentic animate-pulse" />
                  Live Sync
                </span>
              </>
            )}
          </div>
          <p className="text-[12px] text-dark-muted mt-0.5">
            {isAuthenticated
              ? `Audits conducted using your personal 5,000 req/hr GitHub developer quota`
              : 'Live repositories analyzed and verified by our detection engine'}
          </p>
        </div>
      </div>

      {hasLoaded && scans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-dark-border bg-dark-card/40 p-8 text-center backdrop-blur-sm">
          <ShieldCheck className="mx-auto size-8 text-dark-muted mb-2.5 opacity-60" />
          <h3 className="text-sm font-semibold text-white">
            {isAuthenticated ? 'No Personal Audits Yet' : 'No Public Audits Yet'}
          </h3>
          <p className="text-[12px] text-dark-muted mt-1 max-w-sm mx-auto">
            {isAuthenticated
              ? 'You are signed in with your personal GitHub quota. Paste any public repository URL above to generate your first forensic report!'
              : 'Be the first to inspect a GitHub repository. Paste any public repository URL above to run the first forensic audit!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {scans.map((scan) => {
            const isAuthentic = scan.verdict === 'AUTHENTIC';
            const isMixed = scan.verdict === 'MIXED';
            const href = `/report/${encodeURIComponent(scan.owner)}--${encodeURIComponent(scan.repo)}`;

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
      )}
    </div>
  );
}