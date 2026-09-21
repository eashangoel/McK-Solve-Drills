import { SFL } from '../../config.js';
import type { ScoreBreakdown, StageMetric } from '../../types.js';
import { emptyBreakdown } from '../index.js';
import type { SflScenario, SflAnswers } from './types.js';

/**
 * Ranking is scored by total displacement from the ideal order, normalised
 * against the worst possible arrangement. Getting the top item right matters
 * more than perfecting the tail, so displacement is weighted by how high the
 * item sits in the ideal order.
 */
function gradeRanking(scenario: SflScenario, submitted: string[] = []) {
  const ideal = scenario.ranking.idealOrder;
  const n = ideal.length;
  if (!submitted.length) return { score: 0, displacement: null as number | null };

  const positionOf = new Map(submitted.map((id, i) => [id, i]));
  let weighted = 0;
  let worst = 0;
  for (let i = 0; i < n; i++) {
    const id = ideal[i];
    const got = positionOf.get(id);
    // An item left out is treated as placed last.
    const pos = got == null ? n - 1 : got;
    const weight = n - i; // top of the ideal order carries the most weight
    weighted += Math.abs(pos - i) * weight;
    worst += Math.max(i, n - 1 - i) * weight;
  }
  const score = worst > 0 ? Math.max(0, 1 - weighted / worst) : 1;
  return { score, displacement: weighted };
}

export function gradeSfl(
  scenario: SflScenario,
  answers: SflAnswers,
  _stages: StageMetric[],
): { productScore: number; breakdown: ScoreBreakdown } {
  const breakdown = emptyBreakdown();
  const choices = answers?.choices ?? {};

  // ---- Multiple choice ----
  let earned = 0;
  const possible = scenario.questions.length * SFL.optionPoints.best;
  let bestCount = 0;
  let poorCount = 0;

  for (const q of scenario.questions) {
    const chosen = q.options.find((o) => o.id === choices[q.id]);
    earned += chosen?.points ?? 0;
    if (chosen?.tier === 'best') bestCount++;
    if (chosen?.tier === 'poor' || chosen == null) poorCount++;
  }
  const mcScore = possible > 0 ? earned / possible : 0;

  // ---- Ranking ----
  const rank = gradeRanking(scenario, answers?.ranking);

  // Every question carries equal weight, the ranking included.
  const total = scenario.questions.length + 1;
  const productScore = ((mcScore * scenario.questions.length + rank.score) / total) * 100;

  breakdown.subskills['sfl.judgment'] = Math.round(mcScore * 100);
  breakdown.subskills['sfl.prioritisation'] = Math.round(rank.score * 100);

  breakdown.notes.push({
    label: 'Prioritisation',
    detail: answers?.ranking?.length
      ? `Opening ranking scored ${Math.round(rank.score * 100)}% against the ideal order.`
      : 'No ranking submitted.',
    earned: Math.round(rank.score * 100),
    possible: 100,
  });

  breakdown.notes.push({
    label: 'Judgement',
    detail: `${bestCount} of ${scenario.questions.length} questions answered with the strongest option${
      poorCount ? `, ${poorCount} with the weakest or left blank` : ''
    }. Partial credit applies to defensible-but-flawed choices.`,
    earned: Math.round(earned),
    possible,
  });

  return { productScore: Math.round(productScore * 10) / 10, breakdown };
}
