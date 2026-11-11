'use strict';
// Personalization stays in the URL fragment. No API, analytics, or storage.
const $ = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scenes = ['opening', 'countdown', 'celebration'];
let config = { name: '亲爱的你', age: 20 };
let state = 'opening';
let countTimers = [], effectTimers = [], toastTimer;

function chineseNumber(n) {
  const digit = '零一二三四五六七八九';
  if (n < 10) return digit[n];
  if (n < 20) return '十' + (n % 10 ? digit[n % 10] : '');
  if (n < 100) return digit[Math.floor(n / 10)] + '十' + (n % 10 ? digit[n % 10] : '');
  return '一百' + (n === 100 ? '' : n < 110 ? '零' + chineseNumber(n - 100) : n < 120 ? '一' + chineseNumber(n - 100) : '二十');
}
function formalNumber(n) {
  const normal = '零一二三四五六七八九十百', formal = '零壹贰叁肆伍陆柒捌玖拾佰';
  return [...chineseNumber(n)].map(c => formal[normal.indexOf(c)] || c).join('');
}
function cleanName(value) {
  return [...String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim()].slice(0, 24).join('') || '亲爱的你';
}
function readConfig() {
  const params = new URLSearchParams(location.hash.slice(1));
  const n = Number(params.get('age'));
  return { name: cleanName(params.get('name')), age: Number.isInteger(n) && n >= 1 && n <= 120 ? n : 20 };
}
function applyConfig(next) {
  config = next;
  all('[data-recipient]').forEach(el => el.textContent = config.name);
  all('[data-age]').forEach(el => el.textContent = String(config.age));
  all('[data-age-words]').forEach(el => el.textContent = chineseNumber(config.age) + '岁');
  all('[data-episode]').forEach(el => el.textContent = '第' + formalNumber(config.age) + '年');
  document.title = config.name === '亲爱的你' ? '生日特别篇 · UNIT-01' : config.name + '，' + config.age + '岁生日快乐';
}
function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3500);
}
function clearTimers() {
  countTimers.forEach(clearTimeout); effectTimers.forEach(clearTimeout);
  countTimers = []; effectTimers = [];
}
function setScene(next) {
  state = next;
  scenes.forEach(id => $('#' + id).hidden = id !== next);
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function start() {
  clearTimers(); stopSky();
  if (reducedMotion.matches) { showCity(); return; }
  setScene('countdown');
  const captions = ['正在收集深圳的万家灯火。', '正在装载你的热爱与勇气。', '下一幕，由你书写。'];
  function update(n) {
    $('#count-number').textContent = String(n).padStart(2, '0');
    $('#count-text').textContent = captions[3 - n];
  }
  update(3);
  countTimers.push(setTimeout(() => update(2), 850), setTimeout(() => update(1), 1700), setTimeout(showCity, 2550));
}
function showCity() {
  clearTimers(); setScene('celebration'); resizeSky();
  $('#birthday-heading').focus({ preventScroll: true });
  $('#sky-hint').textContent = reducedMotion.matches ? '愿你所爱，皆有回响。' : '点击夜空，让一束烟花为你升起。';
  if (audioOn) chime();
  if (!reducedMotion.matches) {
    [0, 450, 900].forEach((delay, i) => effectTimers.push(setTimeout(() => burst(skyWidth * (.3 + i * .25), skyHeight * (.16 + i * .05)), delay)));
    effectTimers.push(setTimeout(ageConstellation, 1400));
  }
}
function reset() {
  clearTimers(); stopSky(); setScene('opening'); $('#start').focus({ preventScroll: true });
}
$('#start').addEventListener('click', start);
$('#skip').addEventListener('click', showCity);
$('#restart').addEventListener('click', reset);
$('#home').addEventListener('click', event => { event.preventDefault(); reset(); });

// Short-lived local Canvas particles. Drawing stops when the particles expire.
const canvas = $('#sky'), ctx = canvas.getContext('2d');
let skyWidth = 0, skyHeight = 0, frame = 0, particles = [], lastTime = 0;
const colors = ['#a875ed', '#b2ff3a', '#dac3ff', '#e4f6d5'];
function resizeSky() {
  skyWidth = canvas.clientWidth || innerWidth; skyHeight = canvas.clientHeight || innerHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = skyWidth * dpr; canvas.height = skyHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function startDrawing() { if (!frame) { lastTime = 0; frame = requestAnimationFrame(draw); } }
function stopSky() { cancelAnimationFrame(frame); frame = 0; particles = []; ctx.clearRect(0, 0, skyWidth, skyHeight); }
function burst(x, y) {
  if (reducedMotion.matches || state !== 'celebration') return;
  const room = Math.max(0, 900 - particles.length);
  for (let i = 0; i < Math.min(85, room); i++) {
    const angle = Math.random() * Math.PI * 2, speed = 1.3 + Math.random() * 3.3;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 65 + Math.random() * 45, color: colors[i % colors.length], size: .7 + Math.random() * 1.3 });
  }
  startDrawing();
}
function ageConstellation() {
  if (reducedMotion.matches || state !== 'celebration') return;
  const mask = document.createElement('canvas'); mask.width = 360; mask.height = 200;
  const pen = mask.getContext('2d'); pen.font = 'bold 164px Georgia'; pen.textAlign = 'center'; pen.textBaseline = 'middle'; pen.fillStyle = '#fff'; pen.fillText(String(config.age), 180, 105);
  const pixels = pen.getImageData(0, 0, 360, 200).data;
  const scale = skyWidth < 640 ? .55 : 1.05, cx = skyWidth < 640 ? skyWidth * .52 : skyWidth * .75, cy = skyHeight * .17;
  for (let y = 0; y < 200; y += 7) for (let x = 0; x < 360; x += 7) {
    if (pixels[(y * 360 + x) * 4 + 3] < 100 || particles.length >= 900) continue;
    particles.push({ x: cx + (Math.random() - .5) * 400, y: cy + (Math.random() - .5) * 250, tx: cx + (x - 180) * scale, ty: cy + (y - 100) * scale, mode: 'text', life: 260, color: (x + y) % 3 ? '#a875ed' : '#b2ff3a', size: skyWidth < 640 ? 1.2 : 1.6 });
  }
  startDrawing();
}
function draw(time) {
  const dt = lastTime ? Math.min((time - lastTime) / 16.667, 2) : 1; lastTime = time;
  ctx.clearRect(0, 0, skyWidth, skyHeight); ctx.globalCompositeOperation = 'lighter';
  particles = particles.filter(p => p.life > 0);
  for (const p of particles) {
    p.life -= dt;
    if (p.mode === 'text') { const ease = 1 - Math.pow(.94, dt); p.x += (p.tx - p.x) * ease; p.y += (p.ty - p.y) * ease; }
    else { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(.989, dt); p.vy += .025 * dt; }
    ctx.globalAlpha = Math.max(0, Math.min(p.life / 35, 1)); ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  frame = particles.length ? requestAnimationFrame(draw) : 0;
}
canvas.addEventListener('pointerdown', event => { const r = canvas.getBoundingClientRect(); burst(event.clientX - r.left, event.clientY - r.top); });
$('#firework-button').addEventListener('click', () => {
  if (reducedMotion.matches) { toast('这一束烟花，送给此刻的你。愿你生日快乐。'); return; }
  burst(skyWidth * (.25 + Math.random() * .5), skyHeight * (.12 + Math.random() * .23));
  if (audioOn) chime();
});
window.addEventListener('resize', () => { if (state === 'celebration') resizeSky(); });
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) { stopSky(); effectTimers.forEach(clearTimeout); if (state === 'countdown') showCity(); } });

