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

/**
 * The console: output, then the prompt line right after it (like a real terminal), with a
 * block cursor. The real <input> sits invisibly over the prompt line, so typing, history,
 * selection and phone keyboards all work; what you see is the typed text plus the cursor.
 */
function TerminalConsole() {
  const { connect, actions } = useOsApi();
  const [output, setOutput] = useState('');
  const [draft, setDraft] = useState('');
  const [caret, setCaret] = useState(0);
  const [focused, setFocused] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const history = useRef<string[]>([]);
  const historyIndex = useRef(0);

  useImperativeHandle(connect.terminalConsole, () => ({
    prepare: () => setOutput((current) => current || TERMINAL_BANNER),
    focus: () => inputRef.current?.focus(),
  }));

  // Keep the prompt in view as output grows.
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [output]);

  const effects: TerminalEffects = {
    goToSection: actions.goToSection,
    openResumeWizard: actions.openResumeWizard,
    closeTerminal: actions.closeTerminal,
    openUrl: (url) => window.open(url, '_blank', 'noopener'),
  };

  /** Shows `value` with the cursor at the end (used by Enter and history). */
  const setLine = (value: string) => {
    setDraft(value);
    setCaret(value.length);
  };

  /** Follows the real input's caret (arrow keys, Home/End, clicks). */
  const syncCaret = (input: HTMLInputElement) => setCaret(input.selectionStart ?? input.value.length);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = e.currentTarget.value;
      setLine('');
      const result = runTerminalCommand(value, effects);
      setOutput((current) => (result.kind === 'clear' ? '' : appendTerminalLines(current, result.lines)));
      history.current.push(value);
      historyIndex.current = history.current.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex.current > 0) {
        historyIndex.current--;
        setLine(history.current[historyIndex.current] ?? '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex.current < history.current.length - 1) {
        historyIndex.current++;
        setLine(history.current[historyIndex.current] ?? '');
      } else {
        historyIndex.current = history.current.length;
        setLine('');
      }
    }
  };

  // Clicking anywhere in the console focuses the prompt, unless the user is selecting text.
  const onBodyClick = (e: MouseEvent) => {
    if (e.target === inputRef.current) return;
    if (window.getSelection()?.toString()) return;
    inputRef.current?.focus();
  };

  // Keep the input's own caret where ours is drawn after programmatic changes (history).
  useEffect(() => {
    const input = inputRef.current;
    if (input && document.activeElement === input) input.setSelectionRange(caret, caret);
  }, [draft, caret]);

  const at = Math.min(caret, draft.length);
  return (
    <div ref={bodyRef} className="terminal-body" id="terminal-body" onClick={onBodyClick}>
      <div className="terminal-output" role="log" aria-live="polite">
        {output}
      </div>
      <div className="terminal-input-row">
        <span className="terminal-prompt" aria-hidden="true">
          {TERMINAL_PROMPT}
        </span>
        <span className="terminal-field">
          <span className="terminal-line" aria-hidden="true">
            {draft.slice(0, at)}
            {/* Re-keyed on every change so the blink restarts: solid while typing, like macOS Terminal. */}
            <span key={`${draft}|${at}`} className={`terminal-cursor${focused ? ' focused' : ''}`}>
              {draft[at] ?? ' '}
            </span>
            {draft.slice(at + 1)}
          </span>
          <input
            ref={inputRef}
            type="text"
            id="terminal-input"
            aria-label="Terminal command"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              syncCaret(e.target);
            }}
            onKeyDown={onKeyDown}
            onKeyUp={(e) => syncCaret(e.currentTarget)}
            onSelect={(e) => syncCaret(e.currentTarget)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </span>
      </div>
    </div>
  );
}
