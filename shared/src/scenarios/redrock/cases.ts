import type { Rng } from '../../rng.js';
import type { CaseQuestion } from './types.js';
import { table, bar, line } from './build.js';
import { pctOf, pctChange, cagr, weightedAvg, breakEven, sum, round, PCT_TOL } from './math.js';

type CaseGen = (rng: Rng, id: string) => CaseQuestion;

/** Builds distractor choices around a correct value. */
function choicesAround(rng: Rng, correct: number, dp: number, unit: string) {
  const spread = Math.max(Math.abs(correct) * 0.18, 1.2);
  const wrong = new Set<number>();
  while (wrong.size < 3) {
    const delta = rng.float(spread * 0.35, spread * 1.6, dp) * (rng.bool() ? 1 : -1);
    const v = round(correct + delta, dp);
    if (Math.abs(v - correct) > spread * 0.25) wrong.add(v);
  }
  const all = rng.shuffle([correct, ...wrong]);
  return all.map((v, i) => ({
    id: `c${i}`,
    label: `${v.toFixed(dp)}${unit}`,
    value: v,
  }));
}

const shareOfTotal: CaseGen = (rng, id) => {
  const names = rng.sample(['Aurora', 'Bellhaven', 'Crestline', 'Dunmore', 'Everly'], 4);
  const values = names.map(() => rng.int(120, 880));
  const total = sum(values);
  const idx = rng.int(0, names.length - 1);
  const answer = round(pctOf(values[idx], total), 1);
  return {
    id,
    prompt: `What share of total units did ${names[idx]} account for?`,
    exhibit: bar(
      `${id}-ex`,
      'Units sold by site',
      names.map((n, i) => ({ label: n, value: values[i] })),
      { source: 'Operations' },
    ),
    unit: '%',
    answer,
    tolerance: PCT_TOL,
    decimals: 1,
    explanation: `${values[idx]} of ${total} total units.`,
  };
};

const growthRate: CaseGen = (rng, id) => {
  const years = [2021, 2022, 2023, 2024, 2025];
  const v0 = rng.int(220, 900);
  const g = rng.float(0.05, 0.21, 3);
  const vals = years.map((_, i) => Math.round(v0 * (1 + g) ** i));
  const answer = round(cagr(vals[0], vals[4], 4), 1);
  return {
    id,
    prompt: `What was the compound annual growth rate from ${years[0]} to ${years[4]}?`,
    exhibit: line(
      `${id}-ex`,
      'Annual revenue',
      [{ name: 'Revenue ($m)', points: years.map((y, i) => ({ label: String(y), value: vals[i] })) }],
      { source: 'Finance', unit: '$m' },
    ),
    unit: '%',
    answer,
    tolerance: PCT_TOL,
    decimals: 1,
    explanation: `(${vals[4]} / ${vals[0]}) ^ (1/4) − 1. Five data points span four growth periods.`,
  };
};

const simpleChange: CaseGen = (rng, id) => {
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const vals = quarters.map(() => rng.int(140, 760));
  const answer = round(pctChange(vals[0], vals[3]), 1);
  return {
    id,
    prompt: `By what percentage did the figure change from ${quarters[0]} to ${quarters[3]}?`,
    exhibit: bar(
      `${id}-ex`,
      'Quarterly orders',
      quarters.map((q, i) => ({ label: q, value: vals[i] })),
      { source: 'Sales' },
    ),
    unit: '%',
    answer,
    tolerance: PCT_TOL,
    decimals: 1,
    explanation: `From ${vals[0]} to ${vals[3]}, against the starting value. A negative answer means it fell.`,
  };
};

const weighted: CaseGen = (rng, id) => {
  const names = rng.sample(['Standard', 'Express', 'Economy', 'Priority', 'Bulk'], 3);
  const rates = names.map(() => rng.float(6, 44, 1));
  const weights = names.map(() => rng.int(80, 620));
  const answer = round(weightedAvg(rates.map((r, i) => [r, weights[i]] as [number, number])), 1);
  return {
    id,
    prompt: 'What is the volume-weighted average margin across the three service lines?',
    exhibit: table(
      `${id}-ex`,
      'Margin and volume by service line',
      ['Service line', 'Margin (%)', 'Volume (k)'],
      names.map((n, i) => [n, rates[i], weights[i]]),
      { source: 'Finance' },
    ),
    unit: '%',
    answer,
    tolerance: PCT_TOL,
    decimals: 1,
    explanation: 'Weight each margin by its volume. A simple average of the three margins is the common trap.',
  };
};