// Three handwritten wishes, revealed one at a time.
const letters = [
  { title: '自由', paragraphs: ['不必急着成为谁，也不必照着别人的剧本生活。', '偶尔绕远，偶尔停下，都没有关系。愿你有选择方向的勇气，也有享受沿途的从容。'] },
  { title: '热爱', paragraphs: ['愿你眼里有星光，心里有一件想做很久的事。', '像深圳一样，始终保留向上的好奇。去试，去闯，去靠近那些让你心跳加速的可能。新的故事，才刚刚开始。'] },
  { title: '被爱', paragraphs: ['愿你被认真倾听，被温柔惦记，也被坚定选择。', '别忘了，好好吃饭，好好睡觉。你无需证明什么，也值得被爱。愿往后的生日，都有人记得，都有人陪你一起快乐。'] }
];
let letterIndex = 0;
function showLetter(index) {
  letterIndex = index;
  $('#letter-number').textContent = 'LETTER 0' + (index + 1);
  const heading = $('#letter-heading'); heading.replaceChildren(document.createTextNode('愿你，'), document.createElement('br'));
  const emphasis = document.createElement('em'); emphasis.textContent = letters[index].title + '。'; heading.append(emphasis);
  const copy = $('#letter-copy'); copy.replaceChildren();
  letters[index].paragraphs.forEach(text => { const p = document.createElement('p'); p.textContent = text; copy.append(p); });
  all('[data-letter]').forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  $('#next-letter').firstChild.textContent = index === 2 ? '收好这三封信 ' : '下一封信 ';
}
$('#letters-button').addEventListener('click', () => { showLetter(0); $('#letters-dialog').showModal(); });
all('[data-letter]').forEach(button => button.addEventListener('click', () => showLetter(Number(button.dataset.letter))));
$('#next-letter').addEventListener('click', () => { if (letterIndex < 2) showLetter(letterIndex + 1); else $('#letters-dialog').close(); });
$('#close-letters').addEventListener('click', () => $('#letters-dialog').close());

