'use client';

import { useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { useOsApi, type WindowStatus } from '@/components/os/OsProvider';
import { appendDosLines, DOS_BANNER, DOS_PROMPT, runDosCommand, type DosEffects } from '@/lib/dos';
import { Window } from './Window';

/** Terminal window (an app on phones). Output persists across minimize/close; only `clear` empties it. */
export function DosWindow() {
  const { connect: { dosWindow }, actions } = useOsApi();
  return (
    <Window
      ref={dosWindow}
      id="dos-window"
      variant="subwindow"
      title="Terminal — zsh"
      getDockIcon={() => actions.getDockIcon('dos')}
      initiallyOpen={false}
      minWidth={340}
      minHeight={220}
      role="dialog"
      onCloseRequest={actions.closeDos}
      onStatusChange={(status: WindowStatus) => actions.setWindowStatus('dos', status)}
      onShown={actions.focusDos}
    >
      <DosConsole />
    </Window>
  );
}

function DosConsole() {
  const { connect, actions } = useOsApi();
  const [output, setOutput] = useState('');
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const history = useRef<string[]>([]);
  const historyIndex = useRef(0);

  useImperativeHandle(connect.dosConsole, () => ({
    prepare: () => setOutput((current) => current || DOS_BANNER),
    focus: () => inputRef.current?.focus(),
  }));

  useEffect(() => {
    const el = outputRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [output]);

  const effects: DosEffects = {
    goToSection: actions.goToSection,
    openResumeWizard: actions.openResumeWizard,
    closeDos: actions.closeDos,
    openUrl: (url) => window.open(url, '_blank', 'noopener'),
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    if (e.key === 'Enter') {
      const value = input.value;
      input.value = '';
      const result = runDosCommand(value, effects);
      setOutput((current) => (result.kind === 'clear' ? '' : appendDosLines(current, result.lines)));
      history.current.push(value);
      historyIndex.current = history.current.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex.current > 0) {
        historyIndex.current--;
        input.value = history.current[historyIndex.current] ?? '';
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex.current < history.current.length - 1) {
        historyIndex.current++;
        input.value = history.current[historyIndex.current] ?? '';
      } else {
        historyIndex.current = history.current.length;
        input.value = '';
      }
    }
  };

  // Clicking anywhere in the console focuses the prompt, unless the user is selecting text.
  const onBodyClick = (e: MouseEvent) => {
    if (e.target === inputRef.current) return;
    if (window.getSelection()?.toString()) return;
    inputRef.current?.focus();
  };

  return (
    <div className="dos-body" id="dos-body" onClick={onBodyClick}>
      <div ref={outputRef} className="dos-output" role="log" aria-live="polite">
        {output}
      </div>
      <div className="dos-input-row">
        <span aria-hidden="true">{DOS_PROMPT}</span>
        <input
          ref={inputRef}
          type="text"
          id="dos-input"
          aria-label="Terminal command"
          autoComplete="off"
          spellCheck={false}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
}
