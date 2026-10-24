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

type Field = 'email' | 'message';
type FieldErrors = Partial<Record<Field, string>>;

/** Same idea as the browser's own type="email" check: something@something.something. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Checks the required fields ourselves (the form has noValidate) so problems appear inline in
 * the site's own style instead of the browser's "Please fill out this field" bubble.
 */
function validate(email: string, message: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email) errors.email = 'Enter your email address so Shubham can reply.';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address, like name@example.com.';
  if (!message) errors.message = 'Write a message before sending.';
  return errors;
}

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
  const [errors, setErrors] = useState<FieldErrors>({});

  // Typing in a field clears its error.
  const clearError = (field: Field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

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

    const found = validate(msg.email, msg.message);
    setErrors(found);
    const firstInvalid = (['email', 'message'] as const).find((field) => found[field]);
    if (firstInvalid) {
      form.querySelector<HTMLElement>(`#${firstInvalid}`)?.focus();
      return;
    }

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
        "Message couldn't be sent",
        "Couldn't send right now, so your email app should open with the message instead.",
      );
    }
  };

  return (
    <form id="contact-form" onSubmit={onSubmit} noValidate>
      <label htmlFor="name">Name:</label>
      <input type="text" id="name" name="name" autoComplete="name" />
      <label htmlFor="email">Email:</label>
      <input
        type="email"
        id="email"
        name="email"
        autoComplete="email"
        required
        aria-invalid={errors.email ? true : undefined}
        aria-describedby={errors.email ? 'email-error' : undefined}
        onInput={() => clearError('email')}
      />
      {errors.email && (
        <p id="email-error" className="field-error" role="alert">
          {errors.email}
        </p>
      )}
      <label htmlFor="message">Message:</label>
      <textarea
        id="message"
        name="message"
        rows={5}
        required
        aria-invalid={errors.message ? true : undefined}
        aria-describedby={errors.message ? 'message-error' : undefined}
        onInput={() => clearError('message')}
      />
      {errors.message && (
        <p id="message-error" className="field-error" role="alert">
          {errors.message}
        </p>
      )}
      {/* Honeypot (Web3Forms "botcheck"): hidden from people and assistive tech, left in for bots. */}
      <input type="checkbox" name="botcheck" className="honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <p>
        <button type="submit" className="btn-primary" disabled={sending}>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </p>
    </form>
  );
}
