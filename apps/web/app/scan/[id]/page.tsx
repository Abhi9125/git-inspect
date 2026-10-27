'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

const SCAN_STEPS = [
  { id: 'validate', label: 'Validating repository on GitHub', duration: 1200 },
  { id: 'fetch_commits', label: 'Fetching commit trees and pagination', duration: 1400 },
  { id: 'sample_files', label: 'Extracting file diversity & stats', duration: 1600 },
  { id: 'entropy', label: 'Analyzing commit message entropy', duration: 1200 },
  { id: 'timing', label: 'Detecting mechanical clock & timing intervals', duration: 1400 },
  { id: 'dates', label: 'Verifying author vs committer certificate dates', duration: 1200 },
  { id: 'score', label: 'Computing authenticity score & forensic verdict', duration: 1000 }
];

export default function ScanProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const repoName = decodeURIComponent(resolvedParams.id).replace('--', '/');

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (currentStepIndex < SCAN_STEPS.length) {
      timeout = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, SCAN_STEPS[currentStepIndex].id]);
        setCurrentStepIndex((prev) => prev + 1);
      }, SCAN_STEPS[currentStepIndex].duration);
    } else {
      setIsDone(true);
      // Auto-navigate to report after 1.5 seconds
      const finishTimeout = setTimeout(() => {
        router.push('/report/demo');
      }, 1500);
      return () => clearTimeout(finishTimeout);
    }

    return () => clearTimeout(timeout);
  }, [currentStepIndex, router]);

  const progressPercent = Math.min(
    Math.round((completedSteps.length / SCAN_STEPS.length) * 100),
    100
  );

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
                {repoName}
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
            className="h-full bg-vibrant transition-all duration-300 rounded-full shadow-vibrant-glow"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step List */}
        <div className="space-y-3">
          {SCAN_STEPS.map((step, idx) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStepIndex === idx && !isDone;

            return (
              <div
                key={step.id}
                className={`flex items-center justify-between rounded-lg px-3.5 py-2.5 text-[13px] transition-all ${
                  isCurrent
                    ? 'bg-vibrant/10 ring-1 ring-vibrant/30 text-white font-medium'
                    : isCompleted
                    ? 'text-white/80'
                    : 'text-dark-muted/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isCompleted ? (
                    <CheckCircle2 className="size-4 text-authentic shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="size-4 text-vibrant animate-spin shrink-0" />
                  ) : (
                    <div className="size-4 rounded-full border border-dark-border shrink-0" />
                  )}
                  <span>{step.label}</span>
                </div>

                <span className="font-mono text-[11px] text-dark-muted">
                  {isCompleted ? 'Done' : isCurrent ? 'Analyzing...' : 'Waiting'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Finish CTA */}
        {isDone && (
          <div className="mt-8 border-t border-dark-border pt-5 flex items-center justify-between">
            <span className="text-[13px] text-authentic font-medium flex items-center gap-1.5">
              <CheckCircle2 className="size-4" /> Scan completed successfully!
            </span>
            <button
              type="button"
              onClick={() => router.push('/report/demo')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-vibrant px-4 py-2 text-[13px] font-medium text-white hover:bg-vibrant-hover shadow-vibrant-glow transition-all"
            >
              <span>View Full Report</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
