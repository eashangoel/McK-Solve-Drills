import type { Exhibit } from './types.js';

/** Small builders so templates stay readable. */

export function table(
  id: string,
  title: string,
  columns: string[],
  rows: (string | number)[][],
  opts: { caption?: string; unit?: string; source?: string } = {},
): Exhibit {
  return { id, title, kind: 'table', columns, rows, ...opts };
}

export function bar(
  id: string,
  title: string,
  points: { label: string; value: number }[],
  opts: { caption?: string; unit?: string; source?: string; seriesName?: string } = {},
): Exhibit {
  const { seriesName = 'Value', ...rest } = opts;
  return { id, title, kind: 'bar', series: [{ name: seriesName, points }], ...rest };
}

export function line(
  id: string,
  title: string,
  series: { name: string; points: { label: string; value: number }[] }[],
  opts: { caption?: string; unit?: string; source?: string } = {},
): Exhibit {
  return { id, title, kind: 'line', series, ...opts };
}

export function note(
  id: string,
  title: string,
  body: string,
  opts: { source?: string; caption?: string } = {},
): Exhibit {
  return { id, title, kind: 'note', body, ...opts };
}
