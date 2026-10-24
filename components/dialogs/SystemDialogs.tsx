'use client';

import { AppIcon, DialogIcon } from '@/components/icons';
import { useOsActions, useOsState } from '@/components/os/OsProvider';
import { Dialog } from './Dialog';

const TRASH_ITEMS = [
  'console.log("why isn\'t this working")',
  'old_resume_final_v2_FINAL.docx',
  'unused_css.css',
  'todo_list_i_will_never_finish.txt',
  'a_bug_i_fixed_by_accident.js',
  'impostor_syndrome.exe (access denied)',
];

export function MessageDialog() {
  const { dialogs, message } = useOsState();
  const { closeDialog } = useOsActions();
  const close = () => closeDialog('message');
  return (
    <Dialog open={dialogs.message} kind="alert" title={message.title} icon={<DialogIcon type={message.icon} />} onClose={close}>
      <p className="alert-text">{message.text}</p>
      <div className="dialog-buttons">
        <button type="button" className="btn-primary" onClick={close}>
          OK
        </button>
      </div>
    </Dialog>
  );
}

export function CloseConfirmDialog() {
  const { dialogs } = useOsState();
  const { closeDialog, confirmCloseMain } = useOsActions();
  const close = () => closeDialog('closeConfirm');
  return (
    <Dialog
      open={dialogs.closeConfirm}
      kind="alert"
      title="Are you sure you want to quit Shubham?"
      icon={<AppIcon name="portfolio" size={56} />}
      onClose={close}
    >
      <p className="alert-text">(Spoiler: you can&apos;t. But I&apos;ll minimize it to the Dock for you.)</p>
      <div className="dialog-buttons">
        <button type="button" onClick={close}>
          Cancel
        </button>
        <button type="button" className="btn-primary" onClick={confirmCloseMain}>
          Quit
        </button>
      </div>
    </Dialog>
  );
}

export function RecycleBinDialog() {
  const { dialogs } = useOsState();
  const { closeDialog } = useOsActions();
  const close = () => closeDialog('recycleBin');
  return (
    <Dialog open={dialogs.recycleBin} title="Trash" onClose={close} boxClassName="wide">
      <div className="dialog-body">
        <ul className="recycle-list">
          {TRASH_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="dialog-buttons">
          <button type="button" className="btn-primary" onClick={close}>
            Close
          </button>
        </div>
      </div>
    </Dialog>
  );
}
