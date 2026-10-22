import { PROFILE } from '@/data/profile';

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

/**
 * Web3Forms access key from the `WEB3FORMS_ACCESS_KEY` env var. Read on the server (see
 * components/portfolio/Contact.tsx) and passed to the form, because Web3Forms only accepts
 * submissions made from the visitor's browser. The key is public by design: it only routes
 * messages to the account owner's inbox. Empty = mailto-only mode.
 */
export function getWeb3FormsAccessKey(): string {
  return process.env.WEB3FORMS_ACCESS_KEY?.trim() ?? '';
}

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}

export function buildMailtoLink({ name, email, message }: ContactMessage): string {
  const sender = name || 'there';
  return (
    `mailto:${PROFILE.email}?subject=${encodeURIComponent(`Portfolio contact from ${sender}`)}` +
    `&body=${encodeURIComponent(`${message}\n\nFrom: ${sender} (${email})`)}`
  );
}

/** Sends the message through Web3Forms. Resolves to true only when the service confirms delivery. */
export async function sendViaWeb3Forms(accessKey: string, { name, email, message }: ContactMessage): Promise<boolean> {
  const body = new FormData();
  body.append('access_key', accessKey);
  body.append('subject', `Portfolio contact from ${name || 'someone'}`);
  body.append('from_name', 'Shubham OS Portfolio');
  body.append('name', name);
  body.append('email', email);
  body.append('message', message);

  try {
    const response = await fetch(WEB3FORMS_ENDPOINT, {
      method: 'POST',
      body,
      headers: { Accept: 'application/json' },
    });
    const data: unknown = await response.json().catch(() => null);
    return response.ok && typeof data === 'object' && data !== null && (data as { success?: unknown }).success === true;
  } catch {
    return false;
  }
}
