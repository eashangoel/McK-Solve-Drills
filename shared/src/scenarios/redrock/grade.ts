import { PRODUCT_WEIGHTS } from '../../config.js';
import type { ScoreBreakdown, StageMetric } from '../../types.js';
import { emptyBreakdown } from '../index.js';
import type { RedrockScenario, RedrockAnswers } from './types.js';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function near(actual: number | null | undefined, expected: number, tol: number): boolean {
  return actual != null && Number.isFinite(actual) && Math.abs(actual - expected) <= tol;
}

/**
 * Investigation is scored on F1 of the research journal against the exhibits
 * genuinely needed downstream. Precision alone would reward pulling in
 * nothing; recall alone would reward hoarding everything.
 */
function gradeInvestigation(scenario: RedrockScenario, picked: string[]) {
  const truth = new Set(scenario.relevantExhibitIds);
  const chosen = new Set(picked ?? []);
  const hits = [...chosen].filter((id) => truth.has(id)).length;
  const precision = chosen.size ? hits / chosen.size : 0;
  const recall = truth.size ? hits / truth.size : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  return { precision, recall, f1, hits, picked: chosen.size, needed: truth.size };
}

/**
 * The report is graded against the candidate's OWN analysis answers. A figure
 * carried forward faithfully earns credit even when the underlying analysis
 * was wrong, so an early error costs once rather than twice — the cascade
 * behaviour of the real study.
 */
function gradeReport(scenario: RedrockScenario, answers: RedrockAnswers) {
  const r = scenario.report;
  const submitted = answers.report ?? { optionId: null, blanks: {}, chartId: null };
  let earned = 0;
  const possible = 3;
  const detail: string[] = [];

  // 1. Consistency of each numeric blank with what the candidate computed.
  let blankHits = 0;
  for (const blank of r.blanks) {
    const own = answers.analysis?.[blank.fromQuestionId];
    const given = submitted.blanks?.[blank.id];
    const q = scenario.analysis.find((a) => a.id === blank.fromQuestionId);
    if (own == null || q == null) continue;
    if (near(given, own, Math.max(q.tolerance, 0.05))) blankHits++;
  }
  const blankScore = r.blanks.length ? blankHits / r.blanks.length : 0;
  earned += blankScore;
  detail.push(`${blankHits}/${r.blanks.length} figures carried through consistently`);

  // 2. Recommendation, judged against the threshold using the candidate's own value.
  const ownDecision = answers.analysis?.[r.decisionQuestionId];
  const impliedVerdict =
    ownDecision == null
      ? null
      : ownDecision >= r.threshold
        ? r.verdictAbove
        : r.verdictBelow;
  const chosenOption = r.options.find((o) => o.id === submitted.optionId);
  const verdictOk = chosenOption != null && impliedVerdict != null && chosenOption.verdict === impliedVerdict;
  if (verdictOk) earned += 1;
  detail.push(verdictOk ? 'recommendation follows from your own figure' : 'recommendation does not follow from your own figure');

  // 3. Supporting chart.
  const chartOk = submitted.chartId === r.correctChartId;
  if (chartOk) earned += 1;
  detail.push(chartOk ? 'correct supporting exhibit' : 'supporting exhibit does not evidence the claim');

  return { earned, possible, detail, verdictOk, chartOk, blankScore, impliedVerdict };
}

export function gradeRedrock(
  scenario: RedrockScenario,
  answers: RedrockAnswers,
  _stages: StageMetric[],
): { productScore: number; breakdown: ScoreBreakdown } {
  const a: RedrockAnswers = {
    journal: answers?.journal ?? [],
    analysis: answers?.analysis ?? {},
    report: answers?.report ?? { optionId: null, blanks: {}, chartId: null },
    cases: answers?.cases ?? {},
  };

  const breakdown = emptyBreakdown();
  const w = PRODUCT_WEIGHTS.redrock;

  // ---- Investigation ----
  const inv = gradeInvestigation(scenario, a.journal);
  breakdown.subskills['redrock.investigation_precision'] = Math.round(inv.precision * 100);
  breakdown.subskills['redrock.investigation_recall'] = Math.round(inv.recall * 100);
  breakdown.notes.push({
    label: 'Investigation',
    detail: `Pulled ${inv.picked} exhibits, ${inv.hits} of the ${inv.needed} that mattered. Precision ${Math.round(inv.precision * 100)}%, recall ${Math.round(inv.recall * 100)}%.`,
    earned: Math.round(inv.f1 * 100),
    possible: 100,
  });

  // ---- Analysis ----
  let analysisHits = 0;
  for (const q of scenario.analysis) {
    if (near(a.analysis[q.id], q.answer, q.tolerance)) analysisHits++;
  }
  const analysisScore = scenario.analysis.length ? analysisHits / scenario.analysis.length : 0;
  breakdown.subskills['redrock.analysis_accuracy'] = Math.round(analysisScore * 100);
  breakdown.notes.push({
    label: 'Analysis',
    detail: `${analysisHits} of ${scenario.analysis.length} quantitative questions correct.`,
    earned: analysisHits,
    possible: scenario.analysis.length,
  });

  // ---- Report ----
  const rep = gradeReport(scenario, a);
  const reportScore = rep.possible ? rep.earned / rep.possible : 0;
  breakdown.subskills['redrock.report_quality'] = Math.round(reportScore * 100);
  breakdown.notes.push({
    label: 'Report',
    detail: rep.detail.join('; ') + '.',
    earned: Math.round(rep.earned * 10) / 10,
    possible: rep.possible,
  });

  // ---- Cases ----
  let caseHits = 0;
  for (const c of scenario.cases) {
    if (near(a.cases[c.id], c.answer, c.tolerance)) caseHits++;
  }
  const casesScore = scenario.cases.length ? caseHits / scenario.cases.length : 0;
  breakdown.subskills['redrock.cases_accuracy'] = Math.round(casesScore * 100);
  breakdown.notes.push({
    label: 'Cases',
    detail: `${caseHits} of ${scenario.cases.length} rapid-fire questions correct.`,
    earned: caseHits,
    possible: scenario.cases.length,
  });

  const productScore =
    clamp01(inv.f1) * w.investigation * 100 +
    clamp01(analysisScore) * w.analysis * 100 +
    clamp01(reportScore) * w.report * 100 +
    clamp01(casesScore) * w.cases * 100;

  return { productScore: Math.round(productScore * 10) / 10, breakdown };
}
