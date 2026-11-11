'use strict';
// Personalization stays in the URL fragment. No API, analytics, or storage.
const $ = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
const toTraditional = OpenCC.Converter({ from: 'cn', to: 'tw' });
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scenes = ['opening', 'countdown', 'celebration'];
let config = { name: '親愛的你', age: 20 };
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
  const normal = '零一二三四五六七八九十百', formal = '零壹貳參肆伍陸柒捌玖拾佰';
  return [...chineseNumber(n)].map(c => formal[normal.indexOf(c)] || c).join('');
}
function cleanName(value) {
  return toTraditional([...String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim()].slice(0, 24).join('')) || '親愛的你';
}
function readConfig() {
  const params = new URLSearchParams(location.hash.slice(1));
  const n = Number(params.get('age'));
  return { name: cleanName(params.get('name')), age: Number.isInteger(n) && n >= 1 && n <= 120 ? n : 20, music: safeHttps(params.get('music')), lyrics: safeHttps(params.get('lyrics')), title: String(params.get('title') || '').slice(0, 100) };
}
function applyConfig(next) {
  const changed = config.name !== next.name || config.age !== next.age;
  config = next;
  all('[data-recipient]').forEach(el => el.textContent = config.name);
  all('[data-age]').forEach(el => el.textContent = String(config.age));
  all('[data-age-words]').forEach(el => el.textContent = chineseNumber(config.age) + '歲');
  all('[data-episode]').forEach(el => el.textContent = '第' + formalNumber(config.age) + '年');
  document.title = config.name === '親愛的你' ? '生日特別篇 · UNIT-01' : config.name + '，' + config.age + '歲生日快樂';
  if (changed && state === 'celebration' && !reducedMotion.matches) ageConstellation();
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
  const captions = ['正在收集深圳的萬家燈火。', '正在裝載你的熱愛與勇氣。', '下一幕，由你書寫。'];
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
  $('#sky-hint').textContent = reducedMotion.matches ? '願你所愛，皆有迴響。' : '點擊夜空，讓一束煙花為你升起。';
  
  if (!reducedMotion.matches) {
    [0, 450, 900].forEach((delay, i) => effectTimers.push(setTimeout(() => burst(skyWidth * (.3 + i * .25), skyHeight * (.16 + i * .05)), delay)));
    effectTimers.push(setTimeout(ageConstellation, 1400));
  }
}
function reset() {
  audio.pause(); clearTimers(); stopSky(); setScene('opening'); $('#start').focus({ preventScroll: true });
}
$('#start').addEventListener('click', playAndStart);
$('#skip').addEventListener('click', showCity);
$('#restart').addEventListener('click', () => { audio.currentTime = 0; playAndStart(); });
$('#home').addEventListener('click', event => { event.preventDefault(); reset(); });

