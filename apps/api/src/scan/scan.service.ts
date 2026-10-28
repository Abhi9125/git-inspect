import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import {
  ForensicReport,
  ScanProgressState,
  ScanStatus,
} from '@git-forensics/shared';
import { GitHubService } from '../github/github.service';
import { BotFilterService } from '../bot-filter/bot-filter.service';
import { ForensicsService } from '../forensics/forensics.service';
import { ScorerService } from '../scoring/scorer.service';
import { PrismaService } from '../prisma/prisma.service';

interface ScanRecord {
  id: string;
  repoOwner: string;
  repoName: string;
  repoUrl: string;
  status: ScanStatus;
  progressPercent: number;
  currentStepMessage: string;
  completedSteps: string[];
  report?: ForensicReport;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

@Injectable()
export class ScanService {
  private readonly logger = new Logger(ScanService.name);
  // In-memory fallback cache when PostgreSQL is not configured
  private readonly memoryStore = new Map<string, ScanRecord>();
  private readonly repoIndex = new Map<string, string>(); // "owner/repo" -> scanId

  constructor(
    private readonly githubService: GitHubService,
    private readonly botFilterService: BotFilterService,
    private readonly forensicsService: ForensicsService,
    private readonly scorerService: ScorerService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Start a new scan or return cached report if scanned < 24h ago
   */
  public async startScan(repoUrl: string): Promise<{ scanId: string; status: ScanStatus; isCached: boolean }> {
    const { owner, repo } = this.githubService.parseRepoUrl(repoUrl);
    const repoKey = `${owner.toLowerCase()}/${repo.toLowerCase()}`;

    // 1. Check PostgreSQL cache if connected
    if (this.prisma.isConnected) {
      try {
        const existing = await this.prisma.scan.findUnique({
          where: { repoOwner_repoName: { repoOwner: owner, repoName: repo } },
        });

        if (existing && existing.status === 'COMPLETED' && existing.completedAt) {
          const ageHours = (Date.now() - existing.completedAt.getTime()) / (1000 * 3600);
          if (ageHours < 24) {
            this.logger.log(`⚡ Returning PostgreSQL cached report for ${repoKey}`);
            return { scanId: existing.id, status: 'COMPLETED', isCached: true };
          }
        }
      } catch (err: any) {
        this.logger.warn(`Prisma cache check failed: ${err.message}`);
      }
    }

    // 2. Check in-memory store cache
    const cachedScanId = this.repoIndex.get(repoKey);
    if (cachedScanId) {
      const record = this.memoryStore.get(cachedScanId);
      if (record && record.status === 'COMPLETED' && record.completedAt) {
        const ageHours = (Date.now() - record.completedAt.getTime()) / (1000 * 3600);
        if (ageHours < 24) {
          this.logger.log(`⚡ Returning in-memory cached report for ${repoKey}`);
          return { scanId: record.id, status: 'COMPLETED', isCached: true };
        }
      }
    }

    // 3. Create fresh scan record
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullUrl = `https://github.com/${owner}/${repo}`;

    const newRecord: ScanRecord = {
      id: scanId,
      repoOwner: owner,
      repoName: repo,
      repoUrl: fullUrl,
      status: 'PENDING',
      progressPercent: 5,
      currentStepMessage: 'Scan queued...',
      completedSteps: [],
      createdAt: new Date(),
    };

    this.memoryStore.set(scanId, newRecord);
    this.repoIndex.set(repoKey, scanId);

    // Save to PostgreSQL if available
    if (this.prisma.isConnected) {
      try {
        await this.prisma.scan.upsert({
          where: { repoOwner_repoName: { repoOwner: owner, repoName: repo } },
          update: {
            id: scanId,
            status: 'PENDING',
            updatedAt: new Date(),
          },
          create: {
            id: scanId,
            repoOwner: owner,
            repoName: repo,
            repoUrl: fullUrl,
            status: 'PENDING',
          },
        });
      } catch (err: any) {
        this.logger.warn(`Prisma scan record creation error: ${err.message}`);
      }
    }

    // 4. Trigger asynchronous background pipeline
    this.runScanPipeline(scanId, owner, repo).catch((err) => {
      this.logger.error(`Unhandled error in scan pipeline for ${repoKey}:`, err);
    });

    return { scanId, status: 'PENDING', isCached: false };
  }

  /**
   * Background scan pipeline execution
   */
  private async runScanPipeline(scanId: string, owner: string, repo: string): Promise<void> {
    const record = this.memoryStore.get(scanId);
    if (!record) return;

    try {
      // Step 1: Validating repository metadata
      record.status = 'VALIDATING';
      record.progressPercent = 15;
      record.currentStepMessage = 'Validating repository on GitHub...';
      const meta = await this.githubService.getRepoMetadata(owner, repo);
      record.completedSteps.push('validate');

      // Step 2: Fetching commit history
      record.status = 'FETCHING_COMMITS';
      record.progressPercent = 35;
      record.currentStepMessage = 'Extracting commit trees and timeline...';
      const rawCommits = await this.githubService.getCommits(owner, repo, 500);
      record.completedSteps.push('fetch_commits');

      // Step 3: Bot Author Filtering
      const { humanCommits, botCommits, botAuthors, totalBotCommits } =
        this.botFilterService.filter(rawCommits);

      // Step 4: Sampling commit file details & code substance
      record.status = 'FETCHING_FILE_DETAILS';
      record.progressPercent = 60;
      record.currentStepMessage = 'Sampling file diversity and code delta...';
      const enrichedCommits = await this.githubService.enrichCommitsWithDetails(
        owner,
        repo,
        humanCommits.length > 0 ? humanCommits : rawCommits,
      );
      record.completedSteps.push('sample_files');

      // Step 5: Executing 7 Forensic Signal Analyzers
      record.status = 'ANALYZING';
      record.progressPercent = 85;
      record.currentStepMessage = 'Running 7-signal forensic algorithms...';
      const analysis = this.forensicsService.analyze(
        enrichedCommits,
        meta.createdAt,
        meta.pushedAt,
      );
      record.completedSteps.push('entropy', 'timing', 'dates');

      // Step 6: Score Calculation
      const scoreResult = this.scorerService.calculateScore(analysis.signals);
      record.completedSteps.push('score');

      // Step 7: Build Master Forensic Report
      const report: ForensicReport = {
        id: scanId,
        repo: {
          owner: meta.owner,
          name: meta.name,
          url: meta.url,
          description: meta.description,
          stars: meta.stars,
          forks: meta.forks,
          language: meta.language,
          defaultBranch: meta.defaultBranch,
        },
        score: scoreResult.score,
        verdict: scoreResult.verdict,
        confidence: scoreResult.confidence,
        verdictTitle: scoreResult.verdictTitle,
        verdictDescription: scoreResult.verdictDescription,
        totalCommits: rawCommits.length,
        totalBotCommits,
        humanAuthors: analysis.humanAuthorsCount,
        botAuthors,
        dateRange: analysis.dateRange,
        filesTouched: analysis.filesTouched,
        linesChanged: analysis.linesChanged,
        signals: analysis.signals,
        hourDistribution: analysis.hourDistribution,
        weekdayDistribution: analysis.weekdayDistribution,
        scannedAt: new Date().toISOString(),
      };

      // Mark Complete
      record.status = 'COMPLETED';
      record.progressPercent = 100;
      record.currentStepMessage = 'Forensic audit completed successfully!';
      record.report = report;
      record.completedAt = new Date();

      // Update PostgreSQL if available
      if (this.prisma.isConnected) {
        try {
          await this.prisma.scan.update({
            where: { repoOwner_repoName: { repoOwner: owner, repoName: repo } },
            data: {
              status: 'COMPLETED',
              description: meta.description,
              stars: meta.stars,
              forks: meta.forks,
              language: meta.language,
              totalCommits: rawCommits.length,
              totalBotCommits,
              humanAuthors: analysis.humanAuthorsCount,
              botAuthors,
              dateRangeStart: new Date(analysis.dateRange.start),
              dateRangeEnd: new Date(analysis.dateRange.end),
              score: scoreResult.score,
              verdict: scoreResult.verdict,
              signals: analysis.signals as any,
              hourDistribution: analysis.hourDistribution as any,
              weekdayDistribution: analysis.weekdayDistribution as any,
              completedAt: new Date(),
            },
          });
        } catch (dbErr: any) {
          this.logger.warn(`Could not save completed report to PostgreSQL: ${dbErr.message}`);
        }
      }

      this.logger.log(`✅ Scan completed for ${owner}/${repo}: Score ${report.score}/100 (${report.verdict})`);
    } catch (err: any) {
      record.status = 'FAILED';
      record.error = err.message || 'Scan failed';
      record.currentStepMessage = `Error: ${record.error}`;
      this.logger.error(`❌ Scan failed for ${owner}/${repo}:`, err.message);

      if (this.prisma.isConnected) {
        try {
          await this.prisma.scan.update({
            where: { repoOwner_repoName: { repoOwner: owner, repoName: repo } },
            data: { status: 'FAILED' },
          });
        } catch {}
      }
    }
  }

  /**
   * Get live polling progress or final report
   */
  public getScanStatus(scanId: string): ScanProgressState {
    const record = this.memoryStore.get(scanId);
    if (!record) {
      throw new NotFoundException(`Scan ID ${scanId} not found.`);
    }

    return {
      scanId: record.id,
      repoUrl: record.repoUrl,
      owner: record.repoOwner,
      repo: record.repoName,
      status: record.status,
      progressPercent: record.progressPercent,
      currentStepMessage: record.currentStepMessage,
      completedSteps: record.completedSteps,
      error: record.error,
      report: record.report,
    };
  }

  /**
   * Get report directly by owner & repo name (for shareable links)
   */
  public async getReportByRepo(owner: string, repo: string): Promise<ForensicReport> {
    const repoKey = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
    const scanId = this.repoIndex.get(repoKey);

    if (scanId) {
      const record = this.memoryStore.get(scanId);
      if (record?.report) return record.report;
    }

    // Try PostgreSQL
    if (this.prisma.isConnected) {
      let dbScan = await this.prisma.scan.findUnique({
        where: { repoOwner_repoName: { repoOwner: owner, repoName: repo } },
      });

      if (!dbScan) {
        dbScan = await this.prisma.scan.findFirst({
          where: {
            repoOwner: { equals: owner, mode: 'insensitive' },
            repoName: { equals: repo, mode: 'insensitive' },
          },
        });
      }

      if (dbScan && dbScan.status === 'COMPLETED' && dbScan.score !== null) {
        return {
          id: dbScan.id,
          repo: {
            owner: dbScan.repoOwner,
            name: dbScan.repoName,
            url: dbScan.repoUrl,
            description: dbScan.description,
            stars: dbScan.stars || 0,
            forks: dbScan.forks || 0,
            language: dbScan.language,
            defaultBranch: 'main',
          },
          score: dbScan.score,
          verdict: (dbScan.verdict as any) || 'AUTHENTIC',
          confidence: 'HIGH',
          verdictTitle: dbScan.verdict === 'AUTHENTIC' ? 'AUTHENTIC HUMAN DEVELOPMENT PATTERN' : 'SUSPICIOUS PATTERN',
          verdictDescription: 'Historical scan from database archive.',
          totalCommits: dbScan.totalCommits || 0,
          totalBotCommits: dbScan.totalBotCommits || 0,
          humanAuthors: dbScan.humanAuthors || 1,
          botAuthors: dbScan.botAuthors || [],
          dateRange: {
            start: dbScan.dateRangeStart?.toISOString() || new Date().toISOString(),
            end: dbScan.dateRangeEnd?.toISOString() || new Date().toISOString(),
            durationDays: 30,
          },
          filesTouched: 10,
          linesChanged: { additions: 1000, deletions: 200, total: 1200 },
          signals: (dbScan.signals as any) || [],
          hourDistribution: (dbScan.hourDistribution as any) || {},
          weekdayDistribution: (dbScan.weekdayDistribution as any) || {},
          scannedAt: dbScan.completedAt?.toISOString() || new Date().toISOString(),
        };
      }
    }

    throw new NotFoundException(`No report found for ${owner}/${repo}.`);
  }

  /**
   * Return recent completed scans (merges Neon DB + memory)
   */
  public async getRecentScans() {
    const results: any[] = [];
    const seen = new Set<string>();

    // 1. From PostgreSQL if available
    if (this.prisma.isConnected) {
      try {
        const dbScans = await this.prisma.scan.findMany({
          where: { status: 'COMPLETED', score: { not: null } },
          orderBy: { completedAt: 'desc' },
          take: 6,
        });

        for (const s of dbScans) {
          const key = `${s.repoOwner.toLowerCase()}/${s.repoName.toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            results.push({
              owner: s.repoOwner,
              repo: s.repoName,
              score: s.score,
              verdict: s.verdict,
              stars: s.stars || 0,
              language: s.language || 'TypeScript',
              timeAgo: s.completedAt ? this.formatTimeAgo(s.completedAt) : 'Recently',
            });
          }
        }
      } catch (err: any) {
        this.logger.warn(`Could not fetch recent scans from DB: ${err.message}`);
      }
    }

    // 2. Combine with in-memory store
    for (const record of this.memoryStore.values()) {
      if (record.status === 'COMPLETED' && record.report) {
        const key = `${record.repoOwner.toLowerCase()}/${record.repoName.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            owner: record.repoOwner,
            repo: record.repoName,
            score: record.report.score,
            verdict: record.report.verdict,
            stars: record.report.repo.stars,
            language: record.report.repo.language || 'Unknown',
            timeAgo: 'Just now',
          });
        }
      }
    }

    return results;
  }

  private formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}
