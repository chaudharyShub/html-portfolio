'use client';

import { DialogIcon } from '@/components/icons';
import { useOsActions, useOsState } from '@/components/os/OsProvider';
import { Dialog } from './Dialog';

const RECYCLE_BIN_ITEMS = [
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
    <Dialog open={dialogs.message} title={message.title} onClose={close}>
      <div className="dialog-body">
        <div className="dialog-icon">
          <DialogIcon type={message.icon} />
        </div>
        <p>{message.text}</p>
        <div className="dialog-buttons">
          <button type="button" onClick={close}>
            OK
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export function CloseConfirmDialog() {
  const { dialogs } = useOsState();
  const { closeDialog, confirmCloseMain } = useOsActions();
  const close = () => closeDialog('closeConfirm');
  return (
    <Dialog open={dialogs.closeConfirm} title="Shubham OS" onClose={close}>
      <div className="dialog-body">
        <div className="dialog-icon">
          <DialogIcon type="question" />
        </div>
        <p>
          Are you sure you want to close Shubham.exe?
          <br />
          <span className="dialog-note">(Spoiler: you can&apos;t. But I&apos;ll minimize it for you.)</span>
        </p>
        <div className="dialog-buttons">
          <button type="button" onClick={confirmCloseMain}>
            Yes
          </button>
          <button type="button" onClick={close}>
            No
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export function RecycleBinDialog() {
  const { dialogs } = useOsState();
  const { closeDialog } = useOsActions();
  const close = () => closeDialog('recycleBin');
  return (
    <Dialog open={dialogs.recycleBin} title="Recycle Bin" onClose={close} boxClassName="wide">
      <div className="dialog-body align-left">
        <div className="recycle-list">
          {RECYCLE_BIN_ITEMS.map((item) => (
            <div key={item}>{item}</div>
          ))}
        </div>
        <div className="dialog-buttons">
          <button type="button" onClick={close}>
            Close
          </button>
        </div>
      </div>
    </Dialog>
  );
}
