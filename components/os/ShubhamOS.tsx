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
import { DebugRunnerDialog } from '@/components/dialogs/DebugRunnerDialog';
import { TimeMachineDialog } from '@/components/dialogs/TimeMachineDialog';
import { AboutDeveloperDialog } from '@/components/dialogs/AboutDeveloperDialog';
import { ActivityMonitorDialog } from '@/components/dialogs/ActivityMonitorDialog';
import { SettingsDialog } from '@/components/dialogs/SettingsDialog';
import { InstallWizardDialog } from '@/components/dialogs/InstallWizardDialog';
import { CloseConfirmDialog, LinksDialog, MessageDialog, TrashDialog } from '@/components/dialogs/SystemDialogs';
import { TerminalWindow } from '@/components/windows/TerminalWindow';
import { MainWindow, type MainWindowProps } from '@/components/windows/MainWindow';
import type { TerminalPost } from '@/lib/terminal';
import { BootScreen } from './BootScreen';
import { OsProvider, useOsActions } from './OsProvider';
import { useDesktopEvents } from './useDesktopEvents';

/**
 * Root of the interactive desktop. Portfolio content arrives as server-rendered props and is
 * slotted into the main window; everything else here is client-side "OS" chrome.
 */
interface ShubhamOSProps extends MainWindowProps {
  /** The latest blog posts, for the Terminal's `blog` command. */
  posts: TerminalPost[];
}

export function ShubhamOS(props: ShubhamOSProps) {
  return (
    <OsProvider>
      <Desktop {...props} />
    </OsProvider>
  );
}

function Desktop({ posts, ...props }: ShubhamOSProps) {
  const { bootComplete } = useOsActions();
  useDesktopEvents();

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
      <DebugRunnerDialog />
      <TimeMachineDialog />
      <ActivityMonitorDialog />
      <AboutDeveloperDialog />
      <SettingsDialog />
      <ContextMenu />
      <InstallWizardDialog />
      <Toast />
    </>
  );
}
