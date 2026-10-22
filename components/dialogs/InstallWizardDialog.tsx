'use client';

import { useEffect, useRef, useState } from 'react';
import { DialogIcon, WizardDiskIcon } from '@/components/icons';
import { useOsActions, useOsState } from '@/components/os/OsProvider';
import { PROFILE } from '@/data/profile';
import { clickLink } from '@/lib/download';
import { Dialog } from './Dialog';

type Step = 'welcome' | 'license' | 'installing' | 'complete';

const INSTALL_DURATION_MS = 1500;
const INSTALL_MESSAGES = [
  'Copying files...',
  'Registering experience entries...',
  'Installing skill modules...',
  'Compiling achievements...',
  'Done.',
];

/** Resume "InstallShield" wizard. Remounted (via key) on every open, so it always starts at step 1. */
export function InstallWizardDialog() {
  const { dialogs, wizardSession } = useOsState();
  const { closeDialog } = useOsActions();
  const close = () => closeDialog('wizard');
  return (
    <Dialog open={dialogs.wizard} title="Shubham_Resume.exe Setup" onClose={close} boxClassName="wizard-box">
      <WizardSteps key={wizardSession} onClose={close} />
    </Dialog>
  );
}

function WizardSteps({ onClose }: { onClose: () => void }) {
  const { showToast } = useOsActions();
  const [step, setStep] = useState<Step>('welcome');
  const [agreed, setAgreed] = useState(false);
  const [progress, setProgress] = useState(0);
  const frame = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      window.clearTimeout(timer.current);
    },
    [],
  );

  const startInstall = () => {
    setStep('installing');
    setProgress(0);
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(100, ((now - start) / INSTALL_DURATION_MS) * 100);
      setProgress(p);
      if (p < 100) frame.current = requestAnimationFrame(tick);
      else timer.current = window.setTimeout(() => setStep('complete'), 300);
    };
    frame.current = requestAnimationFrame(tick);
  };

  const next = () => {
    if (step === 'welcome') setStep('license');
    else if (step === 'license') {
      if (!agreed) {
        showToast('Setup Wizard', 'You must accept the license agreement to continue.');
        return;
      }
      startInstall();
    } else if (step === 'complete') {
      clickLink(PROFILE.resume.href, { download: PROFILE.resume.fileName, newTab: true });
      onClose();
    }
  };

  const back = () => {
    if (step === 'license') {
      setAgreed(false);
      setStep('welcome');
    }
  };

  const statusMessage = INSTALL_MESSAGES[Math.min(Math.floor(progress / 22), INSTALL_MESSAGES.length - 1)];

  return (
    <>
      <div className="wizard-body">
        <div className="wizard-sidebar">
          <WizardDiskIcon />
          <div className="wizard-sidebar-title">
            Shubham
            <br />
            Resume
            <br />
            Setup
          </div>
        </div>
        <div className="wizard-content" aria-live="polite">
          {step === 'welcome' && (
            <>
              <h3>Welcome to Resume Setup Wizard</h3>
              <p>
                The Setup Wizard will install <b>{PROFILE.resume.fileName}</b> on your computer.
              </p>
              <p className="wizard-spaced">
                It is recommended that you close all other browser tabs before continuing. (Just kidding.)
              </p>
              <p className="wizard-spaced">
                Click <b>Next</b> to continue.
              </p>
            </>
          )}
          {step === 'license' && (
            <>
              <h3>Ready to Install</h3>
              <p>The Wizard is ready to begin installation.</p>
              <fieldset className="wizard-license">
                <p className="wizard-license-text">
                  &ldquo;By clicking Next, you agree that this resume may cause spontaneous interview requests,
                  uncontrollable urge to hire, and general excitement about frontend engineering. Shubham is not liable
                  for career-altering decisions.&rdquo;
                </p>
                <label className="wizard-agree">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /> I accept the
                  terms of this license agreement
                </label>
              </fieldset>
            </>
          )}
          {step === 'installing' && (
            <>
              <h3>Installing...</h3>
              <p>Please wait while credentials are being compiled.</p>
              <div
                id="wizard-progress-track"
                role="progressbar"
                aria-label="Installation progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.floor(progress)}
              >
                <div id="wizard-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="wizard-status">{statusMessage}</p>
            </>
          )}
          {step === 'complete' && (
            <>
              <h3>Setup Complete</h3>
              <div className="wizard-complete">
                <DialogIcon type="info" />
                <p>
                  {PROFILE.resume.fileName} has been successfully installed.
                  <br />
                  <br />
                  Click <b>Finish</b> to exit Setup and open your resume.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="wizard-footer">
        <button type="button" onClick={back} disabled={step !== 'license'}>
          &lt; Back
        </button>
        <button type="button" onClick={next} disabled={step === 'installing'}>
          {step === 'complete' ? 'Finish' : 'Next >'}
        </button>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </>
  );
}
