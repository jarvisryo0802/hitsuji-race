// ===== がめんの きりかえ・おと・えんしゅつ =====

export const $  = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function show(id){
  $$(".screen").forEach(s => s.classList.toggle("on", s.id === id));
  const el = $("#" + id);
  if (el) el.scrollTop = 0;
}
export const current = () => ($(".screen.on") || {}).id;

// ---- おと ----
let actx = null;
export let muted = false;
try { muted = localStorage.getItem("makainoMute") === "1"; } catch (e) {}

export function setMuted(v){
  muted = v;
  try { localStorage.setItem("makainoMute", v ? "1" : "0"); } catch (e) {}
  if (v) { stopMusic(); stopFarmMusic(); }
}

function ensureCtx(){
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === "suspended") actx.resume();
  } catch (e) { actx = null; }
  return actx;
}

export function sound(freq, dur = 0.08, type = "square", vol = 0.16){
  if (muted || !ensureCtx()) return;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, actx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
  o.connect(g); g.connect(actx.destination);
  o.start(); o.stop(actx.currentTime + dur);
}

/* ---- レースの BGM ----
   おんぷを その場で ならしている（おんがくファイルは つかわない）。
   8ぶおんぷ 32こで 1ループ、およそ 6びょう。 */
const NOTE = { C:0,"C#":1,D:2,"D#":3,E:4,F:5,"F#":6,G:7,"G#":8,A:9,"A#":10,B:11 };
const hz = (n) => {
  const m = /^([A-G]#?)(\d)$/.exec(n);
  return 440 * Math.pow(2, (NOTE[m[1]] + (+m[2] - 4) * 12 - 9) / 12);
};
const MELODY = [
  "G4","G4","A4","B4",  "C5","C5","B4","A4",
  "G4","E4","G4","A4",  "G4", "",   "",  "",
  "E4","E4","F4","G4",  "A4","A4","G4","F4",
  "E4","D4","E4","D4",  "C4", "",   "",  "",
];
const BASS = [
  "C3","","","",  "C3","","","",
  "G2","","","",  "G2","","","",
  "F2","","","",  "F2","","","",
  "G2","","","",  "C3","","","",
];
const BPM = 152;

let mTimer = 0, mStep = 0, mNext = 0, mOn = false, tempo = 1;

// レースの おわりで テンポを あげると もりあがる
export function setTempo(m){ tempo = m; }

export function startMusic(){
  stopMusic();
  tempo = 1;
  if (muted || !ensureCtx()) return;
  mOn = true; mStep = 0; mNext = actx.currentTime + 0.1;
  mTimer = setInterval(tickMusic, 60);
}
export function stopMusic(){ mOn = false; clearInterval(mTimer); mTimer = 0; }

function tickMusic(){
  if (!mOn || !actx) return;
  const step = 30 / (BPM * tempo);             // 8ぶおんぷ 1つぶんの びょうすう
  while (mNext < actx.currentTime + 0.3){      // すこし さきまで よやくしておく
    const i = mStep % MELODY.length;
    voice(MELODY[i], mNext, step * 0.85, "square",   0.042);
    voice(BASS[i],   mNext, step * 1.7,  "triangle", 0.065);
    if (i % 2 === 0) beat(mNext);
    mNext += step; mStep++;
  }
}

function voice(name, t, dur, type, vol){
  if (!name) return;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.value = hz(name);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g); g.connect(actx.destination);
  o.start(t); o.stop(t + dur + 0.03);
}
function beat(t){
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = "triangle"; o.frequency.setValueAtTime(1500, t);
  g.gain.setValueAtTime(0.028, t);
  g.gain.exponentialRampToValueAtTime(0.0005, t + 0.045);
  o.connect(g); g.connect(actx.destination);
  o.start(t); o.stop(t + 0.06);
}

/* ---- ぼくじょうの BGM ----
   まったり した のんびりメロディを、レースの おんがくとは べつに ループする。
   マップがめんに いる あいだだけ ならす。 */
