// App-wide settings. Series content lives in /series — see README.md.
export const config = {
  appName: 'Sermon Series',
  church: 'Neighbors and Nations Church',

  // Lists every series and which one opens by default.
  seriesIndex: './series/index.json',

  // Which Bible the reading screen shows:
  //   'BSB' — Berean Standard Bible, built into the app (public domain;
  //           no key needed, works offline, has audio). Default.
  //   'ESV' — fetched from the ESV API; needs one of the esv settings below.
  bible: 'BSB',

  // Only used when bible is 'ESV'. Get access at https://api.esv.org.
  // Use ONE of these:
  //   proxyUrl — recommended. A tiny server function that holds your key
  //              (see server/esv-proxy.worker.js). Key stays private.
  //   apiKey   — quickest to set up, but the key is visible to anyone
  //              who views the site source.
  esv: {
    proxyUrl: '',
    apiKey: '',
  },
};
