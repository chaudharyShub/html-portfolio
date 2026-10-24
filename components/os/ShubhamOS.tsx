'use client';

import { AppMenu } from '@/components/desktop/AppMenu';
import { ContextMenu } from '@/components/desktop/ContextMenu';
import { DesktopIcons } from '@/components/desktop/DesktopIcons';
import { DisplayEffects } from '@/components/desktop/DisplayEffects';
import { Dock } from '@/components/desktop/Dock';
import { LiveWallpaper } from '@/components/desktop/LiveWallpaper';
import { MenuBar } from '@/components/desktop/MenuBar';
import { Toast } from '@/components/desktop/Toast';
import { DebugRunnerDialog } from '@/components/dialogs/DebugRunnerDialog';
import { SettingsDialog } from '@/components/dialogs/SettingsDialog';
import { InstallWizardDialog } from '@/components/dialogs/InstallWizardDialog';
import { CloseConfirmDialog, MessageDialog, TrashDialog } from '@/components/dialogs/SystemDialogs';
import { TerminalWindow } from '@/components/windows/TerminalWindow';
import { MainWindow, type MainWindowProps } from '@/components/windows/MainWindow';
import { BootScreen } from './BootScreen';
import { OsProvider, useOsActions } from './OsProvider';
import { useDesktopEvents } from './useDesktopEvents';

/**
 * Root of the interactive desktop. Portfolio content arrives as server-rendered props and is
 * slotted into the main window; everything else here is client-side "OS" chrome.
 */
export function ShubhamOS(props: MainWindowProps) {
  return (
    <OsProvider>
      <Desktop {...props} />
    </OsProvider>
  );
}

function Desktop(props: MainWindowProps) {
  const { bootComplete } = useOsActions();
  useDesktopEvents();

  // DOM order mirrors the original page; stacking is mostly controlled by z-index in CSS.
  return (
    <>
      <DisplayEffects />
      <BootScreen onFinish={bootComplete} />
      <LiveWallpaper />
      <DesktopIcons />
      <MenuBar />
      <AppMenu />
      <MainWindow {...props} />
      <TerminalWindow />
      <Dock />
      <MessageDialog />
      <CloseConfirmDialog />
      <TrashDialog />
      <DebugRunnerDialog />
      <SettingsDialog />
      <ContextMenu />
      <InstallWizardDialog />
      <Toast />
    </>
  );
}
