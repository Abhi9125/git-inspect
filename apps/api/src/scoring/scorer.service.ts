import { Injectable } from '@nestjs/common';
import {
  SignalResult,
  Verdict,
  Confidence,
  SCORE_THRESHOLDS,
} from '@git-forensics/shared';

export interface ScoreCalculationResult {
  score: number;
  verdict: Verdict;
  confidence: Confidence;
  verdictTitle: string;
  verdictDescription: string;
  totalPenalty: number;
}

@Injectable()
export class ScorerService {
  public calculateScore(signals: SignalResult[]): ScoreCalculationResult {
    let totalPenalty = 0;

    for (const signal of signals) {
      totalPenalty += signal.scorePenalty || 0;
    }

    const rawScore = 100 - totalPenalty;
    const finalScore = Math.max(
      SCORE_THRESHOLDS.MIN_SCORE,
      Math.min(SCORE_THRESHOLDS.MAX_SCORE, rawScore),
    );

    let verdict: Verdict = 'AUTHENTIC';
    let confidence: Confidence = 'HIGH';
    let verdictTitle = 'AUTHENTIC HUMAN DEVELOPMENT PATTERN';
    let verdictDescription =
      'Commit cadence, message entropy, and multi-file code diffs demonstrate organic human problem-solving and software engineering lifecycle.';

    if (finalScore >= SCORE_THRESHOLDS.AUTHENTIC_MIN) {
      verdict = 'AUTHENTIC';
      confidence = 'HIGH';
      verdictTitle = 'AUTHENTIC HUMAN DEVELOPMENT PATTERN';
      verdictDescription =
        'Commit cadence, message entropy, and multi-file code diffs demonstrate organic human problem-solving and software engineering lifecycle.';
    } else if (finalScore >= SCORE_THRESHOLDS.MIXED_MIN) {
      verdict = 'MIXED';
      confidence = 'MODERATE';
      verdictTitle = 'MIXED / BATCH IMPORTED ACTIVITY';
      verdictDescription =
        'Some automated or irregular commit patterns were detected alongside human development. Common in repos with squash-merge PRs or rebased histories.';
    } else {
      verdict = 'SUSPICIOUS';
      confidence = 'HIGH';
      verdictTitle = 'HIGH PROBABILITY OF AUTOMATED BOT / SPOOFED COMMITS';
      verdictDescription =
        'Multiple critical forensic red flags detected: single-file manipulation, repetitive messages, and mechanical clock interval consistency.';
    }

    return {
      score: finalScore,
      verdict,
      confidence,
      verdictTitle,
      verdictDescription,
      totalPenalty,
    };
  }
}
