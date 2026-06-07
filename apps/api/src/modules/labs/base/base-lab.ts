import type { LabMeta, ValidationResult } from "./lab-definition.interface";

export abstract class BaseLab {
  abstract readonly meta: LabMeta;

  abstract validate(
    answers: Record<string, string>,
    context?: { userId: string; sessionId: string; hintsUsed?: number },
  ): Promise<ValidationResult>;

  /** Returns hint content if key matches, else throws */
  getHint(key: string): { title: string; content: string; xpCost: number } | undefined {
    return this.meta.hints.find((h) => h.key === key);
  }

  /** Computes max score from questions */
  get maxScore(): number {
    return this.meta.questions.reduce((acc, q) => acc + q.points, 0);
  }

  /** Fuzzy string comparison — strips whitespace, lowercases */
  protected matches(answer: string, expected: string): boolean {
    return answer.trim().toLowerCase() === expected.trim().toLowerCase();
  }

  /** Check if answer contains any of the expected values */
  protected containsAny(answer: string, expected: string[]): boolean {
    const a = answer.trim().toLowerCase();
    return expected.some((e) => a.includes(e.toLowerCase()));
  }

  /** XP calculation: full reward minus hint penalties */
  protected calcXp(score: number, hintsUsed: number): number {
    const hintPenalty = this.meta.hints
      .slice(0, hintsUsed)
      .reduce((acc, h) => acc + h.xpCost, 0);
    const earned = Math.max(0, Math.round((score / this.maxScore) * this.meta.xpReward) - hintPenalty);
    return earned;
  }
}
