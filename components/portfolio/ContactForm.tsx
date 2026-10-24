'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useOsActions } from '@/components/os/OsProvider';
import {
  buildMailtoLink,
  recordMessageSent,
  SEND_LIMIT,
  secondsUntilNextSend,
  sendViaWeb3Forms,
  type ContactMessage,
} from '@/lib/contact';
import { clickLink } from '@/lib/download';

/**
 * Contact form. Sends through Web3Forms when an access key is configured; otherwise (or if
 * sending fails) it falls back to opening the visitor's mail app with a prefilled mailto: link.
 */
export function ContactForm({ accessKey }: { accessKey: string }) {
  const { showToast } = useOsActions();
  const [sending, setSending] = useState(false);
  // State updates are async, so several submits fired in the same tick would all see
  // `sending === false`. The ref flips synchronously and blocks them.
  const sendingRef = useRef(false);

  // The toast must fire BEFORE navigating: in some sandboxed/preview contexts opening a
  // mailto: link throws synchronously and would otherwise kill the rest of the handler.
  const openMailFallback = (msg: ContactMessage, title: string, text: string) => {
    showToast(title, text);
    try {
      clickLink(buildMailtoLink(msg));
    } catch (err) {
      console.warn('Could not open mail client automatically:', err);
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sendingRef.current) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    const msg: ContactMessage = {
      name: String(data.get('name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      message: String(data.get('message') ?? '').trim(),
    };

    // Honeypot: real visitors never see or tick this, bots usually do. Pretend it worked.
    if (data.get('botcheck')) {
      form.reset();
      showToast('✔ Message sent', 'Thanks! Shubham will get back to you soon.');
      return;
    }

    if (!accessKey) {
      openMailFallback(
        msg,
        '✔ Message ready to send',
        "Your email client should open now. Shubham will reply within 1 business day - or when he's done debugging.",
      );
      return;
    }

    const wait = secondsUntilNextSend();
    if (wait > 0) {
      showToast(
        'Please wait',
        `You've sent ${SEND_LIMIT} messages in the last minute. You can send another in ${wait} seconds.`,
      );
      return;
    }

    sendingRef.current = true;
    setSending(true);
    const sent = await sendViaWeb3Forms(accessKey, msg);
    sendingRef.current = false;
    setSending(false);
    if (sent) {
      recordMessageSent();
      form.reset();
      showToast('✔ Message sent', "Shubham will reply within 1 business day - or when he's done debugging.");
    } else {
      openMailFallback(
        msg,
        'Message.exe has encountered a problem',
        "Couldn't send right now, so your email app should open with the message instead.",
      );
    }
  };

  return (
    <form id="contact-form" onSubmit={onSubmit}>
      <label htmlFor="name">Name:</label>
      <input type="text" id="name" name="name" autoComplete="name" />
      <label htmlFor="email">Email:</label>
      <input type="email" id="email" name="email" autoComplete="email" required />
      <label htmlFor="message">Message:</label>
      <textarea id="message" name="message" rows={5} required />
      {/* Honeypot (Web3Forms "botcheck"): hidden from people and assistive tech, left in for bots. */}
      <input type="checkbox" name="botcheck" className="honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <p>
        <button type="submit" disabled={sending}>
          {sending ? '[ Sending... ]' : '[ Send ]'}
        </button>
      </p>
    </form>
  );
}
