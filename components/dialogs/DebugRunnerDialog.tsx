'use client';

import { useEffect, useEffectEvent, useImperativeHandle, useRef, useState, type PointerEvent } from 'react';
import { useOsApi, useOsState } from '@/components/os/OsProvider';
import { createRunner, GAME_OVER_LINES, type Runner } from '@/lib/debug-runner';
import { prefersReducedMotion } from '@/lib/motion';
import { finishRun, loadTopScore, startRun, useTopScore } from '@/lib/runner-score-client';
import { createStoredValue } from '@/lib/stored-value';
import { STORAGE_KEYS } from '@/lib/storage';
import { Dialog } from './Dialog';
import { RunnerGuide } from './RunnerGuide';

const bestScore = createStoredValue(
  STORAGE_KEYS.debugRunnerBest,
  (raw) => {
    const n = Number.parseInt(raw ?? '0', 10);
    return Number.isFinite(n) ? n : 0;
  },
  (n) => String(n),
  0,
);

/** "…" while loading. */
const formatScore = (n: number | null) => (n === null ? '…' : n.toLocaleString('en-US'));

/** A key held down at game over shouldn't restart straight away. */
const RESTART_DELAY_MS = 400;

export function DebugRunnerDialog() {
  const { dialogs } = useOsState();
  const { actions, connect } = useOsApi();
  const best = bestScore.use();
  const top = useTopScore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runner = useRef<Runner | null>(null);
  const endedAt = useRef(0);
  const lastLine = useRef(-1);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState<{ score: number; line: string } | null>(null);
  /** The guide covers the game and holds the run still until it closes. */
  const [guide, setGuide] = useState(false);
  const guideButton = useRef<HTMLButtonElement>(null);
  const isOpen = useEffectEvent(() => dialogs.game);
  const guideOpen = useEffectEvent(() => guide);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = createRunner(
      canvas,
      {
        onScore: setScore,
        onGameOver: (final) => {
          if (final > bestScore.get()) bestScore.set(final);
          void finishRun(final);
          let i = Math.floor(Math.random() * GAME_OVER_LINES.length);
          if (i === lastLine.current) i = (i + 1) % GAME_OVER_LINES.length;
          lastLine.current = i;
          endedAt.current = performance.now();
          setOver({ score: final, line: GAME_OVER_LINES[i] ?? '' });
        },
      },
      prefersReducedMotion(),
    );
    runner.current = r;
    // The dialog loads on first open (ShubhamOS), after openGame() already asked for a start.
    if (isOpen()) {
      startRun();
      r.start();
    }
    return () => {
      r.destroy();
      runner.current = null;
    };
  }, []);

  const start = () => {
    setGuide(false);
    setOver(null);
    startRun();
    runner.current?.start();
  };

  const stop = () => {
    setGuide(false);
    runner.current?.stop();
  };

  const openGuide = () => {
    runner.current?.pause();
    setGuide(true);
  };
  const closeGuide = () => {
    setGuide(false);
    guideButton.current?.focus({ preventScroll: true });
    runner.current?.resume();
  };

  useImperativeHandle(connect.game, () => ({ start, stop }));

  // Space jumps (held = higher) while the game is open; after a game over it starts a new run.
  const open = dialogs.game;
  useEffect(() => {
    if (!open) return;
    loadTopScore();
    runner.current?.render();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      // The rest of the desktop stays usable while the game is open: Space typed elsewhere (the
      // Terminal, the contact form, another app) is theirs. Only the game or nothing focused.
      if (e.target instanceof Element && e.target !== document.body && !e.target.closest('.game-box')) return;
      // The guide's own button takes Space; nothing starts or jumps behind it.
      if (guideOpen()) return;
      const r = runner.current;
      // Between runs, Space presses a focused button (Close, Restart) like everywhere else.
      // During a run it always jumps, even if a clicked Restart button still has the focus.
      if (!r?.isRunning() && e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
      if (e.repeat) return;
      if (!r) return;
      if (r.isRunning()) r.press();
      else if (performance.now() - endedAt.current > RESTART_DELAY_MS) {
        setOver(null);
        startRun();
        r.start();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') runner.current?.release();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, [open]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!runner.current?.isRunning()) return;
    // Keep getting the "up" even if the finger slides off the stage.
    e.currentTarget.setPointerCapture(e.pointerId);
    runner.current.press();
  };
  const onPointerUp = () => runner.current?.release();

  // Hidden when the shared score can't be reached (no database, or it's down).
  const showTop = top.available;
  // Passing the top score mid-run shows at once: the top score follows the live score.
  const passing = !over && top.best !== null && score > top.best;
  const shownTop = passing ? score : top.best;
  const topClass = passing || top.record ? 'game-top game-top--record' : 'game-top';

  return (
    <Dialog open={open} title="Debug Runner" onClose={actions.closeGame} boxClassName="wide game-box">
      <div className="dialog-body">
        <div className="game-area">
          <div
            id="game-stage"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            role="application"
            aria-label="Debug Runner game stage. Press Space or click to jump; hold to jump higher."
          >
            <canvas ref={canvasRef} className="game-canvas" aria-hidden="true" />
            <div id="game-over-msg" style={{ display: over ? 'flex' : 'none' }} role="status">
              <span className="game-over-title">{over?.line}</span>
              {showTop && top.record ? <span className="game-record">New top score for all players!</span> : null}
              <span className="game-over-sub">
                Score: <span>{over?.score ?? 0}</span> | Your best: <span>{best}</span>
                {showTop ? (
                  <>
                    {' '}
                    | Top score: <span>{formatScore(shownTop)}</span>
                  </>
                ) : null}
              </span>
              <button type="button" className="btn-primary" onClick={start}>
                Restart
              </button>
            </div>
          </div>
          <p className="game-hint">
            Tap to hop, hold to jump higher. Every 100 points a new version ships and it gets faster.
          </p>
          <p className="game-score-line">
            Score: <span>{score}</span> &nbsp; Your best: <span>{best}</span>
            {showTop ? (
              <span className={topClass} title="Highest score of everyone who has played">
                &nbsp; Top score: <span>{formatScore(shownTop)}</span>
              </span>
            ) : null}
          </p>
          {guide ? <RunnerGuide onClose={closeGuide} /> : null}
        </div>
        <div className="dialog-buttons">
          <button type="button" ref={guideButton} onClick={guide ? closeGuide : openGuide} aria-expanded={guide}>
            How to play
          </button>
          <button type="button" onClick={actions.closeGame}>
            Close
          </button>
          <button type="button" className="btn-primary" onClick={start}>
            Start / Restart
          </button>
        </div>
      </div>
    </Dialog>
  );
}
