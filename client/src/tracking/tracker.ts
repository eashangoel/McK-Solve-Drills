import type { EventType, StageMetric, TrackedEvent } from '@solve/shared';

interface OpenStage {
  stage: string;
  budgetMs: number;
  enteredAt: number;
  firstActionMs: number | null;
  revisions: number;
  accumulatedMs: number;
}

/**
 * Silently records the telemetry the process score is built from: how long
 * each stage took, how fast the first real action came, and how often a
 * choice was reversed before being committed. Games call `logAction` and
 * `countRevision`; everything else is bookkeeping.
 */
export class ProcessTracker {
  readonly startedAt = performance.now();
  private events: TrackedEvent[] = [];
  private open = new Map<string, OpenStage>();
  private closed: StageMetric[] = [];
  private current: string | null = null;

  private now(): number {
    return Math.round(performance.now() - this.startedAt);
  }

  private push(stage: string, type: EventType, payload?: Record<string, unknown>) {
    this.events.push({ tsMs: this.now(), stage, type, payload });
  }

  /** Begin (or resume) a stage. Re-entering accumulates rather than resets. */
  enterStage(stage: string, budgetMs: number): void {
    if (this.current && this.current !== stage) this.pauseStage(this.current);
    const existing = this.open.get(stage);
    if (existing) {
      existing.enteredAt = performance.now();
    } else {
      this.open.set(stage, {
        stage,
        budgetMs,
        enteredAt: performance.now(),
        firstActionMs: null,
        revisions: 0,
        accumulatedMs: 0,
      });
    }
    this.current = stage;
    this.push(stage, 'stage_enter');
  }

  /** Stop the clock on a stage without finalizing it. */
  private pauseStage(stage: string): void {
    const s = this.open.get(stage);
    if (!s) return;
    s.accumulatedMs += performance.now() - s.enteredAt;
    s.enteredAt = performance.now();
  }

  /** Any meaningful interaction. The first one per stage sets decisiveness. */
  logAction(type: EventType, payload?: Record<string, unknown>, stage = this.current): void {
    if (!stage) return;
    const s = this.open.get(stage);
    if (s && s.firstActionMs === null) {
      s.firstActionMs = Math.round(performance.now() - s.enteredAt + s.accumulatedMs);
      this.push(stage, 'first_action', payload);
    }
    this.push(stage, type, payload);
  }

  /** A choice was changed after having already been made. */
  countRevision(stage = this.current, payload?: Record<string, unknown>): void {
    if (!stage) return;
    const s = this.open.get(stage);
    if (s) s.revisions += 1;
    this.push(stage, 'change', payload);
  }

  /** Close a stage and record its metrics. Extras carry grading signals. */
  exitStage(
    stage: string,
    extras: { precision?: number; recall?: number; stageScore?: number } = {},
  ): void {
    const s = this.open.get(stage);
    if (!s) return;
    const durationMs = Math.round(s.accumulatedMs + (performance.now() - s.enteredAt));
    this.closed.push({
      stage: s.stage,
      budgetMs: s.budgetMs,
      durationMs,
      firstActionMs: s.firstActionMs,
      revisions: s.revisions,
      ...extras,
    });
    this.open.delete(stage);
    this.push(stage, 'stage_exit', { durationMs });
    if (this.current === stage) this.current = null;
  }

  /** Total elapsed wall time for the session. */
  elapsedMs(): number {
    return this.now();
  }

  /** Snapshot for submission. Closes anything still open. */
  build(): { events: TrackedEvent[]; stages: StageMetric[]; durationMs: number } {
    for (const stage of [...this.open.keys()]) this.exitStage(stage);
    return { events: this.events, stages: this.closed, durationMs: this.elapsedMs() };
  }

  /** Stage metrics closed so far, for live in-game feedback. */
  closedStages(): StageMetric[] {
    return [...this.closed];
  }
}