// Short-lived local Canvas particles. Drawing stops when the particles expire.
const canvas = $('#sky'), ctx = canvas.getContext('2d');
let skyWidth = 0, skyHeight = 0, frame = 0, particles = [], lastTime = 0;
let constellation = null, constellationRun = 0;
const colors = ['#a875ed', '#b2ff3a', '#dac3ff', '#e4f6d5'];
function resizeSky() {
  skyWidth = canvas.clientWidth || innerWidth; skyHeight = canvas.clientHeight || innerHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = skyWidth * dpr; canvas.height = skyHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (constellation) ageConstellation();
}
function startDrawing() { if (!frame) { lastTime = 0; frame = requestAnimationFrame(draw); } }
function stopSky() { constellationRun++; constellation = null; document.documentElement.classList.remove('constellation-active'); cancelAnimationFrame(frame); frame = 0; particles = []; ctx.clearRect(0, 0, skyWidth, skyHeight); }
function burst(x, y) {
  if (reducedMotion.matches || state !== 'celebration') return;
  const room = Math.max(0, 900 - particles.length);
  for (let i = 0; i < Math.min(85, room); i++) {
    const angle = Math.random() * Math.PI * 2, speed = 1.3 + Math.random() * 3.3;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 65 + Math.random() * 45, color: colors[i % colors.length], size: .7 + Math.random() * 1.3 });
  }
  startDrawing();
}
function sampleGlyph(text, maxPoints, isName = false) {
  const mask = document.createElement('canvas'); mask.width = 900; mask.height = 240;
  const pen = mask.getContext('2d');
  let size = isName ? 170 : 180;
  const font = px => isName ? '900 ' + px + 'px RecipientMincho, Mincho, "Noto Serif CJK TC", "Songti TC", serif' : 'bold ' + px + 'px Georgia';
  pen.font = font(size);
  while (pen.measureText(text).width > 860 && size > 28) { size -= 4; pen.font = font(size); }
  pen.textAlign = 'center'; pen.textBaseline = 'middle'; pen.fillStyle = '#fff'; pen.fillText(text, 450, 127);
  const data = pen.getImageData(0, 0, 900, 240).data, points = [];
  let left = 900, right = 0, top = 240, bottom = 0;
  const stride = isName ? 3 : 5;
  for (let y = 0; y < 240; y += stride) for (let x = 0; x < 900; x += stride) {
    if (data[(y * 900 + x) * 4 + 3] < 120 || data[(y * 900 + x) * 4 + 3] === undefined) continue;
    points.push({ x, y }); left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  if (!points.length) return { points: [], aspect: 1 };
  const width = Math.max(1, right - left), height = Math.max(1, bottom - top), count = Math.min(maxPoints, points.length);
  return { aspect: width / height, points: Array.from({ length: count }, (_, i) => { const p = points[Math.floor(i / count * points.length)]; return { u: (p.x - left) / width, v: (p.y - top) / height }; }) };
}
function constellationArea() {
  const canvasRect = canvas.getBoundingClientRect(), headerRect = $('.header').getBoundingClientRect();
  const narrow = skyWidth < 720 && skyHeight > skyWidth * .9;
  if (document.documentElement.classList.contains('has-personal-photo')) {
    const top = Math.max(headerRect.bottom - canvasRect.top + 20, 85), bottom = skyHeight * .38;
    return { x: skyWidth * (narrow ? .70 : .68), y: top, width: skyWidth * (narrow ? .265 : .285), height: Math.max(100, bottom - top), narrow };
  }
  if (narrow) {
    const bottom = skyHeight * .28, top = Math.min(Math.max(headerRect.bottom - canvasRect.top + 18, skyHeight * .09), bottom - 75);
    return { x: skyWidth * .08, y: top, width: skyWidth * .84, height: Math.max(75, bottom - top), narrow };
  }
  const titleRect = $('.city-heading').getBoundingClientRect(), lyricsRect = $('.lyrics-dock').getBoundingClientRect();
  const left = Math.max(skyWidth * .72, titleRect.right - canvasRect.left + 20), right = skyWidth * .965;
  const top = Math.max(88, headerRect.bottom - canvasRect.top + 24);
  const bottom = Math.min(skyHeight * .49, lyricsRect.top > canvasRect.top + top + 110 ? lyricsRect.top - canvasRect.top - 25 : skyHeight * .49);
  return { x: Math.min(left, right - 120), y: top, width: Math.max(120, right - left), height: Math.max(120, bottom - top), narrow };
}
async function ageConstellation() {
  const run = ++constellationRun; constellation = null;
  if (reducedMotion.matches || state !== 'celebration') return;
  // Sample after font loading, including browser fallback glyphs for a custom name.
  try { if (document.fonts?.load) await Promise.all([document.fonts.load('900 170px Mincho', config.name), document.fonts.load('900 170px RecipientMincho', config.name)]); } catch { /* System CJK fonts remain usable. */ }
  if (run !== constellationRun || reducedMotion.matches || state !== 'celebration') return;
  document.documentElement.classList.add('constellation-active');
  const area = constellationArea(), groups = area.narrow ? (area.height < 110 ? 3 : 4) : 5;
  constellation = Constellation.create({ age: sampleGlyph(String(config.age), 220), name: sampleGlyph(config.name, area.narrow ? 1050 : 1500, true), area, groups, maxParticles: area.narrow ? 1050 : 1500, startedAt: performance.now(), seed: config.age, loop: true, pauseMs: 900 });
  if (!constellation) { document.documentElement.classList.remove('constellation-active'); return; }
  startDrawing();
}
function drawConstellation(time) {
  if (!constellation) return;
  if (!Constellation.step(constellation, time)) { constellation = null; document.documentElement.classList.remove('constellation-active'); return; }
  for (const p of constellation.particles) {
    if (p.alpha <= .005) continue;
    ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size);
  }
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
  drawConstellation(time);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  frame = particles.length || constellation ? requestAnimationFrame(draw) : 0;
}
canvas.addEventListener('pointerdown', event => { const r = canvas.getBoundingClientRect(); burst(event.clientX - r.left, event.clientY - r.top); });
$('#firework-button').addEventListener('click', () => {
  if (reducedMotion.matches) { toast('這一束煙花，送給此刻的你。願你生日快樂。'); return; }
  burst(skyWidth * (.25 + Math.random() * .5), skyHeight * (.12 + Math.random() * .23));
  
});
window.addEventListener('resize', () => { if (state === 'celebration') resizeSky(); });
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) { stopSky(); effectTimers.forEach(clearTimeout); if (state === 'countdown') showCity(); } else if (state === 'celebration') ageConstellation(); });

