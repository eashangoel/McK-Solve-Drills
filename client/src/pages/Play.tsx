import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GAME_META, GAMES, type Game } from '@solve/shared';
import { api } from '../api.js';
import { RedrockGame } from './Redrock/index.js';
import { SeaWolfGame } from './SeaWolf/index.js';
import { SflGame } from './SFL/index.js';

const PHASE: Record<Game, string> = {
  redrock: 'Phase B',
  seawolf: 'Phase C',
  sfl: 'Phase D',
};

/**
 * Router target for a module. Each game's real implementation mounts here as
 * its phase lands. Until then this page reports build status honestly instead
 * of leaving a dead control on the landing screen.
 */
export function Play() {
  const { game } = useParams<{ game: string }>();
  const nav = useNavigate();
  const [implemented, setImplemented] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    api.health().then((h) => setImplemented(h.implemented)).catch(() => setImplemented({}));
  }, []);

  if (game !== 'full' && !GAMES.includes(game as Game)) {
    return (
      <Frame title="Unknown module" sub="That module does not exist." onBack={() => nav('/')}>
        <div className="empty">
          <h3>Nothing here</h3>
          <p>Pick a module from the sidebar.</p>
        </div>
      </Frame>
    );
  }

  const isFull = game === 'full';
  const meta = isFull ? null : GAME_META[game as Game];
  const ready = implemented?.[game as string] ?? false;

  if (ready && game === 'redrock') return <RedrockGame mode="drill" />;
  if (ready && game === 'seawolf') return <SeaWolfGame mode="drill" />;
  if (ready && game === 'sfl') return <SflGame mode="drill" />;

  return (
    <div data-accent={meta?.accent}>
      <Frame
        title={isFull ? 'Full session' : (meta as NonNullable<typeof meta>).name}
        sub={
          isFull
            ? 'All three modules back to back on one clock, in the order the real sitting uses.'
            : (meta as NonNullable<typeof meta>).blurb
        }
        onBack={() => nav('/')}
      >
        <div className="card">
          <div className="card-title">
            {isFull ? 'Waiting on all three modules' : `Arrives in ${PHASE[game as Game]}`}
          </div>
          <div className="card-sub" style={{ marginBottom: 18 }}>
            The engine underneath this screen is already running. Only the playable surface is
            outstanding.
          </div>

          <div className="build-list">
            <BuildRow done label="Database, migrations and session persistence" />
            <BuildRow done label="Process-score telemetry and scoring pipeline" />
            <BuildRow done label="Leaderboard, weak spots and streak tracking" />
            <BuildRow done label="Configurable time budgets" />
            {GAMES.map((g) => (
              <BuildRow
                key={g}
                done={implemented?.[g] ?? false}
                label={`${GAME_META[g].name} — playable module (${PHASE[g]})`}
              />
            ))}
          </div>

          <div className="row wrap" style={{ marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={() => nav('/')}>
              Back to Today
            </button>
            <button className="btn btn-ghost" onClick={() => nav('/progress')}>
              View progress
            </button>
            <button className="btn btn-ghost" onClick={() => nav('/settings')}>
              Adjust timers
            </button>
          </div>
        </div>
      </Frame>
    </div>
  );
}

function BuildRow({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="build-row" data-done={done || undefined}>
      <span className="build-tick">{done ? '✓' : '○'}</span>
      <span>{label}</span>
    </div>
  );
}

function Frame({
  title,
  sub,
  onBack,
  children,
}: {
  title: string;
  sub: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fade-in">
      <div className="page-head">
        <button className="btn btn-sm btn-ghost" style={{ marginBottom: 14 }} onClick={onBack}>
          ← Today
        </button>
        <h1>{title}</h1>
        <p className="sub">{sub}</p>
      </div>
      {children}
    </div>
  );
}
