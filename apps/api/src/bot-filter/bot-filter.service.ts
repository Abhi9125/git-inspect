import { Injectable } from '@nestjs/common';
import { KNOWN_BOTS } from '@git-forensics/shared';
import { RawCommit } from '../github/github.service';

export interface FilteredCommitsResult {
  humanCommits: RawCommit[];
  botCommits: RawCommit[];
  botAuthors: string[];
  totalBotCommits: number;
  totalHumanCommits: number;
}

@Injectable()
export class BotFilterService {
  /**
   * Check if an author is a known bot or automated service
   */
  public isBotAuthor(commit: RawCommit): boolean {
    const authorLogin = (commit.authorLogin || '').toLowerCase();
    const authorName = (commit.authorName || '').toLowerCase();
    const authorEmail = (commit.authorEmail || '').toLowerCase();

    // 1. Direct match with KNOWN_BOTS list
    for (const bot of KNOWN_BOTS) {
      const lowerBot = bot.toLowerCase();
      if (
        authorLogin.includes(lowerBot) ||
        authorName.includes(lowerBot) ||
        authorEmail.includes(lowerBot)
      ) {
        return true;
      }
    }

    // 2. Pattern matching [bot] suffix or bot emails
    if (
      authorLogin.endsWith('[bot]') ||
      authorName.endsWith('[bot]') ||
      authorEmail.includes('bot@') ||
      authorEmail.includes('+bot@users.noreply.github.com')
    ) {
      return true;
    }

    return false;
  }

  /**
   * Separate commits into human and bot groups
   */
  public filter(commits: RawCommit[]): FilteredCommitsResult {
    const humanCommits: RawCommit[] = [];
    const botCommits: RawCommit[] = [];
    const botAuthorsSet = new Set<string>();

    for (const commit of commits) {
      if (this.isBotAuthor(commit)) {
        botCommits.push(commit);
        const identifier = commit.authorLogin || commit.authorName || 'unknown-bot';
        botAuthorsSet.add(identifier);
      } else {
        humanCommits.push(commit);
      }
    }

    return {
      humanCommits,
      botCommits,
      botAuthors: Array.from(botAuthorsSet),
      totalBotCommits: botCommits.length,
      totalHumanCommits: humanCommits.length,
    };
  }
}
