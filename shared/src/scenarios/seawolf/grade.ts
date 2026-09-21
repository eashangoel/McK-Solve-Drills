import { SEAWOLF } from '../../config.js';
import type { ScoreBreakdown, StageMetric } from '../../types.js';
import { emptyBreakdown } from '../index.js';
import { evaluateTrio } from './generate.js';
import type { SeaWolfScenario, SeaWolfAnswers, Site } from './types.js';

/**
 * A site scores 100 when all five constraints are met, losing 20 per miss —
 * three attribute averages inside their bands, the required trait present, and
 * the disqualifying trait absent. This mirrors the real module's scoring.
 */
function gradeSite(site: Site, answer: { trio?: string[] } | undefined) {
  const trioIds = answer?.trio ?? [];
  const chosen = trioIds
    .map((id) => site.candidates.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => m != null);

  const checks = evaluateTrio(site, chosen);
  const met = checks.filter((c) => c.met).length;
  const score = Math.max(0, 100 - (SEAWOLF.criteriaPerSite - met) * SEAWOLF.penaltyPerMissedCriterion);
  return { score, checks, met, chosen };
}

/**
 * Screening quality: how well accept/reject matched the microbes that can
 * actually appear in a valid trio. Feeds the process score's data-discipline
 * component rather than the product score, the same way exhibit triage does.
 */
function gradeScreening(site: Site, accepted: string[] = []) {
  const viable = new Set(site.viableIds);
  const picked = new Set(accepted);
  const hits = [...picked].filter((id) => viable.has(id)).length;
  const precision = picked.size ? hits / picked.size : 0;
  const recall = viable.size ? hits / viable.size : 0;
  return { precision, recall, hits, picked: picked.size, viable: viable.size };
}

/** Did the candidate flag the two genuinely binding constraints? */
function gradePriorities(site: Site, priorities: string[] = []) {
  const truth = new Set(site.bindingKeys);
  const hits = priorities.filter((p) => truth.has(p)).length;
  return { hits, possible: truth.size, score: truth.size ? hits / truth.size : 0 };
}

export function gradeSeaWolf(
  scenario: SeaWolfScenario,
  answers: SeaWolfAnswers,
  _stages: StageMetric[],
): { productScore: number; breakdown: ScoreBreakdown } {
  const breakdown = emptyBreakdown();
  const perSite = scenario.sites.map((site) => {
    const a = answers?.sites?.[site.id];
    return {
      site,
      result: gradeSite(site, a),
      screening: gradeScreening(site, a?.accepted),
      priorities: gradePriorities(site, a?.priorities),
    };
  });

  const productScore =
    perSite.reduce((s, p) => s + p.result.score, 0) / Math.max(perSite.length, 1);

  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

  breakdown.subskills['seawolf.constraint_accuracy'] = Math.round(productScore);
  breakdown.subskills['seawolf.categorisation'] = Math.round(
    avg(perSite.map((p) => (p.screening.precision * 0.5 + p.screening.recall * 0.5) * 100)),
  );
  breakdown.subskills['seawolf.prioritisation'] = Math.round(
    avg(perSite.map((p) => p.priorities.score * 100)),
  );

  for (const p of perSite) {
    const missed = p.result.checks.filter((c) => !c.met);
    breakdown.notes.push({
      label: p.site.name,
      detail:
        (missed.length === 0
          ? 'All five constraints satisfied.'
          : `Missed ${missed.length}: ${missed.map((m) => `${labelFor(p.site, m.key)} (${m.detail})`).join('; ')}.`) +
        ` Screening kept ${p.screening.picked} cultures, ${p.screening.hits} of the ${p.screening.viable} that could work.` +
        ` Priorities: ${p.priorities.hits}/${p.priorities.possible} binding constraints identified.`,
      earned: p.result.met,
      possible: SEAWOLF.criteriaPerSite,
    });
  }

  return { productScore: Math.round(productScore * 10) / 10, breakdown };
}

function labelFor(site: Site, key: string): string {
  if (key.startsWith('trait:')) {
    const t = key.slice(6);
    return site.traits.find((x) => x.key === t)?.label ?? t;
  }
  return site.attributes.find((a) => a.key === key)?.label ?? key;
}

/** Screening precision and recall, attached server-side for the process score. */
export function augmentSeaWolfStages(
  scenario: SeaWolfScenario,
  answers: SeaWolfAnswers,
  stages: StageMetric[],
): StageMetric[] {
  return stages.map((st) => {
    const match = st.stage.match(/^screen:(site-\d+)$/);
    if (!match) return st;
    const site = scenario.sites.find((s) => s.id === match[1]);
    if (!site) return st;
    const g = gradeScreening(site, answers?.sites?.[site.id]?.accepted);
    return { ...st, precision: g.precision, recall: g.recall };
  });
}