// Three handwritten wishes, revealed one at a time.
const letters = [
  { title: '自由', paragraphs: ['不必急著成為誰，也不必照著別人的劇本生活。', '偶爾繞遠，偶爾停下，都沒有關係。願你有選擇方向的勇氣，也有享受沿途的從容。'] },
  { title: '熱愛', paragraphs: ['願你眼裡有星光，心裡有一件想做很久的事。', '像深圳一樣，始終保留向上的好奇。去試，去闖，去靠近那些讓你心跳加速的可能。新的故事，才剛剛開始。'] },
  { title: '被愛', paragraphs: ['願你被認真傾聽，被溫柔惦記，也被堅定選擇。', '別忘了，好好吃飯，好好睡覺。你無需證明什麼，也值得被愛。願往後的生日，都有人記得，都有人陪你一起快樂。'] }
];
let letterIndex = 0;
function showLetter(index) {
  letterIndex = index;
  $('#letter-number').textContent = 'LETTER 0' + (index + 1);
  const heading = $('#letter-heading'); heading.replaceChildren(document.createTextNode('願你，'), document.createElement('br'));
  const emphasis = document.createElement('em'); emphasis.textContent = letters[index].title + '。'; heading.append(emphasis);
  const copy = $('#letter-copy'); copy.replaceChildren();
  letters[index].paragraphs.forEach(text => { const p = document.createElement('p'); p.textContent = text; copy.append(p); });
  all('[data-letter]').forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  $('#next-letter').firstChild.textContent = index === 2 ? '收好這三封信 ' : '下一封信 ';
}
$('#letters-button').addEventListener('click', () => { showLetter(0); $('#letters-dialog').showModal(); });
all('[data-letter]').forEach(button => button.addEventListener('click', () => showLetter(Number(button.dataset.letter))));
$('#next-letter').addEventListener('click', () => { if (letterIndex < 2) showLetter(letterIndex + 1); else $('#letters-dialog').close(); });
$('#close-letters').addEventListener('click', () => $('#letters-dialog').close());

