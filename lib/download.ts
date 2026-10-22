/**
 * Programmatic link click, used for the resume download and the contact form's mailto link.
 * A temporary anchor is the only reliable cross-browser way to trigger these from code.
 */
export function clickLink(href: string, options: { download?: string; newTab?: boolean } = {}): void {
  const a = document.createElement('a');
  a.href = href;
  if (options.download) a.download = options.download;
  if (options.newTab) a.target = '_blank';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
