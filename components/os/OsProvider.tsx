'use client';

import { createContext, use, useMemo, useReducer, type ReactNode } from 'react';
import type { DialogIconType } from '@/components/icons';
import { SECTION_TO_TAB, type SectionId, type TabId } from '@/lib/sections';

export type DialogId = 'message' | 'closeConfirm' | 'recycleBin' | 'game' | 'display' | 'wizard';
export type WindowStatus = 'open' | 'minimized' | 'closed';
export type WindowKey = 'main' | 'dos';

/** Imperative API of a desktop window (drag/resize/animation live inside the component). */
export interface WindowHandle {
  open: () => void;
  close: () => void;
  minimize: () => void;
  restore: () => void;
  toggleFromTaskbar: () => void;
  center: () => void;
  playOpenAnimation: () => void;
}

export interface DosConsoleHandle {
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

interface MessageState {
  icon: DialogIconType;
  title: string;
  text: string;
}

interface ToastState {
  id: number;
  title: string;
  message: string;
}

export interface OsState {
  dialogs: Record<DialogId, boolean>;
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
  | { type: 'showMessage'; message: MessageState }
  | { type: 'openWizard' }
  | { type: 'setTab'; tab: TabId }
  | { type: 'toggleMenu' }
  | { type: 'closeMenus' }
  | { type: 'openContextMenu'; x: number; y: number }
  | { type: 'showToast'; title: string; message: string }
  | { type: 'hideToast'; id: number }
  | { type: 'windowStatus'; key: WindowKey; status: WindowStatus };

const initialState: OsState = {
  dialogs: { message: false, closeConfirm: false, recycleBin: false, game: false, display: false, wizard: false },
  message: { icon: 'info', title: 'Shubham OS', text: '' },
  wizardSession: 0,
  tab: 'home',
  tabRequest: 0,
  menuOpen: false,
  contextMenu: null,
  toast: null,
  windows: { main: 'open', dos: 'closed' },
};

function reducer(state: OsState, action: Action): OsState {
  switch (action.type) {
    case 'openDialog':
      return { ...state, dialogs: { ...state.dialogs, [action.id]: true } };
    case 'closeDialog':
      return { ...state, dialogs: { ...state.dialogs, [action.id]: false } };
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
      return { ...state, toast: { id: (state.toast?.id ?? 0) + 1, title: action.title, message: action.message } };
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
 * the desktop (e.g. `ref={connect.mainTaskbarButton}`), so actions can reach them later.
 */
export interface OsConnectors {
  mainWindow: (handle: WindowHandle | null) => void;
  dosWindow: (handle: WindowHandle | null) => void;
  mainDockIcon: (el: HTMLButtonElement | null) => void;
  dosDockIcon: (el: HTMLButtonElement | null) => void;
  dosConsole: (handle: DosConsoleHandle | null) => void;
  desktopIcons: (handle: DesktopIconsHandle | null) => void;
  game: (handle: GameHandle | null) => void;
}

export interface OsActions {
  openDialog: (id: DialogId) => void;
  closeDialog: (id: DialogId) => void;
  showMessage: (icon: DialogIconType, title: string, text: string) => void;
  showToast: (title: string, message: string) => void;
  hideToast: (id: number) => void;
  showSystemProperties: () => void;
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
  openDos: () => void;
  closeDos: () => void;
  toggleDos: () => void;
  focusDos: () => void;
  bootComplete: () => void;
  /** The dock icon a window minimizes into / restores from. */
  getDockIcon: (key: WindowKey) => HTMLElement | null;
}

interface Registry {
  mainWindow: WindowHandle | null;
  dosWindow: WindowHandle | null;
  mainDockIcon: HTMLButtonElement | null;
  dosDockIcon: HTMLButtonElement | null;
  dosConsole: DosConsoleHandle | null;
  desktopIcons: DesktopIconsHandle | null;
  game: GameHandle | null;
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
      dosWindow: null,
      mainDockIcon: null,
      dosDockIcon: null,
      dosConsole: null,
      desktopIcons: null,
      game: null,
    };
    const connect: OsConnectors = {
      mainWindow: (h) => void (r.mainWindow = h),
      dosWindow: (h) => void (r.dosWindow = h),
      mainDockIcon: (el) => void (r.mainDockIcon = el),
      dosDockIcon: (el) => void (r.dosDockIcon = el),
      dosConsole: (h) => void (r.dosConsole = h),
      desktopIcons: (h) => void (r.desktopIcons = h),
      game: (h) => void (r.game = h),
    };
    const closeMenus = () => dispatch({ type: 'closeMenus' });
    const showMessage = (icon: DialogIconType, title: string, text: string) =>
      dispatch({ type: 'showMessage', message: { icon, title, text } });
    const switchTab = (tab: TabId) => dispatch({ type: 'setTab', tab });

    const actions: OsActions = {
      openDialog: (id) => dispatch({ type: 'openDialog', id }),
      closeDialog: (id) => dispatch({ type: 'closeDialog', id }),
      showMessage,
      showToast: (title, message) => dispatch({ type: 'showToast', title, message }),
      hideToast: (id) => dispatch({ type: 'hideToast', id }),
      showSystemProperties: () =>
        showMessage(
          'info',
          'About Shubham HD',
          'Shubham OS v3.0 - Full Stack Engineer - 4+ Years Experience - RAM: 640K - Status: Online',
        ),
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
      toggleMain: () => r.mainWindow?.toggleFromTaskbar(),
      confirmCloseMain: () => {
        dispatch({ type: 'closeDialog', id: 'closeConfirm' });
        r.mainWindow?.minimize();
      },
      openDos: () => {
        r.dosConsole?.prepare();
        r.dosWindow?.open();
      },
      closeDos: () => r.dosWindow?.close(),
      toggleDos: () => r.dosWindow?.toggleFromTaskbar(),
      focusDos: () => r.dosConsole?.focus(),
      getDockIcon: (key) => (key === 'main' ? r.mainDockIcon : r.dosDockIcon),
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