const FARM_MELODY = [
  "C4","","E4","","G4","","E4","",
  "A4","","G4","","E4","","D4","",
  "C4","","D4","","E4","","D4","",
  "C4","","","","G3","","","",
];
const FARM_BASS = [
  "C3","","","","","","","",
  "F2","","","","","","","",
  "G2","","","","","","","",
  "C3","","","","","","","",
];
const FARM_BPM = 78;

let fTimer = 0, fStep = 0, fNext = 0, fOn = false;

export function startFarmMusic(){
  stopFarmMusic();
  if (muted || !ensureCtx()) return;
  fOn = true; fStep = 0; fNext = actx.currentTime + 0.15;
  fTimer = setInterval(tickFarm, 90);
}
export function stopFarmMusic(){ fOn = false; clearInterval(fTimer); fTimer = 0; }

function tickFarm(){
  if (!fOn || !actx) return;
  const step = 30 / FARM_BPM;
  while (fNext < actx.currentTime + 0.35){
    const i = fStep % FARM_MELODY.length;
    voice(FARM_MELODY[i], fNext, step * 1.7, "sine",     0.05);
    voice(FARM_BASS[i],   fNext, step * 3.0, "triangle", 0.045);
    fNext += step; fStep++;
  }
}

/* ---- かんせい（ざわざわ・わーっ）----
   ノイズを バンドパスに とおして、人の こえの ような ざわめきを つくる */
let noiseBuf = null;
function noise(){
  if (noiseBuf) return noiseBuf;
  const len = Math.floor(actx.sampleRate * 2);
  noiseBuf = actx.createBuffer(1, len, actx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

export function cheer(strength = 1, dur = 1.5){
  if (muted || !ensureCtx()) return;
  const t = actx.currentTime;
  const src = actx.createBufferSource();
  src.buffer = noise(); src.loop = true;
  const bp = actx.createBiquadFilter();
  bp.type = "bandpass"; bp.Q.value = 0.8;
  bp.frequency.setValueAtTime(650, t);
  bp.frequency.linearRampToValueAtTime(1150, t + dur * 0.3);
  bp.frequency.linearRampToValueAtTime(800, t + dur);
  const g = actx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.055 * strength, t + dur * 0.25);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  src.connect(bp); bp.connect(g); g.connect(actx.destination);
  src.start(t); src.stop(t + dur + 0.05);
}

// ひつじの なきごえ
export function baa(){
  if (muted || !ensureCtx()) return;
  const t = actx.currentTime;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(430, t);
  o.frequency.linearRampToValueAtTime(390, t + 0.5);
  // こきざみに ふるわせて「メェ〜」に する
  const lfo = actx.createOscillator(), lg = actx.createGain();
  lfo.frequency.value = 17; lg.gain.value = 26;
  lfo.connect(lg); lg.connect(o.frequency);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.1, t + 0.06);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.55);
  o.connect(g); g.connect(actx.destination);
  o.start(t); lfo.start(t); o.stop(t + 0.6); lfo.stop(t + 0.6);
}

// もぐもぐ
export function munch(){ sound(150 + Math.random() * 60, 0.07, "sawtooth", 0.07); }
export const tap    = () => sound(660, 0.06, "triangle", 0.13);
export const good   = () => [784, 988, 1319].forEach((f, i) => setTimeout(() => sound(f, 0.16, "triangle", 0.16), i * 90));
export const bad    = () => sound(180, 0.22, "sawtooth", 0.12);
export const coin   = () => [988, 1319].forEach((f, i) => setTimeout(() => sound(f, 0.1, "square", 0.12), i * 70));
export const fanfare= () => [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => sound(f, 0.24, "triangle", 0.18), i * 130));

// ---- トースト（がめんの うえに でる おしらせ）----
export function toast(text, ms = 1800){
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = text;
  $("#app").appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 400); }, ms);
}

/* ---- かいわ（したから でてくる はなしの まど）----
   text を 1もじずつ だす。とちゅうで タップすると さいごまで だす。
   choices を わたすと、えらんだ ものの value を かえす。 */
