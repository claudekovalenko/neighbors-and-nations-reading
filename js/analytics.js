// Visitor counts with GoatCounter (free for non-profits, no cookies, no
// personal data). Off until config.analytics.goatcounter holds the site code.
import { config } from '../config.js';

const code = config.analytics?.goatcounter;
let ready = null;

function load() {
  if (!code || !navigator.onLine) return null;
  ready ??= new Promise((resolve) => {
    window.goatcounter = { no_onload: true };
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://gc.zgo.at/count.js';
    s.dataset.goatcounter = `https://${code}.goatcounter.com/count`;
    s.onload = () => resolve(window.goatcounter);
    s.onerror = () => resolve(null);
    document.head.append(s);
  });
  return ready;
}

const send = (opts) => load()?.then((gc) => { try { gc?.count?.(opts); } catch { /* never break the app */ } });

// One count per screen: "/", "/weeks", "/week/4", "/settings".
export const trackView = (path) => send({ path: path || '/', title: document.title });

// Things that aren't screens, e.g. opening the app from the home screen.
export const trackEvent = (name) => send({ path: name, title: name, event: true });
