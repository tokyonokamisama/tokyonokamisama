/* Deterministic particle choreography: scattered ages -> recipient -> dissolve. */
(function (root) {
  'use strict';
  const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  function randomGenerator(seed) {
    let value = seed >>> 0;
    return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
  }
  function fitGlyph(glyph, center, maxWidth, maxHeight) {
    const width = Math.min(maxWidth, maxHeight * glyph.aspect), height = width / glyph.aspect;
    return glyph.points.map(point => ({ x: center.x + (point.u - .5) * width, y: center.y + (point.v - .5) * height }));
  }
  function create({ age, name, area, groups = 5, maxParticles = 1500, startedAt = 0, seed = 20, loop = false, pauseMs = 900 }) {
    if (!age.points.length || !name.points.length || area.width <= 0 || area.height <= 0) return null;
    groups = Math.max(3, Math.min(5, groups));
    const random = randomGenerator(seed), anchors = groups === 3 ? [[.22,.25],[.78,.32],[.5,.76]] : groups === 4 ? [[.23,.24],[.76,.29],[.25,.76],[.75,.75]] : [[.23,.18],[.77,.29],[.24,.65],[.77,.81],[.51,.49]];
    const ageWidth = Math.min(area.width * .40, 150), ageHeight = area.height * .30;
    const ageTargets = anchors.map(([x,y]) => fitGlyph(age, { x: area.x + x * area.width, y: area.y + y * area.height }, ageWidth, ageHeight));
    const nameCenter = { x: area.x + area.width * .5, y: area.y + area.height * .5 };
    const nameTargets = fitGlyph(name, nameCenter, area.width * .94, area.height * .62).sort((a,b) => a.x - b.x || a.y - b.y);
    const count = Math.min(maxParticles, Math.max(age.points.length * groups, name.points.length));
    const perGroup = Math.ceil(count / groups), gap = 740, formation = 650;
    const morphAt = (groups - 1) * gap + formation + 900, settleAt = morphAt + 1800, scatterAt = settleAt + 2200, endAt = scatterAt + 2000;
    const particles = [];
    for (let i = 0; i < count; i++) {
      const group = Math.min(groups - 1, Math.floor(i / perGroup));
      const groupIndex = i - group * perGroup, pointsInGroup = Math.min(perGroup, count - group * perGroup);
      const target = ageTargets[group][Math.min(ageTargets[group].length - 1, Math.floor(groupIndex / pointsInGroup * ageTargets[group].length))];
      const nameTarget = nameTargets[Math.min(nameTargets.length - 1, Math.floor(i / count * nameTargets.length))];
      const angle = random() * Math.PI * 2, radius = 22 + random() * Math.min(area.width, area.height) * .25;
      const originX = clamp(target.x + Math.cos(angle) * radius, area.x + 5, area.x + area.width - 5);
      const originY = clamp(target.y + Math.sin(angle) * radius, area.y + 5, area.y + area.height - 5);
      const dx = nameTarget.x - nameCenter.x, dy = nameTarget.y - nameCenter.y;
      const scatterAngle = Math.atan2(dy, dx) + (random() - .5) * .8, speed = 55 + random() * 125;
      const bend = (group % 2 ? 1 : -1) * area.height * (.07 + random() * .08);
      particles.push({
        group, birth: group * gap + groupIndex / pointsInGroup * 420,
        ox: originX, oy: originY, ax: target.x, ay: target.y, nx: nameTarget.x, ny: nameTarget.y,
        cx: clamp((target.x + nameTarget.x) / 2 + bend * .4, area.x + 8, area.x + area.width - 8),
        cy: clamp((target.y + nameTarget.y) / 2 + bend, area.y + 8, area.y + area.height - 8),
        vx: Math.cos(scatterAngle) * speed, vy: Math.sin(scatterAngle) * speed,
        color: i % 4 === 0 ? '#a6ff00' : '#a04aff',
        size: 2.0 + random() * .55, phaseOffset: random() * Math.PI * 2, x: originX, y: originY, alpha: 0
      });
    }
    return { area, groups, particles, startedAt, formation, morphAt, settleAt, scatterAt, endAt, loop, cycle: 0, cycleDuration: endAt + Math.max(0, pauseMs), phase: 'numbers' };
  }
  function step(sequence, now) {
    let elapsed = Math.max(0, now - sequence.startedAt);
    if (sequence.loop) {
      sequence.cycle = Math.floor(elapsed / sequence.cycleDuration);
      elapsed %= sequence.cycleDuration;
      if (elapsed >= sequence.endAt) { sequence.phase = 'pause'; sequence.particles.forEach(p => p.alpha = 0); return true; }
    }
    if (elapsed >= sequence.endAt) { sequence.phase = 'complete'; sequence.particles.forEach(p => p.alpha = 0); return false; }
    sequence.phase = elapsed < sequence.morphAt ? 'numbers' : elapsed < sequence.settleAt ? 'name-forming' : elapsed < sequence.scatterAt ? 'name-hold' : 'dispersing';
    for (const p of sequence.particles) {
      const local = elapsed - p.birth;
      if (local < 0) { p.alpha = 0; continue; }
      if (elapsed < sequence.morphAt) {
        const t = 1 - Math.pow(1 - clamp(local / sequence.formation), 3);
        p.x = mix(p.ox, p.ax, t); p.y = mix(p.oy, p.ay, t); p.alpha = clamp(local / 180);
      } else if (elapsed < sequence.settleAt) {
        const t = smooth((elapsed - sequence.morphAt) / (sequence.settleAt - sequence.morphAt)), u = 1 - t;
        p.x = u * u * p.ax + 2 * u * t * p.cx + t * t * p.nx;
        p.y = u * u * p.ay + 2 * u * t * p.cy + t * t * p.ny; p.alpha = 1;
      } else if (elapsed < sequence.scatterAt) {
        p.x = p.nx; p.y = p.ny; p.alpha = .88 + .12 * Math.sin(elapsed / 330 + p.phaseOffset);
      } else {
        const t = clamp((elapsed - sequence.scatterAt) / (sequence.endAt - sequence.scatterAt));
        p.x = p.nx + p.vx * t * 1.35; p.y = p.ny + p.vy * t * 1.35;
        p.alpha = Math.pow(1 - t, 1.8);
      }
      const edge = Math.min(p.x - sequence.area.x, sequence.area.x + sequence.area.width - p.x, p.y - sequence.area.y, sequence.area.y + sequence.area.height - p.y);
      p.alpha *= clamp(edge / 10);
    }
    return true;
  }
  const api = { create, step, fitGlyph };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Constellation = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
