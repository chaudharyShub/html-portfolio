'use client';

import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { TabGlyph } from '@/components/icons';
import { useOsApi, useOsState, type WindowStatus } from '@/components/os/OsProvider';
import { pressableProps } from '@/lib/a11y';
import { APPLE_EASE, BEFORE_GENIE_COPY, prefersReducedMotion } from '@/lib/motion';
import { sectionOrder, TAB_IDS, TAB_LABELS, TAB_SECTIONS, type SectionId } from '@/lib/sections';
import { Window } from './Window';

export interface MainWindowProps {
  /** Server-rendered portfolio sections, keyed by section id. */
  sections: Record<SectionId, ReactNode>;
  /** Server-rendered bar under the tabs (name, role, status...). */
  infoBar: ReactNode;
  /** Server-rendered footer status bar. */
  statusBar: ReactNode;
}

const CONTENT_ID = 'window-content';

/** The portfolio window (an app on phones). Closing it only minimizes (after a joke prompt). */
export function MainWindow({ sections, infoBar, statusBar }: MainWindowProps) {
  const { connect: { mainWindow }, actions } = useOsApi();
  return (
    <Window
      ref={mainWindow}
      id="window"
      variant="window"
      title="Shubham - Portfolio"
      getDockIcon={() => actions.getDockIcon('main')}
      initiallyOpen
      enableSnap
      recenterOnDoubleClick
      minWidth={600}
      minHeight={300}
      onCloseRequest={() => actions.openDialog('closeConfirm')}
      onStatusChange={(status: WindowStatus) => actions.setWindowStatus('main', status)}
    >
      <TabBar />
      {infoBar}
      <TabbedContent sections={sections} />
      {statusBar}
    </Window>
  );
}

/**
 * A macOS sidebar on desktop (colored icon tiles, a selection highlight that glides between
 * rows); the iOS tab bar on phones.
 */
function TabBar() {
  const { tab } = useOsState();
  const { switchTab } = useOsApi().actions;
  const barRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const bar = barRef.current;
    const pill = pillRef.current;
    if (!bar || !pill) return;
    const place = () => {
      const active = bar.querySelector<HTMLElement>('.tab.active');
      if (!active) return;
      pill.style.width = `${active.offsetWidth}px`;
      pill.style.height = `${active.offsetHeight}px`;
      pill.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(bar);
    // While the window sits in the Dock it is hidden and the highlight measures 0px; re-measure
    // before the restore animation copies the window, or the copies show no highlight.
    const win = bar.closest<HTMLElement>('.window');
    win?.addEventListener(BEFORE_GENIE_COPY, place);
    return () => {
      observer.disconnect();
      win?.removeEventListener(BEFORE_GENIE_COPY, place);
    };
  }, [tab]);

  return (
    <div className="tab-bar-wrap">
      <div ref={barRef} className="tab-bar" role="tablist" aria-label="Portfolio sections" aria-orientation="vertical">
        <div ref={pillRef} className="tab-pill" aria-hidden="true" />
        {TAB_IDS.map((id) => (
          <div
            key={id}
            id={`tab-${id}`}
            className={`tab${id === tab ? ' active' : ''}`}
            {...pressableProps}
            onClick={() => switchTab(id)}
            role="tab"
            aria-selected={id === tab}
            aria-controls={CONTENT_ID}
          >
            <span className={`tab-tile tab-tile--${id}`}>
              <TabGlyph name={id} />
            </span>
            <span className="tab-label">{TAB_LABELS[id]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabbedContent({ sections }: { sections: Record<SectionId, ReactNode> }) {
  const { tab, tabRequest } = useOsState();
  const contentRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const visible = TAB_SECTIONS[tab];

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    content.scrollTop = 0;
    // On phones the whole app scrolls, not just the content area.
    const app = content.closest<HTMLElement>('.window');
    if (app) app.scrollTop = 0;
    const panel = panelRef.current;
    if (panel && !prefersReducedMotion()) {
      panel.animate(
        [
          { opacity: 0, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 320, easing: APPLE_EASE },
      );
    }
  }, [tab, tabRequest]);

  return (
    <main ref={contentRef} className="content">
      <h1 className="sr-only">Shubham Chaudhary - Full Stack Engineer Portfolio</h1>
      <div ref={panelRef} id={CONTENT_ID} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {sectionOrder(tab).map((id) => (
          <div key={id} className="section-slot" hidden={!visible.includes(id)}>
            {sections[id]}
          </div>
        ))}
      </div>
    </main>
  );
}
