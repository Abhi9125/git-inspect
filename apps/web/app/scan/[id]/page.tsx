'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Loader2,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  Github,
} from 'lucide-react';
import { pollScanStatus, startScan } from '../../../lib/api';
import { ScanProgressState } from '@git-forensics/shared';
import { useAuth } from '../../../context/AuthContext';

const SCAN_STEPS = [
  { id: 'validate', label: 'Validating repository on GitHub' },
  { id: 'fetch_commits', label: 'Extracting commit trees and timeline' },
  { id: 'sample_files', label: 'Sampling file diversity & code delta' },
  { id: 'entropy', label: 'Analyzing commit message entropy' },
  { id: 'timing', label: 'Detecting mechanical clock & timing intervals' },
  { id: 'dates', label: 'Verifying author vs committer certificate dates' },
  { id: 'events', label: 'Auditing GitHub datacenter PushEvent logs' },
  { id: 'score', label: 'Computing authenticity score & forensic verdict' },
];

export default function ScanProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const scanId = decodeURIComponent(resolvedParams.id);
  const { user, token, isAuthenticated, login } = useAuth();

  const [scanState, setScanState] = useState<ScanProgressState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResuming, setIsResuming] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    // Check if it's a real backend scan ID (starts with scan_)
    const isRealScanId = scanId.startsWith('scan_');

    const poll = async () => {
      try {
        if (isRealScanId) {
          const data = await pollScanStatus(scanId);
          setScanState(data);

          if (data.status === 'COMPLETED' && data.owner && data.repo) {
            clearInterval(interval);
            setTimeout(() => {
              router.push(`/report/${encodeURIComponent(data.owner)}--${encodeURIComponent(data.repo)}`);
            }, 1200);
          } else if (data.status === 'FAILED') {
            clearInterval(interval);
            setError(data.error || 'Repository analysis failed.');
          }
        } else {
          // Graceful fallback for mock slugs (e.g. facebook--react)
          clearInterval(interval);
          setTimeout(() => {
            router.push('/report/demo');
          }, 1500);
        }
      } catch (err: any) {
        setError(err.message || 'Failed connecting to forensic scanning engine.');
        clearInterval(interval);
      }
    };

    poll();
    interval = setInterval(poll, 1500);

    return () => clearInterval(interval);
  }, [scanId, router]);

  const isRateLimited = !!error && (
    error.toLowerCase().includes('rate limit') ||
    error.toLowerCase().includes('403') ||
    error.toLowerCase().includes('secondary rate')
  );

  // Auto-resume scan if user logs in after rate limit halt
  useEffect(() => {
    if (token && error && isRateLimited && scanState?.repoUrl && !isResuming) {
      setIsResuming(true);
      startScan(scanState.repoUrl, true, token, user?.login)
        .then((newScan) => {
          router.replace(`/scan/${encodeURIComponent(newScan.scanId)}`);
        })
        .catch((err) => {
          setError(err.message || 'Auto-resume scan failed.');
          setIsResuming(false);
        });
    }
  }, [token, error, isRateLimited, scanState?.repoUrl, isResuming, user?.login, router]);

  const handleManualResume = async () => {
    if (!scanState?.repoUrl) return;
    setIsResuming(true);
    try {
      const newScan = await startScan(scanState.repoUrl, true, token || undefined, user?.login);
      router.replace(`/scan/${encodeURIComponent(newScan.scanId)}`);
    } catch (err: any) {
      setError(err.message || 'Resume failed.');
      setIsResuming(false);
    }
  };

  const progressPercent = scanState ? scanState.progressPercent : 20;
  const currentMessage = scanState
    ? scanState.currentStepMessage
    : 'Connecting to forensic audit engine...';
  const completedSteps = scanState ? scanState.completedSteps : [];
  const isDone = scanState?.status === 'COMPLETED';
  const displayName = scanState ? `${scanState.owner}/${scanState.repo}` : scanId.replace('--', '/');

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="rounded-2xl bg-dark-card ring-1 ring-dark-border p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Shimmer top border line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-vibrant to-transparent" />

        <div className="flex items-center justify-between border-b border-dark-border pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-vibrant/10 ring-1 ring-vibrant/30">
              <ShieldCheck className="size-5 text-vibrant" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-dark-muted uppercase tracking-wider">
                Forensic Scan In Progress
              </span>
              <h2 className="text-lg font-bold text-white font-mono tracking-tight">
                {displayName}
              </h2>
            </div>
          </div>

          <div className="font-mono text-xl font-extrabold text-vibrant">
            {progressPercent}%
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="relative h-2 w-full rounded-full bg-dark-bg ring-1 ring-white/5 overflow-hidden mb-8">
          <div
            className="h-full bg-vibrant transition-all duration-500 rounded-full shadow-vibrant-glow"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Error Display */}
        {error ? (
          <div className="space-y-4">
            {isRateLimited ? (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-5 text-[13px] text-amber-200">
                <div className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                    <Sparkles className="size-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-300 text-[14px]">
                      GitHub Anonymous Rate Limit Reached
                    </h4>
                    <p className="mt-1 text-amber-200/80 leading-relaxed text-[12px]">
                      GitHub limits anonymous guest scans to 60 requests/hr. Sign in with GitHub to immediately unlock your personal 5,000 req/hr quota and finish analyzing <strong className="text-white font-mono">{displayName}</strong>.
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {!isAuthenticated ? (
                        <button
                          onClick={() => login(`/scan/${encodeURIComponent(scanId)}`)}
                          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-[12px] font-semibold text-black hover:bg-neutral-200 shadow-md transition-all active:scale-95"
                        >
                          <Github className="size-4" />
                          <span>Sign in with GitHub & Resume Scan</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleManualResume}
                          disabled={isResuming}
                          className="inline-flex items-center gap-2 rounded-lg bg-vibrant px-4 py-2 text-[12px] font-semibold text-white hover:bg-vibrant-hover shadow-vibrant-glow transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isResuming ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Zap className="size-4" />
                          )}
                          <span>Resume Scan with 5,000 Quota</span>
                        </button>
                      )}

                      <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-dark-bg px-3 py-2 text-[12px] font-medium text-dark-muted hover:text-white ring-1 ring-dark-border transition-all"
                      >
                        <RotateCcw className="size-3" />
                        <span>Cancel</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-danger/10 border border-danger/30 p-4 text-[13px] text-danger flex items-start gap-3">
                <AlertTriangle className="size-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-danger">Forensic Analysis Halted</h4>
                  <p className="mt-1 text-danger/80">{error}</p>
                </div>
              </div>
            )}

            {!isRateLimited && (
              <div className="flex justify-end gap-3 pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-dark-bg px-4 py-2 text-[13px] font-medium text-white ring-1 ring-dark-border hover:ring-white/20 transition-all"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Try Another Repo</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* Step List */
          <div className="space-y-3">
            {SCAN_STEPS.map((step, idx) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent =
                !isCompleted &&
                (completedSteps.length === idx || (idx === 0 && completedSteps.length === 0));

              return (
                <div
                  key={step.id}
                  className={`flex items-center justify-between rounded-lg px-3.5 py-2.5 text-[13px] transition-all ${
                    isCurrent && !isDone
                      ? 'bg-vibrant/10 ring-1 ring-vibrant/30 text-white font-medium'
                      : isCompleted
                      ? 'text-white/80'
                      : 'text-dark-muted/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isCompleted ? (
                      <CheckCircle2 className="size-4 text-authentic shrink-0" />
                    ) : isCurrent && !isDone ? (
                      <Loader2 className="size-4 text-vibrant animate-spin shrink-0" />
                    ) : (
                      <div className="size-4 rounded-full border border-dark-border shrink-0" />
                    )}
                    <span>{step.label}</span>
                  </div>

                  <span className="font-mono text-[11px] text-dark-muted">
                    {isCompleted ? 'Done' : isCurrent && !isDone ? 'Analyzing...' : 'Waiting'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Finish CTA */}
        {isDone && scanState?.owner && scanState?.repo && (
          <div className="mt-8 border-t border-dark-border pt-5 flex items-center justify-between">
            <span className="text-[13px] text-authentic font-medium flex items-center gap-1.5">
              <CheckCircle2 className="size-4" /> Audit complete! Redirecting...
            </span>
            <Link
              href={`/report/${encodeURIComponent(scanState.owner)}--${encodeURIComponent(scanState.repo)}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-vibrant px-4 py-2 text-[13px] font-medium text-white hover:bg-vibrant-hover shadow-vibrant-glow transition-all"
            >
              <span>View Full Report</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
