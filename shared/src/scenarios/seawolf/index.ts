import { registerGame } from '../index.js';
import { generateSeaWolf, redactSeaWolf } from './generate.js';
import { gradeSeaWolf, augmentSeaWolfStages } from './grade.js';
import type { SeaWolfScenario, SeaWolfAnswers } from './types.js';

registerGame({
  game: 'seawolf',
  generate: (rng) => generateSeaWolf(rng),
  grade: (scenario, answers, stages) =>
    gradeSeaWolf(scenario as SeaWolfScenario, answers as SeaWolfAnswers, stages),
  redact: (scenario) => redactSeaWolf(scenario as SeaWolfScenario),
  augmentStages: (scenario, answers, stages) =>
    augmentSeaWolfStages(scenario as SeaWolfScenario, answers as SeaWolfAnswers, stages),
});

export * from './types.js';
