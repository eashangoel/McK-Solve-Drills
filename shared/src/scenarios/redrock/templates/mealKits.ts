import type { Rng } from '../../../rng.js';
import type { RedrockTemplate } from '../types.js';
import { table, bar, line, note } from '../build.js';
import { pctOf, cagr, weightedAvg, breakEven, sum, round, PCT_TOL, RATIO_TOL, MONEY_TOL } from '../math.js';

/**
 * A regional grocery chain weighing a meal-kit line. Tests revenue mix,
 * market CAGR, blended margin and break-even volume.
 */
export const mealKits: RedrockTemplate = {
  id: 'meal-kits',
  label: 'Meal-kit market entry',

  build(rng: Rng) {
    const regions = ['Northern', 'Coastal', 'Central', 'Southern'];
    const revenue = regions.map(() => rng.int(180, 640));
    const totalRev = sum(revenue);
    const focusIdx = rng.int(0, regions.length - 1);
    const focusRegion = regions[focusIdx];

    // Market size over 5 years, compounding at a hidden rate.
    const years = [2021, 2022, 2023, 2024, 2025];
    const mkt0 = rng.int(420, 900);
    const trueGrowth = rng.float(0.06, 0.19, 3);
    const market = years.map((_, i) => Math.round(mkt0 * (1 + trueGrowth) ** i));

    // Segment margins and volumes for a blended-margin question.
    const segments = ['Premium', 'Family', 'Value'];
    const segMargin = segments.map(() => rng.float(11, 38, 1));
    const segVolume = segments.map(() => rng.int(120, 520));

    // Unit economics for break-even.
    const price = rng.float(9.5, 17.5, 2);
    const varCost = round(price * rng.float(0.52, 0.74, 3), 2);
    const fixedCost = rng.int(1400, 4200) * 1000;

    const answers = {
      share: pctOf(revenue[focusIdx], totalRev),
      cagr: cagr(market[0], market[4], 4),
      blended: weightedAvg(segMargin.map((m, i) => [m, segVolume[i]] as [number, number])),
      breakEvenK: breakEven(fixedCost, price, varCost) / 1000,
    };

    const exhibits = [
      table(
        'ex-revenue',
        'Grocery revenue by region, FY2025',
        ['Region', 'Revenue ($m)', 'Stores'],
        regions.map((r, i) => [r, revenue[i], rng.int(18, 74)]),
        { source: 'Finance', caption: 'Audited full-year figures.' },
      ),
      line(
        'ex-market',
        'National meal-kit market size',
        [{ name: 'Market ($m)', points: years.map((y, i) => ({ label: String(y), value: market[i] })) }],
        { source: 'Market research', unit: '$m' },
      ),
      table(
        'ex-segments',
        'Meal-kit segment economics (pilot)',
        ['Segment', 'Gross margin (%)', 'Weekly volume (k units)'],
        segments.map((s, i) => [s, segMargin[i], segVolume[i]]),
        { source: 'Pilot programme', caption: 'Twelve-week pilot across six stores.' },
      ),
      table(
        'ex-unit',
        'Meal-kit unit economics',
        ['Line item', 'Value'],
        [
          ['Average price per kit', `$${price.toFixed(2)}`],
          ['Variable cost per kit', `$${varCost.toFixed(2)}`],
          ['Annual fixed cost', `$${(fixedCost / 1000).toLocaleString()}k`],
        ],
        { source: 'Finance' },
      ),

      // ---- Decoys: plausible, well-presented, and not needed ----
      bar(
        'ex-headcount',
        'Store headcount by region',
        regions.map((r) => ({ label: r, value: rng.int(240, 980) })),
        { source: 'People team', caption: 'Full-time equivalents.' },
      ),
      line(
        'ex-satisfaction',
        'Customer satisfaction index',
        [
          { name: 'Our stores', points: years.map((y) => ({ label: String(y), value: rng.float(72, 89, 1) })) },
          { name: 'Category average', points: years.map((y) => ({ label: String(y), value: rng.float(70, 84, 1) })) },
        ],
        { source: 'Brand tracker' },
      ),
      table(
        'ex-suppliers',
        'Supplier lead times',
        ['Supplier', 'Lead time (days)', 'On-time rate (%)'],
        ['Fenwick Produce', 'Alder Foods', 'Rowan Cold Chain', 'Mistral Packaging'].map((s) => [
          s,
          rng.int(2, 16),
          rng.float(86, 99, 1),
        ]),
        { source: 'Supply chain' },
      ),
      note(
        'ex-regulatory',
        'Cold-chain labelling rules',
        'Chilled ready-to-cook kits must carry a use-by date within seven days of packing. Three of the four candidate regions have adopted the national standard; the remaining region is expected to follow next year. No fee is attached to compliance.',
        { source: 'Legal' },
      ),
      bar(
        'ex-awareness',
        'Unaided brand awareness',
        regions.map((r) => ({ label: r, value: rng.float(18, 56, 1) })),
        { source: 'Brand tracker', unit: '%' },
      ),
    ];

    const threshold = round(rng.float(19, 27, 0), 0);

    return {
      title: 'Meal-kit market entry',
      client: 'Harbourline Grocers',
      brief: `Harbourline Grocers runs ${regions.length} regional store networks and is deciding whether to launch an own-brand meal-kit line. A twelve-week pilot has finished. The board wants a recommendation grounded in the pilot economics and the size of the opportunity, not in enthusiasm.`,
      objective: `Decide whether Harbourline should launch the meal-kit line. The board will back a launch only if the blended gross margin clears ${threshold}%.`,
      exhibits,
      relevantExhibitIds: ['ex-revenue', 'ex-market', 'ex-segments', 'ex-unit'],
      analysis: [
        {
          id: 'q1',
          prompt: `What share of FY2025 grocery revenue came from the ${focusRegion} region?`,
          unit: '%' as const,
          answer: round(answers.share, 1),
          tolerance: PCT_TOL,
          decimals: 1,
          requiredExhibits: ['ex-revenue'],
          explanation: `${focusRegion} revenue of $${revenue[focusIdx]}m divided by the $${totalRev}m total.`,
        },
        {
          id: 'q2',
          prompt: `What was the compound annual growth rate of the national meal-kit market from ${years[0]} to ${years[4]}?`,
          unit: '%' as const,
          answer: round(answers.cagr, 1),
          tolerance: PCT_TOL,
          decimals: 1,
          requiredExhibits: ['ex-market'],
          explanation: `($${market[4]}m / $${market[0]}m) to the power of 1/4, minus 1. Four growth periods span five data points.`,
        },
        {
          id: 'q3',
          prompt: 'What is the volume-weighted blended gross margin across the three pilot segments?',
          unit: '%' as const,
          answer: round(answers.blended, 1),
          tolerance: PCT_TOL,
          decimals: 1,
          requiredExhibits: ['ex-segments'],
          explanation: `Each segment margin weighted by its weekly volume, not a simple average of ${segMargin.join('%, ')}%.`,
        },
        {
          id: 'q4',
          prompt: 'How many kits must be sold annually to break even on the fixed cost?',
          unit: 'k units' as const,
          answer: round(answers.breakEvenK, 1),
          tolerance: Math.max(RATIO_TOL, round(answers.breakEvenK * 0.02, 1)),
          decimals: 1,
          requiredExhibits: ['ex-unit'],
          explanation: `Fixed cost of $${(fixedCost / 1000).toLocaleString()}k divided by the $${round(price - varCost, 2)} contribution per kit.`,
        },
      ],
      report: {
        preamble: `Draft the recommendation for the board. Use the figures you calculated.`,
        sentence: `We recommend {{option}}. The blended gross margin is {{margin}}%, against a {{threshold}}% hurdle, and the market is compounding at {{growth}}% a year.`,
        options: [
          { id: 'opt-launch', text: 'launching the meal-kit line across all regions', verdict: 'launch' },
          { id: 'opt-hold', text: 'holding the launch and re-testing the pilot economics', verdict: 'hold' },
          { id: 'opt-partner', text: 'licensing a third-party brand instead of building our own', verdict: 'partner' },
        ],
        correctVerdict: answers.blended >= threshold ? 'launch' : 'hold',
        decisionQuestionId: 'q3',
        threshold,
        verdictAbove: 'launch',
        verdictBelow: 'hold',
        blanks: [
          { id: 'margin', label: 'Blended gross margin', fromQuestionId: 'q3', unit: '%' },
          { id: 'growth', label: 'Market CAGR', fromQuestionId: 'q2', unit: '%' },
        ],
        chartChoices: [
          { id: 'ch-market', label: 'Line chart of market size over five years' },
          { id: 'ch-awareness', label: 'Bar chart of unaided brand awareness by region' },
          { id: 'ch-headcount', label: 'Bar chart of store headcount by region' },
        ],
        correctChartId: 'ch-market',
      },
    };
  },
};
