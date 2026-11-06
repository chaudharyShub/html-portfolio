'use client';

import { useEffect, useImperativeHandle, useRef, useState, type PointerEvent } from 'react';
import { useOsApi, useOsState } from '@/components/os/OsProvider';
import { createRunner, GAME_OVER_LINES, type Runner } from '@/lib/debug-runner';
import { prefersReducedMotion } from '@/lib/motion';
import { createStoredValue } from '@/lib/stored-value';
import { STORAGE_KEYS } from '@/lib/storage';
import { Dialog } from './Dialog';

const bestScore = createStoredValue(
  STORAGE_KEYS.debugRunnerBest,
  (raw) => {
    const n = Number.parseInt(raw ?? '0', 10);
    return Number.isFinite(n) ? n : 0;
  },
  (n) => String(n),
  0,
);

/** A key held down at game over shouldn't restart straight away. */
const RESTART_DELAY_MS = 400;

export function DebugRunnerDialog() {
  const { dialogs } = useOsState();
  const { actions, connect } = useOsApi();
  const best = bestScore.use();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runner = useRef<Runner | null>(null);
  const endedAt = useRef(0);
  const lastLine = useRef(-1);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState<{ score: number; line: string } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = createRunner(
      canvas,
      {
        onScore: setScore,
        onGameOver: (final) => {
          if (final > bestScore.get()) bestScore.set(final);
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
    return () => {
      r.destroy();
      runner.current = null;
    };
  }, []);

  const start = () => {
    setOver(null);
    runner.current?.start();
  };

  const stop = () => {
    runner.current?.stop();
  };

  useImperativeHandle(connect.game, () => ({ start, stop }));

  // Space jumps (held = higher) while the game is open; after a game over it starts a new run.
  const open = dialogs.game;
  useEffect(() => {
    if (!open) return;
    runner.current?.render();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (e.repeat) return;
      const r = runner.current;
      if (!r) return;
      if (r.isRunning()) r.press();
      else if (performance.now() - endedAt.current > RESTART_DELAY_MS) {
        setOver(null);
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

  return (
    <Dialog open={open} title="Debug Runner" onClose={actions.closeGame} boxClassName="wide">
      <div className="dialog-body">
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
            <span className="game-over-sub">
              Score: <span>{over?.score ?? 0}</span> | Best: <span>{best}</span>
            </span>
            <button type="button" className="btn-primary" onClick={start}>
              Restart
            </button>
          </div>
        </div>
        <p className="game-hint">
          Tap to hop, hold to jump higher. Clear the bugs, long-jump the memory leaks, stay under the
          404s, and grab the coffee for hotfix mode.
        </p>
        <p className="game-score-line">
          Score: <span>{score}</span> &nbsp; Best: <span>{best}</span>
        </p>
        <div className="dialog-buttons">
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
