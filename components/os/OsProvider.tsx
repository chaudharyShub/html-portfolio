'use client';

import { createContext, use, useMemo, useReducer, type ReactNode } from 'react';
import type { DialogIconType } from '@/components/icons';
import type { EmojiName } from '@/components/icons/Emoji';
import { SECTION_TO_TAB, type SectionId, type TabId } from '@/lib/sections';

export type DialogId = 'message' | 'closeConfirm' | 'trash' | 'game' | 'settings' | 'wizard' | 'timeMachine' | 'about' | 'activity' | 'links' | 'writing';
export type WindowStatus = 'open' | 'minimized' | 'closed';
export type WindowKey = 'main' | 'terminal';

/** Imperative API of a desktop window (drag/resize/animation live inside the component). */
export interface WindowHandle {
  open: () => void;
  close: () => void;
  minimize: () => void;
  restore: () => void;
  toggleFromDock: () => void;
  center: () => void;
  playOpenAnimation: () => void;
}

export interface TerminalConsoleHandle {
  /** Prints the startup banner if the console is empty. */
  prepare: () => void;
  focus: () => void;
}

export interface DesktopIconsHandle {
  resetLayout: () => void;
  arrange: () => void;
}

export interface GameHandle {
  start: () => void;
  stop: () => void;
}

/** A panel that can minimize into the Dock (see `Dialog`'s `minimizable`). */
export interface PanelHandle {
  /** True from the yellow button's click until it is restored. */
  isMinimized: () => boolean;
  restore: () => void;
  /** Builds the genie's copies ahead of a restore (the pointer is on its Dock icon). */
  prepareRestore: () => void;
}

interface MessageState {
  icon: DialogIconType;
  title: string;
  text: string;
}

/** One of our emoji drawings on a tile tinted with `tint` (a CSS color), shown in place of the app tile. */
export interface ToastEmoji {
  emoji: EmojiName;
  tint: string;
}

export interface ToastOptions {
  /** Replaces the app tile as the banner's icon. */
  emoji?: ToastEmoji;
  /** A small drawing before the title (the contact form's tick). */
  titleIcon?: EmojiName;
}

interface ToastState {
  id: number;
  title: string;
  message: string;
  emoji?: ToastEmoji;
  titleIcon?: EmojiName;
}

export interface OsState {
  dialogs: Record<DialogId, boolean>;
  /**
   * Open apps sent to the Dock with the yellow button (Activity Monitor, Writing); still open.
   * Reported by the panel when its genie lands, like the windows (re-rendering on the click held
   * up the animation's first frame).
   */
  minimized: Partial<Record<DialogId, boolean>>;
  message: MessageState;
  /** Bumped each time the wizard opens so it starts fresh. */
  wizardSession: number;
  tab: TabId;
  /** Bumped on every tab switch request so the content scrolls to top even when the tab is unchanged. */
  tabRequest: number;
  /** The logo menu (menu bar on desktop, action sheet on phones). */
  menuOpen: boolean;
  contextMenu: { x: number; y: number } | null;
  toast: ToastState | null;
  windows: Record<WindowKey, WindowStatus>;
}

type Action =
  | { type: 'openDialog'; id: DialogId }
  | { type: 'closeDialog'; id: DialogId }
  | { type: 'panelMinimized'; id: DialogId; minimized: boolean }
  | { type: 'showMessage'; message: MessageState }
  | { type: 'openWizard' }
  | { type: 'setTab'; tab: TabId }
  | { type: 'toggleMenu' }
  | { type: 'closeMenus' }
  | { type: 'openContextMenu'; x: number; y: number }
  | { type: 'showToast'; title: string; message: string; options?: ToastOptions }
  | { type: 'hideToast'; id: number }
  | { type: 'windowStatus'; key: WindowKey; status: WindowStatus };

const initialState: OsState = {
  dialogs: { message: false, closeConfirm: false, trash: false, game: false, settings: false, wizard: false, timeMachine: false, about: false, activity: false, links: false, writing: false },
  minimized: {},
  message: { icon: 'info', title: 'Shubham OS', text: '' },
  wizardSession: 0,
  tab: 'home',
  tabRequest: 0,
  menuOpen: false,
  contextMenu: null,
  toast: null,
  windows: { main: 'open', terminal: 'closed' },
};