const breakEvenCase: CaseGen = (rng, id) => {
  const price = rng.float(18, 72, 2);
  const variable = round(price * rng.float(0.45, 0.78, 3), 2);
  const fixed = rng.int(90, 640) * 1000;
  const answer = round(breakEven(fixed, price, variable) / 1000, 1);
  return {
    id,
    prompt: 'How many units must be sold to break even?',
    exhibit: table(
      `${id}-ex`,
      'Unit economics',
      ['Line item', 'Value'],
      [
        ['Selling price per unit', `$${price.toFixed(2)}`],
        ['Variable cost per unit', `$${variable.toFixed(2)}`],
        ['Annual fixed cost', `$${fixed.toLocaleString()}`],
      ],
      { source: 'Finance' },
    ),
    unit: 'k units',
    answer,
    tolerance: Math.max(0.3, round(answer * 0.02, 1)),
    decimals: 1,
    explanation: `Fixed cost divided by the $${round(price - variable, 2)} contribution per unit.`,
  };
};

const probability: CaseGen = (rng, id) => {
  const passA = rng.int(55, 92);
  const passB = rng.int(55, 92);
  const answer = round((passA / 100) * (passB / 100) * 100, 1);
  return {
    id,
    prompt: 'What is the probability that a unit passes both inspections?',
    exhibit: table(
      `${id}-ex`,
      'Independent inspection pass rates',
      ['Inspection', 'Pass rate (%)'],
      [
        ['Stage A', passA],
        ['Stage B', passB],
      ],
      { source: 'Quality', caption: 'The two inspections are independent.' },
    ),
    unit: '%',
    answer,
    tolerance: PCT_TOL,
    decimals: 1,
    explanation: `${passA}% × ${passB}%. Independent events multiply.`,
  };
};

const ratioCompare: CaseGen = (rng, id) => {
  const a = rng.int(240, 980);
  const b = rng.int(60, 230);
  const answer = round(a / b, 2);
  return {
    id,
    prompt: 'How many times larger is the Northern region than the Western region?',
    exhibit: bar(
      `${id}-ex`,
      'Revenue by region',
      [
        { label: 'Northern', value: a },
        { label: 'Western', value: b },
        { label: 'Southern', value: rng.int(100, 700) },
      ],
      { source: 'Finance', unit: '$m' },
    ),
    unit: 'x',
    answer,
    tolerance: 0.12,
    decimals: 2,
    explanation: `$${a}m divided by $${b}m.`,
  };
};

const marginRecovery: CaseGen = (rng, id) => {
  const revenue = rng.int(400, 1600);
  const cogs = Math.round(revenue * rng.float(0.52, 0.81, 3));
  const opex = Math.round(revenue * rng.float(0.08, 0.24, 3));
  const answer = round(pctOf(revenue - cogs - opex, revenue), 1);
  const q: CaseQuestion = {
    id,
    prompt: 'What is the operating margin?',
    exhibit: table(
      `${id}-ex`,
      'Income statement extract',
      ['Line item', '$m'],
      [
        ['Revenue', revenue],
        ['Cost of goods sold', cogs],
        ['Operating expenses', opex],
      ],
      { source: 'Finance' },
    ),
    unit: '%',
    answer,
    tolerance: PCT_TOL,
    decimals: 1,
    explanation: `(${revenue} − ${cogs} − ${opex}) / ${revenue}.`,
  };
  return q;
};

const GENERATORS: CaseGen[] = [
  shareOfTotal,
  growthRate,
  simpleChange,
  weighted,
  breakEvenCase,
  probability,
  ratioCompare,
  marginRecovery,
];

/**
 * Six independent rapid-fire questions. Two are served as multiple choice,
 * matching the mix of free-entry and selection in the real mini-cases.
 */
export function buildCases(rng: Rng, count = 6): CaseQuestion[] {
  const gens = rng.sample(GENERATORS, Math.min(count, GENERATORS.length));
  const questions = gens.map((g, i) => g(rng, `case${i + 1}`));
  const mcIndices = new Set(rng.sample([...questions.keys()], 2));
  return questions.map((q, i) =>
    mcIndices.has(i)
      ? { ...q, choices: choicesAround(rng, q.answer, q.decimals, q.unit === 'x' ? 'x' : q.unit === '%' ? '%' : '') }
      : q,
  );
}
