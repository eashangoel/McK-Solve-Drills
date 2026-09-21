import { PROCESS_WEIGHTS, type StageMetric, type ScoreBreakdown } from '@solve/shared';

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

/**
 * Pacing: how well time was allocated against each stage's budget.
 * The sweet spot is 55-100% of budget. Finishing far under budget usually
 * means data was skipped; going over means the next stage gets starved.
 */
function pacingScore(stages: StageMetric[]): number {
  const usable = stages.filter((s) => s.budgetMs > 0 && s.durationMs > 0);
  if (!usable.length) return 70;
  const per = usable.map((s) => {
    const ratio = s.durationMs / s.budgetMs;
    if (ratio >= 0.55 && ratio <= 1.0) return 100;
    if (ratio < 0.55) {
      // Rushing: 0.55 -> 100, 0.15 -> 40, floor at 25.
      return clamp(40 + ((ratio - 0.15) / 0.4) * 60, 25, 100);
    }
    // Overrun: 1.0 -> 100, 1.5 -> 50, 2.0+ -> 0.
    return clamp(100 - (ratio - 1) * 100, 0, 100);
  });
  return per.reduce((a, b) => a + b, 0) / per.length;
}

/**
 * Decisiveness: time from landing on a screen to the first meaningful action.
 * Measured as a fraction of that stage's budget. Reading for a beat is good;
 * instant clicking and long stalls are both penalised.
 */
function decisivenessScore(stages: StageMetric[]): number {
  const usable = stages.filter((s) => s.firstActionMs != null && s.budgetMs > 0);
  if (!usable.length) return 70;
  const per = usable.map((s) => {
    const frac = (s.firstActionMs as number) / s.budgetMs;
    if (frac >= 0.03 && frac <= 0.15) return 100;
    if (frac < 0.03) return clamp(55 + (frac / 0.03) * 45, 55, 100); // clicked before reading
    return clamp(100 - (frac - 0.15) * 250, 20, 100); // stalled
  });
  return per.reduce((a, b) => a + b, 0) / per.length;
}

/**
 * Revision discipline: changing your mind once or twice per stage is normal
 * deliberation; churning through many reversals is not.
 */
function revisionScore(stages: StageMetric[]): number {
  if (!stages.length) return 70;
  const per = stages.map((s) => {
    const r = s.revisions ?? 0;
    if (r <= 2) return 100;
    return clamp(100 - (r - 2) * 9, 20, 100);
  });
  return per.reduce((a, b) => a + b, 0) / per.length;
}

/**
 * Data discipline: of the material you pulled in, how much of it mattered.
 * Weighted toward precision (hoarding is the common failure) but recall still
 * counts, since missing a needed exhibit breaks the analysis downstream.
 */
function dataDisciplineScore(stages: StageMetric[]): number | null {
  const usable = stages.filter((s) => s.precision != null || s.recall != null);
  if (!usable.length) return null;
  const per = usable.map((s) => {
    const p = s.precision ?? 0;
    const r = s.recall ?? 0;
    return (p * 0.6 + r * 0.4) * 100;
  });
  return per.reduce((a, b) => a + b, 0) / per.length;
}

export interface ProcessResult {
  score: number;
  components: { pacing: number; decisiveness: number; revisions: number; dataDiscipline: number | null };
}

/**
 * Blends the four telemetry components into a 0-100 process score. When a game
 * has no data-gathering stage (Sea Wolf, SFL), that weight is redistributed
 * across the remaining three rather than scored as zero.
 */
export function computeProcessScore(stages: StageMetric[]): ProcessResult {
  const pacing = pacingScore(stages);
  const decisiveness = decisivenessScore(stages);
  const revisions = revisionScore(stages);
  const dataDiscipline = dataDisciplineScore(stages);

  const w = { ...PROCESS_WEIGHTS };
  let total: number;

  if (dataDiscipline === null) {
    const remaining = w.pacing + w.decisiveness + w.revisions;
    total =
      (pacing * w.pacing + decisiveness * w.decisiveness + revisions * w.revisions) / remaining;
  } else {
    total =
      pacing * w.pacing +
      decisiveness * w.decisiveness +
      revisions * w.revisions +
      dataDiscipline * w.dataDiscipline;
  }

  return {
    score: Math.round(clamp(total) * 10) / 10,
    components: { pacing, decisiveness, revisions, dataDiscipline },
  };
}

/** Folds the process components into a breakdown's sub-skill map. */
export function addProcessSubskills(breakdown: ScoreBreakdown, r: ProcessResult): ScoreBreakdown {
  breakdown.subskills['process.pacing'] = Math.round(r.components.pacing);
  breakdown.subskills['process.decisiveness'] = Math.round(r.components.decisiveness);
  breakdown.subskills['process.revisions'] = Math.round(r.components.revisions);
  if (r.components.dataDiscipline !== null) {
    breakdown.subskills['process.data_discipline'] = Math.round(r.components.dataDiscipline);
  }
  return breakdown;
}
