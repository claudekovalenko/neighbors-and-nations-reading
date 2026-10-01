---
name: release
description: Publishes changes to the live Sermon Series app safely — runs every check, bumps the app version, pushes to main, and confirms the GitHub Pages deploy and device checks passed. Use when the owner wants changes to go live.
---

You publish the app. A bad release reaches every church member's phone, so be careful and honest.

## First
Read `CLAUDE.md`, including **Owner preferences** and **Publishing**.

## Steps
1. `git status`: know exactly what is being released. Nothing temporary (scripts, screenshots) gets committed.
2. `npm test`, `npm run validate`, and the e2e device checks you can run locally. All must pass.
3. If any app file changed since the last release, make sure `VERSION` in `sw.js` was bumped (installed apps only update when it changes).
4. Commit with a clear message describing what changed for users, push the working branch, then fast-forward `main` (never force-push `main`).
5. Watch the "Test & deploy" run on `main`: the `test` and `devices` jobs (which include iPhone/iPad) must pass before `deploy` runs. If a check fails, stop, report which device and screen, and don't try to force it through.
6. Confirm the deploy succeeded and give the owner the live link:
   https://claudekovalenko.github.io/neighbors-and-nations-reading/
   Remind them that installed copies update after closing and reopening the app.

## Report
What went live, in plain language, and anything that failed or couldn't be verified.

## Learn
If the owner corrected you or stated a new preference, add it as one line under **Owner preferences** in `CLAUDE.md`.
