'use client';

import { useEffect, useState, type KeyboardEvent } from 'react';
import { CareerUptime } from '@/components/live/CareerStats';
import { useOsActions, useOsState } from '@/components/os/OsProvider';
import { VISIBLE_EXPERIENCE } from '@/data/experience';
import { VISIBLE_PROJECTS } from '@/data/projects';
import { SKILL_GROUPS } from '@/data/skills';
import { prefersReducedMotion } from '@/lib/motion';
import { SKILL_PROCESSES, skillUsage, type SkillProcess } from '@/lib/skill-usage';
import { Dialog } from './Dialog';

/** Samples kept per skill for the load graph (one per second). */
const SAMPLES = 60;
const TICK_MS = 1000;
const FILTERS = ['All', ...SKILL_GROUPS.map((g) => g.title)];
const FILTER_LABELS: Record<string, string> = { All: 'All Processes', 'Tools & DevOps': 'Tools', 'AI Tools & Workflows': 'AI' };
const JOB_COUNT = VISIBLE_EXPERIENCE.length;
const PROJECT_COUNT = VISIBLE_PROJECTS.length;
const GROUP_INDEX = Object.fromEntries(SKILL_GROUPS.map((g, i) => [g.title, i]));
const SHORT_GROUP: Record<string, string> = { 'Tools & DevOps': 'Tools', 'AI Tools & Workflows': 'AI' };

type SortKey = 'name' | 'cpu' | 'kind' | 'level' | 'pid';
type Samples = Record<string, number[]>;

/** A gentle, deterministic wobble so the graphs aren't flat before the first live sample. */
function initialSamples(): Samples {
  return Object.fromEntries(
    SKILL_PROCESSES.map((p, n) => [
      p.name,
      Array.from({ length: SAMPLES }, (_, i) => p.percent - 2 + 1.6 * Math.sin(i * 0.7 + n) + Math.sin(i * 0.23 + n * 2)),
    ]),
  );
}

/** Next sample: a small random walk that keeps pulling back toward the skill level. */
function nextSample(prev: number, level: number, random: number) {
  const v = prev + (random - 0.5) * 3 + (level - prev) * 0.3;
  return Math.max(level - 6, Math.min(Math.min(100, level + 3), v));
}

const last = (values: number[] | undefined) => values?.[values.length - 1] ?? 0;
const LEVEL_RANK = { Advanced: 3, Proficient: 2, Intermediate: 1 } as const;

function compare(a: SkillProcess, b: SkillProcess, key: SortKey, samples: Samples) {
  switch (key) {
    case 'name':
      return a.name.localeCompare(b.name);
    case 'cpu':
      return last(samples[a.name]) - last(samples[b.name]);
    case 'level':
      return LEVEL_RANK[a.level] - LEVEL_RANK[b.level];
    case 'kind':
      return a.group.localeCompare(b.group);
    case 'pid':
      return a.pid - b.pid;
  }
}

const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: 'name', label: 'Process Name' },
  { key: 'cpu', label: '% CPU', className: 'am-num' },
  { key: 'kind', label: 'Kind' },
  { key: 'level', label: 'Level', className: 'am-wide-only' },
  { key: 'pid', label: 'PID', className: 'am-num am-wide-only' },
];

/** Load graph of one skill: an area chart that scrolls left as samples come in. */
function LoadGraph({ values }: { values: number[] }) {
  const points = values.map((v, i) => `${i},${(100 - v).toFixed(2)}`).join(' ');
  return (
    <svg className="am-graph" viewBox={`0 0 ${SAMPLES - 1} 100`} preserveAspectRatio="none" aria-hidden="true">
      {[25, 50, 75].map((y) => (
        <line key={y} className="am-grid" x1="0" x2={SAMPLES - 1} y1={y} y2={y} />
      ))}
      <polygon className="am-area" points={`0,100 ${points} ${SAMPLES - 1},100`} />
      <polyline className="am-line" points={points} />
    </svg>
  );
}

