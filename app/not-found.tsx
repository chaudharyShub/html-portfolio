import type { Metadata } from 'next';
import Link from 'next/link';
import { DialogIcon } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false },
};

/** macOS-style alert on the plain desktop. */
export default function NotFound() {
  return (
    <main className="not-found">
      <div className="dialog-box dialog-box--alert" role="alertdialog" aria-labelledby="nf-title" aria-describedby="nf-text">
        <div className="dialog-icon">
          <DialogIcon type="warning" />
        </div>
        <h1 className="alert-title" id="nf-title">
          Page Not Found
        </h1>
        <p className="alert-text" id="nf-text">
          The page you were looking for has been moved to the Trash, or never existed.
        </p>
        <div className="dialog-buttons">
          <Link className="btn btn-primary" href="/">
            Back to Desktop
          </Link>
        </div>
      </div>
    </main>
  );
}
