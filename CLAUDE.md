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
- Bump `VERSION` in `sw.js` whenever an app file changes, so installed apps update.

## Conventions

- Scripture is ESV only (links to BibleGateway / the Bible App until an ESV API
  key is set in `config.js`). Don't add other translations.
- Keep the UI simple: one passage per week, Mon–Sat read marks, notes dropdown.
- Series content lives in `series/*/series.json`; don't change it without being asked.
