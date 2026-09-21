import type { Rng } from '../../rng.js';
import { SFL } from '../../config.js';
import { buildContext, fill } from './context.js';
import { BY_PHASE, RANKING_TEMPLATES } from './templates/index.js';
import type {
  SflScenario,
  SflScenarioPublic,
  SflQuestion,
  SflRanking,
  Tier,
} from './types.js';

const POINTS: Record<Tier, number> = {
  best: SFL.optionPoints.best,
  good: SFL.optionPoints.good,
  weak: SFL.optionPoints.weak,
  poor: SFL.optionPoints.poor,
};

export function generateSfl(rng: Rng): { templateId: string; scenario: SflScenario } {
  const ctx = buildContext(rng);
  const mcCount = SFL.questionsPerSession - SFL.rankingQuestions;

  // Spread the twelve multiple-choice questions evenly across the three phases
  // so the scenario moves from orientation to crisis rather than jumping about.
  const perPhase = Math.floor(mcCount / 3);
  const remainder = mcCount - perPhase * 3;
  const counts: Record<1 | 2 | 3, number> = {
    1: perPhase + (remainder > 0 ? 1 : 0),
    2: perPhase + (remainder > 1 ? 1 : 0),
    3: perPhase,
  };

  const questions: SflQuestion[] = [];
  for (const phase of [1, 2, 3] as const) {
    const picked = rng.sample(BY_PHASE[phase], Math.min(counts[phase], BY_PHASE[phase].length));
    for (const t of picked) {
      // Options are shuffled so position carries no information.
      const options = rng.shuffle(t.options).map((o, i) => ({
        id: `${t.id}-o${i}`,
        text: fill(o.text, ctx),
        tier: o.tier,
        points: POINTS[o.tier],
        why: fill(o.why, ctx),
      }));
      questions.push({
        id: t.id,
        templateId: t.id,
        phase: t.phase,
        theme: t.theme,
        situation: fill(t.situation, ctx),
        prompt: fill(t.prompt, ctx),
        options,
      });
    }
  }

  const rt = rng.pick(RANKING_TEMPLATES);
  const ranking: SflRanking = {
    id: rt.id,
    templateId: rt.id,
    prompt: fill(rt.prompt, ctx),
    note: rt.note,
    items: rng.shuffle(rt.items).map((i) => ({ id: i.id, text: fill(i.text, ctx) })),
    idealOrder: rt.items.map((i) => i.id),
    rationale: rt.items.map((i) => ({ id: i.id, why: fill(i.why, ctx) })),
  };

  return {
    templateId: `sfl-${rt.id}`,
    scenario: {
      templateId: 'sfl',
      title: `${ctx.site} restoration programme`,
      context: ctx,
      briefing: fill(
        'You have joined the restoration programme at {{site}}, a {{ecosystem}} affected by {{contaminant}}. ' +
          '{{sponsor}} at {{sponsorOrg}} funds the work and {{partnerOrg}} holds long-standing use of the site. ' +
          'The programme is already under way and has {{deadlineWeeks}} weeks left to run. ' +
          'Information will arrive as the situation develops, and it will not always be complete.',
        ctx,
      ),
      ranking,
      questions,
    },
  };
}

/** Strips tiers, points and rationales before the scenario reaches the browser. */
export function redactSfl(s: SflScenario): SflScenarioPublic {
  return {
    templateId: s.templateId,
    title: s.title,
    briefing: s.briefing,
    ranking: {
      id: s.ranking.id,
      prompt: s.ranking.prompt,
      note: s.ranking.note,
      items: s.ranking.items,
    },
    questions: s.questions.map((q) => ({
      id: q.id,
      phase: q.phase,
      situation: q.situation,
      prompt: q.prompt,
      options: q.options.map((o) => ({ id: o.id, text: o.text })),
    })),
  };
}
