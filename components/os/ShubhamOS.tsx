'use client';

import { AppMenu } from '@/components/desktop/AppMenu';
import { ContextMenu } from '@/components/desktop/ContextMenu';
import { DesktopIcons } from '@/components/desktop/DesktopIcons';
import { DisplayEffects } from '@/components/desktop/DisplayEffects';
import { Dock } from '@/components/desktop/Dock';
import { LiveWallpaper } from '@/components/desktop/LiveWallpaper';
import { MadeByPill } from '@/components/desktop/MadeBy';
import { MenuBar } from '@/components/desktop/MenuBar';
import { Toast } from '@/components/desktop/Toast';
import { CloseConfirmDialog, LinksDialog, MessageDialog, TrashDialog } from '@/components/dialogs/SystemDialogs';
import { WritingDialog } from '@/components/dialogs/WritingDialog';
import { TerminalWindow } from '@/components/windows/TerminalWindow';
import { MainWindow, type MainWindowProps } from '@/components/windows/MainWindow';
import type { TerminalPost } from '@/lib/terminal';
import dynamic from 'next/dynamic';
import { useEffect, useState, type ReactNode } from 'react';
import { BootScreen } from './BootScreen';
import { OsProvider, useOsActions, useOsState, type DialogId } from './OsProvider';
import { useDesktopEvents } from './useDesktopEvents';

/*
 * The bigger apps are loaded on demand: none of them is downloaded, rendered or hydrated with the
 * page (that was most of the phone's startup work). Each mounts the first time its dialog opens
 * and then stays mounted like the others (so the game, Time Machine etc. keep their state). Their
 * code is fetched in the background once the page is idle, so the first open doesn't wait for it.
 */
const loadDebugRunner = () => import('@/components/dialogs/DebugRunnerDialog');
const loadTimeMachine = () => import('@/components/dialogs/TimeMachineDialog');
const loadActivityMonitor = () => import('@/components/dialogs/ActivityMonitorDialog');
const loadAboutDeveloper = () => import('@/components/dialogs/AboutDeveloperDialog');
const loadSettings = () => import('@/components/dialogs/SettingsDialog');
const loadInstallWizard = () => import('@/components/dialogs/InstallWizardDialog');
const LAZY_APPS = [loadDebugRunner, loadTimeMachine, loadActivityMonitor, loadAboutDeveloper, loadSettings, loadInstallWizard];

const DebugRunnerDialog = dynamic(() => loadDebugRunner().then((m) => m.DebugRunnerDialog), { ssr: false });
const TimeMachineDialog = dynamic(() => loadTimeMachine().then((m) => m.TimeMachineDialog), { ssr: false });
const ActivityMonitorDialog = dynamic(() => loadActivityMonitor().then((m) => m.ActivityMonitorDialog), { ssr: false });
const AboutDeveloperDialog = dynamic(() => loadAboutDeveloper().then((m) => m.AboutDeveloperDialog), { ssr: false });
const SettingsDialog = dynamic(() => loadSettings().then((m) => m.SettingsDialog), { ssr: false });
const InstallWizardDialog = dynamic(() => loadInstallWizard().then((m) => m.InstallWizardDialog), { ssr: false });

/** Renders `children` from the first time dialog `id` opens, and keeps them mounted after. */
function OnFirstOpen({ id, children }: { id: DialogId; children: ReactNode }) {
  const { dialogs } = useOsState();
  const [opened, setOpened] = useState(false);
  if (dialogs[id] && !opened) setOpened(true);
  return opened ? children : null;
}

/** Fetches the on-demand apps' code once the browser is idle after startup. */
function usePreloadApps() {
  useEffect(() => {
    const preload = () => LAZY_APPS.forEach((load) => void load());
    // Safari has no requestIdleCallback; a plain timeout is fine there.
    const hasIdle = 'requestIdleCallback' in window;
    let handle = 0;
    const timer = window.setTimeout(() => {
      handle = hasIdle ? window.requestIdleCallback(preload, { timeout: 4000 }) : window.setTimeout(preload, 0);
    }, 2000);
    return () => {
      window.clearTimeout(timer);
      if (hasIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, []);
}

/**
 * Root of the interactive desktop. Portfolio content arrives as server-rendered props and is
 * slotted into the main window; everything else here is client-side "OS" chrome.
 */
interface ShubhamOSProps extends MainWindowProps {
  /** The latest blog posts, for the Terminal's `blog` command. */
  posts: TerminalPost[];
  /** The Writing app's post list, rendered on the server. */
  writing: ReactNode;
}

export function ShubhamOS(props: ShubhamOSProps) {
  return (
    <OsProvider>
      <Desktop {...props} />
    </OsProvider>
  );
}

function Desktop({ posts, writing, ...props }: ShubhamOSProps) {
  const { bootComplete } = useOsActions();
  useDesktopEvents();
  usePreloadApps();

  // DOM order mirrors the original page; stacking is mostly controlled by z-index in CSS.
  return (
    <>
      <DisplayEffects />
      <BootScreen onFinish={bootComplete} />
      <LiveWallpaper />
      <DesktopIcons />
      <MadeByPill className="made-by" />
      <MenuBar />
      <AppMenu />
      <MainWindow {...props} />
      <TerminalWindow posts={posts} />
      <Dock />
      <MessageDialog />
      <CloseConfirmDialog />
      <TrashDialog />
      <LinksDialog />
      <WritingDialog>{writing}</WritingDialog>
      <OnFirstOpen id="game">
        <DebugRunnerDialog />
      </OnFirstOpen>
      <OnFirstOpen id="timeMachine">
        <TimeMachineDialog />
      </OnFirstOpen>
      <OnFirstOpen id="activity">
        <ActivityMonitorDialog />
      </OnFirstOpen>
      <OnFirstOpen id="about">
        <AboutDeveloperDialog />
      </OnFirstOpen>
      <OnFirstOpen id="settings">
        <SettingsDialog />
      </OnFirstOpen>
      <ContextMenu />
      <OnFirstOpen id="wizard">
        <InstallWizardDialog />
      </OnFirstOpen>
      <Toast />
    </>
  );
}
