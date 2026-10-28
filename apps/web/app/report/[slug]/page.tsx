'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  RotateCcw,
  AlertTriangle,
  Play,
  Loader2,
} from 'lucide-react';
import ReportHeader from '../../../components/ReportHeader';
import ScoreGauge from '../../../components/ScoreGauge';
import SignalCard from '../../../components/SignalCard';
import HourChart from '../../../components/HourChart';
import WeekdayChart from '../../../components/WeekdayChart';
import { getReportByRepo, startScan } from '../../../lib/api';
import { ForensicReport } from '@git-forensics/shared';
import { useAuth } from '../../../context/AuthContext';

export default function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const slug = decodeURIComponent(resolvedParams.slug);

  // Real report state
  const [report, setReport] = useState<ForensicReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Parse owner and repo
  let owner = '';
  let repo = '';
  if (slug.includes('--')) {
    const parts = slug.split('--');
    owner = parts[0];
    repo = parts.slice(1).join('--');
  } else if (slug.includes('/')) {
    const parts = slug.split('/');
    owner = parts[0];
    repo = parts[1];
  } else {
    owner = slug;
  }

  useEffect(() => {
    if (!owner || !repo) {
      setError(`Invalid repository format "${slug}". Expected "owner--repo" or "owner/repo".`);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getReportByRepo(owner, repo)
      .then((data) => {
        if (isMounted) {
          setReport(data);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err.message || `No forensic report found for ${owner}/${repo}`);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [owner, repo, slug]);

  const { token, user } = useAuth();

  const handleStartScanNow = async () => {
    if (!owner || !repo) return;
    try {
      setIsScanning(true);
      const res = await startScan(
        `https://github.com/${owner}/${repo}`,
        true,
        token || undefined,
        user?.login || undefined,
      );
      router.push(`/scan/${res.scanId}`);
    } catch (err: any) {
      setIsScanning(false);
      setError(err.message || 'Failed to trigger scan.');
    }
  };

  // 1. LOADING SKELETON
  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-dark-muted hover:text-white transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Analyze Another Repository</span>
          </Link>
        </div>

        <div className="rounded-2xl bg-dark-card ring-1 ring-dark-border p-8 text-center space-y-4">
          <Loader2 className="size-8 text-vibrant animate-spin mx-auto" />
          <div>
            <h3 className="text-base font-semibold text-white">
              Loading Forensic Analysis...
            </h3>
            <p className="text-[12px] text-dark-muted mt-1 font-mono">
              Retrieving cryptographic commit metrics for {owner}/{repo}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. ERROR STATE / NOT SCANNED YET
  if (error || !report) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24 text-center">
        <div className="rounded-2xl bg-dark-card ring-1 ring-dark-border p-8 shadow-2xl space-y-6">
          <div className="inline-flex size-12 items-center justify-center rounded-xl bg-danger/10 text-danger ring-1 ring-danger/30 mx-auto">
            <AlertTriangle className="size-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Report Not Available
            </h2>
            <p className="text-[14px] text-dark-muted max-w-md mx-auto">
              {error || `No completed analysis found for ${owner}/${repo}. It may not have been scanned yet.`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {owner && repo && (
              <button
                type="button"
                onClick={handleStartScanNow}
                disabled={isScanning}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-vibrant px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-vibrant-hover shadow-vibrant-glow transition-all disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Queuing Scan...</span>
                  </>
                ) : (
                  <>
                    <Play className="size-4" />
                    <span>Scan {owner}/{repo} Now</span>
                  </>
                )}
              </button>
            )}

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-dark-bg px-4 py-2.5 text-[13px] font-medium text-dark-muted hover:text-white ring-1 ring-dark-border hover:ring-white/20 transition-all"
            >
              <ArrowLeft className="size-4" />
              <span>Back Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. REAL REPORT RENDER
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-dark-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Analyze Another Repository</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleStartScanNow}
            disabled={isScanning}
            className="inline-flex items-center gap-1.5 rounded-lg bg-vibrant/10 px-3 py-1.5 text-[12px] font-medium text-vibrant ring-1 ring-vibrant/30 hover:bg-vibrant/20 transition-all disabled:opacity-50"
          >
            {isScanning ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RotateCcw className="size-3.5" />
            )}
            <span>Re-analyze</span>
          </button>
        </div>
      </div>

      {/* Main Report Header (Stats Ribbon, Repo Title, Badge copy) */}
      <ReportHeader report={report} />

      {/* Authenticity Score Gauge Card */}
      <ScoreGauge
        score={report.score}
        verdict={report.verdict}
        confidence={report.confidence}
        verdictTitle={report.verdictTitle}
        verdictDescription={report.verdictDescription}
      />

      {/* Forensic Signals Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-white">
              Forensic Signal Analysis
            </h3>
            <p className="text-[12px] text-dark-muted">
              Deep inspection across {report.signals.length} behavioral & server-log dimensions
            </p>
          </div>
          <span className="text-[11px] font-mono text-dark-muted">
            {report.signals.filter((s) => s.status === 'PASS').length}/{report.signals.length} Signals Cleared
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.signals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      </div>

      {/* Visual Analytics Grid: 24-hr & Weekday Charts */}
      <div>
        <h3 className="text-lg font-bold tracking-tight text-white mb-4">
          Chronological Patterns & Behavior
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HourChart data={report.hourDistribution} />
          <WeekdayChart data={report.weekdayDistribution} />
        </div>
      </div>

      {/* Bottom CTA to scan another repo */}
      <div className="rounded-xl bg-dark-card border border-dark-border p-6 text-center space-y-3">
        <h4 className="text-base font-semibold text-white">
          Want to verify another GitHub repository?
        </h4>
        <p className="text-[13px] text-dark-muted max-w-md mx-auto">
          Test any open-source repo, personal project, or suspected fake activity graph in seconds.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg bg-vibrant px-4 py-2 text-[13px] font-medium text-white hover:bg-vibrant-hover shadow-vibrant-glow transition-all"
        >
          <RotateCcw className="size-3.5" />
          <span>Scan New Repo</span>
        </Link>
      </div>
    </div>
  );
}