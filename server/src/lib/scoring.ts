import type { GameSession } from '../types.js';

export function calculateScore(session: GameSession, correct: boolean): {
  score: number;
  scoreBreakdown: {
    base: number;
    hintPenalty: number;
    questionPenalty: number;
    incorrectAccusationPenalty: number;
    final: number;
  };
} {
  const base = 100;
  const hintPenalty = session.hintsUsed * 15;
  const questionPenalty = session.questionsUsed * 5;

  if (!correct) {
    return {
      score: 0,
      scoreBreakdown: {
        base,
        hintPenalty,
        questionPenalty,
        incorrectAccusationPenalty: 0,
        final: 0
      }
    };
  }

  const final = Math.max(0, base - hintPenalty - questionPenalty);

  return {
    score: final,
    scoreBreakdown: {
      base,
      hintPenalty,
      questionPenalty,
      incorrectAccusationPenalty: 0,
      final
    }
  };
}
