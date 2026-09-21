import { registerGame } from '../index.js';
import { generateSfl, redactSfl } from './generate.js';
import { gradeSfl } from './grade.js';
import type { SflScenario, SflAnswers } from './types.js';

registerGame({
  game: 'sfl',
  generate: (rng) => generateSfl(rng),
  grade: (scenario, answers, stages) =>
    gradeSfl(scenario as SflScenario, answers as SflAnswers, stages),
  redact: (scenario) => redactSfl(scenario as SflScenario),
});

export * from './types.js';
