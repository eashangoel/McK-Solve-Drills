import { registerGame } from '../index.js';
import { generateRedrock, redactRedrock } from './generate.js';
import { gradeRedrock } from './grade.js';
import type { RedrockScenario, RedrockAnswers } from './types.js';
import type { StageMetric } from '../../types.js';

registerGame({
  game: 'redrock',
  generate: (rng) => generateRedrock(rng),
  grade: (scenario, answers, stages) =>
    gradeRedrock(scenario as RedrockScenario, answers as RedrockAnswers, stages),
  redact: (scenario) => redactRedrock(scenario as RedrockScenario),

  /**
   * Journal precision and recall need the ground-truth relevant set, which the
   * browser never sees. They are attached here so the process score's
   * data-discipline component has real numbers to work with.
   */
  augmentStages: (scenario, answers, stages: StageMetric[]) => {
    const s = scenario as RedrockScenario;
    const a = answers as RedrockAnswers;
    const truth = new Set(s.relevantExhibitIds);
    const picked = new Set(a?.journal ?? []);
    const hits = [...picked].filter((id) => truth.has(id)).length;
    const precision = picked.size ? hits / picked.size : 0;
    const recall = truth.size ? hits / truth.size : 0;
    return stages.map((st) =>
      st.stage === 'investigation' ? { ...st, precision, recall } : st,
    );
  },
});

export * from './types.js';
