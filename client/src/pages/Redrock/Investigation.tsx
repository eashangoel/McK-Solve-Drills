import { useState } from 'react';
import type { Exhibit } from '@solve/shared';
import { ExhibitView, ExhibitHeader } from '../../components/ExhibitView.js';

interface Props {
  brief: string;
  objective: string;
  client: string;
  exhibits: Exhibit[];
  journal: string[];
  onToggle: (id: string) => void;
  onDone: () => void;
}

/**
 * Stage 1. Read the brief, then pull the exhibits that matter into the
 * research journal. Only journalled exhibits are visible in Analysis, so
 * over-collecting costs nothing here but under-collecting is fatal later.
 */
export function Investigation({ brief, objective, client, exhibits, journal, onToggle, onDone }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const inJournal = new Set(journal);

  return (
    <div className="fade-in">
      <div className="brief-card">
        <div className="brief-client">{client}</div>
        <p className="brief-text">{brief}</p>
        <div className="brief-objective">
          <span className="chip chip-accent">Objective</span>
          <span>{objective}</span>
        </div>
      </div>

      <div className="section-head">
        <h2>Data room</h2>
        <div className="note">
          {journal.length} of {exhibits.length} in your journal. Only what you add here is
          available during Analysis.
        </div>
      </div>

      <div className="exhibit-grid">
        {exhibits.map((ex) => {
          const added = inJournal.has(ex.id);
          const expanded = open === ex.id;
          return (
            <article key={ex.id} className="exhibit-card" data-added={added || undefined}>
              <ExhibitHeader exhibit={ex} />
              {expanded ? (
                <ExhibitView exhibit={ex} height={180} />
              ) : (
                <div className="exhibit-peek">
                  {ex.kind === 'note'
                    ? `${ex.body?.slice(0, 96)}…`
                    : ex.kind === 'table'
                      ? `Table · ${ex.rows?.length ?? 0} rows × ${ex.columns?.length ?? 0} columns`
                      : `${ex.kind === 'bar' ? 'Bar' : 'Line'} chart · ${ex.series?.[0]?.points.length ?? 0} points`}
                </div>
              )}
              <div className="exhibit-actions">
                <button className="btn btn-sm btn-ghost" onClick={() => setOpen(expanded ? null : ex.id)}>
                  {expanded ? 'Collapse' : 'Open'}
                </button>
                <button
                  className={added ? 'btn btn-sm' : 'btn btn-sm btn-primary'}
                  onClick={() => onToggle(ex.id)}
                >
                  {added ? 'Remove' : 'Add to journal'}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="stage-foot">
        <div className="note">
          Analysis locks the data room. You cannot come back for an exhibit you left behind.
        </div>
        <button className="btn btn-primary btn-lg" onClick={onDone} disabled={journal.length === 0}>
          Continue to Analysis →
        </button>
      </div>
    </div>
  );
}
