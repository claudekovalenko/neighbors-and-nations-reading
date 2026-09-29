# Sermon Series app — notes for anyone (or any Claude session) making updates

A static PWA (plain HTML/CSS/JS modules, no build step) for Neighbors and
Nations Church. It is used by many people on phones, so every change must
look right on **both iPhone and Android** before it goes live.

## Before publishing any change

1. `npm test` — unit tests, series-file checks, syntax of every module.
2. `npm run validate` — every series file and passage reference.
3. `npm run test:e2e` — the app on simulated devices (see `playwright.config.js`):
   Android (Pixel 7, small Galaxy S8, dark mode), iPhone 14, iPhone SE, iPhone
   dark mode, iPad, desktop. Checks: bottom bar flush and identical on every
   screen, nothing wider than the screen, tap targets ≥ 44px, no errors, and
   the main interactions. Screenshots of every screen are in the report.
   - Locally only Chromium may be installed; run the Android/desktop projects
     with `--project="Android · Pixel 7"` etc. GitHub Actions runs all of them,
     including the iPhone/iPad ones (WebKit), on every push and pull request.
4. When you add a screen or feature, add it to `e2e/app.spec.js` (the
   `SCREENS` list and/or a test for the interaction).
5. Look at the screenshots, not just the pass/fail — the checks can't judge taste.
   Viewport screenshots show the phone as a person sees it; full-page
   screenshots stretch the page, so the fixed bottom bar will appear mid-image.

## Publishing

- The site deploys from `main` via `.github/workflows/deploy.yml`, and only
  when the `test` and `devices` jobs pass.
- Bump `VERSION` in `sw.js` **and** `version` in `config.js` (a test checks they
  match) whenever an app file changes. Settings shows the version, so the owner
  can confirm their phone has the update. The service worker is network-first
  and the app reloads itself when an update takes over.

## Agents

Project agents live in `.claude/agents/`:
- `app-qa`: checks and fixes how the app looks and works on every device.
- `content-editor`: updates passages, dates, videos, podcast links, and series.
- `release`: publishes safely and confirms the deploy.

Every agent reads the preferences below first and **adds a line whenever the
owner corrects something or states a new preference**. That list is how the
agents learn over time. Keep each entry short and concrete.

## Owner preferences (learned; newest last)

- Keep it simple. Fewer screens, fewer words; remove anything that isn't needed.
- ESV only. No other translations, no in-app BSB/NIV text, no "also read in" links.
- Reading links must open exactly that week's passage and nothing else
  (BibleGateway normal page + Bible App link; not ESV.org, not print views).
- No extra commentary around the passage (footnotes, cross-references, headings).
- One passage per week: people read the coming Sunday's passage each day
  Mon–Sat. No separate daily readings.
- Read marks happen automatically when someone taps Read; circles can be tapped
  to fix mistakes. Don't add instructions like "read it each day".
- Notes are a simple collapsible "My notes" dropdown (Today card + week page,
  same note). No "Week N details" link on the Today card.
- No preacher/speaker names.
- No listening/audio features until there are real recordings. Don't show
  "recording coming soon" style messages.
- Stay a PWA (installable website) for now, not App Store / Play Store apps.
  The Capacitor wrapper is saved in git history (commit 36cd087) for later.
- It must look right on both iPhone and Android. Verify on devices, measure,
  and look at viewport screenshots before saying something is fixed.
- The owner is not technical: report in plain language, briefly.
- The bottom tab bar must sit in exactly the same place on every screen and
  reach the bottom edge of the phone. The layout is app-style: the body is
  pinned to the screen edges (`position: fixed; inset: 0`), it's a flex column,
  and only `main` scrolls. Never put `position: fixed` on the bars themselves
  (mobile Safari moves them), and never size the app with 100vh/100dvh (iPhone
  home-screen apps come up short by the status-bar height, leaving a gap under
  the bar). Check in phone emulation, and ask for a phone screenshot when in doubt.
- Never use `apple-mobile-web-app-status-bar-style: black-translucent`. On iOS 26
  it makes home-screen apps stop short of the bottom edge (WebKit bug 301108);
  no CSS can fix that strip. Use "default". When a layout bug only shows on the
  owner's phone, research the platform (WebKit bugs, iOS version) before guessing.
