import type { Rng } from '../../../rng.js';
import type { RedrockTemplate } from '../types.js';
import { table, bar, line, note } from '../build.js';
import { pctOf, cagr, weightedAvg, sum, round, PCT_TOL } from '../math.js';

/**
 * A clinic network deciding where to add capacity. Tests throughput maths,
 * demand growth and weighted waiting times.
 */
export const clinicCapacity: RedrockTemplate = {
  id: 'clinic-capacity',
  label: 'Clinic capacity planning',

  build(rng: Rng) {
    const sites = ['Ashford', 'Brightwell', 'Calder Vale', 'Denholm'];
    const rooms = sites.map(() => rng.int(6, 22));
    const dailySlots = rooms.map((r) => r * rng.int(7, 12));
    const totalSlots = sum(dailySlots);
    const waitDays = sites.map(() => rng.int(9, 48));
    const demandShare = sites.map(() => rng.int(12, 40));

    const years = [2021, 2022, 2023, 2024, 2025];
    const ref0 = rng.int(38000, 72000);
    const growth = rng.float(0.04, 0.16, 3);
    const referrals = years.map((_, i) => Math.round(ref0 * (1 + growth) ** i));

    const focusIdx = rng.int(0, sites.length - 1);
    const newRoomCost = rng.int(85, 240) * 1000;
    const slotsPerNewRoom = rng.int(7, 12);
    const revenuePerSlot = rng.int(48, 135);
    const workingDays = 245;

    const annualRevenuePerRoom = slotsPerNewRoom * revenuePerSlot * workingDays;
    const paybackMonths = (newRoomCost / annualRevenuePerRoom) * 12;

    const exhibits = [
      table(
        'ex-capacity',
        'Consulting capacity by site',
        ['Site', 'Rooms', 'Daily appointment slots'],
        sites.map((s, i) => [s, rooms[i], dailySlots[i]]),
        { source: 'Operations' },
      ),
      table(
        'ex-wait',
        'Waiting time and demand share',
        ['Site', 'Median wait (days)', 'Share of referrals (%)'],
        sites.map((s, i) => [s, waitDays[i], demandShare[i]]),
        { source: 'Patient access' },
      ),
      line(
        'ex-referrals',
        'Annual referrals received',
        [{ name: 'Referrals', points: years.map((y, i) => ({ label: String(y), value: referrals[i] })) }],
        { source: 'Patient access' },
      ),
      table(
        'ex-roomecon',
        'Economics of an additional consulting room',
        ['Line item', 'Value'],
        [
          ['Fit-out cost per room', `$${newRoomCost.toLocaleString()}`],
          ['Slots added per day', slotsPerNewRoom],
          ['Net revenue per slot', `$${revenuePerSlot}`],
          ['Working days per year', workingDays],
        ],
        { source: 'Finance' },
      ),

      // ---- Decoys ----
      bar(
        'ex-staff',
        'Clinical staff by site',
        sites.map((s) => ({ label: s, value: rng.int(24, 96) })),
        { source: 'People team' },
      ),
      line(
        'ex-satisfaction',
        'Patient satisfaction score',
        [{ name: 'Score', points: years.map((y) => ({ label: String(y), value: rng.float(3.4, 4.7, 2) })) }],
        { source: 'Survey', caption: 'Five-point scale.' },
      ),
      table(
        'ex-parking',
        'Site facilities',
        ['Site', 'Parking spaces', 'Step-free access'],
        sites.map((s) => [s, rng.int(20, 180), rng.bool(0.7) ? 'Yes' : 'Partial']),
        { source: 'Facilities' },
      ),
      note(
        'ex-accreditation',
        'Accreditation status',
        'All four sites hold current accreditation, renewed on a three-year cycle. The next renewal falls due at Brightwell, and no site has outstanding conditions attached.',
        { source: 'Quality' },
      ),
      bar(
        'ex-dna',
        'Did-not-attend rate by site',
        sites.map((s) => ({ label: s, value: rng.float(4, 17, 1) })),
        { source: 'Patient access', unit: '%' },
      ),
    ];

    const maxPayback = rng.int(14, 30);

    return {
      title: 'Clinic capacity planning',
      client: 'Wellstone Clinics',
      brief: `Wellstone Clinics runs ${sites.length} outpatient sites. Waiting times have drifted upward and the board has released capital for additional consulting rooms, but only where the investment pays back quickly enough.`,
      objective: `Recommend whether Wellstone should fund additional consulting rooms. Capital is released only where payback is within ${maxPayback} months.`,
      exhibits,
      relevantExhibitIds: ['ex-capacity', 'ex-wait', 'ex-referrals', 'ex-roomecon'],
      analysis: [
        {
          id: 'q1',
          prompt: `What share of total daily appointment slots does ${sites[focusIdx]} provide?`,
          unit: '%' as const,
          answer: round(pctOf(dailySlots[focusIdx], totalSlots), 1),
          tolerance: PCT_TOL,
          decimals: 1,
          requiredExhibits: ['ex-capacity'],
          explanation: `${dailySlots[focusIdx]} slots out of ${totalSlots} network-wide.`,
        },
        {
          id: 'q2',
          prompt: `What was the compound annual growth rate in referrals from ${years[0]} to ${years[4]}?`,
          unit: '%' as const,
          answer: round(cagr(referrals[0], referrals[4], 4), 1),
          tolerance: PCT_TOL,
          decimals: 1,
          requiredExhibits: ['ex-referrals'],
          explanation: `From ${referrals[0].toLocaleString()} to ${referrals[4].toLocaleString()} over four growth periods.`,
        },
        {
          id: 'q3',
          prompt: 'What is the referral-weighted median waiting time across the network?',
          unit: '' as const,
          answer: round(weightedAvg(waitDays.map((w, i) => [w, demandShare[i]] as [number, number])), 1),
          tolerance: 0.8,
          decimals: 1,
          requiredExhibits: ['ex-wait'],
          explanation: 'Each site\'s wait weighted by its share of referrals, not a simple average.',
        },
        {
          id: 'q4',
          prompt: 'What is the payback period on one additional consulting room?',
          unit: '' as const,
          answer: round(paybackMonths, 1),
          tolerance: 0.9,
          decimals: 1,
          requiredExhibits: ['ex-roomecon'],
          explanation: `$${newRoomCost.toLocaleString()} divided by annual revenue of $${annualRevenuePerRoom.toLocaleString()}, converted to months.`,
        },
      ],
      report: {
        preamble: 'Draft the recommendation for the capital committee.',
        sentence: `We recommend {{option}}. Payback on a new room is {{payback}} months against a {{threshold}}-month ceiling, while referrals grow at {{growth}}% a year.`,
        options: [
          { id: 'opt-fund', text: 'funding additional consulting rooms now', verdict: 'fund' },
          { id: 'opt-hold', text: 'holding capital and managing demand through scheduling', verdict: 'hold' },
          { id: 'opt-outsource', text: 'outsourcing overflow demand to partner providers', verdict: 'outsource' },
        ],
        correctVerdict: paybackMonths <= maxPayback ? 'fund' : 'hold',
        decisionQuestionId: 'q4',
        threshold: maxPayback,
        verdictAbove: 'hold',
        verdictBelow: 'fund',
        blanks: [
          { id: 'payback', label: 'Payback period (months)', fromQuestionId: 'q4', unit: 'months' },
          { id: 'growth', label: 'Referral CAGR', fromQuestionId: 'q2', unit: '%' },
        ],
        chartChoices: [
          { id: 'ch-referrals', label: 'Line chart of annual referrals over five years' },
          { id: 'ch-parking', label: 'Table of parking spaces by site' },
          { id: 'ch-dna', label: 'Bar chart of did-not-attend rates' },
        ],
        correctChartId: 'ch-referrals',
      },
    };
  },
};