function reducer(state: OsState, action: Action): OsState {
  switch (action.type) {
    case 'openDialog':
      return { ...state, dialogs: { ...state.dialogs, [action.id]: true } };
    case 'closeDialog':
      return { ...state, dialogs: { ...state.dialogs, [action.id]: false }, minimized: { ...state.minimized, [action.id]: false } };
    case 'panelMinimized':
      return !!state.minimized[action.id] === action.minimized
        ? state
        : { ...state, minimized: { ...state.minimized, [action.id]: action.minimized } };
    case 'showMessage':
      return { ...state, message: action.message, dialogs: { ...state.dialogs, message: true } };
    case 'openWizard':
      return { ...state, wizardSession: state.wizardSession + 1, dialogs: { ...state.dialogs, wizard: true } };
    case 'setTab':
      return { ...state, tab: action.tab, tabRequest: state.tabRequest + 1 };
    case 'toggleMenu':
      return { ...state, menuOpen: !state.menuOpen };
    case 'closeMenus':
      return state.menuOpen || state.contextMenu ? { ...state, menuOpen: false, contextMenu: null } : state;
    case 'openContextMenu':
      return { ...state, contextMenu: { x: action.x, y: action.y } };
    case 'showToast':
      return { ...state, toast: { id: (state.toast?.id ?? 0) + 1, title: action.title, message: action.message, ...action.options } };
    case 'hideToast':
      return state.toast?.id === action.id ? { ...state, toast: null } : state;
    case 'windowStatus':
      return state.windows[action.key] === action.status
        ? state
        : { ...state, windows: { ...state.windows, [action.key]: action.status } };
  }
}

/**
 * Stable callback refs that components use to plug their DOM nodes / imperative handles into
 * the desktop (e.g. `ref={connect.mainDockIcon}`), so actions can reach them later.
 */
export interface OsConnectors {
  mainWindow: (handle: WindowHandle | null) => void;
  terminalWindow: (handle: WindowHandle | null) => void;
  mainDockIcon: (el: HTMLButtonElement | null) => void;
  terminalDockIcon: (el: HTMLButtonElement | null) => void;
  terminalConsole: (handle: TerminalConsoleHandle | null) => void;
  desktopIcons: (handle: DesktopIconsHandle | null) => void;
  game: (handle: GameHandle | null) => void;
  panel: (id: DialogId, handle: PanelHandle | null) => void;
}

export interface OsActions {
  openDialog: (id: DialogId) => void;
  closeDialog: (id: DialogId) => void;
  /** A panel's genie landed in the Dock (true) or back on screen (false). */
  reportPanelMinimized: (id: DialogId, minimized: boolean) => void;
  /** The pointer rests on a minimized app's Dock icon: get its way back ready. */
  preparePanelRestore: (id: DialogId) => void;
  showMessage: (icon: DialogIconType, title: string, text: string) => void;
  showToast: (title: string, message: string, options?: ToastOptions) => void;
  hideToast: (id: number) => void;
  denyNewTextDocument: () => void;
  shutDown: () => void;
  openGame: () => void;
  closeGame: () => void;
  openResumeWizard: () => void;
  switchTab: (tab: TabId) => void;
  goToSection: (id: SectionId) => void;
  toggleMenu: () => void;
  closeMenus: () => void;
  openContextMenu: (x: number, y: number) => void;
  arrangeIcons: () => void;
  setWindowStatus: (key: WindowKey, status: WindowStatus) => void;
  toggleMain: () => void;
  confirmCloseMain: () => void;
  openTerminal: () => void;
  closeTerminal: () => void;
  toggleTerminal: () => void;
  focusTerminal: () => void;
  bootComplete: () => void;
  /** The dock icon a window minimizes into / restores from. */
  getDockIcon: (key: WindowKey) => HTMLElement | null;
}

interface Registry {
  mainWindow: WindowHandle | null;
  terminalWindow: WindowHandle | null;
  mainDockIcon: HTMLButtonElement | null;
  terminalDockIcon: HTMLButtonElement | null;
  terminalConsole: TerminalConsoleHandle | null;
  desktopIcons: DesktopIconsHandle | null;
  game: GameHandle | null;
  panels: Partial<Record<DialogId, PanelHandle>>;
}

interface OsApi {
  actions: OsActions;
  connect: OsConnectors;
}

const OsApiContext = createContext<OsApi | null>(null);
const OsStateContext = createContext<OsState | null>(null);

