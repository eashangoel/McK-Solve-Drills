/** Shared display helpers so numbers look the same everywhere. */

export function fmtDuration(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return '—';
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function fmtClock(ms: number): string {
  const safe = Math.max(0, ms);
  const total = Math.ceil(safe / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function fmtScore(n: number | null | undefined, dp = 0): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toFixed(dp);
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Score -> semantic class for chips and text. */
export function scoreTone(n: number | null | undefined): 'good' | 'warn' | 'bad' | 'muted' {
  if (n == null || !Number.isFinite(n)) return 'muted';
  if (n >= 75) return 'good';
  if (n >= 50) return 'warn';
  return 'bad';
}
