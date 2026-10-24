<div align="center">

# 🖥️ Shubham OS

**A portfolio that boots like it's 1995.**

A single-page portfolio dressed up as an interactive Windows 95 desktop -
draggable windows, a working DOS prompt, a Start menu, and a few easter eggs.

[**▶ Visit the live site**](https://shubhamworks.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-App%20Router-000080?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-008080?style=flat-square)
![CSS](https://img.shields.io/badge/CSS-hand--written-c0c0c0?style=flat-square)
![Runtime deps](https://img.shields.io/badge/runtime%20deps-next%20%2B%20react%20%2B%20analytics-800000?style=flat-square)

<br>

<img src="public/og-image.png" alt="Preview of the Shubham OS portfolio window" width="720">

</div>

---

## About

This is the personal portfolio of **Shubham Chaudhary**, Full Stack Engineer.
Instead of a typical landing page, it is a small Win95-style "operating system":
the site plays a BIOS boot sequence, then opens a single window containing
About, Skills, Projects, Experience and Contact.

It is a Next.js (App Router) app written in TypeScript with hand-written CSS -
no UI libraries, no CSS framework. All portfolio content is rendered on the
server, so it is in the HTML for search engines before any JavaScript runs.

## Features

| | |
|---|---|
| **Boot screen** | BIOS-style startup sequence. Click or press any key to skip. |
| **Window manager** | Drag, resize from 8 edges, minimize, maximize, and snap to screen edges. |
| **MS-DOS Prompt** | A real command parser with history (↑ / ↓). |
| **Start menu & taskbar** | Quick links, a live clock, and animated minimize-to-taskbar. |
| **Desktop** | Draggable icons and a custom right-click menu. |
| **Display Properties** | 3 themes (Win95, Win98, Terminal), 9 wallpapers, CRT scanlines, cursor trail. |
| **Contact form** | Sends via Web3Forms (honeypot spam trap, 5 messages per minute per visitor); falls back to your mail app via `mailto:`. |
| **Resume Setup Wizard** | An InstallShield-style installer that "installs" the resume PDF. |
| **Debug Runner** | A tiny jump-over-the-bugs game with a saved best score. |
| **Installable** | Works offline as a PWA via a service worker. |
| **Analytics** | Vercel Web Analytics (cookieless page views), active only on Vercel deployments. |

All preferences are stored in `localStorage`, and every animation respects
`prefers-reduced-motion`. On phones, desktop icons open with a single tap and the window
buttons are finger-sized. Menus, tabs, title-bar buttons and dialogs are
keyboard operable (Enter/Space to activate, Escape to close).

## Try the DOS prompt

Open **MS-DOS Prompt** from the desktop or Start menu and type `help`.

```text
C:\Users\Shubham> whoami
C:\Users\Shubham> skills
C:\Users\Shubham> projects
C:\Users\Shubham> resume
C:\Users\Shubham> sudo hire-me
```

There are a few undocumented commands too. Minimizing the main window is also
worth a try.

## Run locally

Requires Node.js 20.9+ (developed on Node 24) and npm.

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build (also type-checks)
npm start          # serve the production build
npm run lint       # ESLint (Next.js + React Compiler rules)
npm run typecheck  # tsc --noEmit
npm run test:e2e   # browser tests (Playwright)
```

### Browser tests

`npm run test:e2e` builds the site into its own folder (`.next-e2e`, so your normal build is
untouched), starts it on port 3200 and runs the tests in `tests/e2e/` in Chromium, at desktop
size and at phone size (375×667, touch). They cover the boot screen, tabs, the DOS prompt, saved
themes, the contact form (sending, burst submits, the 5-per-minute limit, the honeypot, the
mail-app fallback) and the phone layout.

The tests never send real mail: they use a fake Web3Forms key and stub `api.web3forms.com`.
First time on a new machine, install the browser with `npx playwright install chromium`.

The service worker is only registered in production builds (`npm run build && npm start`),
so development never serves stale cached bundles.

## Project structure

```text
app/
  layout.tsx            # <html>, metadata, pre-paint theme script, SW registration
  page.tsx              # the single page: server-rendered sections -> desktop
  not-found.tsx         # Win95-style 404
  sitemap.ts robots.ts manifest.ts
  globals.css           # imports the stylesheets in styles/
components/
  os/                   # OsProvider (shared state + actions), ShubhamOS root, BootScreen
  windows/              # generic Window (drag/resize/snap/animate), MainWindow, DosWindow
  desktop/              # icons, taskbar, Start menu, context menu, DVD logo, toast, effects
  dialogs/              # generic Dialog + message, recycle bin, game, display props, wizard
  portfolio/            # About, Skills, Projects, Experience, Contact (server components)
  live/                 # small client readouts: clock, career stats, year, visitor counter
  shared/               # JSON-LD script, service worker registration
  icons/                # hand-drawn Win95-style SVG icons
data/                   # portfolio content: profile, about, skills, projects, experience
lib/                    # site config, themes, wallpapers, DOS parser, storage, animations
tests/e2e/              # Playwright browser tests (desktop + phone)
styles/                 # the original CSS, split by area (class names unchanged)
public/                 # resume PDF, icons, og-image, wallpapers, sw.js
```

### How it fits together

- **Content is data.** Edit `data/*.ts` to change projects, experience or skills.
  Entries with `hidden: true` are kept but not rendered.
- **Server vs client.** Portfolio sections are Server Components. They are passed as
  props into the client-side desktop (`components/os/ShubhamOS.tsx`), which only decides
  which sections a tab shows and in what order.
- **State.** `OsProvider` holds dialogs, menus, tabs, toasts and window status in a
  reducer and exposes stable actions (`useOsActions()`), e.g. `showToast`, `showMessage`,
  `openDialog`, `goToSection`, `openDos`.
- **Windows.** `components/windows/Window.tsx` is the one draggable/resizable window
  implementation. Reuse it for any new window instead of duplicating drag/resize logic.
- **Preferences** use small `localStorage`-backed stores (`lib/preferences.ts`) read
  through `useSyncExternalStore`, so server HTML and the first client render always match.

## Deploy to Vercel

The repo includes `vercel.json` with `"framework": "nextjs"`, so Vercel builds it as a
Next.js app (important because this project previously deployed as a static site).

1. Push the branch and open the project on Vercel (or run `vercel` / `vercel --prod`).
2. Check **Project Settings → Build & Development**: Framework Preset *Next.js*,
   build command `next build`, and no custom output directory left over from the static setup.
3. Add the environment variable `WEB3FORMS_ACCESS_KEY` (see below) and deploy.

## Contact form (Web3Forms)

1. Create a free access key at [web3forms.com](https://web3forms.com) with the email address
   that should receive messages.
2. Set `WEB3FORMS_ACCESS_KEY` in Vercel (**Settings → Environment Variables**, Production
   and Preview) and in `.env.local` for local testing, then redeploy. The value is read at build time
   (the page is statically generated), so changing it needs a redeploy.

How it behaves:

- With a key: the message is sent from the page, a toast confirms it and the form clears.
- If sending fails (network error, quota reached): the visitor's email app opens with the
  message prefilled instead.
- Without a key: the form only uses the `mailto:` fallback (the original behavior).
- A hidden `botcheck` checkbox catches simple bots; their submissions are silently dropped.
- Each visitor can send up to 5 messages per minute. Over the limit, a "Please wait" toast
  shows how many seconds are left and the typed text stays in the form. Send times are kept in
  `localStorage`, so refreshing the page doesn't reset the limit. Submits fired at the same
  instant (e.g. by a script) only send once.
- The key is visible in the page source by design: Web3Forms only accepts browser submissions on the
  free plan (server-side calls need a paid plan with a safelisted IP), and their docs state the key
  is public. It can only deliver messages to your inbox.
  If spam still gets through, add hCaptcha (free on Web3Forms; Cloudflare Turnstile and reCAPTCHA
  need a paid plan).

## Web Analytics

The site uses [Vercel Web Analytics](https://vercel.com/docs/analytics) (`<Analytics />` in
`app/layout.tsx`). To see data:

1. In Vercel, open the project → **Analytics** tab → **Enable** (once per project).
2. Deploy. Page views appear in the Analytics tab within a few minutes of visits.

The component is only rendered in builds made on Vercel (`process.env.VERCEL`), because its script
is served by Vercel itself; local `npm run dev` / `npm start` don't load it.

## Custom domain

1. In Vercel: **Project → Settings → Domains → Add**, enter your domain and follow the
   DNS instructions (an `A` record for the apex domain or a `CNAME` for `www`).
2. Set **`NEXT_PUBLIC_SITE_URL`** to the new origin (e.g. `https://your-domain.com`) in
   **Settings → Environment Variables** for *Production*, then redeploy.

The site URL drives the canonical link, Open Graph/Twitter URLs, JSON-LD, `sitemap.xml`
and `robots.txt`. It is resolved in `lib/site.ts` in this order:

1. `NEXT_PUBLIC_SITE_URL`, if set
2. `VERCEL_PROJECT_PRODUCTION_URL` (set automatically by Vercel; it prefers your custom
   domain once one is attached)
3. `https://shubhamworks.vercel.app`

See `.env.example`. After switching domains, re-submit the sitemap in Google Search Console.

## Design notes

- The Win95 bevel is the design: gray `#c0c0c0`, navy `#000080`, inset and
  outset borders, and nothing more modern than that.
- Icons and wallpapers are hand-drawn SVG, inspired by the era rather than
  copied from it. No Microsoft assets are used.
- One scrolling window, kept deliberately simple, rather than a full desktop
  simulator.

## Contact

**Shubham Chaudhary**

[Portfolio](https://shubhamworks.vercel.app) ·
[GitHub](https://github.com/chaudharyShub) ·
[LinkedIn](https://www.linkedin.com/in/shubham-chaudhary-4398bba8)

<div align="center">
<br>
<sub>It is now safe to turn off your computer.</sub>
</div>