export function OsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Actions only touch `dispatch` and the registry below, so the API is created once and never changes.
  const api = useMemo<OsApi>(() => {
    // Handles that components plug in through `connect`; read only from event handlers/effects.
    const r: Registry = {
      mainWindow: null,
      terminalWindow: null,
      mainDockIcon: null,
      terminalDockIcon: null,
      terminalConsole: null,
      desktopIcons: null,
      game: null,
      panels: {},
    };
    const connect: OsConnectors = {
      mainWindow: (h) => void (r.mainWindow = h),
      terminalWindow: (h) => void (r.terminalWindow = h),
      mainDockIcon: (el) => void (r.mainDockIcon = el),
      terminalDockIcon: (el) => void (r.terminalDockIcon = el),
      terminalConsole: (h) => void (r.terminalConsole = h),
      desktopIcons: (h) => void (r.desktopIcons = h),
      game: (h) => void (r.game = h),
      panel: (id, h) => {
        if (h) r.panels[id] = h;
        else delete r.panels[id];
      },
    };
    const closeMenus = () => dispatch({ type: 'closeMenus' });
    const showMessage = (icon: DialogIconType, title: string, text: string) =>
      dispatch({ type: 'showMessage', message: { icon, title, text } });
    const switchTab = (tab: TabId) => dispatch({ type: 'setTab', tab });

    const actions: OsActions = {
      // Opening a minimized app (Dock, desktop icon, menu) brings it back from the Dock.
      openDialog: (id) => {
        const panel = r.panels[id];
        if (panel?.isMinimized()) panel.restore();
        else dispatch({ type: 'openDialog', id });
      },
      closeDialog: (id) => dispatch({ type: 'closeDialog', id }),
      reportPanelMinimized: (id, minimized) => dispatch({ type: 'panelMinimized', id, minimized }),
      preparePanelRestore: (id) => r.panels[id]?.prepareRestore(),
      showMessage,
      showToast: (title, message, options) => dispatch({ type: 'showToast', title, message, options }),
      hideToast: (id) => dispatch({ type: 'hideToast', id }),
      denyNewTextDocument: () =>
        showMessage('forbidden', 'Shubham OS', "Access denied: you don't have permission to create files in this dimension."),
      shutDown: () => {
        closeMenus();
        showMessage('info', 'Shubham OS', "It's now safe to close this tab. Just kidding - please stick around!");
      },
      openGame: () => {
        dispatch({ type: 'openDialog', id: 'game' });
        r.game?.start();
      },
      closeGame: () => {
        r.game?.stop();
        dispatch({ type: 'closeDialog', id: 'game' });
      },
      openResumeWizard: () => dispatch({ type: 'openWizard' }),
      switchTab,
      goToSection: (id) => {
        r.mainWindow?.restore();
        closeMenus();
        switchTab(SECTION_TO_TAB[id]);
      },
      toggleMenu: () => dispatch({ type: 'toggleMenu' }),
      closeMenus,
      openContextMenu: (x, y) => dispatch({ type: 'openContextMenu', x, y }),
      arrangeIcons: () => r.desktopIcons?.arrange(),
      setWindowStatus: (key, status) => dispatch({ type: 'windowStatus', key, status }),
      toggleMain: () => r.mainWindow?.toggleFromDock(),
      confirmCloseMain: () => {
        dispatch({ type: 'closeDialog', id: 'closeConfirm' });
        r.mainWindow?.minimize();
      },
      openTerminal: () => {
        r.terminalConsole?.prepare();
        r.terminalWindow?.open();
      },
      closeTerminal: () => r.terminalWindow?.close(),
      toggleTerminal: () => r.terminalWindow?.toggleFromDock(),
      focusTerminal: () => r.terminalConsole?.focus(),
      getDockIcon: (key) => (key === 'main' ? r.mainDockIcon : r.terminalDockIcon),
      bootComplete: () => {
        switchTab('home');
        r.desktopIcons?.resetLayout();
        r.mainWindow?.playOpenAnimation();
      },
    };
    return { actions, connect };
  }, []);

  return (
    <OsApiContext value={api}>
      <OsStateContext value={state}>{children}</OsStateContext>
    </OsApiContext>
  );
}

export function useOsApi(): OsApi {
  const api = use(OsApiContext);
  if (!api) throw new Error('useOsApi must be used inside <OsProvider>');
  return api;
}

export function useOsActions(): OsActions {
  return useOsApi().actions;
}

export function useOsState(): OsState {
  const state = use(OsStateContext);
  if (!state) throw new Error('useOsState must be used inside <OsProvider>');
  return state;
}
