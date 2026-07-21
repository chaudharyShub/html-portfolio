# Shubham Chaudhary — Portfolio Site (Windows 95 style)

## What this is
A single-page portfolio site styled as an interactive Windows 95/98 desktop.
Everything lives in `index.html` (plain HTML/CSS/JS, no frameworks, no build step).
Supporting files: `resume.pdf`, `favicon.ico`, `favicon.png`, `apple-touch-icon.png`, `og-image.png`,
`manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`, `robots.txt`, `sitemap.xml`.
**These files must all stay in the same folder** — the HTML references them with relative paths.

## Design philosophy (do not violate without asking)
- **Very minimal CSS, intentionally simple.** The Win95 bevel/border look (outset/inset borders)
  IS the design — don't add gradients, shadows, or modern flourishes beyond what's already there.
- **Single scrolling window**, not a multi-window "desktop simulator." We deliberately chose this
  over draggable-windows-for-every-section early on, for simplicity.
- Palette: gray `#c0c0c0`, navy `#000080`, classic Win95 3D bevel borders throughout.
- Font: "MS Sans Serif", Tahoma fallback.
- Custom icons are hand-drawn inline SVG in the Win95/98 visual language — not emoji, not real
  Microsoft assets (avoid copyright issues, keep it "inspired by" not "copied from").

## Structure of the page
Header → About → Skills → Projects → Experience → Contact → Footer, all inside one
draggable/resizable/minimizable/maximizable "window" (`#window`), sitting on a "desktop layer"
with icons, a DVD-bounce easter egg, a taskbar, and a Start menu.

## Features currently implemented
- **Boot screen**: BIOS-style boot sequence on load, deterministic ~5.3s total (lines type in,
  a "verifying disk integrity" beat, a progress bar with fixed animation duration). Click or any
  keypress skips it. Timing is intentionally fixed (not randomized) — total time must stay
  strictly within 4–6 seconds if changed.
- **Main window**: draggable (by title bar), resizable (8 edge/corner handles with native
  ns/ew/nwse/nesw resize cursors), minimizable (hides + reveals desktop layer behind it),
  maximizable, and snappable (drag to screen edges to snap left/right, drag to top to maximize —
  like Windows Aero snap).
- **DOS Prompt** (`#dos-window`): a separate floating sub-window, ALSO draggable/resizable/
  minimizable/maximizable (uses the same generic `makeDraggable()`/`makeResizable()` helper
  functions as the main window — reuse these for any future sub-windows rather than duplicating
  drag/resize logic). Has a real command parser (`whoami`, `skills`, `resume`, `sudo hire-me`,
  etc. — see `DOS_COMMANDS` object). Output persists across minimize/maximize/close since the
  DOM node is only hidden, never cleared (only the `clear` command clears it).
- **Debug Runner**: a tiny jump-over-bugs game (desktop icon + Start menu), best score saved in
  `localStorage`.
- **Desktop icons**: Recycle Bin, My Computer, Debug Runner, MS-DOS Prompt — all draggable
  around the desktop layer independently of the window.
- **DVD bounce easter egg**: "SHUBHAM OS" text bounces around the desktop layer only while the
  main window is minimized. Every 14th bounce (capped at 2 per minimize session) triggers a joke
  error dialog. **This frequency was deliberately reduced** — it started at every 4th bounce and
  felt spammy, so don't increase the frequency without being asked.
- **Right-click context menu**: custom menu (Refresh, Arrange Icons, Display Properties,
  Properties, New Text Document joke).
- **Display Properties / wallpaper picker**: solid colors + CSS-generated patterns (stripes, dot
  grid, terminal grid) — no real Microsoft wallpapers (copyright). Persisted via `localStorage`.
- **Contact form**: constructs a `mailto:` link. IMPORTANT bug we already fixed once: the toast
  confirmation must fire **before** attempting `window.location.href` navigation (wrapped in
  try/catch), because in some sandboxed/preview contexts setting `location.href` to a mailto
  link throws synchronously and silently kills the rest of the handler. Don't reorder this.
- **Toast notifications**: generic `showToast(title, msg)` — reused for form submission
  confirmation. Feel free to reuse this for other confirmations rather than building new UI.
- **Resume download**: `resume.pdf` was generated with a Python/reportlab script from the same
  content as the page (see "Content source" below) — it's a normal clean resume, NOT styled like
  Win95 (deliberate — a resume should look professional).
- **Favicon**: a hand-drawn "winking CRT monitor" icon (blue screen, one open eye, one winking
  arc, smile). We went through several concepts (Tetris S-piece, Debug Runner bug mascot,
  terminal prompt, floppy disk, winking CRT) before landing on this one. Don't revert to a
  generic Windows-flag-style icon.
- **Link previews**: Open Graph + Twitter Card meta tags in `<head>`, `og-image.png` is a mockup
  of the site's own window chrome (screenshot-style, not a generic banner) with copy leading
  with the novelty hook ("boots like it's 1995") before the credentials.
  `og:image` is set to an absolute URL at `https://shubhamworks.vercel.app/og-image.png`.

