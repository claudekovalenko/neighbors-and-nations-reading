// App-wide settings. Series content lives in /series — see README.md.
export const config = {
  appName: 'N&N Reading Plan',
  church: 'Neighbors and Nations Church',

  // Shown in Settings. Keep in step with VERSION in sw.js (a test checks).
  version: '39',

  // The live site. Calendar reminders link back here.
  siteUrl: 'https://claudekovalenko.github.io/neighbors-and-nations-reading/',

  // Visitor counts (goatcounter.com). Put the site code here, e.g. 'nn-reading';
  // leave empty to turn counting off.
  analytics: { goatcounter: '' },

  // Lists every series and which one opens by default.
  seriesIndex: './series/index.json',

  // Scripture is the ESV. Until one of these is set, each passage links to
  // BibleGateway (ESV). Get a key at https://api.esv.org, then use ONE:
  //   proxyUrl — recommended. A tiny server function that holds your key
  //              (see server/esv-proxy.worker.js). Key stays private.
  //   apiKey   — quickest to set up, but the key is visible to anyone
  //              who views the site source.
  // With a key, the text shows inside the app.
  esv: {
    proxyUrl: '',
    apiKey: '',
  },
};
