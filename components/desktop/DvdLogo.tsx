'use client';

import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/lib/motion';

const COLORS = ['#ff375f', '#30d158', '#ff9f0a', '#0a84ff', '#bf5af2', '#ffffff', '#64d2ff'];
/** Keep in sync with --menubar-h / --dock-reserve in styles/base.css. */
const MENUBAR_HEIGHT = 28;
const DOCK_RESERVE = 84;

/**
 * "SHUBHAM OS" text that bounces around the desktop, behind all windows, the whole time.
 * Under prefers-reduced-motion it stays still. It moves with a transform written per animation
 * frame, and its size is measured only at start and on resize, so frames never force a layout.
 */
export function DvdLogo() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Random start position, chosen once per page load.
    const m = {
      x: Math.random() * (window.innerWidth - 200),
      y: MENUBAR_HEIGHT + Math.random() * (window.innerHeight - 200),
      dx: 2.2,
      dy: 1.7,
    };
    const place = () => {
      el.style.transform = `translate(${m.x}px, ${m.y}px)`;
    };
    place();
    if (prefersReducedMotion()) return;

    let maxX = 0;
    let maxY = 0;
    const measure = () => {
      maxX = window.innerWidth - el.offsetWidth;
      maxY = window.innerHeight - DOCK_RESERVE - el.offsetHeight;
    };
    measure();
    window.addEventListener('resize', measure);

    let frame = 0;
    const step = () => {
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
      if (m.y <= MENUBAR_HEIGHT) {
        m.y = MENUBAR_HEIGHT;
        m.dy *= -1;
        bounced = true;
      }
      if (m.y >= maxY) {
        m.y = maxY;
        m.dy *= -1;
        bounced = true;
      }
      if (bounced) el.style.color = COLORS[Math.floor(Math.random() * COLORS.length)] ?? '';
      place();
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <div id="dvd-logo" ref={ref} aria-hidden="true" />
  );
}
