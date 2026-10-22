'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { DocumentIcon } from '@/components/icons';
import { useOsApi, useOsState, type WindowStatus } from '@/components/os/OsProvider';
import { pressableProps } from '@/lib/a11y';
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

/** "Shubham.exe" - the single scrolling portfolio window. Closing it only minimizes (after a joke prompt). */
export function MainWindow({ sections, infoBar, statusBar }: MainWindowProps) {
  const { connect: { mainWindow }, actions } = useOsApi();
  return (
    <Window
      ref={mainWindow}
      id="window"
      variant="window"
      title="Shubham.exe - Portfolio Manager"
      icon={<DocumentIcon />}
      getTaskbarButton={() => actions.getTaskbarButton('main')}
      initiallyOpen
      enableSnap
      recenterOnDoubleClick
      minWidth={360}
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

function TabBar() {
  const { tab } = useOsState();
  const { switchTab } = useOsApi().actions;
  return (
    <div className="tab-bar" role="tablist" aria-label="Portfolio sections">
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
          {TAB_LABELS[id]}
        </div>
      ))}
    </div>
  );
}

function TabbedContent({ sections }: { sections: Record<SectionId, ReactNode> }) {
  const { tab, tabRequest } = useOsState();
  const contentRef = useRef<HTMLElement>(null);
  const visible = TAB_SECTIONS[tab];

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [tab, tabRequest]);

  return (
    <main ref={contentRef} className="content" id={CONTENT_ID} role="tabpanel" aria-labelledby={`tab-${tab}`}>
      <h1 className="sr-only">Shubham Chaudhary — Full Stack Engineer Portfolio</h1>
      {sectionOrder(tab).map((id) => (
        <div key={id} className="section-slot" hidden={!visible.includes(id)}>
          {sections[id]}
        </div>
      ))}
    </main>
  );
}
