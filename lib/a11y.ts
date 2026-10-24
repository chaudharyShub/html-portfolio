import type { KeyboardEvent } from 'react';

/** Enter/Space on a focused element triggers its click handler (like a native button). */
export function clickOnActivationKey(event: KeyboardEvent<HTMLElement>): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    event.currentTarget.click();
  }
}

/**
 * Spread onto a styled non-button element (menu item, title-bar control, tab) together with an
 * `onClick` to make it keyboard operable without changing its styling.
 * Override `role` when a more specific one applies (menuitem, tab, radio).
 */
export const pressableProps = {
  role: 'button',
  tabIndex: 0,
  onKeyDown: clickOnActivationKey,
} as const;
