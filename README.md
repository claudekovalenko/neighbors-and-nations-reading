# N&N Reading Plan

The sermon app for **Neighbors and Nations Church**: an installable web app (PWA) for following each sermon series week by week. The current series is **Romans**, and the app can be reused for future series.

- **Today:** this week's passage with a **Read** button (ESV, only those verses), Mon–Sat check-offs for reading it each day before Sunday, and last week's message.
- **Weeks:** every sermon in the series. Each one has its date, passage, big idea, the pastor's video from before or after Sunday, the podcast episode, discussion questions, and the day-by-day reading plan.
- **Settings:** install help, a calendar file with a daily reading reminder, text size, and a series switcher.

The app works offline once installed. Progress and notes stay on each person's device, so nobody needs an account.

There's no build step: it's plain HTML, CSS, and JavaScript modules, so any static host works.

---

## Filling in the Romans plan

Everything lives in **`series/romans/series.json`**. All 31 sermons are filled in from the church's *Sermon Series Proposal Fall 2026 – 2027*: dates, passages, and the three parts. Each week, people read **that Sunday's passage** every day Monday–Saturday and check off each day. The ESV button opens exactly those verses. Leave the `days` entries' `passage` blank to use the week's passage, which is the normal case. Fill one in only if a day should read something different.

```jsonc
{
  "id": "romans",
  "title": "Romans",
  "subtitle": "The gospel of God for neighbors and nations",
  "church": "Neighbors and Nations Church",
  "startDate": "2026-09-13",        // first sermon Sunday
  "sermonTime": "10:00",            // used for calendar export
  "theme": { "accent": "#b5832a" }, // per-series accent color
  "readingPlan": { "dayOffsets": [-6, -5, -4, -3, -2, -1] },
  "podcast": { "spotifyShowUrl": "", "applePodcastsUrl": "", "rssUrl": "" },
  "weeks": [
    {
      "title": "Introduction",
      "passage": "Romans 1:1-7",
      "part": "Part 1",               // optional — groups weeks on the Weeks screen
      "date": "2026-09-13",          // optional — override this week's Sunday
      "summary": "One short paragraph.",
      "bigIdea": "One sentence people can carry all week.",
      "videos": {
        "before": "https://youtu.be/...",   // shown in the lead-up to Sunday
        "after":  "https://youtu.be/..."    // shown after, to keep thinking about it
      },
      "podcastEpisodeUrl": "https://open.spotify.com/episode/...",
      "questions": ["Discussion question 1", "..."],
      "days": [
        { "passage": "Romans 1:1-7", "title": "Called and set apart", "prompt": "Reflection question" }
        // ...one entry per reading day
      ]
    }
  ]
}
```

**How dates work**
- Sermon dates are `startDate` plus one week for each week after it. To skip a Sunday (a holiday, for example), give that week a `"date"`. Every later week follows from there.
  Romans does this at the start of each part: week 11 is dated Apr 4, 2027 and week 21 is dated Aug 15, 2027. During the breaks, the Romans Today screen shows "Romans is on a break — we pick back up Sunday, April 4".
- Reading days fall **Monday–Saturday before each sermon**, so people read the passage *ahead* of hearing it preached. To change that, edit `readingPlan.dayOffsets`, which counts days relative to Sunday. For example, `[1,2,3,4,5]` puts the readings in the week *after* the sermon. Any single day can also set its own `"date"`.
- Leave any field empty and the app simply leaves it out. You can fill the plan in gradually.

**Videos:** paste a YouTube or Vimeo link, or a direct `.mp4` link.
**Podcast:** paste the Spotify episode share link. It's embedded on the week page and, the week after, on the Today page.

Check your edits with `npm run validate`.

## Scripture (ESV)

The app uses the **ESV only**.

- **Right now, with no API key:** every passage has a **Read** button that opens exactly those verses on BibleGateway (ESV), plus an **Open in the Bible App** link (YouVersion, ESV). Tapping either one marks today as read.
- **Each sermon** also has a *Read* page for its passage, linked from the Today screen and the week page.
- **Showing the text inside the app** needs an [ESV API](https://api.esv.org) key from Crossway, which is free for non-commercial church use but is reviewed by hand. Once you have one, choose one option in `config.js`:
  - **`proxyUrl` (recommended):** deploy `server/esv-proxy.worker.js` as a free Cloudflare Worker (steps are in the file). The key stays secret.
  - **`apiKey`:** paste the key directly. It's quick, but anyone viewing the site source can see it.
- **ESV terms:** they limit how much text an app may store. This app keeps only the 20 most recent passages on the device and shows Crossway's copyright notice wherever text appears.

Write passages the usual way: `Romans 1:1-7`, `Romans 1:18-2:3`, `Psalm 98`, `Luke 1:5-25; 2:1-7`. Then run `npm run validate`, which flags any reference it can't understand.

## Reminders

- **Daily reminder:** in Settings people pick a time and tap *Apple Calendar* (opens a ready-made file from `cal/`) or *Google Calendar*. The reminder repeats Mon–Sat at that time. After changing series dates, run `npm run calendars` to rebuild `cal/`.
- The app doesn't send its own notifications: a web app can't send them on time without a push server. A push service such as OneSignal could add that later; the service worker already handles notification taps.

## Podcast on Spotify

The simplest route is **[Spotify for Creators](https://creators.spotify.com)** (formerly Anchor). It's free. Upload each Sunday's recording, and it can also distribute the show to Apple Podcasts. After each upload:

1. Copy the episode's share link into that week's `podcastEpisodeUrl`.
2. Put the show link in `podcast.spotifyShowUrl` once. That adds a "Follow on Spotify" button.

## Running and publishing

```bash
npm start          # serves at http://localhost:8080
npm test           # schedule, media-link and series-file tests
npm run validate   # checks every series file
```

**Publishing (GitHub Pages):** the included workflow tests and deploys every push to `main`. One-time setup: repo **Settings → Pages → Source: GitHub Actions**. Any other static host also works, such as Netlify or Cloudflare Pages.

When you change app code (anything outside `series/`), bump `VERSION` in `sw.js` so installed copies update. Series data always loads fresh when people are online.

## Starting a new series later

```bash
npm run new-series -- --id=james --title="James" --weeks=12 --start=2027-06-06
```

Then add it to `series/index.json` and set `"active"` to it. Older series stay available: once more than one exists, a series picker appears in Settings.

## Project layout

```
index.html, manifest.webmanifest, sw.js   app shell, install metadata, offline cache
config.js                                 app name, church, ESV settings
series/index.json                         list of series + which is active
series/romans/series.json                 the Romans plan (edit this)
js/schedule.js                            date logic (unit-tested)
js/reference.js, js/books.js              checks passage references
js/esv.js, js/reminders.js, js/media.js   ESV text, calendar .ics + icon badge, video/Spotify embeds
js/views/*.js                             the five screens
css/app.css                               styles (light + dark)
icons/                                    app icons (npm run icons re-renders PNGs)
server/esv-proxy.worker.js                optional key-hiding ESV proxy
scripts/                                  scaffold, validate, icon tools
```
