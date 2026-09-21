import { useEffect, useState } from 'react';
import { fmtClock } from '../lib/format.js';

interface Props {
  /** Wall-clock start, from performance.now(). */
  startedAt: number;
  budgetMs: number;
  onExpire?: () => void;
  label?: string;
  compact?: boolean;
}

/**
 * Counts down against a budget. Turns amber at 25% remaining and red at 10%,
 * then keeps counting up past zero rather than hard-stopping, so an overrun
 * is visible and scoreable instead of silently truncating the run.
 */
export function Timer({ startedAt, budgetMs, onExpire, label, compact }: Props) {
  const [now, setNow] = useState(() => performance.now());
  const [fired, setFired] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(performance.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const elapsed = now - startedAt;
  const remaining = budgetMs - elapsed;
  const over = remaining < 0;
  const frac = Math.max(0, Math.min(1, elapsed / budgetMs));

  useEffect(() => {
    if (over && !fired) {
      setFired(true);
      onExpire?.();
    }
  }, [over, fired, onExpire]);

  const tone = over ? 'bad' : remaining < budgetMs * 0.1 ? 'bad' : remaining < budgetMs * 0.25 ? 'warn' : 'ok';

  return (
    <div className="timer" data-tone={tone} data-compact={compact || undefined}>
      {label && <div className="timer-label">{label}</div>}
      <div className="timer-value num">
        {over ? '+' : ''}
        {fmtClock(Math.abs(remaining))}
      </div>
      <div className="timer-track">
        <div className="timer-fill" style={{ width: `${frac * 100}%` }} />
      </div>
    </div>
  );
}
