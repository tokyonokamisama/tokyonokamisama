/* LRC parsing and lookup are kept separate so imported lyrics can be validated. */
(function (root) {
  'use strict';
  function parseLrc(input) {
    const text = String(input || '').replace(/^\uFEFF/, '');
    const offsetMatch = text.match(/\[offset\s*:\s*([+-]?\d+)\]/i);
    const offset = offsetMatch ? Number(offsetMatch[1]) / 1000 : 0;
    const cues = [];
    for (const line of text.split(/\r?\n/)) {
      const stamps = [...line.matchAll(/\[(\d{1,3}):([0-5]?\d)(?:[.:](\d{1,3}))?\]/g)];
      if (!stamps.length) continue;
      const words = line.replace(/\[[^\]]*\]/g, '').trim();
      // Empty timed lines deliberately clear the display during instrumental breaks.
      for (const stamp of stamps) {
        const seconds = Number(stamp[1]) * 60 + Number(stamp[2]) + (stamp[3] ? Number('0.' + stamp[3]) : 0);
        cues.push({ time: Math.max(0, seconds - offset), text: words });
      }
    }
    return cues.sort((a, b) => a.time - b.time);
  }
  function plainLines(input) {
    return String(input || '').split(/\r?\n/).map(line => line.replace(/\[[^\]]*\]/g, '').trim()).filter(Boolean);
  }
  function findCue(cues, time) {
    let lo = 0, hi = cues.length - 1, found = -1;
    while (lo <= hi) { const mid = (lo + hi) >> 1; if (cues[mid].time <= time) { found = mid; lo = mid + 1; } else hi = mid - 1; }
    return found;
  }
  function formatLrc(cues) {
    return cues.map(cue => {
      const total = Math.round(Math.max(0, cue.time) * 100), minutes = Math.floor(total / 6000), seconds = Math.floor(total / 100) % 60, fraction = total % 100;
      return '[' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0') + '.' + String(fraction).padStart(2, '0') + ']' + cue.text;
    }).join('\n');
  }
  const api = { parseLrc, plainLines, findCue, formatLrc };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Lyrics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
