import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GitHubRepoMeta {
  owner: string;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  pushedAt?: string;
}

export interface RawCommit {
  sha: string;
  message: string;
  authorName: string;
  authorEmail: string;
  authorDate: string; // ISO UTC
  committerName: string;
  committerEmail: string;
  committerDate: string; // ISO UTC
  authorLogin?: string;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: string[];
}

@Injectable()
export class GitHubService {
  private readonly token?: string;

  constructor(private configService: ConfigService) {
    this.token = this.configService.get<string>('GITHUB_TOKEN');
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'GitForensics-Engine/1.0',
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  /**
   * Parse repo URL into { owner, repo }
   */
  public parseRepoUrl(input: string): { owner: string; repo: string } {
    let cleaned = input.trim();
    cleaned = cleaned.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
    const parts = cleaned.split('/');
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      throw new HttpException(
        'Invalid GitHub repository format. Use "owner/repo" or "https://github.com/owner/repo"',
        HttpStatus.BAD_REQUEST,
      );
    }
    return { owner: parts[0], repo: parts[1] };
  }

  /**
   * Fetch repository metadata
   */
  public async getRepoMetadata(owner: string, repo: string): Promise<GitHubRepoMeta> {
    const url = `https://api.github.com/repos/${owner}/${repo}`;
    const res = await fetch(url, { headers: this.getHeaders() });

    if (res.status === 404) {
      throw new HttpException(
        `Repository ${owner}/${repo} not found or is private.`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (res.status === 403) {
      const reset = res.headers.get('x-ratelimit-reset');
      throw new HttpException(
        `GitHub API rate limit exceeded. Resets at ${reset ? new Date(parseInt(reset) * 1000).toLocaleTimeString() : 'soon'}.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!res.ok) {
      throw new HttpException(
        `Failed to fetch repo metadata: ${res.statusText}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const data = await res.json();
    return {
      owner: data.owner.login,
      name: data.name,
      fullName: data.full_name,
      url: data.html_url,
      description: data.description,
      stars: data.stargazers_count,
      forks: data.forks_count,
      language: data.language,
      defaultBranch: data.default_branch,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      pushedAt: data.pushed_at,
    };
  }

  /**
   * Fetch commit history with pagination (up to maxCommits e.g. 500)
   */
  public async getCommits(owner: string, repo: string, maxCommits = 500): Promise<RawCommit[]> {
    const commits: RawCommit[] = [];
    const perPage = 100;
    let page = 1;

    while (commits.length < maxCommits) {
      const url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${perPage}&page=${page}`;
      const res = await fetch(url, { headers: this.getHeaders() });

      if (!res.ok) {
        if (res.status === 404 || res.status === 409) break; // Empty repo or no commits
        throw new HttpException(
          `Failed fetching commits at page ${page}: ${res.statusText}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const batch = await res.json();
      if (!Array.isArray(batch) || batch.length === 0) break;

      for (const item of batch) {
        commits.push({
          sha: item.sha,
          message: item.commit?.message || '',
          authorName: item.commit?.author?.name || 'Unknown',
          authorEmail: item.commit?.author?.email || '',
          authorDate: item.commit?.author?.date || new Date().toISOString(),
          committerName: item.commit?.committer?.name || 'Unknown',
          committerEmail: item.commit?.committer?.email || '',
          committerDate: item.commit?.committer?.date || new Date().toISOString(),
          authorLogin: item.author?.login,
        });
      }

      if (batch.length < perPage) break;
      page++;
    }

    return commits;
  }

  /**
   * Smart Sampling strategy to fetch file details & line stats
   * for a subset of commits without blowing rate limits
   */
  public async enrichCommitsWithDetails(
    owner: string,
    repo: string,
    commits: RawCommit[],
  ): Promise<RawCommit[]> {
    const total = commits.length;
    if (total === 0) return commits;

    // Determine sample indices
    const sampleIndices: number[] = [];
    if (total <= 50) {
      // 100% sample for small repos
      for (let i = 0; i < total; i++) sampleIndices.push(i);
    } else if (total <= 200) {
      // 50% sample
      for (let i = 0; i < total; i += 2) sampleIndices.push(i);
    } else {
      // Sample 100 evenly spread commits
      const step = Math.max(1, Math.floor(total / 100));
      for (let i = 0; i < total && sampleIndices.length < 100; i += step) {
        sampleIndices.push(i);
      }
    }

    // Fetch commit details concurrently in chunks of 10
    const chunkSize = 10;
    for (let i = 0; i < sampleIndices.length; i += chunkSize) {
      const chunk = sampleIndices.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (index) => {
          const target = commits[index];
          try {
            const url = `https://api.github.com/repos/${owner}/${repo}/commits/${target.sha}`;
            const res = await fetch(url, { headers: this.getHeaders() });
            if (res.ok) {
              const detail = await res.json();
              target.stats = detail.stats || { additions: 0, deletions: 0, total: 0 };
              target.files = Array.isArray(detail.files)
                ? detail.files.map((f: any) => f.filename)
                : [];
            }
          } catch {
            // Non-fatal: if detail fetch fails for one commit, continue
          }
        }),
      );
    }

    return commits;
  }
}
