import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GAME_META, type Game, type SessionScores } from '@solve/shared';
import { api } from '../api.js';
import { Results as RedrockResults } from './Redrock/Results.js';
import { Results as SeaWolfResults } from './SeaWolf/Results.js';
import { Results as SflResults } from './SFL/Results.js';

/**
 * Reopens a completed session from its saved record. The server sends back
 * the full, unredacted scenario once a session is finalized — the same
 * response shape the live game gets right after submitting — so this page
 * just fetches by id and hands it to the same Results component the live
 * flow uses, with no `onAgain` handler (that prop is optional precisely so
 * this route can omit it and fall back to "Practice again").
 */
export function SessionReview() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getSession(Number(id)).then(setData).catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="fade-in">
        <div className="banner" data-tone="bad">Could not load that session: {error}</div>
        <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={() => nav('/progress')}>
          Back to progress
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fade-in">
        <div className="skeleton" style={{ height: 120, marginBottom: 14 }} />
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }

  if (!data.completedAt) {
    return (
      <div className="fade-in">
        <div className="page-head">
          <div className="eyebrow">{GAME_META[data.game as Game]?.name ?? data.game}</div>
          <h1>Session not finished</h1>
          <p className="sub">This run was never completed, so there's no result to review.</p>
        </div>
        <button className="btn btn-ghost" onClick={() => nav('/progress')}>
          Back to progress
        </button>
      </div>
    );
  }

  const result: SessionScores & { scenario: unknown } = {
    productScore: data.productScore,
    processScore: data.processScore,
    combinedScore: data.combinedScore,
    breakdown: data.breakdown,
    scenario: data.scenario,
  };

  const game = data.game as Game;

  if (game === 'redrock') return <RedrockResults result={result} answers={data.answers} />;
  if (game === 'seawolf') return <SeaWolfResults result={result} answers={data.answers} />;
  if (game === 'sfl') return <SflResults result={result} answers={data.answers} />;

  return (
    <div className="fade-in">
      <div className="empty">
        <h3>Unknown module</h3>
        <p>This session's game type isn't recognised.</p>
      </div>
    </div>
  );
}
