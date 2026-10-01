# N&N Reading Plan app — notes for anyone (or any Claude session) making updates

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
- iPhone home-screen settings (status bar style, etc.) are frozen when the app
  is added; updates can't change them. Before changing layout for a phone
  screenshot, measure it in points (iPhone 14 = 844pt tall) to tell a stale
  install from a real layout problem. Old installs see a "re-add the app" note.
- Tab bar: slim, icons low, a little padding above the icons (8px).
- Only the current series (Romans). Don't add other series (Advent, etc.)
  unless asked.
- Look: chic, modern, classy. Newsreader (serif) for headings, Inter for text,
  both bundled in fonts/. Soft white cards, no heavy borders, near-black primary
  button, muted gold used sparingly, small uppercase letter-spaced labels.
- App name is "N&N Reading Plan" (manifest, page titles); home-screen label "N&N Reading"
  (fits on iPhone). Was "N&N Sermons" until v33. Current series: Romans.
- Typography should feel editorial ("umami"): italic Newsreader for dates and
  subtitles, few all-caps labels (tracking ~.1em), en dashes in verse ranges
  (use `ref()` from js/ui.js for display; keep raw references for links).
- No series subtitle/tagline under the title. Type should be on the small,
  refined side (15px body, ~1.6rem passage heading, ~2.8rem title).
- Tab bar height: about 73pt on iPhone (48pt row, 10pt above icons). Not thinner.
- No date under the series title on Today.
- Browsers show a 'Get the app' card on Today (js/install.js): one-tap Install on
  Android/Chrome, Share → Add to Home Screen steps on iPhone. Hidden in the
  installed app and after 'Not now'.
- Instructions use as few words as possible (e.g. iPhone install: "Tap Share (or ••• first)" / "Scroll to Add to Home Screen").
- Install instructions must fit every browser (iPhone Safari/Chrome/Firefox/Edge,
  Android Chrome/Samsung/Firefox/Edge, desktop Chrome/Edge/Firefox, Mac Safari):
  STEPS in js/install.js, two short steps each, with the browser's own symbols.
- Install steps live at the top of Settings too (for that person's browser), so anyone
  who taps X can find them. After X, Today briefly says "Install anytime from Settings".
- No in-app notification reminders (they can't fire on time without a push server).
  The calendar file in Settings is the reminder.
- Daily reminder in Settings = a time (half-hour steps) + calendar buttons
  (Apple uses the pre-built .ics in cal/). Few words. After changing series
  dates, run `npm run calendars` (a test fails if cal/ is stale).
- Main passage button says "Read / Listen" (the passage is already in the heading).
- No reset-progress option in Settings.
- Show the year on dates in another year (part ranges on Weeks, e.g. "Aug 15 – Oct 24, 2027").
- Daily reminder: let people choose — two equal buttons, Apple Calendar and Google Calendar.
