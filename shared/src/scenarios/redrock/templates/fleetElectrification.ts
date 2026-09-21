import type { Rng } from '../../../rng.js';
import type { RedrockTemplate } from '../types.js';
import { table, bar, line, note } from '../build.js';
import { pctOf, pctChange, weightedAvg, sum, round, PCT_TOL } from '../math.js';

/**
 * A logistics operator weighing electric vans. Tests cost-per-km comparison,
 * payback period, utilisation-weighted averages and fleet mix.
 */
export const fleetElectrification: RedrockTemplate = {
  id: 'fleet-electrification',
  label: 'Fleet electrification',

  build(rng: Rng) {
    const depots = ['Eastgate', 'Junction 9', 'Portside', 'Kilnbrook'];
    const vans = depots.map(() => rng.int(40, 165));
    const totalVans = sum(vans);

    const dieselCostKm = rng.float(0.42, 0.68, 3);
    const electricCostKm = round(dieselCostKm * rng.float(0.44, 0.72, 3), 3);
    const kmPerVanYear = rng.int(24000, 52000);
    const premiumPerVan = rng.int(11000, 24000);

    const savingPerVanYear = (dieselCostKm - electricCostKm) * kmPerVanYear;
    const payback = premiumPerVan / savingPerVanYear;

    const years = [2022, 2023, 2024, 2025];
    const dieselPrice = years.map((_, i) => round(1.42 + i * rng.float(0.03, 0.14, 3), 2));

    const routeTypes = ['Urban', 'Suburban', 'Trunk'];
    const routeShare = routeTypes.map(() => rng.int(15, 55));
    const routeUtil = routeTypes.map(() => rng.float(51, 92, 1));

    const focusIdx = rng.int(0, depots.length - 1);

    const exhibits = [
      table(
        'ex-fleet',
        'Fleet by depot',
        ['Depot', 'Vans', 'Avg age (yrs)'],
        depots.map((d, i) => [d, vans[i], rng.float(2.1, 9.4, 1)]),
        { source: 'Operations' },
      ),
      table(
        'ex-cost',
        'Running cost per kilometre',
        ['Powertrain', 'Cost per km ($)', 'Annual km per van'],
        [
          ['Diesel', dieselCostKm, kmPerVanYear],
          ['Electric', electricCostKm, kmPerVanYear],
        ],
        { source: 'Finance', caption: 'Fuel, maintenance and tyres. Excludes purchase price.' },
      ),
      note(
        'ex-premium',
        'Purchase price premium',
        `An electric van costs $${premiumPerVan.toLocaleString()} more to buy than the equivalent diesel. There is no difference in residual value at end of life, and no grant currently applies to vehicles of this class.`,
        { source: 'Procurement' },
      ),
      table(
        'ex-routes',
        'Route mix and vehicle utilisation',
        ['Route type', 'Share of fleet (%)', 'Utilisation (%)'],
        routeTypes.map((r, i) => [r, routeShare[i], routeUtil[i]]),
        { source: 'Operations' },
      ),

      // ---- Decoys ----
      line(
        'ex-dieselprice',
        'Retail diesel price',
        [{ name: '$/litre', points: years.map((y, i) => ({ label: String(y), value: dieselPrice[i] })) }],
        { source: 'Market data', caption: 'National average pump price.' },
      ),
      bar(
        'ex-incidents',
        'Reportable incidents by depot',
        depots.map((d) => ({ label: d, value: rng.int(1, 19) })),
        { source: 'Safety' },
      ),
      table(
        'ex-drivers',
        'Driver headcount and turnover',
        ['Depot', 'Drivers', 'Turnover (%)'],
        depots.map((d) => [d, rng.int(55, 210), rng.float(8, 31, 1)]),
        { source: 'People team' },
      ),
      note(
        'ex-charging',
        'Depot charging feasibility',
        'All four depots have a grid connection sufficient for overnight charging at the depot. Two would need a switchgear upgrade, scheduled within the existing maintenance budget. No depot requires a new substation.',
        { source: 'Facilities' },
      ),
      bar(
        'ex-parcels',
        'Parcels delivered per depot per day',
        depots.map((d) => ({ label: d, value: rng.int(2200, 9400) })),
        { source: 'Operations' },
      ),
    ];

    const maxPayback = rng.int(4, 7);

    return {
      title: 'Fleet electrification',
      client: 'Meridian Freight',
      brief: `Meridian Freight operates ${totalVans} delivery vans across ${depots.length} depots. Procurement wants to switch new purchases to electric. Finance will not approve a switch that takes too long to pay back the higher purchase price.`,
      objective: `Recommend whether Meridian should switch new van purchases to electric. Finance requires a payback period of ${maxPayback} years or less.`,
      exhibits,
      relevantExhibitIds: ['ex-fleet', 'ex-cost', 'ex-premium', 'ex-routes'],
      analysis: [
        {
          id: 'q1',
          prompt: `What share of the fleet sits at the ${depots[focusIdx]} depot?`,
          unit: '%' as const,
          answer: round(pctOf(vans[focusIdx], totalVans), 1),
          tolerance: PCT_TOL,
          decimals: 1,
          requiredExhibits: ['ex-fleet'],
          explanation: `${vans[focusIdx]} vans out of ${totalVans} across all depots.`,
        },
        {
          id: 'q2',
          prompt: 'By what percentage is the electric running cost per kilometre below diesel?',
          unit: '%' as const,
          answer: round(Math.abs(pctChange(dieselCostKm, electricCostKm)), 1),
          tolerance: PCT_TOL,
          decimals: 1,
          requiredExhibits: ['ex-cost'],
          explanation: `The gap between $${dieselCostKm} and $${electricCostKm}, expressed against the diesel figure.`,
        },
        {
          id: 'q3',
          prompt: 'What is the payback period on the electric purchase premium for a single van?',
          unit: 'yrs' as const,
          answer: round(payback, 2),
          tolerance: 0.2,
          decimals: 2,
          requiredExhibits: ['ex-cost', 'ex-premium'],
          explanation: `The $${premiumPerVan.toLocaleString()} premium divided by annual savings of $${Math.round(savingPerVanYear).toLocaleString()}, itself the per-km gap times ${kmPerVanYear.toLocaleString()} km.`,
        },
        {
          id: 'q4',
          prompt: 'What is the fleet-share-weighted average utilisation across route types?',
          unit: '%' as const,
          answer: round(weightedAvg(routeUtil.map((u, i) => [u, routeShare[i]] as [number, number])), 1),
          tolerance: PCT_TOL,
          decimals: 1,
          requiredExhibits: ['ex-routes'],
          explanation: 'Each utilisation figure weighted by that route type\'s share of the fleet.',
        },
      ],
      report: {
        preamble: 'Draft the recommendation for the finance committee.',
        sentence: `We recommend {{option}}. Payback lands at {{payback}} years against a {{threshold}}-year ceiling, with electric running {{saving}}% cheaper per kilometre.`,
        options: [
          { id: 'opt-switch', text: 'switching all new van purchases to electric', verdict: 'switch' },
          { id: 'opt-defer', text: 'deferring the switch until the purchase premium narrows', verdict: 'defer' },
          { id: 'opt-pilot', text: 'running a single-depot pilot before committing', verdict: 'pilot' },
        ],
        correctVerdict: payback <= maxPayback ? 'switch' : 'defer',
        decisionQuestionId: 'q3',
        threshold: maxPayback,
        // Lower payback is better, so the verdicts invert.
        verdictAbove: 'defer',
        verdictBelow: 'switch',
        blanks: [
          { id: 'payback', label: 'Payback period', fromQuestionId: 'q3', unit: 'yrs' },
          { id: 'saving', label: 'Running-cost saving', fromQuestionId: 'q2', unit: '%' },
        ],
        chartChoices: [
          { id: 'ch-cost', label: 'Bar chart comparing running cost per km by powertrain' },
          { id: 'ch-incidents', label: 'Bar chart of reportable incidents by depot' },
          { id: 'ch-parcels', label: 'Bar chart of parcels delivered per depot' },
        ],
        correctChartId: 'ch-cost',
      },
    };
  },
};
