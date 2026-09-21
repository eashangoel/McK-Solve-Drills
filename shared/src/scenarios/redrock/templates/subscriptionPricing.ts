import type { Rng } from '../../../rng.js';
import type { RedrockTemplate } from '../types.js';
import { table, bar, line, note } from '../build.js';
import { pctOf, pctChange, weightedAvg, sum, round, PCT_TOL } from '../math.js';

/**
 * A software business resetting its pricing. Tests churn maths, revenue mix,
 * blended ARPU and the net effect of a price rise against expected attrition.
 */
export const subscriptionPricing: RedrockTemplate = {
  id: 'subscription-pricing',
  label: 'Subscription pricing reset',

  build(rng: Rng) {
    const tiers = ['Starter', 'Team', 'Business', 'Enterprise'];
    const subs = tiers.map(() => rng.int(400, 9200));
    const price = tiers.map((_, i) => rng.int(9 + i * 22, 28 + i * 60));
    const totalSubs = sum(subs);
    const mrr = subs.map((s, i) => s * price[i]);
    const totalMrr = sum(mrr);

    const focusIdx = rng.int(0, tiers.length - 1);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const churnStart = rng.float(1.8, 4.6, 2);
    const churn = months.map((_, i) => round(churnStart + i * rng.float(-0.18, 0.26, 3), 2));

    const priceRise = rng.int(6, 22);
    const expectedAttrition = rng.float(2.5, 11, 1);
    // Net revenue effect of raising price while losing some subscribers.
    const netEffect = ((1 + priceRise / 100) * (1 - expectedAttrition / 100) - 1) * 100;

    const exhibits = [
      table(
        'ex-tiers',
        'Subscribers and pricing by tier',
        ['Tier', 'Subscribers', 'Price ($/month)'],
        tiers.map((t, i) => [t, subs[i], price[i]]),
        { source: 'Finance', caption: 'Position at end of the last closed month.' },
      ),
      bar(
        'ex-mrr',
        'Monthly recurring revenue by tier',
        tiers.map((t, i) => ({ label: t, value: mrr[i] })),
        { source: 'Finance', unit: '$' },
      ),
      note(
        'ex-proposal',
        'Proposed pricing change',
        `Product proposes an across-the-board price rise of ${priceRise}%. The customer research team expects ${expectedAttrition}% of subscribers to cancel in response, spread evenly across tiers. No change to cost of service is expected.`,
        { source: 'Product' },
      ),
      line(
        'ex-churn',
        'Monthly churn rate',
        [{ name: 'Churn (%)', points: months.map((m, i) => ({ label: m, value: churn[i] })) }],
        { source: 'Customer success', unit: '%' },
      ),

      // ---- Decoys ----
      bar(
        'ex-tickets',
        'Support tickets per 100 subscribers',
        tiers.map((t) => ({ label: t, value: rng.float(2.1, 18.4, 1) })),
        { source: 'Support' },
      ),
      line(
        'ex-nps',
        'Net promoter score',
        [{ name: 'NPS', points: months.map((m) => ({ label: m, value: rng.int(11, 58) })) }],
        { source: 'Survey' },
      ),
      table(
        'ex-headcount',
        'Engineering headcount by squad',
        ['Squad', 'Engineers', 'Open roles'],
        ['Platform', 'Billing', 'Growth', 'Mobile'].map((s) => [s, rng.int(4, 28), rng.int(0, 6)]),
        { source: 'People team' },
      ),
      note(
        'ex-contract',
        'Enterprise contract terms',
        'Enterprise agreements run on annual terms with ninety days notice. Roughly a third renew in each of the first three quarters. Mid-term price changes are not permitted under the standard contract.',
        { source: 'Legal' },
      ),
      bar(
        'ex-uptime',
        'Platform uptime by month',
        months.map((m) => ({ label: m, value: rng.float(99.1, 99.99, 2) })),
        { source: 'Engineering', unit: '%' },
      ),
    ];

    const hurdle = rng.int(3, 9);

    return {
      title: 'Subscription pricing reset',
      client: 'Caldera Software',
      brief: `Caldera Software sells a project-tracking product across ${tiers.length} tiers to ${totalSubs.toLocaleString()} subscribers. Product wants an across-the-board price rise. Finance will approve only if the net revenue effect clears the hurdle, after accounting for the subscribers the rise will cost.`,
      objective: `Recommend whether Caldera should implement the price rise. Finance requires a net revenue uplift of at least ${hurdle}%.`,
      exhibits,
      relevantExhibitIds: ['ex-tiers', 'ex-mrr', 'ex-proposal', 'ex-churn'],
      analysis: [
        {
          id: 'q1',
          prompt: `What share of total monthly recurring revenue comes from the ${tiers[focusIdx]} tier?`,
          unit: '%' as const,
          answer: round(pctOf(mrr[focusIdx], totalMrr), 1),
          tolerance: PCT_TOL,
          decimals: 1,
          requiredExhibits: ['ex-tiers', 'ex-mrr'],
          explanation: `$${mrr[focusIdx].toLocaleString()} of $${totalMrr.toLocaleString()} total monthly recurring revenue.`,
        },
        {
          id: 'q2',
          prompt: 'What is the subscriber-weighted average price across all tiers?',
          unit: '$m' as const,
          answer: round(weightedAvg(price.map((p, i) => [p, subs[i]] as [number, number])), 2),
          tolerance: 0.6,
          decimals: 2,
          requiredExhibits: ['ex-tiers'],
          explanation: 'Each tier price weighted by its subscriber count, not a simple average of the four prices.',
        },
        {
          id: 'q3',
          prompt: `By what percentage did the monthly churn rate change from ${months[0]} to ${months[5]}?`,
          unit: '%' as const,
          answer: round(pctChange(churn[0], churn[5]), 1),
          tolerance: PCT_TOL + 0.4,
          decimals: 1,
          requiredExhibits: ['ex-churn'],
          explanation: `From ${churn[0]}% to ${churn[5]}%, expressed as a change against the starting rate. A negative answer means churn improved.`,
        },
        {
          id: 'q4',
          prompt: 'What is the net effect on revenue of the price rise, after expected cancellations?',
          unit: '%' as const,
          answer: round(netEffect, 1),
          tolerance: PCT_TOL,
          decimals: 1,
          requiredExhibits: ['ex-proposal'],
          explanation: `A ${priceRise}% rise applied to the ${(100 - expectedAttrition).toFixed(1)}% of subscribers who stay. The two effects multiply rather than subtract.`,
        },
      ],
      report: {
        preamble: 'Draft the recommendation for the pricing committee.',
        sentence: `We recommend {{option}}. The net revenue effect is {{net}}% against a {{threshold}}% hurdle, on a weighted average price of ${'$'}{{arpu}}.`,
        options: [
          { id: 'opt-raise', text: 'implementing the price rise across all tiers', verdict: 'raise' },
          { id: 'opt-hold', text: 'holding prices and revisiting after the next renewal cycle', verdict: 'hold' },
          { id: 'opt-segment', text: 'raising prices on upper tiers only', verdict: 'segment' },
        ],
        correctVerdict: netEffect >= hurdle ? 'raise' : 'hold',
        decisionQuestionId: 'q4',
        threshold: hurdle,
        verdictAbove: 'raise',
        verdictBelow: 'hold',
        blanks: [
          { id: 'net', label: 'Net revenue effect', fromQuestionId: 'q4', unit: '%' },
          { id: 'arpu', label: 'Weighted average price', fromQuestionId: 'q2', unit: '$' },
        ],
        chartChoices: [
          { id: 'ch-mrr', label: 'Bar chart of monthly recurring revenue by tier' },
          { id: 'ch-nps', label: 'Line chart of net promoter score' },
          { id: 'ch-uptime', label: 'Bar chart of platform uptime by month' },
        ],
        correctChartId: 'ch-mrr',
      },
    };
  },
};