export function say(name, text, choices = null){
  return new Promise(resolve => {
    const back = document.createElement("div");
    back.className = "talkback";
    back.innerHTML = `
      <div class="talkbox">
        ${name ? `<div class="talkname">${name}</div>` : ""}
        <div class="talktext"></div>
        <div class="talkchoices"></div>
        <div class="talknext">▼</div>
      </div>`;
    $("#app").appendChild(back);

    const txt = back.querySelector(".talktext");
    const nx  = back.querySelector(".talknext");
    const ch  = back.querySelector(".talkchoices");
    let done = false;

    // <b> などの タグは 1もじずつ ださずに まとめて だす。
    // タグを もじ数に かぞえると、ながい ぶんしょうで とても おそくなる。
    const parts = [];
    for (let i = 0; i < text.length; ){
      if (text[i] === "<"){
        const j = text.indexOf(">", i);
        if (j < 0){ parts.push({ ch: text[i] }); i++; continue; }
        parts.push({ tag: text.slice(i, j + 1) });
        i = j + 1;
      } else { parts.push({ ch: text[i] }); i++; }
    }
    const visible = parts.filter(p => p.ch).length;
    const wait = Math.max(11, Math.min(28, 1000 / Math.max(1, visible)));

    let k = 0, buf = "", shown = 0;
    const timer = setInterval(() => {
      // つぎの 1もじが でるまで、タグは まとめて つける
      while (k < parts.length && parts[k].tag) buf += parts[k++].tag;
      if (k < parts.length){ buf += parts[k++].ch; shown++; }
      txt.innerHTML = buf;
      if (shown % 3 === 0) sound(520 + Math.random() * 120, 0.03, "square", 0.05);
      if (k >= parts.length) finish();
    }, wait);

    function finish(){
      clearInterval(timer);
      txt.innerHTML = text;
      done = true;
      if (choices && choices.length){
        nx.style.display = "none";
        ch.innerHTML = choices.map((c, k) =>
          `<button class="talkchoice" data-k="${k}">${c.label}</button>`).join("");
        ch.querySelectorAll(".talkchoice").forEach(b => {
          b.onclick = (e) => { e.stopPropagation(); tap(); back.remove(); resolve(choices[+b.dataset.k].value); };
        });
      }
    }

    back.onclick = () => {
      if (!done){ finish(); return; }
      if (!choices || !choices.length){ tap(); back.remove(); resolve(null); }
    };
  });
}

// ---- かんたんな ダイアログ ----
export function dialog({ title, body, ok = "OK", cancel = null }){
  return new Promise(resolve => {
    const back = document.createElement("div");
    back.className = "dlgback";
    back.innerHTML = `
      <div class="dlg">
        <h3>${title}</h3>
        <div class="dlgbody">${body}</div>
        <div class="dlgbtns">
          ${cancel ? `<button class="btn small gray" data-no>${cancel}</button>` : ""}
          <button class="btn small" data-yes>${ok}</button>
        </div>
      </div>`;
    $("#app").appendChild(back);
    back.querySelector("[data-yes]").onclick = () => { tap(); back.remove(); resolve(true); };
    const no = back.querySelector("[data-no]");
    if (no) no.onclick = () => { tap(); back.remove(); resolve(false); };
  });
}

// ---- きらきら・かみふぶき ----
export function confetti(n = 60){
  const colors = ["#ff6b9d", "#3fa3f5", "#ffb02e", "#4ec26a", "#a97cff", "#ff7a4d"];
  for (let i = 0; i < n; i++){
    const c = document.createElement("div");
    c.className = "conf";
    c.style.left = Math.random() * 100 + "%";
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = (1.6 + Math.random() * 1.6) + "s";
    c.style.animationDelay = (Math.random() * 0.5) + "s";
    $("#app").appendChild(c);
    setTimeout(() => c.remove(), 3800);
  }
}

// かずが ふえる えんしゅつ
export function countUp(el, from, to, ms = 600){
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / ms);
    el.textContent = Math.round(from + (to - from) * k).toLocaleString();
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export const yen = (n) => n.toLocaleString() + "えん";
