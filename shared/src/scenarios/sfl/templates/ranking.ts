import type { RankingTemplate } from '../types.js';

/**
 * The opening prioritisation task. Items are listed here in their correct
 * order; the generator shuffles them before presentation.
 */
export const RANKING_TEMPLATES: RankingTemplate[] = [
  {
    id: 'rank-first-week',
    prompt: 'Order these for your first week on the {{site}} project, most important first.',
    note: 'You have limited time and cannot do all of them well.',
    items: [
      {
        id: 'r1',
        text: 'Establish what decision the project actually has to deliver, and by when',
        why: 'Everything else is only useful once you know what the work is for. Without it you cannot tell which data or which relationship matters.',
      },
      {
        id: 'r2',
        text: 'Review the existing evidence base and identify the gaps that would change the answer',
        why: 'Tells you where the real uncertainty sits, which is what should drive how you spend the remaining weeks.',
      },
      {
        id: 'r3',
        text: 'Meet {{partnerOrg}} to understand their position and constraints',
        why: 'Their consent shapes what is deliverable. Late discovery of an objection is one of the most expensive failures available.',
      },
      {
        id: 'r4',
        text: 'Agree working arrangements and decision rights with {{sponsor}}',
        why: 'Important, but it can be settled quickly once you know what the project is delivering, and misjudging it early is easy to correct.',
      },
      {
        id: 'r5',
        text: 'Rebuild the project schedule in full detail',
        why: 'Premature. A detailed schedule built before you understand the decision or the evidence gaps will be rewritten within a fortnight.',
      },
    ],
  },
  {
    id: 'rank-final-weeks',
    prompt: 'With {{daysLeft}} days left, order these by priority, most important first.',
    note: 'Not all of them will get done.',
    items: [
      {
        id: 'r1',
        text: 'Resolve the one open question that could still change the recommendation',
        why: 'The only remaining work that can alter the answer. Everything else refines a conclusion that may be wrong.',
      },
      {
        id: 'r2',
        text: 'Give {{sponsor}} early warning of anything in the findings they will find difficult',
        why: 'Surprise is what damages trust, not bad news. This has to happen before the room, and it costs very little time.',
      },
      {
        id: 'r3',
        text: 'Make sure {{partnerOrg}} can sustain the monitoring after the team leaves',
        why: 'Determines whether the restoration holds. Urgent only because the window closes when you do, but it outlasts everything else here.',
      },
      {
        id: 'r4',
        text: 'Tighten the written analysis and supporting appendices',
        why: 'Genuine quality work, but it improves the presentation of the answer rather than the answer itself.',
      },
      {
        id: 'r5',
        text: 'Produce a polished slide deck for the final presentation',
        why: 'Lowest leverage. Presentation quality matters least when the underlying question, the relationships and the handover are unresolved.',
      },
    ],
  },
  {
    id: 'rank-crisis',
    prompt: 'A storm has damaged part of the {{site}} works. Order your response, most important first.',
    note: 'The team is small and cannot run these in parallel.',
    items: [
      {
        id: 'r1',
        text: 'Establish whether anyone is at risk and whether the damage is still progressing',
        why: 'Safety and active deterioration come before assessment. Nothing else matters if the situation is still getting worse.',
      },
      {
        id: 'r2',
        text: 'Assess the extent of the damage and what is recoverable',
        why: 'You cannot make any sensible decision, or tell anyone anything useful, until you know the scale.',
      },
      {
        id: 'r3',
        text: 'Inform {{sponsor}} and {{partnerOrg}} with what is known so far',
        why: 'Early even when incomplete, because they may hear it elsewhere. But it lands better once you can say roughly how bad it is.',
      },
      {
        id: 'r4',
        text: 'Revise the project plan and timeline to reflect the setback',
        why: 'Necessary, but replanning before the damage is assessed produces a plan you will immediately discard.',
      },
      {
        id: 'r5',
        text: 'Document the event thoroughly for the lessons-learned record',
        why: 'Genuinely valuable and easy to prioritise too early. It can wait until the response is under control.',
      },
    ],
  },
];
