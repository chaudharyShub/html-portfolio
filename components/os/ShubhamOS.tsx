'use client';

import { ContextMenu } from '@/components/desktop/ContextMenu';
import { DesktopIcons } from '@/components/desktop/DesktopIcons';
import { DisplayEffects } from '@/components/desktop/DisplayEffects';
import { DvdLogo } from '@/components/desktop/DvdLogo';
import { StartMenu } from '@/components/desktop/StartMenu';
import { Taskbar } from '@/components/desktop/Taskbar';
import { Toast } from '@/components/desktop/Toast';
import { DebugRunnerDialog } from '@/components/dialogs/DebugRunnerDialog';
import { DisplayPropertiesDialog } from '@/components/dialogs/DisplayPropertiesDialog';
import { InstallWizardDialog } from '@/components/dialogs/InstallWizardDialog';
import { CloseConfirmDialog, MessageDialog, RecycleBinDialog } from '@/components/dialogs/SystemDialogs';
import { DosWindow } from '@/components/windows/DosWindow';
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
      <DesktopIcons />
      <DvdLogo />
      <Taskbar />
      <StartMenu />
      <MainWindow {...props} />
      <DosWindow />
      <MessageDialog />
      <CloseConfirmDialog />
      <RecycleBinDialog />
      <DebugRunnerDialog />
      <DisplayPropertiesDialog />
      <ContextMenu />
      <InstallWizardDialog />
      <Toast />
    </>
  );
}
