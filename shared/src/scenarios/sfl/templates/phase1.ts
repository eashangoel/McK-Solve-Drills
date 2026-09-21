import type { QuestionTemplate } from '../types.js';

/**
 * Phase 1 — orientation. You have just joined a project already in motion.
 * The recurring test: orient yourself efficiently without either stalling for
 * certainty or charging ahead on assumptions.
 */
export const PHASE_1: QuestionTemplate[] = [
  {
    id: 'p1-handover',
    phase: 1,
    theme: 'Orienting on a live project',
    situation:
      'You join the {{site}} restoration team on day one. {{lead}}, who led the work for eight months, left last week. There is no handover document, but the shared drive holds three years of field data and a half-finished options paper.',
    prompt: 'What do you do first?',
    options: [
      {
        text: 'Spend the first morning reading the options paper and the most recent season of field data, then book short calls with the two people who worked most closely with {{lead}}.',
        tier: 'best',
        why: 'Bounded self-orientation first, then targeted questions. You arrive at those conversations able to ask about judgement rather than facts you could have read.',
      },
      {
        text: 'Read all three years of field data end to end before speaking to anyone, so your questions are fully informed.',
        tier: 'weak',
        why: 'Thorough but disproportionate. Most of that data will not bear on the decision, and the delay costs you access to colleagues while the project drifts.',
      },
      {
        text: 'Call a full team meeting and ask everyone to brief you on where things stand.',
        tier: 'good',
        why: 'Gets you oriented and signals engagement, but spends the whole team\'s time on something a couple of targeted conversations would cover, and you cannot yet tell a good answer from a vague one.',
      },
      {
        text: 'Write your own plan for the remaining {{deadlineWeeks}} weeks and circulate it for comment, to establish direction quickly.',
        tier: 'poor',
        why: 'You do not yet know enough to write it. A plan built on day-one assumptions will anchor the team on your misunderstandings.',
      },
    ],
  },
  {
    id: 'p1-conflicting-data',
    phase: 1,
    theme: 'Reconciling conflicting evidence',
    situation:
      'Two monitoring datasets disagree about {{contaminant}} levels at {{site}}. The in-house series shows a steady decline; the {{partnerOrg}} series shows no change. Both are credible and were collected with different protocols.',
    prompt: 'How do you proceed?',
    options: [
      {
        text: 'Compare the two protocols to find what differs — sampling point, timing, or method — and see whether that difference explains the gap before treating either series as wrong.',
        tier: 'best',
        why: 'Disagreement between two credible sources is usually a methodological artefact. Finding the cause often turns a contradiction into a more useful combined picture.',
      },
      {
        text: 'Use the in-house series, since you can vouch for how it was collected and the team already trusts it.',
        tier: 'weak',
        why: 'Defaults to the familiar rather than the correct. If the partner series is right, the recommendation is built on a false trend and the partner will say so publicly.',
      },
      {
        text: 'Average the two series so neither source is dismissed.',
        tier: 'poor',
        why: 'Averaging a real signal with a null one manufactures a number that describes nothing. It hides the disagreement rather than resolving it.',
      },
      {
        text: 'Commission a fresh independent round of sampling to settle the question definitively.',
        tier: 'good',
        why: 'Would resolve it, but spends budget and weeks on a question that comparing the protocols may answer in an afternoon. Reasonable only if that comparison comes up empty.',
      },
    ],
  },
  {
    id: 'p1-scope',
    phase: 1,
    theme: 'Scope discipline',
    situation:
      '{{sponsor}} at {{sponsorOrg}} asks whether the team could "also take a quick look" at a neighbouring catchment while you are in the field. It is genuinely interesting and would take roughly a fifth of your remaining capacity.',
    prompt: 'What is your response?',
    options: [
      {
        text: 'Say what the addition would cost in terms of the committed work, and ask {{sponsor}} which they would rather have if both cannot be done well.',
        tier: 'best',
        why: 'Makes the trade-off explicit and leaves the priority call with the person who owns it, without either refusing outright or silently absorbing the work.',
      },
      {
        text: 'Agree, since the sponsor asked and the team can probably absorb it with some extra hours.',
        tier: 'poor',
        why: '"Probably absorb it" is how committed deliverables slip. Agreeing without naming the cost means the sponsor chooses without knowing what they are trading.',
      },
      {
        text: 'Decline, explaining that the current scope is already fixed and cannot accommodate additions.',
        tier: 'weak',
        why: 'Protects the plan but treats scope as immovable. The sponsor may well prefer the new question, and only they can make that call.',
      },
      {
        text: 'Agree to look at it only if the deadline moves out by the equivalent amount of time.',
        tier: 'good',
        why: 'Names a real trade-off, but presumes the deadline is the flexible variable. It may be fixed for reasons outside the project, and the scope question is still worth asking.',
      },
    ],
  },
  {
    id: 'p1-expertise',
    phase: 1,
    theme: 'Working with specialist expertise',
    situation:
      '{{analyst}}, the team\'s hydrologist, tells you a modelling approach you proposed "will not work here" but gives no detail. You do not have the background to evaluate the claim yourself.',
    prompt: 'What do you do?',
    options: [
      {
        text: 'Ask {{analyst}} to walk you through what specifically fails, so you can judge whether it rules the approach out entirely or only under certain conditions.',
        tier: 'best',
        why: 'Takes the expertise seriously while still testing the claim. The answer usually reveals either a real constraint you can design around or an assumption worth challenging.',
      },
      {
        text: 'Defer to {{analyst}} and drop the approach. They are the specialist.',
        tier: 'weak',
        why: 'Expertise deserves weight, not automatic deference. An unexamined objection may be about effort or preference rather than feasibility.',
      },
      {
        text: 'Ask a hydrologist outside the team for a second opinion before raising it again.',
        tier: 'good',
        why: 'A reasonable check, but going around a colleague before asking them a direct question costs trust you will need later.',
      },
      {
        text: 'Proceed with the approach and let the results demonstrate whether it works.',
        tier: 'poor',
        why: 'Spends real time to test something a five-minute conversation might settle, and tells your specialist their judgement carries no weight.',
      },
    ],
  },
  {
    id: 'p1-stakeholder-map',
    phase: 1,
    theme: 'Stakeholder judgement',
    situation:
      'The restoration plan for {{site}} affects {{partnerOrg}}, who have used the {{ecosystem}} for generations. They were consulted once, early, and not since. The plan has changed substantially since then.',
    prompt: 'What is the right next step?',
    options: [
      {
        text: 'Go back to them with the current plan and what changed, early enough that their input can still alter it.',
        tier: 'best',
        why: 'Consultation is only real while the outcome can still move. Returning before decisions harden is both fairer and cheaper than reopening later.',
      },
      {
        text: 'Wait until the plan is finalised, then present it to them clearly and completely.',
        tier: 'weak',
        why: 'Presenting a settled plan is informing, not consulting. It invites exactly the late objection that forces expensive rework.',
      },
      {
        text: 'Send them the revised documents and invite written comments by a set date.',
        tier: 'good',
        why: 'Better than silence and creates a record, but a document drop asks them to do the work of interpretation and tends to surface only the most confident voices.',
      },
      {
        text: 'Treat the original consultation as sufficient, since the project scope has not formally changed.',
        tier: 'poor',
        why: 'The plan changed substantially. Leaning on a formal technicality is how projects lose the community consent they depend on.',
      },
    ],
  },
  {
    id: 'p1-baseline',
    phase: 1,
    theme: 'Decisions under missing information',
    situation:
      'You discover the project never established a proper baseline for {{ecosystem}} condition before intervention began. Without it, you cannot cleanly attribute any improvement to the work.',
    prompt: 'How do you handle this?',
    options: [
      {
        text: 'Tell {{sponsor}} now, alongside the best reconstruction you can assemble from historical records and what it would and would not support.',
        tier: 'best',
        why: 'Surfaces a limitation that will otherwise emerge at the worst moment, and pairs the problem with a practical option rather than handing over just the bad news.',
      },
      {
        text: 'Reconstruct a baseline from historical records and proceed without flagging it, since the reconstruction is reasonable.',
        tier: 'poor',
        why: 'A reconstructed baseline carries uncertainty the sponsor needs to know about. Presenting it as equivalent to a measured one misrepresents how strong the eventual claim is.',
      },
      {
        text: 'Report outcomes in absolute terms only, avoiding any before-and-after claim.',
        tier: 'good',
        why: 'Honest and avoids overclaiming, but quietly abandons the attribution question the sponsor is funding the work to answer, without telling them.',
      },
      {
        text: 'Establish a baseline now and treat the current state as the starting point.',
        tier: 'weak',
        why: 'Useful going forward, but silently redefines the project as measuring from mid-intervention. That needs to be a stated decision, not a substitution.',
      },
    ],
  },
];