// Generic template editor. Never write the recipient to GitHub or a server.
function openEditor() { $('#recipient-input').value = config.name === '亲爱的你' ? '' : config.name; $('#age-input').value = config.age; if (!$('#editor-dialog').open) $('#editor-dialog').showModal(); }
async function copyLink(url) {
  try { await navigator.clipboard.writeText(url); toast('专属链接已复制，可以送给特别的人了。'); return true; }
  catch { openEditor(); $('#link-result').hidden = false; $('#personal-url').value = url; $('#personal-url').focus(); $('#personal-url').select(); toast('请手动复制下方的专属链接。'); return false; }
}
$('#customize').addEventListener('click', openEditor);
$('#close-editor').addEventListener('click', () => $('#editor-dialog').close());
$('#share').addEventListener('click', () => copyLink(location.href));
$('#editor-form').addEventListener('submit', async event => {
  event.preventDefault();
  const name = cleanName($('#recipient-input').value), age = Number($('#age-input').value);
  if (!Number.isInteger(age) || age < 1 || age > 120) { toast('请填写 1 到 120 之间的年龄。'); return; }
  const params = new URLSearchParams({ name, age: String(age) });
  const url = new URL(location.href); url.hash = params.toString();
  history.replaceState(null, '', url); applyConfig({ name, age });
  $('#link-result').hidden = false; $('#personal-url').value = url.href;
  await copyLink(url.href);
});
window.addEventListener('hashchange', () => applyConfig(readConfig()));

// User-controlled ambient synthesis. No copyrighted soundtrack or remote audio.
let audioContext, master, audioOn = false;
function initAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) throw new Error('Audio unavailable');
  audioContext = new Ctx(); master = audioContext.createGain(); master.gain.value = 0; master.connect(audioContext.destination);
  [130.81, 196, 261.63].forEach((frequency, i) => { const osc = audioContext.createOscillator(), gain = audioContext.createGain(); osc.frequency.value = frequency; gain.gain.value = .025 / (i + 1); osc.connect(gain).connect(master); osc.start(); });
}
function chime() {
  if (!audioContext) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, i) => { const osc = audioContext.createOscillator(), gain = audioContext.createGain(), t = audioContext.currentTime + i * .25; osc.frequency.value = frequency; gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(.06, t + .02); gain.gain.exponentialRampToValueAtTime(.001, t + 1.8); osc.connect(gain).connect(master); osc.start(t); osc.stop(t + 2); });
}
$('#sound').addEventListener('click', async () => {
  try { if (!audioContext) initAudio(); await audioContext.resume(); audioOn = !audioOn; master.gain.setTargetAtTime(audioOn ? 1 : 0, audioContext.currentTime, .5); $('#sound-label').textContent = audioOn ? '声音开启' : '声音关闭'; $('#sound').setAttribute('aria-pressed', String(audioOn)); $('#sound').setAttribute('aria-label', audioOn ? '关闭背景音' : '开启背景音'); $('#sound').classList.toggle('playing', audioOn); if (audioOn) chime(); }
  catch { toast('当前浏览器暂不支持声音，祝福仍可正常播放。'); }
});
document.addEventListener('visibilitychange', () => { if (audioContext) { if (document.hidden) audioContext.suspend(); else if (audioOn) audioContext.resume().catch(() => {}); } });
applyConfig(readConfig());
