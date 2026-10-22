'use client';

import { useEffect, useRef } from 'react';

const COLORS = ['#ff0044', '#00ff88', '#ffaa00', '#00aaff', '#ff00ff', '#ffffff', '#33ff33'];
const TASKBAR_HEIGHT = 32;

/**
 * "SHUBHAM OS" text that bounces around the desktop while the main window is minimized.
 * Position is written per animation frame directly to the element.
 */
export function DvdLogo({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const motion = useRef<{ x: number; y: number; dx: number; dy: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    // Random start position, chosen once per page load (the first time it bounces).
    motion.current ??= {
      x: Math.random() * (window.innerWidth - 200),
      y: Math.random() * (window.innerHeight - 200),
      dx: 2.2,
      dy: 1.7,
    };
    const m = motion.current;
    let frame = 0;
    const step = () => {
      const maxX = window.innerWidth - el.offsetWidth;
      const maxY = window.innerHeight - TASKBAR_HEIGHT - el.offsetHeight;
      m.x += m.dx;
      m.y += m.dy;
      let bounced = false;
      if (m.x <= 0) {
        m.x = 0;
        m.dx *= -1;
        bounced = true;
      }
      if (m.x >= maxX) {
        m.x = maxX;
        m.dx *= -1;
        bounced = true;
      }
      if (m.y <= 0) {
        m.y = 0;
        m.dy *= -1;
        bounced = true;
      }
      if (m.y >= maxY) {
        m.y = maxY;
        m.dy *= -1;
        bounced = true;
      }
      if (bounced) el.style.color = COLORS[Math.floor(Math.random() * COLORS.length)] ?? '';
      el.style.left = `${m.x}px`;
      el.style.top = `${m.y}px`;
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  return (
    <div id="dvd-logo" ref={ref} aria-hidden="true">
      SHUBHAM OS
    </div>
  );
}
