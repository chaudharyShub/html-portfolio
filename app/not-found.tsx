import type { Metadata } from 'next';
import Link from 'next/link';
import { DialogIcon } from '@/components/icons';

export const metadata: Metadata = {
  title: 'File Not Found',
  robots: { index: false },
};

/** Win95-style "file not found" error box on the plain teal desktop. */
export default function NotFound() {
  return (
    <main className="not-found">
      <div className="dialog-box wide" role="alertdialog" aria-labelledby="nf-title" aria-describedby="nf-text">
        <div className="dialog-title-bar">
          <span id="nf-title">C:\WINDOWS\404.EXE</span>
        </div>
        <div className="dialog-body">
          <div className="dialog-icon">
            <DialogIcon type="error" />
          </div>
          <h1 className="not-found-heading">File Not Found</h1>
          <p id="nf-text">The page you were looking for has been moved to the Recycle Bin, or never existed.</p>
          <div className="dialog-buttons">
            <Link className="btn" href="/">
              OK - Back to Desktop
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
