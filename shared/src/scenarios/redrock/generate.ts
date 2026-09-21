import type { Rng } from '../../rng.js';
import type { RedrockScenario, RedrockScenarioPublic } from './types.js';
import { REDROCK_TEMPLATES } from './templates/index.js';
import { buildCases } from './cases.js';
import { REDROCK } from '../../config.js';

export function generateRedrock(rng: Rng): { templateId: string; scenario: RedrockScenario } {
  const template = rng.pick(REDROCK_TEMPLATES);
  const base = template.build(rng);
  const cases = buildCases(rng, REDROCK.caseQuestions);

  // Exhibits are shuffled so the relevant ones are never in a fixed position.
  const scenario: RedrockScenario = {
    ...base,
    templateId: template.id,
    exhibits: rng.shuffle(base.exhibits),
    cases,
  };

  return { templateId: template.id, scenario };
}

/** Strips every answer before the scenario reaches the browser. */
export function redactRedrock(s: RedrockScenario): RedrockScenarioPublic {
  return {
    templateId: s.templateId,
    title: s.title,
    client: s.client,
    brief: s.brief,
    objective: s.objective,
    exhibits: s.exhibits,
    analysis: s.analysis.map(({ id, prompt, unit, decimals }) => ({ id, prompt, unit, decimals })),
    report: {
      preamble: s.report.preamble,
      sentence: s.report.sentence,
      options: s.report.options,
      decisionQuestionId: s.report.decisionQuestionId,
      // The hurdle is public: it is stated in the objective the candidate read.
      threshold: s.report.threshold,
      blanks: s.report.blanks,
      chartChoices: s.report.chartChoices,
    },
    cases: s.cases.map(({ id, prompt, exhibit, unit, decimals, choices }) => ({
      id,
      prompt,
      exhibit,
      unit,
      decimals,
      choices,
    })),
  };
}
