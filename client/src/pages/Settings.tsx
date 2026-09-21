import { useEffect, useState } from 'react';
import { api } from '../api.js';

const LABELS: Record<string, string> = {
  redrock_total: 'Redrock — whole study',
  redrock_investigation: 'Redrock — Investigation',
  redrock_analysis: 'Redrock — Analysis',
  redrock_report: 'Redrock — Report',
  redrock_cases: 'Redrock — Cases',
  seawolf_total: 'Sea Wolf — whole module',
  seawolf_site: 'Sea Wolf — per site',
  sfl_total: 'Sustainable Futures Lab — whole module',
};

/** Timer budgets live in SQLite so they persist across restarts. */
export function Settings() {
  const [budgets, setBudgets] = useState<Record<string, number> | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.settings().then((s) => setBudgets(s.budgets)).catch(() => {});
  }, []);

  if (!budgets) return <div className="skeleton" style={{ height: 320 }} />;

  const setMinutes = (key: string, minutes: number) =>
    setBudgets({ ...budgets, [key]: Math.round(minutes * 60_000) });

  const save = async () => {
    const res = await api.saveBudgets(budgets);
    setBudgets(res.budgets);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const reset = async () => {
    const res = await api.resetBudgets();
    setBudgets(res.budgets);
  };

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="eyebrow">Configuration</div>
        <h1>Settings</h1>
        <p className="sub">
          Time budgets drive both the on-screen clock and the pacing half of the process score.
          Defaults match the real assessment's published lengths.
        </p>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <div className="card-title">Time budgets</div>
        <div className="card-sub" style={{ marginBottom: 18 }}>Minutes per stage.</div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {Object.entries(budgets).map(([key, ms]) => (
            <div className="field" key={key}>
              <label htmlFor={key}>{LABELS[key] ?? key}</label>
              <input
                id={key}
                type="number"
                min={1}
                max={120}
                step={1}
                value={Math.round(ms / 60_000)}
                onChange={(e) => setMinutes(key, Number(e.target.value))}
              />
            </div>
          ))}
        </div>

        <div className="row" style={{ marginTop: 20 }}>
          <button className="btn btn-primary" onClick={save}>Save</button>
          <button className="btn btn-ghost" onClick={reset}>Reset to defaults</button>
          {saved && <span className="chip chip-good">Saved</span>}
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560, marginTop: 16 }}>
        <div className="card-title">Data</div>
        <div className="card-sub">
          Every session is stored in <code className="mono">data/solvetrainer.db</code>. It is a
          plain SQLite file — back it up by copying it. Clearing browser storage does not touch it.
        </div>
      </div>
    </div>
  );
}
