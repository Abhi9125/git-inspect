import { ForensicReport, ScanProgressState, ScanStatus } from '@git-forensics/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface StartScanResponse {
  scanId: string;
  status: ScanStatus;
  isCached: boolean;
}

export async function startScan(repoUrl: string): Promise<StartScanResponse> {
  const res = await fetch(`${API_BASE}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to initiate scan: ${res.statusText}`);
  }

  return res.json();
}

export async function pollScanStatus(scanId: string): Promise<ScanProgressState> {
  const res = await fetch(`${API_BASE}/scan/${encodeURIComponent(scanId)}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch scan status: ${res.statusText}`);
  }

  return res.json();
}

export async function getReportByRepo(owner: string, repo: string): Promise<ForensicReport> {
  const res = await fetch(`${API_BASE}/report/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Repository report not found: ${res.statusText}`);
  }

  return res.json();
}

export async function getRecentScans(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/recent`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