## Features explicitly tried and REMOVED (don't re-add without being asked)
- **Achievement system**: fully built (11 achievements, toast on unlock, progress tracker), then
  completely removed because it "wasn't looking good." All traces were stripped from the code.
- **Music player**: fully built with procedurally generated Web Audio chiptune tracks (no real
  audio files, synthesized via oscillators), then completely removed at the user's request
  ("we will see that later someday"). If music comes back, the plan discussed was:
  - User will supply their own royalty-free audio files (e.g. from Pixabay Music or
    OpenGameArt.org, searching "chiptune")
  - Files get placed in the same folder as `index.html`
  - Player gets rebuilt using real `<audio>` elements instead of synthesis, keeping the same
    play/pause/next/prev/scrub UX that was designed
  - A taskbar tray icon should reappear next to the clock only while something is playing

## Features added (session 3)
- **SEO**: `<meta name="description">` added (reuses og:description copy). JSON-LD `Person`
  schema added to `<head>` with name, jobTitle, url, sameAs (GitHub + LinkedIn), description.
  `robots.txt` and `sitemap.xml` already existed with the correct domain — no changes needed
  there. Added a visually-hidden `<h1 class="sr-only">` as the page's single semantic h1
  (screen-reader-only; Win95 aesthetic unchanged). Section headings remain as `<legend>` inside
  `<fieldset>` which is accessible and sensible.
- **PWA**: `<link rel="manifest" href="manifest.json">` and `<meta name="theme-color">` added
  to `<head>`. `sw.js` service worker created (cache-first, pre-caches index.html, resume.pdf,
  favicon/icon files, og-image.png, manifest.json; skips `/api/` requests). Registered from
  index.html with a `'serviceWorker' in navigator` guard on the `load` event. Test in Chrome
  DevTools → Application → Manifest to confirm installability.
- **Contact form backend**: attempted (Vercel serverless function + Resend API), but reverted
  at user request after hitting local-testing friction. Contact form is back to the original
  `mailto:` approach. Revisit when ready to set up Resend.

## Features added (session 2)
- **InstallShield wizard for resume**: `openInstallWizard()` opens a 3-step fake installer
  dialog with a wizard layout (navy sidebar with floppy disk graphic, step content on right,
  Back/Next/Cancel footer). Step 1: Welcome. Step 2: license-agreement joke with a mandatory
  checkbox. Step 3: progress bar animates 0→100% over exactly 1500ms (deterministic), then
  auto-advances to "Setup Complete" state with a Finish button that downloads `resume.pdf`.
  Cancel at any step closes without downloading. Wired to: Contact section button, Start menu
  "Download Resume" item, and DOS `resume` command.

## Ideas discussed but NOT built (may come up again)
- **Global Debug Runner leaderboard**: would require a real backend (Firebase/Supabase/etc.)
  since this is a static site with no server — currently high scores are per-visitor via
  `localStorage` only. Deliberately not pursued to avoid infra/maintenance overhead, unless the
  user wants to use it as a backend-skills showcase.
- **Desktop mascot**: designed and built, then reverted at user request — keep for later if asked.
- **BSOD easter egg**: designed and built (triggered after 5 DVD-bounce error dialogs), then
  reverted at user request alongside the mascot — keep for later if asked.
- **Open-sourcing this project**: explicitly considered and declined. This is a personal, private
  project. Do not suggest open-sourcing, adding a LICENSE file, or adding "fork this template"
  content unless the user brings it up.
- **Multiplayer cursors** (live cursor presence via PartyKit or similar): considered and removed
  from scope. Do not suggest it again unless the user brings it up.
- **Achievements**, revisited above — removed once, don't re-add speculatively.

## Content source
All resume/bio/skills/experience/project content came from the user directly (not invented).
If asked to add new experience/projects/skills, ask the user for the real content rather than
inventing placeholder text — this reflects a real person's actual career history.

## User's general preferences (from the conversation)
- Likes minimal, deliberate design — pushes back when things feel unnecessary or "not looking
  good," and expects clean removal (no dead code left behind) when something is cut.
- Enjoys creative/memorable/"out of the box" additions but wants them scoped and tasteful, not
  overwhelming — prefers being offered a menu of ideas with an honest recommendation rather than
  everything being built at once.
- Cares about correctness of copyright-sensitive choices (custom icons instead of real Windows
  assets, no real Microsoft wallpapers, generated resume PDF instead of scraping/copying).

## Known constraints
- No build step, no frameworks — keep it plain HTML/CSS/JS.
- No backend — anything requiring persistence beyond `localStorage` needs an explicit decision
  to add real infrastructure.
- Test locally with a real server (`python3 -m http.server 8000`), not `file://` — relative
  paths for `resume.pdf` and favicons can behave inconsistently opened directly from disk in
  some browsers.
