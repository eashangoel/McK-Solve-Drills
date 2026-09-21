import type { QuestionTemplate } from '../types.js';

/**
 * Phase 3 — decision under pressure. Time is short and information is
 * incomplete. The recurring test: act on what is decisive, carry the
 * uncertainty openly, and own the call.
 */
export const PHASE_3: QuestionTemplate[] = [
  {
    id: 'p3-incomplete',
    phase: 3,
    theme: 'Deciding with incomplete information',
    situation:
      'The recommendation is due in {{daysLeft}} days. One result that would materially change it is still four weeks from being available. Everything else points one way, but not overwhelmingly.',
    prompt: 'What do you do?',
    options: [
      {
        text: 'Make the recommendation on current evidence, state plainly what the pending result could change, and set out what you would do if it lands the other way.',
        tier: 'best',
        why: 'Gives the decision-maker something actionable now and a pre-agreed response to the one thing that could overturn it. Uncertainty is carried openly rather than hidden or used as a reason to stall.',
      },
      {
        text: 'Recommend waiting four weeks for the outstanding result before committing to a direction.',
        tier: 'weak',
        why: 'Sometimes right, but the deadline presumably exists for a reason. Recommending delay without establishing that the cost of waiting is lower than the cost of being wrong is avoidance.',
      },
      {
        text: 'Present the evidence and the options without recommending, so the decision-maker can weigh the uncertainty themselves.',
        tier: 'poor',
        why: 'You are closest to the evidence. Withholding a recommendation because the picture is imperfect pushes your hardest judgement onto someone with less context.',
      },
      {
        text: 'Make the recommendation on current evidence and note the outstanding result in an appendix.',
        tier: 'good',
        why: 'Decisive and technically complete, but burying a result that could materially change the answer means it may not be read at all.',
      },
    ],
  },
  {
    id: 'p3-late-reversal',
    phase: 3,
    theme: 'Handling a late reversal',
    situation:
      'Two days before the final presentation, {{analyst}} finds an error in the model. Corrected, it does not reverse the recommendation but cuts the projected benefit by roughly a third.',
    prompt: 'What is the right response?',
    options: [
      {
        text: 'Correct the figures, tell {{sponsor}} before the presentation that the number has moved and why, and present the revised case.',
        tier: 'best',
        why: 'The recommendation survives, so the issue is purely about whether the sponsor hears it from you beforehand or discovers it later. Early disclosure of your own error is what makes the rest of your work trustworthy.',
      },
      {
        text: 'Correct the figures and present the revised case without drawing attention to the change.',
        tier: 'weak',
        why: 'The numbers are right, but anyone who saw the earlier version will notice. Letting them find it themselves costs far more credibility than naming it would have.',
      },
      {
        text: 'Present the original figures and issue a correction afterwards, since the recommendation is unchanged either way.',
        tier: 'poor',
        why: 'Knowingly presenting figures you have established are wrong. That the conclusion holds does not make the number honest.',
      },
      {
        text: 'Ask for the presentation to be postponed so the corrected model can be reviewed properly.',
        tier: 'good',
        why: 'Cautious and defensible if the error suggests deeper problems, but a one-third change with a stable conclusion rarely justifies moving a final presentation.',
      },
    ],
  },
  {
    id: 'p3-sponsor-pushback',
    phase: 3,
    theme: 'Holding a position under pressure',
    situation:
      '{{sponsor}} reads the draft and pushes back hard on the central recommendation, arguing you have underweighted the political difficulty. They are not disputing the analysis, only its conclusion.',
    prompt: 'How do you respond?',
    options: [
      {
        text: 'Ask what specifically makes it undeliverable, and whether the answer changes the recommendation or the way it should be sequenced.',
        tier: 'best',
        why: 'Treats their political read as real evidence you lack without abandoning the analysis. Often the substance survives and only the phasing changes.',
      },
      {
        text: 'Hold the recommendation as written; the analysis supports it and deliverability is the sponsor\'s domain, not yours.',
        tier: 'weak',
        why: 'A recommendation that cannot be implemented has not helped anyone. Treating feasibility as someone else\'s problem is how good analysis dies on the shelf.',
      },
      {
        text: 'Soften the recommendation to something {{sponsor}} will accept, since an adopted partial measure beats a rejected full one.',
        tier: 'poor',
        why: 'Changes the conclusion to suit the audience rather than the evidence. If the original was right, the sponsor now has neither the honest answer nor a record of it.',
      },
      {
        text: 'Present both the original recommendation and a politically lighter alternative, and let {{sponsor}} choose.',
        tier: 'good',
        why: 'Honest and gives them agency, but without a stated view on which is better you have converted a recommendation into a menu.',
      },
    ],
  },
  {
    id: 'p3-scale-back',
    phase: 3,
    theme: 'Proportionate response to new risk',
    situation:
      'Late monitoring suggests the restored area at {{site}} may be more vulnerable to {{season}} than modelled. The evidence is one season of data and could be normal variation.',
    prompt: 'What action do you take?',
    options: [
      {
        text: 'Name it as an unconfirmed risk, put in place the cheapest monitoring that would confirm or dismiss it, and set a threshold that would trigger a bigger response.',
        tier: 'best',
        why: 'Matches the response to the strength of the evidence, and decides the trigger in advance rather than in the middle of a crisis.',
      },
      {
        text: 'Treat it as a live risk and recommend scaling back the intervention until more data is available.',
        tier: 'weak',
        why: 'Over-reacts to a single season. Scaling back has real costs and may itself increase vulnerability during the period you are worried about.',
      },
      {
        text: 'Note it in the report as an area for future research and proceed as planned.',
        tier: 'good',
        why: 'Reasonable given how weak the evidence is, but "future research" with no owner and no trigger usually means nobody looks again until it is a problem.',
      },
      {
        text: 'Leave it out until a second season confirms the pattern, to avoid alarming stakeholders over normal variation.',
        tier: 'poor',
        why: 'Withholding a known risk because it might be nothing takes a decision that belongs to the people carrying the consequences.',
      },
    ],
  },
  {
    id: 'p3-handover-out',
    phase: 3,
    theme: 'Sustaining results beyond the team',
    situation:
      'Your involvement at {{site}} ends in {{deadlineWeeks}} weeks. The restoration needs active management for years. {{partnerOrg}} is willing to take it on but has no experience with this kind of monitoring.',
    prompt: 'What do you prioritise in the time remaining?',
    options: [
      {
        text: 'Build the monitoring routine around what they can realistically sustain, and train them on it while you are still there to correct mistakes.',
        tier: 'best',
        why: 'A simpler protocol they actually run beats a rigorous one they abandon. Training while you can still observe and correct is the part that cannot be done remotely.',
      },
      {
        text: 'Write a thorough monitoring manual covering every protocol, so they have a complete reference.',
        tier: 'good',
        why: 'Valuable and durable, but a manual alone rarely transfers a practical skill, and complete coverage tends to produce a document nobody opens.',
      },
      {
        text: 'Recommend that {{sponsorOrg}} fund a professional monitoring contractor instead.',
        tier: 'weak',
        why: 'Might produce better data while funded, but it removes local ownership and creates a dependency that ends when the money does.',
      },
      {
        text: 'Focus the remaining time on completing the final report to the highest standard, since that is the contracted deliverable.',
        tier: 'poor',
        why: 'Optimises for the deliverable over the outcome. A polished report on a restoration that degrades afterwards has not achieved the project\'s purpose.',
      },
    ],
  },
  {
    id: 'p3-final-call',
    phase: 3,
    theme: 'Owning the recommendation',
    situation:
      'The team is split. {{lead}} favours the ambitious intervention; {{analyst}} favours the conservative one. The evidence genuinely supports either. You have to sign the recommendation.',
    prompt: 'How do you decide?',
    options: [
      {
        text: 'Identify which risks each option exposes {{sponsorOrg}} to, pick the one whose failure mode is most recoverable, and state why in the recommendation.',
        tier: 'best',
        why: 'When evidence cannot separate the options, asymmetry of consequences can. Recording the reasoning lets the decision be revisited sensibly if things change.',
      },
      {
        text: 'Go with the conservative option, since it carries less downside when the evidence is ambiguous.',
        tier: 'good',
        why: 'Often the right instinct, but applied as a rule rather than a judgement. The conservative option can carry the larger risk when the cost of under-acting is high.',
      },
      {
        text: 'Present both options with equal weight and let {{sponsor}} make the final call.',
        tier: 'weak',
        why: 'You were asked for a recommendation. Genuine ambiguity is a reason to explain your reasoning, not to decline to reason.',
      },
      {
        text: 'Side with {{lead}}, whose longer experience of {{site}} should carry the most weight.',
        tier: 'poor',
        why: 'Substitutes seniority for reasoning. It also wastes the disagreement, which was the most useful signal available.',
      },
    ],
  },
];
