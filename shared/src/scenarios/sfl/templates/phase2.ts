import type { QuestionTemplate } from '../types.js';

/**
 * Phase 2 — complication. The project is under way and something has gone
 * wrong. The recurring test: respond proportionately, address causes rather
 * than symptoms, and keep the people who need to know informed.
 */
export const PHASE_2: QuestionTemplate[] = [
  {
    id: 'p2-bad-news',
    phase: 2,
    theme: 'Communicating unwelcome findings',
    situation:
      'Your analysis shows the intervention at {{site}} is unlikely to meet its headline target. {{sponsorOrg}} has already publicised the target. The finding is solid but you are {{daysLeft}} days from the review meeting.',
    prompt: 'What do you do?',
    options: [
      {
        text: 'Tell {{sponsor}} before the meeting, with what you now expect to achieve and what would have to change to close the gap.',
        tier: 'best',
        why: 'Gives the sponsor time to absorb it and decide how to handle the public position. Being surprised in the room is far worse for them than hearing it early.',
      },
      {
        text: 'Present the finding at the review meeting as scheduled, with full supporting analysis.',
        tier: 'weak',
        why: 'Honest and complete, but ambushes the sponsor in front of an audience on something they have staked their credibility on. The same content lands very differently delivered early.',
      },
      {
        text: 'Re-examine the analysis first to be certain, then raise it if it still holds after the review.',
        tier: 'poor',
        why: 'You already describe the finding as solid. Deferring past the review lets the sponsor reaffirm a target you know is out of reach.',
      },
      {
        text: 'Raise it with {{lead}} and let them decide how and when to tell the sponsor.',
        tier: 'good',
        why: 'Respects the reporting line and is not wrong, but it delays the message and hands off a conversation you are closest to the evidence on.',
      },
    ],
  },
  {
    id: 'p2-inconvenient',
    phase: 2,
    theme: 'Integrity under pressure',
    situation:
      'A colleague suggests excluding one monitoring station from the results. It is the station showing the worst {{contaminant}} readings, and they argue it is unrepresentative because of a nearby road.',
    prompt: 'How do you respond?',
    options: [
      {
        text: 'Ask whether the road effect was a documented exclusion criterion before the data came in, and if not, report the results both ways.',
        tier: 'best',
        why: 'The test is whether the reason predates the inconvenient result. Reporting both ways keeps the decision visible to readers instead of buried in a methods note.',
      },
      {
        text: 'Exclude it, since a roadside station genuinely is unrepresentative of the wider {{ecosystem}}.',
        tier: 'poor',
        why: 'The justification may be sound, but adopting it only after seeing which way it moves the answer is how selective reporting happens, whatever the intent.',
      },
      {
        text: 'Keep the station in and note the road as a possible confounder in the write-up.',
        tier: 'good',
        why: 'Defensible and transparent, but if the road effect is real this understates performance. The colleague may be right, which is worth testing rather than dismissing.',
      },
      {
        text: 'Escalate to {{sponsor}} as a possible attempt to manipulate the findings.',
        tier: 'weak',
        why: 'Disproportionate to what is, on its face, an ordinary methodological argument. Escalating before asking the clarifying question damages a working relationship you need.',
      },
    ],
  },
  {
    id: 'p2-slipping',
    phase: 2,
    theme: 'Managing a slipping timeline',
    situation:
      'Fieldwork has fallen two weeks behind because {{season}} arrived early. The deadline has not moved. Recovering the full schedule would mean cutting the sampling interval roughly in half.',
    prompt: 'What is the best course?',
    options: [
      {
        text: 'Work out which parts of the analysis actually depend on the full sampling density, protect those, and thin the rest.',
        tier: 'best',
        why: 'Treats the schedule as a set of separable commitments rather than one block. Usually only a portion of the work truly needs full density.',
      },
      {
        text: 'Halve the sampling interval across the board to recover the schedule.',
        tier: 'weak',
        why: 'Uniform cuts degrade the conclusions that matter alongside the ones that do not. It is the simplest response, not the best one.',
      },
      {
        text: 'Keep the sampling plan intact and tell {{sponsor}} the deadline will slip by two weeks.',
        tier: 'good',
        why: 'Protects data quality and is honest, but treats the deadline as the only flexible variable before checking whether the plan itself has slack.',
      },
      {
        text: 'Add field hours and weekend shifts to catch up without changing the plan.',
        tier: 'poor',
        why: 'Buys the schedule with team fatigue, raising error rates in exactly the fieldwork you are trying to protect, and does not survive a second delay.',
      },
    ],
  },
  {
    id: 'p2-team-conflict',
    phase: 2,
    theme: 'Team effectiveness',
    situation:
      '{{analyst}} and {{lead}} disagree sharply about the modelling approach. Both are competent, the disagreement is technical, and it has stalled progress for a week. Others have started routing around both of them.',
    prompt: 'What do you do?',
    options: [
      {
        text: 'Get them to agree on what evidence would settle it, then run that check and abide by the result.',
        tier: 'best',
        why: 'Converts a stalled argument into an answerable question and gives both a way to change position without conceding. It also unblocks the rest of the team.',
      },
      {
        text: 'Make the call yourself on the approach you judge stronger, so the work can move.',
        tier: 'good',
        why: 'Restores momentum, which matters, but spends your authority on a technical question you may be less qualified to judge, and leaves the loser unconvinced.',
      },
      {
        text: 'Let them work it out between themselves; technical disputes usually resolve on their own.',
        tier: 'poor',
        why: 'It has already stalled a week and the team is routing around both. Left alone this hardens into a lasting split.',
      },
      {
        text: 'Escalate to {{sponsor}} and ask them to arbitrate.',
        tier: 'weak',
        why: 'Pushes an internal technical matter to someone with less context, and signals the team cannot resolve its own disagreements.',
      },
    ],
  },
  {
    id: 'p2-partner-friction',
    phase: 2,
    theme: 'Partner relationships',
    situation:
      '{{partnerOrg}} says the team has been sampling in an area they asked to be left undisturbed during {{season}}. Your records show the request was noted but never made it into the field protocol.',
    prompt: 'How do you handle it?',
    options: [
      {
        text: 'Acknowledge the failure plainly, stop sampling there now, and fix the protocol so agreements reach the field team.',
        tier: 'best',
        why: 'Owns the error without hedging, stops the harm immediately, and repairs the process gap that caused it rather than just the instance.',
      },
      {
        text: 'Stop sampling in that area immediately and apologise, while explaining it was an administrative oversight rather than a deliberate choice.',
        tier: 'good',
        why: 'Right on substance, but leading with the explanation reads as excuse-making, and it leaves the process gap that will produce the next one.',
      },
      {
        text: 'Review the records to confirm the request was binding before changing anything.',
        tier: 'weak',
        why: 'Your records already show it was made and noted. Litigating whether it was binding treats a relationship problem as a contractual one.',
      },
      {
        text: 'Complete the current sampling round, which is nearly finished, then honour the request going forward.',
        tier: 'poor',
        why: 'Continues the thing they objected to for your own convenience, and tells them their requests hold only when costless to you.',
      },
    ],
  },
  {
    id: 'p2-budget',
    phase: 2,
    theme: 'Resource trade-offs',
    situation:
      'You learn of {{budgetPressure}}. The restoration work at {{site}} can continue, but something has to give: monitoring frequency, the community engagement programme, or the final synthesis report.',
    prompt: 'Which do you protect, and how do you decide?',
    options: [
      {
        text: 'Ask what each element is actually for, and cut the one whose loss least damages the project\'s ability to demonstrate and sustain results.',
        tier: 'best',
        why: 'Anchors the cut to purpose rather than to what is easiest to stop. It also produces a rationale you can defend to whoever loses out.',
      },
      {
        text: 'Cut the community engagement programme, since it is the only element not producing analytical output.',
        tier: 'weak',
        why: 'Engagement is what sustains the restoration after the team leaves. Treating non-analytical work as discretionary is a common and expensive error.',
      },
      {
        text: 'Reduce all three proportionally so no single element is gutted.',
        tier: 'poor',
        why: 'Spreads the damage evenly regardless of consequence. A thinner version of all three may leave none of them able to do its job.',
      },
      {
        text: 'Take the decision to {{sponsor}} with the three options and let them choose.',
        tier: 'good',
        why: 'Appropriate to involve them in a decision of this size, but arriving with three options and no recommendation hands back work that is yours.',
      },
    ],
  },
];
