import { useEffect, useState } from 'react';
import { GAME_META, GAMES, type Game } from '@solve/shared';
import { api, type LeaderboardRow } from '../api.js';
import { fmtDateTime, fmtDuration, fmtScore, scoreTone } from '../lib/format.js';

/**
 * Phase (a) renders the session log. Trend charts, weak spots and the streak
 * calendar land in phase (e) once there is data worth plotting.
 */
export function Progress() {
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [filter, setFilter] = useState<Game | 'all'>('all');

  useEffect(() => {
    setRows(null);
    api.leaderboard(filter).then(setRows).catch(() => setRows([]));
  }, [filter]);

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="eyebrow">Review</div>
        <h1>Progress</h1>
        <p className="sub">
          Every completed run, scored on product and process separately. This is your leaderboard
          against your own past self.
        </p>
      </div>

      <div className="section-head">
        <h2>Session log</h2>
        <div className="segmented">
          <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
            All
          </button>
          {GAMES.map((g) => (
            <button key={g} aria-pressed={filter === g} onClick={() => setFilter(g)}>
              {GAME_META[g].short}
            </button>
          ))}
        </div>
      </div>

      {rows === null ? (
        <div className="skeleton" style={{ height: 220 }} />
      ) : rows.length === 0 ? (
        <div className="empty">
          <h3>No runs yet</h3>
          <p>Finish a module and it will show up here with its product and process scores.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>When</th>
                <th>Module</th>
                <th>Mode</th>
                <th className="num">Product</th>
                <th className="num">Process</th>
                <th className="num">Combined</th>
                <th className="num">Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{fmtDateTime(r.completedAt)}</td>
                  <td>{GAME_META[r.game].name}</td>
                  <td>
                    <span className="chip">{r.mode}</span>
                  </td>
                  <td className="num">{fmtScore(r.productScore)}</td>
                  <td className="num">{fmtScore(r.processScore)}</td>
                  <td className="num">
                    <span className={`chip chip-${scoreTone(r.combinedScore)}`}>
                      {fmtScore(r.combinedScore)}
                    </span>
                  </td>
                  <td className="num">{fmtDuration(r.durationMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
