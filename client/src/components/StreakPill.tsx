import { useEffect, useState } from 'react';
import { api } from '../api.js';
import type { StreakInfo } from '@solve/shared';

/** Small always-visible nudge for the daily-practice habit. */
export function StreakPill() {
  const [streak, setStreak] = useState<StreakInfo | null>(null);

  useEffect(() => {
    api.streak().then(setStreak).catch(() => setStreak(null));
  }, []);

  if (!streak) return null;

  const lit = streak.playedToday;
  return (
    <div className="streak-pill" data-lit={lit}>
      <div className="streak-flame">{lit ? '◆' : '◇'}</div>
      <div>
        <div className="streak-count num">{streak.current}</div>
        <div className="streak-label">
          {streak.current === 1 ? 'day streak' : 'day streak'}
        </div>
      </div>
      {!lit && <div className="streak-hint">not yet today</div>}
    </div>
  );
}
