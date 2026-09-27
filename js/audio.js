// Listening to a passage:
//  1. Narrated BSB recordings (whole chapters), found through the Free Use
//     Bible API at bible.helloao.org, which lists audio for each chapter.
//  2. Otherwise the device's own text-to-speech voice.

const API = 'https://bible.helloao.org/api/BSB';

export async function narratedAudio(chapters) {
  const found = [];
  for (const c of chapters) {
    try {
      const res = await fetch(`${API}/${c.code}/${c.chapter}.json`, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      const data = await res.json();
      const links = data.thisChapterAudioLinks;
      const url = Array.isArray(links) ? links[0] : links && Object.values(links)[0];
      if (typeof url === 'string' && /^https:\/\//.test(url)) found.push({ ...c, url });
    } catch {
      /* offline or unavailable — fall back to device voice */
    }
  }
  return found;
}

export const speechSupported = () => 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

// Speaks verse by verse (long single utterances get cut off in some browsers).
export function speak(verseGroups, { onEnd } = {}) {
  const synth = window.speechSynthesis;
  synth.cancel();
  const voice = synth.getVoices().find((v) => /^en(-|_)/i.test(v.lang) && v.localService) ??
    synth.getVoices().find((v) => /^en/i.test(v.lang));
  const lines = verseGroups.flat();
  lines.forEach((text, i) => {
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.rate = 0.95;
    if (i === lines.length - 1) u.onend = () => onEnd?.();
    synth.speak(u);
  });
}

export function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel();
}
