'use client';

import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { BugIcon } from '@/components/icons';
import { useOsApi, useOsState } from '@/components/os/OsProvider';
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

/* Physics constants are unchanged from the original game. */
const PLAYER_LEFT = 20;
const PLAYER_WIDTH = 22;
const PLAYER_HEIGHT = 28;
const BUG_SIZE = 18;
const GROUND = 2;
const JUMP_VELOCITY = 8;
const GRAVITY = 0.6;

interface Bug {
  id: number;
  x: number;
}

interface Sim {
  running: boolean;
  score: number;
  speed: number;
  playerY: number;
  playerVY: number;
  jumping: boolean;
  bugs: Bug[];
  frame: number;
  nextBugId: number;
}

interface View {
  playerY: number;
  bugs: Bug[];
  score: number;
  gameOver: boolean;
}

const freshSim = (): Sim => ({
  running: false,
  score: 0,
  speed: 3,
  playerY: 0,
  playerVY: 0,
  jumping: false,
  bugs: [],
  frame: 0,
  nextBugId: 0,
});

export function DebugRunnerDialog() {
  const { dialogs } = useOsState();
  const { actions, connect } = useOsApi();
  const best = bestScore.use();
  const stageRef = useRef<HTMLDivElement>(null);
  const sim = useRef<Sim>(freshSim());
  const raf = useRef(0);
  const [view, setView] = useState<View>({ playerY: 0, bugs: [], score: 0, gameOver: false });

  const publish = (gameOver = false) => {
    const s = sim.current;
    setView({ playerY: s.playerY, bugs: [...s.bugs], score: s.score, gameOver });
  };

  const jump = () => {
    const s = sim.current;
    if (!s.running || s.jumping) return;
    s.jumping = true;
    s.playerVY = JUMP_VELOCITY;
  };

  const endGame = () => {
    const s = sim.current;
    s.running = false;
    cancelAnimationFrame(raf.current);
    if (s.score > bestScore.get()) bestScore.set(s.score);
    publish(true);
  };

  const loop = () => {
    const s = sim.current;
    if (!s.running) return;
    s.frame++;
    if (s.jumping) {
      s.playerY += s.playerVY;
      s.playerVY -= GRAVITY;
      if (s.playerY <= 0) {
        s.playerY = 0;
        s.jumping = false;
        s.playerVY = 0;
      }
    }
    if (s.frame % Math.max(40, 90 - Math.floor(s.score / 5)) === 0) {
      s.bugs.push({ id: s.nextBugId++, x: stageRef.current?.offsetWidth ?? 400 });
    }
    for (const bug of s.bugs) bug.x -= s.speed;

    const playerBottom = GROUND + s.playerY;
    const playerTop = playerBottom + PLAYER_HEIGHT;
    s.bugs = s.bugs.filter((bug) => bug.x >= -24);
    for (const bug of s.bugs) {
      const overlapX = bug.x + BUG_SIZE > PLAYER_LEFT && bug.x < PLAYER_LEFT + PLAYER_WIDTH;
      const overlapY = GROUND + BUG_SIZE > playerBottom && GROUND < playerTop;
      if (overlapX && overlapY) {
        endGame();
        return;
      }
    }
    if (s.frame % 6 === 0) s.score++;
    if (s.frame % 200 === 0) s.speed += 0.5;
    publish();
    raf.current = requestAnimationFrame(loop);
  };

  const start = () => {
    cancelAnimationFrame(raf.current);
    sim.current = { ...freshSim(), running: true };
    publish();
    raf.current = requestAnimationFrame(loop);
  };

  const stop = () => {
    cancelAnimationFrame(raf.current);
    sim.current = { ...sim.current, running: false, bugs: [] };
    setView((v) => ({ ...v, bugs: [] }));
  };

  useImperativeHandle(connect.game, () => ({ start, stop }));

  // Space jumps while the game window is open (as in the original).
  const open = dialogs.game;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      const s = sim.current;
      if (s.running && !s.jumping) {
        s.jumping = true;
        s.playerVY = JUMP_VELOCITY;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <Dialog open={open} title="Debug_Runner.exe" onClose={actions.closeGame} boxClassName="wide">
      <div className="dialog-body compact">
        <div
          id="game-stage"
          ref={stageRef}
          onClick={jump}
          role="application"
          aria-label="Debug Runner game stage. Press Space or click to jump."
        >
          <div id="game-player" style={{ bottom: GROUND + view.playerY }}>
            <div className="player-body" />
            <div className="player-head" />
          </div>
          {view.bugs.map((bug) => (
            <div key={bug.id} className="game-bug" style={{ left: bug.x }}>
              <BugIcon size={20} />
            </div>
          ))}
          <div id="game-over-msg" style={{ display: view.gameOver ? 'flex' : 'none' }} role="status">
            <span>GAME OVER</span>
            <span className="game-over-sub">
              Score: <span>{view.score}</span> | Best: <span>{best}</span>
            </span>
            <button type="button" onClick={start}>
              Restart
            </button>
          </div>
        </div>
        <p className="game-hint">Press SPACE or tap the stage to jump over the bugs. Ship it before you crash it.</p>
        <p className="game-score-line">
          Score: <span>{view.score}</span> &nbsp; Best: <span>{best}</span>
        </p>
        <div className="dialog-buttons">
          <button type="button" onClick={start}>
            Start / Restart
          </button>
          <button type="button" onClick={actions.closeGame}>
            Close
          </button>
        </div>
      </div>
    </Dialog>
  );
}
