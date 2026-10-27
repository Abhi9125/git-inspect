'use client';

import { useState } from 'react';
import { ExternalLink, Copy, Check, GitCommit, Users, Clock, FolderGit2 } from 'lucide-react';
import { ForensicReport } from '@git-forensics/shared';

export default function ReportHeader({ report }: { report: ForensicReport }) {
  const [copied, setCopied] = useState(false);
  const [badgeCopied, setBadgeCopied] = useState(false);

  const badgeMarkdown = `[![GitForensics Score](https://img.shields.io/badge/GitForensics-${report.score}%2F100-${report.score >= 75 ? '10B981' : report.score >= 50 ? 'F59E0B' : 'EF4444'}?logo=github)](${report.repo.url})`;

  const copyReportLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyBadge = () => {
    navigator.clipboard.writeText(badgeMarkdown);
    setBadgeCopied(true);
    setTimeout(() => setBadgeCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Meta Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-mono text-dark-muted">
              Forensic Report for
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-dark-muted ring-1 ring-white/10">
              {report.repo.language || 'Unknown'}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="text-dark-muted font-normal">{report.repo.owner}/</span>
              {report.repo.name}
            </h1>
            <a
              href={report.repo.url}
              target="_blank"
              rel="noreferrer"
              className="text-dark-muted hover:text-vibrant transition-colors p-1"
            >
              <ExternalLink className="size-4" />
            </a>
          </div>

          <p className="mt-1 text-[13px] text-dark-muted max-w-xl line-clamp-1">
            {report.repo.description || 'No description provided.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyReportLink}
            className="inline-flex items-center gap-1.5 rounded-lg bg-dark-card px-3 py-1.5 text-[12px] font-medium text-white ring-1 ring-dark-border hover:ring-white/20 transition-all active:scale-95"
          >
            {copied ? <Check className="size-3.5 text-authentic" /> : <Copy className="size-3.5" />}
            <span>{copied ? 'Link Copied!' : 'Share Report'}</span>
          </button>
        </div>
      </div>

      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="vibrant-card rounded-xl bg-dark-card ring-1 ring-dark-border p-4 shadow-sm">
          <div className="flex items-center gap-2 text-dark-muted text-[11px] font-medium uppercase tracking-wider">
            <GitCommit className="size-3.5 text-vibrant" /> Commits Analyzed
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-white">
            {report.totalCommits.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[11px] text-dark-muted">
            {report.totalBotCommits > 0 ? `${report.totalBotCommits} bot commits filtered` : '0 bot commits'}
          </div>
        </div>

        <div className="vibrant-card rounded-xl bg-dark-card ring-1 ring-dark-border p-4 shadow-sm">
          <div className="flex items-center gap-2 text-dark-muted text-[11px] font-medium uppercase tracking-wider">
            <Users className="size-3.5 text-vibrant" /> Contributors
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-white">
            {report.humanAuthors}
          </div>
          <div className="mt-0.5 text-[11px] text-dark-muted">
            {report.humanAuthors === 1 ? 'Solo maintainer' : 'Team / Multi-author'}
          </div>
        </div>

        <div className="vibrant-card rounded-xl bg-dark-card ring-1 ring-dark-border p-4 shadow-sm">
          <div className="flex items-center gap-2 text-dark-muted text-[11px] font-medium uppercase tracking-wider">
            <Clock className="size-3.5 text-vibrant" /> Active Duration
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-white">
            {report.dateRange.durationDays} days
          </div>
          <div className="mt-0.5 text-[11px] text-dark-muted">
            Span of analyzed history
          </div>
        </div>

        <div className="vibrant-card rounded-xl bg-dark-card ring-1 ring-dark-border p-4 shadow-sm">
          <div className="flex items-center gap-2 text-dark-muted text-[11px] font-medium uppercase tracking-wider">
            <FolderGit2 className="size-3.5 text-vibrant" /> Code Impact
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-white">
            {report.filesTouched} files
          </div>
          <div className="mt-0.5 text-[11px] text-dark-muted">
            {(report.linesChanged.total).toLocaleString()} lines changed
          </div>
        </div>
      </div>

      {/* GitHub README Badge Embed Snippet */}
      <div className="rounded-xl bg-dark-card/60 ring-1 ring-dark-border p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-dark-muted">
            README Badge:
          </span>
          <code className="text-[12px] font-mono text-white/80 bg-dark-bg px-2.5 py-1 rounded ring-1 ring-white/5 truncate max-w-sm sm:max-w-md">
            {badgeMarkdown}
          </code>
        </div>
        <button
          type="button"
          onClick={copyBadge}
          className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-medium text-vibrant hover:text-vibrant-hover transition-colors"
        >
          {badgeCopied ? <Check className="size-3 text-authentic" /> : <Copy className="size-3" />}
          <span>{badgeCopied ? 'Markdown Copied!' : 'Copy Badge Markdown'}</span>
        </button>
      </div>
    </div>
  );
}
