import { createStore } from './store';

/**
 * The Debug Runner top score (all visitors) in the browser. Loaded when the game first opens;
 * each run asks the server for a ticket when it starts and sends its score with it at game over
 * (see lib/runner-score-store.ts).
 */
export interface TopScoreState {
  /** null until loaded. */
  best: number | null;
  /** false when /api/debug-runner isn't available: the top score is hidden. */
  available: boolean;
  /** The last run set a new top score. */
  record: boolean;
}

const store = createStore<TopScoreState>({ best: null, available: true, record: false });
const setState = store.set;
let loadStarted = false;

export const useTopScore: () => TopScoreState = store.use;

/** Loads the top score once (later calls do nothing). */
export function loadTopScore(): void {
  if (loadStarted) return;
  loadStarted = true;
  fetch('/api/debug-runner', { cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
    .then((data: { best: number }) => setState({ best: data.best }))
    .catch(() => setState({ available: false }));
}

/** The current run's ticket (a promise, so a quick game over still waits for it). */
let ticket: Promise<string | null> = Promise.resolve(null);
/** Counts runs, so a late server answer doesn't change the record flag of a newer run. */
let run = 0;

/** Call when a run starts. */
export function startRun(): void {
  run++;
  if (store.get().record) setState({ record: false });
  if (!store.get().available) {
    ticket = Promise.resolve(null);
    return;
  }
  ticket = fetch('/api/debug-runner/run', { method: 'POST' })
    .then((res) => (res.ok ? res.json() : null))
    .then((data: { ticket?: string } | null) => data?.ticket ?? null)
    .catch(() => null);
}

/**
 * Call at game over. A score above the known top score shows as the new top score at once;
 * then it is sent, and the server's answer settles it (if it isn't saved, the old one is back).
 */
export async function finishRun(score: number): Promise<void> {
  // Taken before waiting, so a run started meanwhile keeps its own ticket.
  const current = ticket;
  ticket = Promise.resolve(null);
  const thisRun = run;
  const previous = store.get().best;
  const beaten = store.get().available && previous !== null && score > previous;
  if (beaten) setState({ best: score, record: true });
  /** Applies the server's top score; the record flag only while this run is still the last one. */
  const settle = (best: number | null, record: boolean) =>
    setState(run === thisRun ? { best, record } : { best });
  // Put back the old top score if this one didn't make it.
  const undo = () => {
    if (beaten && store.get().best === score) settle(previous, false);
  };

  const runTicket = await current;
  if (!runTicket || score <= 0) {
    undo();
    return;
  }
  try {
    const res = await fetch('/api/debug-runner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket: runTicket, score }),
    });
    const data = (await res.json()) as { best?: number; record?: boolean };
    if (typeof data.best !== 'number') throw new Error(String(res.status));
    settle(data.best, res.ok && Boolean(data.record));
  } catch {
    // The score just isn't shared; the visitor's own best is still saved on this device.
    undo();
  }
}
