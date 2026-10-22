'use client';

import { DocumentIcon, DosSmallIcon, StartLogo } from '@/components/icons';
import { Clock } from '@/components/live/Clock';
import { useOsApi, useOsState } from '@/components/os/OsProvider';

export function Taskbar() {
  const { actions, connect: { mainTaskbarButton, dosTaskbarButton } } = useOsApi();
  const { startMenuOpen, windows } = useOsState();

  return (
    <div className="taskbar">
      <button
        type="button"
        className={`start-button${startMenuOpen ? ' active' : ''}`}
        id="start-button"
        aria-haspopup="menu"
        aria-expanded={startMenuOpen}
        aria-controls="start-menu"
        onClick={(e) => {
          e.stopPropagation(); // the document click handler would immediately close it again
          actions.toggleStartMenu();
        }}
      >
        <StartLogo />
        Start
      </button>
      <div className="taskbar-sep" />
      <button
        ref={mainTaskbarButton}
        type="button"
        id="taskbar-window-btn"
        className={`taskbar-app-btn${windows.main === 'open' ? ' active' : ''}`}
        aria-pressed={windows.main === 'open'}
        onClick={actions.toggleMain}
      >
        <DocumentIcon />
        Shubham.exe
      </button>
      <button
        ref={dosTaskbarButton}
        type="button"
        id="taskbar-dos-btn"
        className={`taskbar-app-btn${windows.dos === 'open' ? ' active' : ''}`}
        style={{ display: windows.dos === 'closed' ? 'none' : 'flex' }}
        aria-pressed={windows.dos === 'open'}
        onClick={actions.toggleDos}
      >
        <DosSmallIcon />
        MS-DOS Prompt
      </button>
      <div className="taskbar-right">
        <div id="clock-behind">
          <Clock />
        </div>
      </div>
    </div>
  );
}