/** Activity Monitor: the skills as running processes, with a live load graph and where each is used. */
export function ActivityMonitorDialog() {
  const { dialogs } = useOsState();
  const open = dialogs.activity;
  const actions = useOsActions();
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'cpu', desc: true });
  const [selected, setSelected] = useState(SKILL_PROCESSES[0]?.name ?? '');
  const [samples, setSamples] = useState(initialSamples);
  const [zoomed, setZoomed] = useState(false);
  const close = () => actions.closeDialog('activity');

  // New samples every second, only while the app is open.
  useEffect(() => {
    if (!open || prefersReducedMotion()) return;
    const timer = window.setInterval(() => {
      const randoms = SKILL_PROCESSES.map(() => Math.random());
      setSamples((prev) =>
        Object.fromEntries(
          SKILL_PROCESSES.map((p, i) => {
            const values = prev[p.name] ?? [];
            return [p.name, [...values.slice(1), nextSample(last(values), p.percent, randoms[i] ?? 0.5)]];
          }),
        ),
      );
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [open]);

  const rows = SKILL_PROCESSES.filter((p) => filter === 'All' || p.group === filter).sort((a, b) => {
    const order = compare(a, b, sort.key, samples) || a.name.localeCompare(b.name);
    return sort.desc ? -order : order;
  });
  const current = SKILL_PROCESSES.find((p) => p.name === selected) ?? rows[0];
  const usage = current ? skillUsage(current.name) : { jobs: [], projects: [] };

  const pickFilter = (f: string) => {
    setFilter(f);
    const first = SKILL_PROCESSES.find((p) => f === 'All' || p.group === f);
    if (first && f !== 'All' && current?.group !== f) setSelected(first.name);
  };

  const sortBy = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: key !== 'name' }));

  // Up/Down move the selection, like a Mac table.
  const onTableKeyDown = (e: KeyboardEvent) => {
    const step = { ArrowUp: -1, ArrowDown: 1 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    const index = rows.findIndex((p) => p.name === current?.name);
    const next = rows[Math.max(0, Math.min(rows.length - 1, index + step))];
    if (!next) return;
    setSelected(next.name);
    requestAnimationFrame(() => document.getElementById(`am-row-${next.pid}`)?.focus());
  };

  return (
    <Dialog
      open={open}
      title="Activity Monitor"
      onClose={close}
      boxClassName="wide activity-box"
      zoomed={zoomed}
      onToggleZoom={() => setZoomed((z) => !z)}
    >
      <div className="activity">
        <div className="am-toolbar" role="group" aria-label="Show">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`am-filter${f === filter ? ' active' : ''}`}
              aria-pressed={f === filter}
              onClick={() => pickFilter(f)}
            >
              {FILTER_LABELS[f] ?? f}
            </button>
          ))}
        </div>

        <div className="am-table-wrap">
          <table className="am-table" onKeyDown={onTableKeyDown}>
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    className={c.className}
                    aria-sort={sort.key === c.key ? (sort.desc ? 'descending' : 'ascending') : undefined}
                  >
                    <button type="button" className="am-sort" onClick={() => sortBy(c.key)}>
                      {c.label}
                      <span className="am-caret" aria-hidden="true">
                        {sort.key === c.key ? (sort.desc ? '▾' : '▴') : ''}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const isSelected = p.name === current?.name;
                return (
                  <tr key={p.name} className={isSelected ? 'selected' : undefined} onClick={() => setSelected(p.name)}>
                    <td>
                      <button
                        type="button"
                        id={`am-row-${p.pid}`}
                        className="am-name"
                        aria-pressed={isSelected}
                        tabIndex={isSelected ? 0 : -1}
                        onClick={() => setSelected(p.name)}
                      >
                        <span className={`am-dot am-dot--${GROUP_INDEX[p.group] ?? 0}`} aria-hidden="true" />
                        {p.name}
                      </button>
                    </td>
                    <td className="am-num">{last(samples[p.name]).toFixed(1)}</td>
                    <td>{SHORT_GROUP[p.group] ?? p.group}</td>
                    <td className="am-wide-only">{p.level}</td>
                    <td className="am-num am-wide-only">{p.pid}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {current && (
          <div className="am-footer">
            <section className="am-panel am-used" aria-label={`Where ${current.name} is used`}>
              <h3 className="am-panel-title">Used in</h3>
              {usage.jobs.length + usage.projects.length === 0 ? (
                <p className="am-muted">Not tagged on a specific job or project.</p>
              ) : (
                <ul>
                  {usage.jobs.map((j) => (
                    <li key={j.company}>
                      <b>{j.company}</b> <span className="am-muted">job</span>
                    </li>
                  ))}
                  {usage.projects.map((p) => (
                    <li key={p.name}>
                      <b>{p.name}</b> <span className="am-muted">project</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="am-panel am-load">
              <h3 className="am-panel-title">
                CPU Load <span className="am-muted">· {current.name}</span>
              </h3>
              <LoadGraph values={samples[current.name] ?? []} />
            </section>
            <section className="am-panel am-stats">
              <dl>
                <dt>Level</dt>
                <dd>{current.level}</dd>
                <dt>Processes</dt>
                <dd>{SKILL_PROCESSES.length}</dd>
                <dt>Jobs</dt>
                <dd>{JOB_COUNT}</dd>
                <dt>Projects</dt>
                <dd>{PROJECT_COUNT}</dd>
                <dt>Uptime</dt>
                <dd className="am-mono">
                  <CareerUptime />
                </dd>
              </dl>
            </section>
          </div>
        )}
        <p className="am-hint">% CPU is the skill level, with a little live wobble. Pick a process to see where it was used.</p>
      </div>
    </Dialog>
  );
}
