/** Shared quantitative helpers. Every answer in Redrock is computed, never typed by hand. */

export const round = (v: number, dp = 1) => {
  const p = 10 ** dp;
  return Math.round(v * p) / p;
};

/** a as a percentage of b. */
export const pctOf = (a: number, b: number) => (a / b) * 100;

/** Percentage change from v0 to v1. */
export const pctChange = (v0: number, v1: number) => ((v1 - v0) / v0) * 100;

/** Compound annual growth rate, as a percentage. */
export const cagr = (v0: number, vn: number, years: number) =>
  ((vn / v0) ** (1 / years) - 1) * 100;

/** Weighted average of [value, weight] pairs. */
export const weightedAvg = (pairs: [number, number][]) => {
  const w = pairs.reduce((s, [, wt]) => s + wt, 0);
  return pairs.reduce((s, [v, wt]) => s + v * wt, 0) / w;
};

/** Break-even volume: fixed / (price - variable cost). */
export const breakEven = (fixed: number, price: number, variable: number) =>
  fixed / (price - variable);

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Tolerance for a percentage answer: generous enough to forgive rounding. */
export const PCT_TOL = 0.6;
export const RATIO_TOL = 0.06;
export const MONEY_TOL = 0.6;
export const YEAR_TOL = 0.15;
