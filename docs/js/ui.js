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
  if (v) stopMusic();
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

let mTimer = 0, mStep = 0, mNext = 0, mOn = false;

export function startMusic(){
  stopMusic();
  if (muted || !ensureCtx()) return;
  mOn = true; mStep = 0; mNext = actx.currentTime + 0.1;
  mTimer = setInterval(tickMusic, 60);
}
export function stopMusic(){ mOn = false; clearInterval(mTimer); mTimer = 0; }

function tickMusic(){
  if (!mOn || !actx) return;
  const step = 30 / BPM;                       // 8ぶおんぷ 1つぶんの びょうすう
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
