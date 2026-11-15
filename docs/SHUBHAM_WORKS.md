# Shubham Works: shared rules for every site (D-062)

"Shubham Works" is the umbrella name for the developer's sites: the portfolio
(https://shubhamworks.vercel.app/), Git, Drawn Out, CloudPrep and Frontend Interview Prep. Each site keeps
its own logo and URL. What ties them together is the same small footer block on every site,
the same owner-aware analytics and the same mark.

**Single source of truth:** `SHUBHAM_WORKS.md` in the projects' parent folder
(`(A) WORKING`). Edit only that file, then run `sync-shubham-works.ps1` (same folder) to copy
it into every project's `docs/SHUBHAM_WORKS.md`. Those copies are mirrors kept so each repo
on GitHub still has the page; never edit a copy by hand. A new project gets its copy from the
same script. The portfolio's block is `components/desktop/MadeBy.tsx`, CloudPrep's is
`MadeBy` in `src/components/layout/Brand.tsx`.

## The block

```
[SW] A Shubham Works project
Made by Shubham Chaudhary ↗       (links to the portfolio)
Also: Git, Drawn Out ↗, Frontend Interview Prep ↗ · All projects ↗
                                  (the newest other sites, then the portfolio's project list)
```

Rules, so it reads the same everywhere:

- **Never list the site the block is on.** CloudPrep's footer doesn't link to CloudPrep, Git,
  Drawn Out's doesn't link to Git, Drawn Out, and so on; "Also:" is only the other sites.
- Same wording and order on every site. "Also:" lists **at most 3** of the developer's other
  sites (never the current one), newest first (new tab, `rel="noopener noreferrer"`), then
  "All projects ↗" linking to the portfolio's project list
  (https://shubhamworks.vercel.app/projects: a plain page, no startup screen, so visitors see
  the projects at once; the bare portfolio address only opened the desktop). On the
  portfolio's desktop, "All projects" goes to the same page in the same tab (no arrow, it
  stays on the site); the /projects page itself leaves "All projects" out.
  The cap was the user's call on 2026-11-15: a list of every site would grow into a paragraph
  as projects are added.
- Current order, newest first: Git, Drawn Out (https://git-drawn-out.vercel.app/), CloudPrep,
  Frontend Interview Prep. With 3 sites, each other site lists the 2 that aren't itself; the
  portfolio lists all 3.
- Keep it in one column (the mark beside the first line only), so it fits a narrow sidebar.
- On the portfolio, the "Made by" line can link to the About section or be plain text.
- Small, quiet text in the site's own muted colour; only the mark is orange. It never
  replaces the site's own logo.
- The mark is decorative (`aria-hidden="true"`); the text "A Shubham Works project" carries
  the meaning.
- When a new project is added, it takes the first spot in "Also:" on every other site and the
  oldest one drops off past 3 (it is still in the portfolio's Projects). The portfolio does
  this by itself (from `data/projects.ts`); the other sites are edited by hand.

## The README

Every site's GitHub README carries the same section, just before "License":

```
## Made by

<Site> is a **Shubham Works** project, made by [Shubham Chaudhary](https://shubhamworks.vercel.app/).

Also:

- [<other site>](<url>): <one-line description>
- ... (the same sites, in the same order, as the footer's "Also:")
- [All projects](https://shubhamworks.vercel.app/projects)
```

A site may add one short paragraph after the list (CloudPrep says where the credit shows in
the app). The portfolio's README lists the other sites at the end of "Contact" instead
(no "All projects", it is the portfolio). When "Also:" changes on the sites, change the READMEs
too. Descriptions: Git, Drawn Out "a visual field guide to Git"; CloudPrep "practice exams for
three AWS certifications"; Frontend Interview Prep "frontend interview questions with answers".

## Every site: keep the owner's visits out of analytics

Every Shubham Works site that has analytics (Vercel Web Analytics, Speed Insights or any
other) must leave out the owner's own browsers, the same way on every site. Build this in when
adding the footer; the owner shouldn't have to ask for it. The portfolio's version is
`lib/owner-device.ts` + `components/shared/VercelInsights.tsx`.

How it works:

- The owner has one secret token, the same for every site. Opening
  `https://<site>/#<token>` marks that browser as the owner's on that site;
  `https://<site>/#<token>.on` turns analytics back on. The part after `#` never reaches a
  server.
- The code holds only the token's SHA-256, never the token:
  `00ad41f213985ec4c69bf6fd3eb60c220399829190ca21e5c4001ddfc9dbe05b`.
  **Never write the token in code, docs, tests, commits or PR text.** Use this hash as is;
  if it changes, change it on every site and in the master copy of this page.
- On page load: read `location.hash` (URL-decoded). If it ends in `.on`, strip that. If the
  SHA-256 (hex, `crypto.subtle.digest`) of what is left equals the hash:
  - remove the token from the address bar with
    `history.replaceState(null, '', location.pathname + location.search)`;
  - turning off: save the **token** (not a flag) in localStorage and `alert("This browser
    won't be counted in analytics.")`;
  - with `.on`: delete the saved token and `alert('Analytics is back on for this browser.')`.
- Otherwise, the browser is the owner's when localStorage holds a value whose SHA-256 equals
  the hash (so a hand-typed `true` doesn't count).
- **Nothing analytics-related loads until that check is done**, and it never loads for the
  owner. In React / Next.js, render `<Analytics />` / `<SpeedInsights />` only after the check
  says "not the owner". On a plain HTML site, don't put the analytics `<script>` tags in the
  HTML: add them from JavaScript after the check (for Vercel:
  `/_vercel/insights/script.js` and `/_vercel/speed-insights/script.js`, `defer`).
- Also run the check on `hashchange`, so pasting the link into an open tab works.
- If the check throws (no `crypto.subtle`, storage blocked), count the visit as normal.
- localStorage key: the site's own, named after the site (the portfolio's is
  `shubhamOsDevice`).
- Don't mention it in the README or on the site; the code comment is enough.

## The mark: the Dial

The user chose the "Dial" on 2026-11-01: a wide, squared SW inside a ring, in orange. Two
versions, both drawn on a 48×48 grid as plain shapes (no font needed):

- `docs/brand/shubham-works-dial.svg` (in CloudPrep): the detailed version with an inner ring and tick
  marks. Use it at 32px and up: the portfolio header, link previews, about pages.
- `docs/brand/shubham-works-dial-small.svg` (in CloudPrep): a thick ring and larger letters, for 16–24px:
  footers and favicons.

Colours: orange `#f97316` on dark backgrounds or as a general brand colour. In CloudPrep the
footer mark uses the `maker` token (`#c2410c` on light, `#fb923c` on dark, both checked for
3:1 contrast). On another site, swap `stroke` for that site's own orange, or for
`currentColor` to take the text colour. A soft glow (as in the original image) is fine on large
versions on dark backgrounds; leave it off small ones.

If the drawing changes, update CloudPrep's `src/components/brand/MakerMark.tsx`, both SVG
files, the portfolio's `MakerMark` (`components/icons`) and the master copy of this page together.

## Later

A shared domain (for example `cloudprep.<domain>`) was discussed and postponed by the user
on 2026-11-01; the sites keep their current `vercel.app` addresses for now.
