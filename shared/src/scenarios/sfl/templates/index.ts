import type { QuestionTemplate } from '../types.js';
import { PHASE_1 } from './phase1.js';
import { PHASE_2 } from './phase2.js';
import { PHASE_3 } from './phase3.js';

export { RANKING_TEMPLATES } from './ranking.js';

/** Add a scenario by appending it to the matching phase file. */
export const QUESTION_TEMPLATES: QuestionTemplate[] = [...PHASE_1, ...PHASE_2, ...PHASE_3];

export const BY_PHASE: Record<1 | 2 | 3, QuestionTemplate[]> = {
  1: PHASE_1,
  2: PHASE_2,
  3: PHASE_3,
};
