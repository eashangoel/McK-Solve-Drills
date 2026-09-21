import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAMES, GAME_META, type Game } from '@solve/shared';
import { api, type Summary } from '../api.js';
import { Stat } from '../components/Stat.js';
import { fmtScore } from '../lib/format.js';

/** Landing screen: start a timed full session, or drill one game. */
export function Today() {
  const nav = useNavigate();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [implemented, setImplemented] = useState<Record<string, boolean>>({});
  const [streakToday, setStreakToday] = useState<boolean | null>(null);

  useEffect(() => {
    api.summary().then(setSummary).catch(() => {});
    api.health().then((h) => setImplemented(h.implemented)).catch(() => {});
    api.streak().then((s) => setStreakToday(s.playedToday)).catch(() => {});
  }, []);

  return (
    <div className="fade-in">
      <section className="hero">
        <div className="page-head" style={{ marginBottom: 0 }}>
          <div className="eyebrow">
            {streakToday === null ? '' : streakToday ? 'Logged today' : 'Not logged today'}
          </div>
          <h1>Ready for a run?</h1>
          <p>
            A full session runs all three modules back to back on the clock, exactly like the
            real sitting. Drill mode lets you isolate a single module or stage when you want
            to grind one weakness.
          </p>
        </div>

        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={() => nav('/play/full')}>
            Start full session
          </button>
          <button className="btn btn-ghost btn-lg" onClick={() => nav('/progress')}>
            View progress
          </button>
        </div>

        {summary && summary.total > 0 && (
          <div className="hero-stats">
            <Stat label="Sessions" value={summary.total} />
            <Stat label="Avg product" value={fmtScore(summary.avgProduct)} tone="accent" />
            <Stat label="Avg process" value={fmtScore(summary.avgProcess)} tone="accent" />
            <Stat label="Best combined" value={fmtScore(summary.bestCombined)} tone="good" />
          </div>
        )}
      </section>

      <div className="section-head">
        <h2>Drill a module</h2>
        <div className="note">Scenarios regenerate every run, so nothing is memorisable.</div>
      </div>

      <div className="game-cards">
        {GAMES.map((g) => (
          <GameCard key={g} game={g} ready={!!implemented[g]} summary={summary} />
        ))}
      </div>
    </div>
  );
}

function GameCard({
  game,
  ready,
  summary,
}: {
  game: Game;
  ready: boolean;
  summary: Summary | null;
}) {
  const nav = useNavigate();
  const meta = GAME_META[game];
  const stat = summary?.perGame.find((p) => p.game === game);

  return (
    <button
      className="game-card"
      data-accent={meta.accent}
      data-pending={!ready || undefined}
      onClick={() => nav(`/play/${game}`)}
    >
      <div className="game-card-icon">{meta.initials}</div>
      <h3>{meta.name}</h3>
      <div className="blurb">{meta.blurb}</div>
      <div className="meta">
        {ready ? (
          <>
            <span className="chip chip-accent">{stat ? `${stat.count} runs` : 'New'}</span>
            {stat && <span className="chip">avg {Math.round(stat.avg)}</span>}
            {stat && <span className="chip chip-good">best {Math.round(stat.best)}</span>}
          </>
        ) : (
          <span className="chip">Coming in the next phase</span>
        )}
      </div>
    </button>
  );
}