// Generic template editor. Never write the recipient to GitHub or a server.
function openEditor() { $('#recipient-input').value = config.name === '親愛的你' ? '' : config.name; $('#age-input').value = config.age; if (!$('#editor-dialog').open) $('#editor-dialog').showModal(); }
async function copyLink(url) {
  try { await navigator.clipboard.writeText(url); toast('專屬鏈接已複製，可以送給特別的人了。'); return true; }
  catch { openEditor(); $('#link-result').hidden = false; $('#personal-url').value = url; $('#personal-url').focus(); $('#personal-url').select(); toast('請手動複製下方的專屬鏈接。'); return false; }
}
$('#customize').addEventListener('click', openEditor);
$('#close-editor').addEventListener('click', () => $('#editor-dialog').close());
$('#share').addEventListener('click', shareCurrent);
$('#editor-form').addEventListener('submit', async event => {
  event.preventDefault();
  const name = cleanName($('#recipient-input').value), age = Number($('#age-input').value);
  if (!Number.isInteger(age) || age < 1 || age > 120) { toast('請填寫 1 到 120 之間的年齡。'); return; }
  const params = new URLSearchParams({ name, age: String(age) });
  if (externalAudioUrl) params.set('music', externalAudioUrl);
  if (externalLyricsUrl) params.set('lyrics', externalLyricsUrl);
  if ($('#song-title').value.trim()) params.set('title', $('#song-title').value.trim());
  const url = new URL(location.href); url.hash = params.toString();
  history.replaceState(null, '', url); applyConfig({ name, age });
  $('#link-result').hidden = false; $('#personal-url').value = url.href;
  await copyLink(url.href);
});
window.addEventListener('hashchange', () => applyConfig(readConfig()));

