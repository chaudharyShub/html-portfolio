'use client';

import { useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { useOsApi, type WindowStatus } from '@/components/os/OsProvider';
import { appendTerminalLines, TERMINAL_BANNER, TERMINAL_PROMPT, runTerminalCommand, type TerminalEffects } from '@/lib/terminal';
import { Window } from './Window';

/** Terminal window (an app on phones). Output persists across minimize/close; only `clear` empties it. */
export function TerminalWindow() {
  const { connect: { terminalWindow }, actions } = useOsApi();
  return (
    <Window
      ref={terminalWindow}
      id="terminal-window"
      variant="subwindow"
      title="Terminal - zsh"
      getDockIcon={() => actions.getDockIcon('terminal')}
      initiallyOpen={false}
      minWidth={340}
      minHeight={220}
      role="dialog"
      onCloseRequest={actions.closeTerminal}
      onStatusChange={(status: WindowStatus) => actions.setWindowStatus('terminal', status)}
      onShown={actions.focusTerminal}
    >
      <TerminalConsole />
    </Window>
  );
}

function TerminalConsole() {
  const { connect, actions } = useOsApi();
  const [output, setOutput] = useState('');
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const history = useRef<string[]>([]);
  const historyIndex = useRef(0);

  useImperativeHandle(connect.terminalConsole, () => ({
    prepare: () => setOutput((current) => current || TERMINAL_BANNER),
    focus: () => inputRef.current?.focus(),
  }));

  useEffect(() => {
    const el = outputRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [output]);

  const effects: TerminalEffects = {
    goToSection: actions.goToSection,
    openResumeWizard: actions.openResumeWizard,
    closeTerminal: actions.closeTerminal,
    openUrl: (url) => window.open(url, '_blank', 'noopener'),
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    if (e.key === 'Enter') {
      const value = input.value;
      input.value = '';
      const result = runTerminalCommand(value, effects);
      setOutput((current) => (result.kind === 'clear' ? '' : appendTerminalLines(current, result.lines)));
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
    <div className="terminal-body" id="terminal-body" onClick={onBodyClick}>
      <div ref={outputRef} className="terminal-output" role="log" aria-live="polite">
        {output}
      </div>
      <div className="terminal-input-row">
        <span aria-hidden="true">{TERMINAL_PROMPT}</span>
        <input
          ref={inputRef}
          type="text"
          id="terminal-input"
          aria-label="Terminal command"
          autoComplete="off"
          spellCheck={false}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
}