// Real audio and lyrics are imported by the visitor. No synthesized substitute.
const audio = $('#audio');
let localAudioFile = null, localAudioObjectUrl = '', externalAudioUrl = '', externalLyricsUrl = '', recipientFontUrl = '', personalPhotoUrl = '';
let rawLyrics = '', cues = [], lyricLines = [], lastCue = -999, lyricFrame = 0, lyricLoadId = 0;
let draftCues = [], stampCursor = 0, manualSync = false, bundledMedia = false;
function safeHttps(value) {
  if (!value) return '';
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; }
}
function mediaPath(value) {
  if (!value) return '';
  try { const u = new URL(value, location.href); return u.protocol === 'https:' || (u.origin === location.origin && u.protocol === 'http:') ? u.href : ''; } catch { return ''; }
}
function applyPersonalPhoto(source) {
  const url = mediaPath(source); if (!url) return;
  const photo = $('.city-photo');
  photo.onload = () => {
    personalPhotoUrl = url; document.documentElement.classList.add('has-personal-photo');
    $('.opening-backdrop').style.backgroundImage = 'url("' + url.replace(/"/g, '%22') + '")';
    $('#personal-photo-credit').hidden = false;
    if (state === 'celebration') resizeSky();
  };
  photo.onerror = () => {
    personalPhotoUrl = ''; document.documentElement.classList.remove('has-personal-photo');
    $('.opening-backdrop').style.backgroundImage = ''; $('#personal-photo-credit').hidden = true;
    photo.onload = null; photo.onerror = null; photo.src = 'assets/shenzhen.jpg';
    photo.alt = '深圳城市夜景';
  };
  photo.alt = '主角背對鏡頭倚著欄杆，望向深圳的紫色夜空與城市燈火。';
  photo.src = url;
}
function openMusic() { if (!$('#music-dialog').open) $('#music-dialog').showModal(); }
$('#music-settings').addEventListener('click', openMusic);
$('#close-music').addEventListener('click', () => $('#music-dialog').close());
function updateTrackLabel() { $('#track-label').textContent = $('#song-title').value.trim() || 'YOUR SONG, YOUR STORY.'; }
$('#song-title').addEventListener('input', updateTrackLabel);
function setAudioSource(source, title = '') {
  audio.pause(); audio.src = source; audio.load();
  if (title && !$('#song-title').value.trim()) $('#song-title').value = title.slice(0, 100);
  updateTrackLabel(); $('#audio-status').textContent = '音樂已載入，可播放試聽。';
  $('#sound-label').textContent = '播放音樂';
}
async function requestMusic(gesture = false) {
  if (!audio.getAttribute('src')) return false;
  let playTimeout;
  try { await Promise.race([audio.play(), new Promise((_, reject) => { playTimeout = setTimeout(() => reject(new Error('Playback timeout')), 8000); })]); return true; }
  catch (error) {
    if (error.name === 'NotAllowedError') {
      $('#audio-status').textContent = '請點「啟動生日特別篇」，連同音樂開始放映。';
      if (gesture) toast('請點一下播放，允許這個頁面的音樂。');
    } else {
      $('#audio-status').textContent = '無法播放音樂，請檢查格式或改用音訊直鏈。';
      if (gesture) toast('這個音檔或連結無法播放，請在「音樂與歌詞」重新匯入。');
    }
    return false;
  } finally { clearTimeout(playTimeout); }
}
function playAndStart() { requestMusic(true); start(); }
$('#sound').addEventListener('click', () => {
  if (!audio.getAttribute('src')) { openMusic(); return; }
  if (audio.paused) requestMusic(true); else audio.pause();
});
audio.addEventListener('play', () => {
  $('#sound-label').textContent = '暫停音樂'; $('#sound').setAttribute('aria-pressed', 'true'); $('#sound').classList.add('playing');
  $('#audio-status').textContent = '正在播放。';
  cancelAnimationFrame(lyricFrame); lyricTick();
});
audio.addEventListener('pause', () => { $('#sound-label').textContent = '播放音樂'; $('#sound').setAttribute('aria-pressed', 'false'); $('#sound').classList.remove('playing'); cancelAnimationFrame(lyricFrame); });
audio.addEventListener('ended', () => { cancelAnimationFrame(lyricFrame); $('#audio-status').textContent = '播放完畢。'; });
audio.addEventListener('error', () => { $('#audio-status').textContent = '音訊載入失敗；請使用可直接播放的音檔或 HTTPS 音訊直鏈。'; });
$('#audio-file').addEventListener('change', event => {
  const file = event.target.files[0]; if (!file) return;
  if (file.size > 100 * 1024 * 1024) { toast('請選擇小於 100MB 的音檔。'); return; }
  if (localAudioObjectUrl) URL.revokeObjectURL(localAudioObjectUrl);
  localAudioFile = file; localAudioObjectUrl = URL.createObjectURL(file); externalAudioUrl = ''; bundledMedia = false;
  $('#music-url').value = ''; setAudioSource(localAudioObjectUrl, file.name.replace(/\.[^.]+$/, ''));
  $('#audio-status').textContent = '已匯入本機音樂。試聽完成後，請匯出分享包保存。';
});
$('#load-music-url').addEventListener('click', () => {
  const url = safeHttps($('#music-url').value.trim());
  if (!url) { toast('請填入 HTTPS 音訊直鏈。'); return; }
  if (localAudioObjectUrl) URL.revokeObjectURL(localAudioObjectUrl);
  localAudioObjectUrl = ''; localAudioFile = null; externalAudioUrl = url; bundledMedia = false;
  setAudioSource(url); requestMusic(true);
});
function setLyrics(text, fromFile = false) {
  rawLyrics = String(text || '').replace(/^\uFEFF/, ''); cues = Lyrics.parseLrc(rawLyrics); lyricLines = Lyrics.plainLines(rawLyrics);
  manualSync = false; stampCursor = 0; draftCues = []; lastCue = -999; $('#stamp-line').disabled = true;
  $('#lyrics-text').value = rawLyrics;
  if (fromFile) { externalLyricsUrl = ''; $('#lyrics-url').value = ''; }
  $('#lyrics-status').textContent = cues.length ? '已載入 ' + cues.length + ' 個時間點，會隨音樂同步。' : lyricLines.length ? '已載入 ' + lyricLines.length + ' 句普通歌詞，請逐句打點。' : '尚未匯入歌詞。';
  $('#sync-preview').textContent = lyricLines.length ? '第一句：' + lyricLines[0] : '等待歌詞。';
  updateLyrics();
}
$('#lyrics-file').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  if (file.size > 512 * 1024) { toast('歌詞檔案過大，請選擇小於 512KB 的 LRC 或 TXT。'); return; }
  lyricLoadId++; setLyrics(await file.text(), true);
});
$('#apply-lyrics').addEventListener('click', () => { lyricLoadId++; setLyrics($('#lyrics-text').value, true); });
async function loadLyricsUrl(url) {
  const id = ++lyricLoadId;
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, { signal: controller.signal, referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error('Lyrics unavailable');
    const text = await response.text(); if (text.length > 512 * 1024) throw new Error('Lyrics too large');
    if (id !== lyricLoadId) return;
    setLyrics(text); externalLyricsUrl = safeHttps(url);
  } catch {
    if (id === lyricLoadId) { $('#lyrics-status').textContent = '歌詞直鏈載入失敗（可能不允許跨站讀取）。請匯入 LRC 檔或直接貼入。'; toast('歌詞載入失敗，可以改用 LRC 檔案或貼入歌詞。'); }
  } finally { clearTimeout(timeout); }
}
$('#load-lyrics-url').addEventListener('click', () => { const url = safeHttps($('#lyrics-url').value.trim()); if (!url) toast('請填入 HTTPS 歌詞直鏈。'); else loadLyricsUrl(url); });
function updateLyrics() {
  const index = Lyrics.findCue(cues, audio.currentTime || 0);
  if (index === lastCue) return; lastCue = index;
  if (!cues.length) {
    $('#lyric-prev').textContent = ''; $('#lyric-current').textContent = lyricLines.length ? '歌詞等待打點' : '尚未匯入歌詞';
    $('#lyric-next').textContent = lyricLines.length ? '在「音樂與歌詞」跟著歌曲記錄每句時間。' : '在「音樂與歌詞」匯入你的歌曲。'; return;
  }
  $('#lyric-prev').textContent = index > 0 ? cues[index - 1].text : '';
  $('#lyric-current').textContent = index >= 0 ? cues[index].text || '♪' : '♪';
  $('#lyric-next').textContent = index + 1 < cues.length ? cues[index + 1].text : '';
}
function lyricTick() { updateLyrics(); if (!audio.paused && !audio.ended) lyricFrame = requestAnimationFrame(lyricTick); }
['timeupdate', 'seeking', 'seeked', 'loadedmetadata'].forEach(type => audio.addEventListener(type, updateLyrics));
$('#start-sync').addEventListener('click', () => {
  if (!audio.getAttribute('src')) { toast('先匯入一首音樂，再開始打點。'); return; }
  const lines = Lyrics.plainLines($('#lyrics-text').value);
  if (!lines.length) { toast('請先貼入歌詞，每句一行。'); return; }
  lyricLoadId++; lyricLines = lines; rawLyrics = lines.join('\n'); cues = []; draftCues = []; stampCursor = 0; manualSync = true; lastCue = -999;
  externalLyricsUrl = ''; $('#lyrics-url').value = ''; audio.currentTime = 0; requestMusic(true);
  $('#stamp-line').disabled = false; $('#sync-preview').textContent = '待記錄第 1 句：' + lyricLines[0];
  $('#lyrics-status').textContent = '每句唱到的時候，點一下「記錄下一句」。';
});
function finishSync() {
  manualSync = false; $('#stamp-line').disabled = true;
  if (draftCues.length) { cues = [...draftCues]; rawLyrics = Lyrics.formatLrc(cues); $('#lyrics-text').value = rawLyrics; $('#lyrics-status').textContent = '已同步 ' + cues.length + ' 句，可回放確認、下載 LRC 或匯出分享包。'; }
  $('#sync-preview').textContent = '打點結束。'; lastCue = -999; updateLyrics();
}
$('#stamp-line').addEventListener('click', () => {
  if (!manualSync || stampCursor >= lyricLines.length) return;
  const time = audio.currentTime || 0;
  if (draftCues.length && time < draftCues[draftCues.length - 1].time) { toast('播放位置在上一個時間點之前，請向後播放再記錄。'); return; }
  draftCues.push({ time, text: lyricLines[stampCursor++] }); cues = [...draftCues]; lastCue = -999; updateLyrics();
  if (stampCursor === lyricLines.length) { finishSync(); toast('全部歌詞已完成打點。'); }
  else $('#sync-preview').textContent = '待記錄第 ' + (stampCursor + 1) + ' 句：' + lyricLines[stampCursor];
});
$('#end-sync').addEventListener('click', finishSync);
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
$('#download-lrc').addEventListener('click', () => {
  if (!cues.length) { toast('請先載入 LRC，或完成逐句打點。'); return; }
  downloadBlob(new Blob([Lyrics.formatLrc(cues)], { type: 'text/plain;charset=utf-8' }), 'soundtrack.lrc');
});
function personalUrl() {
  const url = new URL(location.href), params = new URLSearchParams({ name: config.name, age: String(config.age) });
  if (externalAudioUrl) params.set('music', externalAudioUrl);
  if (externalLyricsUrl) params.set('lyrics', externalLyricsUrl);
  if ($('#song-title').value.trim()) params.set('title', $('#song-title').value.trim());
  url.hash = params.toString(); return url.href;
}
function shareCurrent() {
  if (localAudioFile || (rawLyrics && !externalLyricsUrl && !bundledMedia)) { toast('本機音樂或歌詞還不能隨連結分享，請先匯出分享包並發布。'); openMusic(); return; }
  copyLink(personalUrl());
}
const packageFiles = ['index.html', 'style.css', 'app.js', 'lyrics.js', 'constellation.js', 'assets/birthday.svg', 'assets/mincho-tc.ttf', 'assets/shenzhen.jpg', 'assets/icon.svg', 'assets/FONT-LICENSE.txt', 'vendor/opencc.js', 'vendor/OPENCC-LICENSE.txt', 'vendor/jszip.min.js', 'vendor/JSZIP-LICENSE.txt'];
$('#export-package').addEventListener('click', async () => {
  const button = $('#export-package');
  if (!audio.getAttribute('src')) { toast('請先匯入你要分享的音樂。'); return; }
  if (manualSync) finishSync();
  button.disabled = true; $('#export-status').textContent = '正在裝入音樂與歌詞…';
  try {
    const zip = new JSZip();
    await Promise.all(packageFiles.map(async path => { const response = await fetch(new URL(path, location.href)); if (!response.ok) throw new Error('asset'); zip.file(path, await response.arrayBuffer()); }));
    let musicBytes, extension = 'mp3';
    if (localAudioFile) { musicBytes = await localAudioFile.arrayBuffer(); const ext = localAudioFile.name.split('.').pop().toLowerCase(); if (['mp3', 'm4a', 'wav', 'ogg', 'flac', 'aac', 'webm', 'opus'].includes(ext)) extension = ext; }
    else { try { const response = await fetch(audio.src, { referrerPolicy: 'no-referrer' }); if (!response.ok) throw new Error('audio'); musicBytes = await response.arrayBuffer(); const match = new URL(audio.src).pathname.match(/\.(mp3|m4a|wav|ogg|flac|aac|webm|opus)$/i); if (match) extension = match[1].toLowerCase(); } catch { throw new Error('audio'); } }
    const musicPath = 'assets/soundtrack.' + extension; zip.file(musicPath, musicBytes);
    const lyricsPath = rawLyrics || cues.length ? 'assets/soundtrack.lrc' : '';
    if (lyricsPath) zip.file(lyricsPath, cues.length ? Lyrics.formatLrc(cues) : rawLyrics);
    const mediaManifest = { audio: musicPath, lyrics: lyricsPath, title: $('#song-title').value.trim() };
    if (personalPhotoUrl) { const response = await fetch(personalPhotoUrl); if (!response.ok) throw new Error('photo'); const ext = new URL(personalPhotoUrl).pathname.match(/\.(jpg|jpeg|png|webp|avif)$/i)?.[1] || 'jpg'; const path = 'assets/portrait.' + ext.toLowerCase(); zip.file(path, await response.arrayBuffer()); mediaManifest.photo = path; }
    if (recipientFontUrl) { const response = await fetch(recipientFontUrl); if (!response.ok) throw new Error('font'); zip.file('assets/recipient-mincho.ttf', await response.arrayBuffer()); mediaManifest.font = 'assets/recipient-mincho.ttf'; }
    zip.file('media.json', JSON.stringify(mediaManifest, null, 2));
    zip.file('.nojekyll', '');
    zip.file('READ-ME.txt', '這是可直接發布的生日網站。解壓後，把整個資料夾上傳至靜態托管服務。\n音樂和歌詞已包含在 assets 中，收件人不用重新匯入。\n收件人姓名不會寫進分享包，可透過網站的「製作一份祝福」生成專屬連結。\n瀏覽器可能要求先點一下，才允許有聲播放。\n');
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 3 } });
    downloadBlob(blob, 'birthday-share.zip');
    $('#export-status').textContent = '分享包已下載（' + (blob.size / 1024 / 1024).toFixed(1) + ' MB）。發布這個包後，音樂與歌詞會隨頁面載入。';
  } catch (error) { $('#export-status').textContent = error.message === 'audio' ? '音樂直鏈允許播放，但不允許打包讀取。請選擇本機音檔後再匯出。' : '打包未完成，請檢查網路後重試。'; }
  finally { button.disabled = false; }
});
async function initializeMedia() {
  applyConfig(readConfig());
  let packaged = {};
  try { const response = await fetch('media.json', { cache: 'no-cache' }); if (response.ok) packaged = await response.json(); } catch { /* A generic template can run without music. */ }
  if (packaged.photo) applyPersonalPhoto(packaged.photo);
  if (!audio.getAttribute('src')) {
    const source = config.music || mediaPath(packaged.audio);
    if (source) { externalAudioUrl = config.music || ''; bundledMedia = !config.music && Boolean(packaged.audio); $('#music-url').value = externalAudioUrl; setAudioSource(source, config.title || String(packaged.title || '')); }
  }
  if (packaged.font && window.FontFace && document.fonts) {
    try { const url = mediaPath(packaged.font); if (url) { const face = new FontFace('RecipientMincho', 'url("' + url + '")', { weight: '900' }); document.fonts.add(face); await face.load(); recipientFontUrl = url; } } catch { /* System CJK fonts remain available. */ }
  }
  const lyricsSource = config.lyrics || mediaPath(packaged.lyrics);
  if (lyricsSource && !rawLyrics) { $('#lyrics-url').value = config.lyrics || ''; loadLyricsUrl(lyricsSource); }
  // Keep the opening title and its entry button visible until the visitor enters.
  // Music may start on the opening screen if the browser permits autoplay.
  if (audio.getAttribute('src')) await requestMusic();
}
initializeMedia();

// Fullscreen always follows a visitor gesture; unsupported browsers get viewport mode.
let viewportMode = false;
function fullscreenElement() { return document.fullscreenElement || document.webkitFullscreenElement; }
function updateFullscreen() {
  const active = Boolean(fullscreenElement()) || viewportMode;
  document.documentElement.classList.toggle('is-fullscreen', active);
  $('#fullscreen').setAttribute('aria-pressed', String(active));
  $('#fullscreen').setAttribute('aria-label', active ? '退出全螢幕放映' : '進入全螢幕放映');
  $('#fullscreen').querySelector('.fullscreen-label').textContent = active ? '退出全螢幕 ' : '全螢幕 ';
  if (state === 'celebration') requestAnimationFrame(resizeSky);
}
async function toggleFullscreen() {
  const root = document.documentElement;
  try {
    if (fullscreenElement()) { const exit = document.exitFullscreen || document.webkitExitFullscreen; if (exit) await exit.call(document); }
    else if (viewportMode) viewportMode = false;
    else { const enter = root.requestFullscreen || root.webkitRequestFullscreen; if (enter) await enter.call(root); else { viewportMode = true; toast('此瀏覽器不支援網頁全螢幕，已切換為滿版放映。'); } }
  } catch { viewportMode = true; toast('瀏覽器未允許全螢幕，已切換為滿版放映。'); }
  updateFullscreen();
}
$('#fullscreen').addEventListener('click', toggleFullscreen);
['fullscreenchange', 'webkitfullscreenchange'].forEach(event => document.addEventListener(event, updateFullscreen));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && viewportMode) { viewportMode = false; updateFullscreen(); }
  if (event.key.toLowerCase() === 'f' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target?.closest?.('input,textarea,select,[contenteditable]') && !document.querySelector('dialog[open]')) { event.preventDefault(); toggleFullscreen(); }
});
