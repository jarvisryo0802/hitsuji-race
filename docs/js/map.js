// ===== ぼくじょうを あるきまわる がめん（とりのめ）=====
// ゆびで がめんを おして うごかすと、しゅじんこうが ぼくじょうを あるく。
// じはんき・ひつじの さく・レースかいじょう・スタッフに ちかづくと
// ボタンが でて、そこで できることを えらべる。
import * as S from "./save.js";
import { sheepArt, FOOT_X, FOOT_Y } from "./sheep.js";
import { $, show, tap, toast, say, yen } from "./ui.js";

const W = 720, H = 1000;               // ぼくじょう ぜんたいの ひろさ
const VIEW_W = 440, VIEW_H = 704;      // がめんに うつる ぶん（index.html の viewBox と そろえる）
const SPEED = 165;                     // 1びょうに あるく きょり
const STICK_MAX = 58;                  // ゆびを うごかす さいだい（ピクセル）

// いける ばしょ
export const SPOTS = [
  { id:"pen",   x:172, y:470, r:120, name:"ひつじの さく",     act:"あいさつする" },
  { id:"race",  x:360, y:170, r:130, name:"レースかいじょう",   act:"はいる" },
  { id:"shop",  x:503, y:672, r:88,  name:"エサの じはんき",   act:"かう" },
  { id:"gacha", x:628, y:790, r:82,  name:"ガチャ",            act:"まわす" },
  { id:"staff", x:246, y:742, r:82,  name:"スタッフの おねえさん", act:"はなす" },
];

// とおれない ばしょ
const SOLID = [
  { x: 52, y:376, w:242, h:150 },   // ひつじの さく
  { x:468, y:352, w:180, h:148 },   // なや
  { x:470, y:628, w: 66, h: 62 },   // じはんき
  { x:598, y:752, w: 62, h: 60 },   // ガチャ
  { x:250, y: 92, w:220, h: 34 },   // レースゲートの よこぼう
];

const st = {
  x: 360, y: 900, face: 1, gait: 0,
  vx: 0, vy: 0, near: null,
  raf: 0, timer: 0, last: 0, on: false,
  stick: null, origin: null,
};

// ちいさな らんすう（たねが おなじなら いつも おなじ もように なる）
function rnd(seed){
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/* =========================================================
   みための ぶひん（グラデーション・かげ）を まとめて つくる
   ========================================================= */
function defs(){
  return `
  <defs>
    <radialGradient id="grassMain" cx="42%" cy="28%" r="88%">
      <stop offset="0%" stop-color="#c8f0a4"/>
      <stop offset="55%" stop-color="#a3e084"/>
      <stop offset="100%" stop-color="#7fc562"/>
    </radialGradient>
    <radialGradient id="penGrass" cx="40%" cy="24%" r="90%">
      <stop offset="0%" stop-color="#d3f2ae"/>
      <stop offset="100%" stop-color="#a9e08c"/>
    </radialGradient>
    <radialGradient id="pondG" cx="30%" cy="24%" r="90%">
      <stop offset="0%" stop-color="#e4f8ff"/>
      <stop offset="45%" stop-color="#a9e2ff"/>
      <stop offset="100%" stop-color="#57a9e0"/>
    </radialGradient>
    <linearGradient id="roadG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f3e0b8"/>
      <stop offset="100%" stop-color="#dcb787"/>
    </linearGradient>
    <linearGradient id="roofG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#dadada"/>
    </linearGradient>
    <linearGradient id="wallG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f08881"/>
      <stop offset="100%" stop-color="#cf5751"/>
    </linearGradient>
    <linearGradient id="siloG" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#fff9ec"/>
      <stop offset="42%" stop-color="#efe3c9"/>
      <stop offset="100%" stop-color="#c9b993"/>
    </linearGradient>
    <linearGradient id="fenceG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fffdf4"/>
      <stop offset="100%" stop-color="#ecdcb2"/>
    </linearGradient>
    <linearGradient id="vendG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#79c6ff"/>
      <stop offset="100%" stop-color="#2f8fdc"/>
    </linearGradient>
    <linearGradient id="gachaG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#cbb0ff"/>
      <stop offset="100%" stop-color="#8f61e0"/>
    </linearGradient>
    <linearGradient id="treeG" x1="0.1" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#8bd977"/>
      <stop offset="100%" stop-color="#4f9e46"/>
    </linearGradient>
    <linearGradient id="trunkG" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#c08f5c"/>
      <stop offset="100%" stop-color="#8a5f38"/>
    </linearGradient>
    <linearGradient id="skinG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffe4c4"/>
      <stop offset="100%" stop-color="#f2c99c"/>
    </linearGradient>
    <linearGradient id="kidShirtG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffab52"/>
      <stop offset="100%" stop-color="#ee7d17"/>
    </linearGradient>
    <linearGradient id="kidHairG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7a6046"/>
      <stop offset="100%" stop-color="#4a3626"/>
    </linearGradient>
    <linearGradient id="kidPantsG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6f92c4"/>
      <stop offset="100%" stop-color="#3f5d8a"/>
    </linearGradient>
    <linearGradient id="staffShirtG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#72d488"/>
      <stop offset="100%" stop-color="#3aa858"/>
    </linearGradient>
    <linearGradient id="staffHairG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5a4636"/>
      <stop offset="100%" stop-color="#33251a"/>
    </linearGradient>
    <linearGradient id="staffPantsG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#84899a"/>
      <stop offset="100%" stop-color="#565b6a"/>
    </linearGradient>
    <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1c2a16" stop-opacity=".32"/>
      <stop offset="72%" stop-color="#1c2a16" stop-opacity=".13"/>
      <stop offset="100%" stop-color="#1c2a16" stop-opacity="0"/>
    </radialGradient>
    <filter id="softSh" x="-60%" y="-40%" width="220%" height="220%">
      <feDropShadow dx="0" dy="5" stdDeviation="3.4" flood-color="#1f3018" flood-opacity=".26"/>
    </filter>
  </defs>`;
}

// くさの てくすちゃ（ちいさな ふでの あとを ばらまく）
function grassTexture(x, y, w, h, n, seed){
  const r = rnd(seed);
  let s = "";
  for (let i = 0; i < n; i++){
    const bx = x + r() * w, by = y + r() * h;
    const dark = r() > 0.5;
    s += `<ellipse cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" rx="${(3 + r() * 3).toFixed(1)}" ry="${(1.4 + r() * 1.2).toFixed(1)}"
      fill="${dark ? "#6fb857" : "#c8f0a0"}" opacity="${(dark ? 0.16 : 0.22).toFixed(2)}"
      transform="rotate(${(r() * 40 - 20).toFixed(0)} ${bx.toFixed(1)} ${by.toFixed(1)})"/>`;
  }
  return s;
}

/* ---------- しゅじんこうの え（あしもとが 0,0）---------- */
function kidArt(){
  return `
    <ellipse cx="0" cy="1" rx="15" ry="4.5" fill="url(#groundShadow)"/>
    <rect class="kl1" x="-8.5" y="-15" width="7.5" height="16" rx="3.5" fill="url(#kidPantsG)"/>
    <rect class="kl2" x="1"    y="-15" width="7.5" height="16" rx="3.5" fill="url(#kidPantsG)"/>
    <rect x="-12" y="-36" width="24" height="23" rx="8" fill="url(#kidShirtG)"/>
    <rect x="-12" y="-36" width="24" height="7" rx="3.5" fill="#ffffff" opacity=".22"/>
    <rect class="ka1" x="-17.5" y="-34" width="6.5" height="16" rx="3.2" fill="url(#skinG)"/>
    <rect class="ka2" x="11"    y="-34" width="6.5" height="16" rx="3.2" fill="url(#skinG)"/>
    <circle cx="0" cy="-46" r="13.5" fill="url(#skinG)"/>
    <ellipse cx="-5.5" cy="-42" rx="3.6" ry="2.4" fill="#ff9d8a" opacity=".55"/>
    <ellipse cx="5.5" cy="-42" rx="3.6" ry="2.4" fill="#ff9d8a" opacity=".55"/>
    <path d="M-13.5,-48 a13.5,13.5 0 0 1 27,0 q-13.5,-8 -27,0z" fill="url(#kidHairG)"/>
    <circle cx="-4.8" cy="-45" r="2.1" fill="#3a3a4a"/>
    <circle cx="4.8"  cy="-45" r="2.1" fill="#3a3a4a"/>
    <path d="M-3,-39 q3,3 6,0" stroke="#c9736b" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
}

/* ---------- スタッフの え ---------- */
function staffArt(){
  return `
    <ellipse cx="0" cy="1" rx="15" ry="4.5" fill="url(#groundShadow)"/>
    <rect x="-8.5" y="-15" width="7.5" height="16" rx="3.5" fill="url(#staffPantsG)"/>
    <rect x="1"    y="-15" width="7.5" height="16" rx="3.5" fill="url(#staffPantsG)"/>
    <rect x="-12" y="-36" width="24" height="23" rx="8" fill="url(#staffShirtG)"/>
    <rect x="-12" y="-36" width="24" height="7" rx="3.5" fill="#ffffff" opacity=".2"/>
    <rect x="-17.5" y="-34" width="6.5" height="16" rx="3.2" fill="url(#skinG)"/>
    <rect x="11"    y="-34" width="6.5" height="16" rx="3.2" fill="url(#skinG)"/>
    <circle cx="0" cy="-46" r="13.5" fill="url(#skinG)"/>
    <ellipse cx="-5.5" cy="-42" rx="3.4" ry="2.2" fill="#ff9d8a" opacity=".5"/>
    <ellipse cx="5.5" cy="-42" rx="3.4" ry="2.2" fill="#ff9d8a" opacity=".5"/>
    <path d="M-14,-49 a14,14 0 0 1 28,0 q-14,-9 -28,0z" fill="url(#staffHairG)"/>
    <path d="M-16,-52 a16,10 0 0 1 32,0z" fill="#e0625e"/>
    <rect x="-16" y="-52" width="32" height="5" rx="2.5" fill="#f08881"/>
    <circle cx="-4.8" cy="-45" r="2.1" fill="#3a3a4a"/>
    <circle cx="4.8"  cy="-45" r="2.1" fill="#3a3a4a"/>
    <path d="M-3.5,-39 q3.5,3.5 7,0" stroke="#c9736b" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
}

/* ---------- ぼくじょうの え ---------- */
function tree(x, y, s = 1){
  return `<g transform="translate(${x},${y}) scale(${s})" filter="url(#softSh)">
    <rect x="-4" y="-26" width="8" height="28" rx="3" fill="url(#trunkG)"/>
    <circle cx="0" cy="-40" r="24" fill="url(#treeG)"/>
    <circle cx="-13" cy="-31" r="16" fill="url(#treeG)"/>
    <circle cx="13" cy="-32" r="15" fill="url(#treeG)"/>
    <ellipse cx="-9" cy="-52" rx="10" ry="6.5" fill="#ffffff" opacity=".25"/>
  </g>`;
}
function flowers(x, y, n, c){
  let s = "";
  for (let i = 0; i < n; i++){
    const fx = x + (i % 3) * 15 + (i % 2) * 6, fy = y + Math.floor(i / 3) * 13;
    s += `<ellipse cx="${fx + 1}" cy="${fy + 2.4}" rx="4.6" ry="2" fill="url(#groundShadow)"/>
          <circle cx="${fx}" cy="${fy}" r="4" fill="${c}"/>
          <circle cx="${fx}" cy="${fy}" r="1.6" fill="#fff6c0"/>`;
  }
  return s;
}

function worldSVG(d, penSheepHTML){
  let fence = "";
  for (let x = 52; x <= 294; x += 24) fence += `<rect x="${x}" y="376" width="6" height="150" rx="3" fill="url(#fenceG)"/>`;
  fence += `<rect x="46" y="384" width="256" height="7" rx="3.5" fill="url(#fenceG)"/>
            <rect x="46" y="470" width="256" height="7" rx="3.5" fill="url(#fenceG)"/>`;

  return `
  ${defs()}
  <rect x="-40" y="-40" width="${W + 80}" height="${H + 80}" fill="url(#grassMain)"/>
  <ellipse cx="120" cy="180" rx="150" ry="90" fill="#b3e896" opacity=".65"/>
  <ellipse cx="620" cy="520" rx="140" ry="110" fill="#93d876" opacity=".55"/>
  ${grassTexture(-40, -40, W + 80, H + 80, 130, 42)}

  <!-- みち -->
  <g filter="url(#softSh)">
    <rect x="326" y="150" width="68" height="760" rx="34" fill="url(#roadG)"/>
    <rect x="150" y="512" width="230" height="56" rx="28" fill="url(#roadG)"/>
    <rect x="340" y="656" width="200" height="56" rx="28" fill="url(#roadG)"/>
    <rect x="470" y="686" width="190" height="56" rx="28" fill="url(#roadG)"/>
    <rect x="230" y="700" width="140" height="54" rx="27" fill="url(#roadG)"/>
    <ellipse cx="360" cy="880" rx="120" ry="70" fill="url(#roadG)"/>
  </g>
  <rect x="330" y="154" width="10" height="752" rx="5" fill="#fff" opacity=".28"/>

  <!-- いけ -->
  <g filter="url(#softSh)">
    <ellipse cx="612" cy="212" rx="74" ry="46" fill="url(#pondG)"/>
  </g>
  <ellipse cx="612" cy="212" rx="74" ry="46" fill="none" stroke="#fff" stroke-width="4" opacity=".55"/>
  <ellipse cx="590" cy="198" rx="30" ry="10" fill="none" stroke="#fff" stroke-width="2.4" opacity=".4"/>
  <ellipse cx="632" cy="222" rx="22" ry="7" fill="none" stroke="#fff" stroke-width="2" opacity=".3"/>
  <circle cx="585" cy="192" r="3.4" fill="#fff" opacity=".7"/>
  <circle cx="640" cy="208" r="2.2" fill="#fff" opacity=".6"/>

  <!-- レースかいじょうの ゲート -->
  <g filter="url(#softSh)">
    <rect x="248" y="112" width="20" height="96" rx="8" fill="url(#fenceG)"/>
    <rect x="452" y="112" width="20" height="96" rx="8" fill="url(#fenceG)"/>
    <rect x="250" y="92" width="220" height="34" rx="10" fill="url(#wallG)"/>
  </g>
  <rect x="250" y="92" width="220" height="12" rx="6" fill="#fff" opacity=".22"/>
  <text x="360" y="116" text-anchor="middle" class="gatetxt">レースかいじょう</text>
  <g class="flagl"><polygon points="258,86 258,62 292,74" fill="#ffd45e"/></g>
  <g class="flagr"><polygon points="462,86 462,62 428,74" fill="#ffd45e"/></g>

  <!-- ひつじの さく -->
  <rect x="52" y="376" width="242" height="150" rx="10" fill="url(#penGrass)"/>
  ${grassTexture(52, 376, 242, 150, 26, 7)}
  ${flowers(70, 500, 6, "#ff8fb4")}
  <g id="penSheep">${penSheepHTML}</g>
  <g filter="url(#softSh)">${fence}</g>
  <rect x="121" y="341" width="112" height="26" rx="13" fill="rgba(0,0,0,.12)"/>
  <rect x="120" y="340" width="112" height="26" rx="13" fill="#fffef8"/>
  <text x="176" y="358" text-anchor="middle" class="signtxt">ひつじの さく</text>

  <!-- なや -->
  <g filter="url(#softSh)">
    <polygon points="462,352 558,300 654,352" fill="url(#roofG)"/>
    <rect x="472" y="348" width="172" height="118" rx="8" fill="url(#wallG)"/>
    <rect x="580" y="348" width="64" height="118" rx="8" fill="#000" opacity=".08"/>
    <rect x="530" y="398" width="56" height="68" rx="6" fill="#8b3a3a"/>
    <rect x="656" y="330" width="42" height="136" rx="8" fill="url(#siloG)"/>
    <ellipse cx="677" cy="330" rx="21" ry="14" fill="url(#roofG)"/>
  </g>
  <polygon points="462,352 558,300 654,352" fill="#fff" opacity=".16"/>
  <rect x="472" y="348" width="172" height="10" rx="5" fill="#fff" opacity=".2"/>
  <rect x="530" y="398" width="56" height="10" rx="5" fill="#000" opacity=".12"/>
  <rect x="664" y="336" width="7" height="120" rx="3.5" fill="#fff" opacity=".45"/>

  <!-- エサの じはんき -->
  <g filter="url(#softSh)">
    <rect x="470" y="628" width="66" height="62" rx="8" fill="url(#vendG)"/>
  </g>
  <rect x="470" y="628" width="66" height="62" rx="8" fill="none"/>
  <rect x="476" y="634" width="38" height="34" rx="4" fill="#dff1ff"/>
  <circle cx="484" cy="642" r="4" fill="#ffb02e"/><circle cx="497" cy="642" r="4" fill="#4ec26a"/>
  <circle cx="484" cy="656" r="4" fill="#ff6b9d"/><circle cx="497" cy="656" r="4" fill="#a97cff"/>
  <rect x="520" y="634" width="10" height="24" rx="3" fill="#1f6fb0"/>
  <rect x="476" y="674" width="52" height="10" rx="4" fill="#1f6fb0"/>
  <polygon points="474,631 500,631 480,660 474,660" fill="#fff" opacity=".2"/>
  <rect x="453" y="597" width="104" height="24" rx="12" fill="rgba(0,0,0,.12)"/>
  <rect x="452" y="596" width="104" height="24" rx="12" fill="#fffef8"/>
  <text x="504" y="613" text-anchor="middle" class="signtxt">エサ 100えん〜</text>

  <!-- ガチャ -->
  <g filter="url(#softSh)">
    <rect x="598" y="752" width="62" height="60" rx="8" fill="url(#gachaG)"/>
  </g>
  <polygon points="601,754 622,754 606,806 601,806" fill="#fff" opacity=".18"/>
  <circle cx="629" cy="772" r="19" fill="#fff" opacity=".92"/>
  <circle cx="622" cy="768" r="6" fill="#ff8fb4"/><circle cx="636" cy="774" r="6" fill="#ffd45e"/>
  <circle cx="627" cy="780" r="6" fill="#7fc7ff"/>
  <circle cx="629" cy="798" r="6" fill="#ffd45e"/>
  <circle cx="620.5" cy="766" r="1.6" fill="#fff" opacity=".8"/>
  <circle cx="625" cy="778" r="1.3" fill="#fff" opacity=".7"/>
  <rect x="585" y="723" width="90" height="24" rx="12" fill="rgba(0,0,0,.12)"/>
  <rect x="584" y="722" width="90" height="24" rx="12" fill="#fffef8"/>
  <text x="629" y="739" text-anchor="middle" class="signtxt">ガチャ 300えん</text>

  <!-- き と はな -->
  ${tree(70, 210)} ${tree(150, 140, .85)} ${tree(660, 620, .9)}
  ${tree(80, 700, .8)} ${tree(620, 130, .75)} ${tree(120, 880, .9)}
  ${tree(640, 900, .85)}
  ${flowers(430, 250, 6, "#ffd45e")}
  ${flowers(180, 620, 6, "#c3a4ff")}
  ${flowers(520, 860, 6, "#ff8fb4")}

  <!-- スタッフ -->
  <g id="npcStaff" transform="translate(246,742)"><g class="npcbob">${staffArt()}</g></g>

  <!-- しゅじんこう -->
  <g id="player"><g class="kidbody">${kidArt()}</g></g>`;
}

/* =========================================================
   がめんを つくる
   ========================================================= */
export function buildMap(){
  const d = S.data;
  // さくの なかで じぶんの ひつじが くさを たべている。
  // ★ グラデーションが きえないよう、penSheep の なかみは べつどりで あとから
  //   innerHTML に つめなおすのではなく、さいしょから 1かいの innerHTML で つくる
  //   （あとから つめなおすと ブラウザが グラデーションを みうしなう ことがある）
  const penSheepHTML =
    `<g transform="translate(200,452) scale(0.86) translate(${-FOOT_X},${-FOOT_Y})">${sheepArt(d.color)}</g>`;
  $("#mapWorld").innerHTML = worldSVG(d, penSheepHTML);
  st.x = 360; st.y = 900; st.face = 1; st.near = null;
  refreshHud();
}

export function refreshHud(){
  $("#mapMoney").textContent = S.data.money.toLocaleString();
  $("#mapDay").textContent = S.data.days;
  $("#mapCare").textContent = S.data.careLeft;
  $("#mapRace").textContent = S.data.raceLeft;
}

/* =========================================================
   うごかす
   ========================================================= */
export function startMap(){
  st.on = true;
  st.last = performance.now();
  bindStick();
  loop(st.last);
}
export function stopMap(){
  st.on = false;
  cancelAnimationFrame(st.raf); clearTimeout(st.timer);
  st.vx = st.vy = 0;
  hideStick();
}

function loop(ts){
  if (!st.on) return;
  cancelAnimationFrame(st.raf); clearTimeout(st.timer);
  const dt = Math.max(0, Math.min(0.05, (ts - st.last) / 1000));
  st.last = ts;
  step(dt);
  st.raf = requestAnimationFrame(loop);
  st.timer = setTimeout(() => loop(performance.now()), 40);
}

function blocked(x, y){
  for (const s of SOLID){
    if (x > s.x - 12 && x < s.x + s.w + 12 && y > s.y - 6 && y < s.y + s.h + 10) return true;
  }
  return false;
}

function step(dt){
  const moving = st.vx !== 0 || st.vy !== 0;
  if (moving){
    const nx = st.x + st.vx * dt, ny = st.y + st.vy * dt;
    // よこと たてを べつべつに ためして、かべに そって すべるように する
    if (!blocked(nx, st.y)) st.x = nx;
    if (!blocked(st.x, ny)) st.y = ny;
    st.x = Math.max(26, Math.min(W - 26, st.x));
    st.y = Math.max(150, Math.min(H - 24, st.y));
    if (Math.abs(st.vx) > 4) st.face = st.vx < 0 ? -1 : 1;
    st.gait += dt * 11;
  } else {
    st.gait = 0;
  }

  // えがく
  const p = $("#player");
  if (!p) return;
  p.setAttribute("transform", `translate(${st.x.toFixed(1)},${st.y.toFixed(1)}) scale(${st.face},1)`);
  const body = p.querySelector(".kidbody");
  const bob = moving ? Math.abs(Math.sin(st.gait)) * 2.4 : 0;
  body.setAttribute("transform", `translate(0 ${-bob.toFixed(2)})`);
  const swing = moving ? Math.sin(st.gait) * 15 : 0;
  const set = (cls, a, px) => {
    const el = p.querySelector(cls);
    if (el) el.setAttribute("transform", `rotate(${a.toFixed(1)} ${px} -14)`);
  };
  set(".kl1", swing, -4.7); set(".kl2", -swing, 4.7);
  const seta = (cls, a, px) => {
    const el = p.querySelector(cls);
    if (el) el.setAttribute("transform", `rotate(${a.toFixed(1)} ${px} -32)`);
  };
  seta(".ka1", -swing * 0.8, -14.2); seta(".ka2", swing * 0.8, 14.2);

  // カメラ
  const camX = Math.max(0, Math.min(W - VIEW_W, st.x - VIEW_W / 2));
  const camY = Math.max(0, Math.min(H - VIEW_H, st.y - VIEW_H / 2 - 40));
  $("#mapWorld").setAttribute("transform", `translate(${-camX.toFixed(1)},${-camY.toFixed(1)})`);

  // ちかくの ばしょを しらべる
  let found = null, best = 1e9;
  for (const sp of SPOTS){
    const dd = Math.hypot(sp.x - st.x, sp.y - st.y);
    if (dd < sp.r && dd < best){ best = dd; found = sp; }
  }
  if ((found && found.id) !== (st.near && st.near.id)){
    st.near = found;
    const btn = $("#actBtn");
    if (found){
      btn.classList.add("on");
      btn.innerHTML = `<b>${found.act}</b><small>${found.name}</small>`;
      tap();
    } else btn.classList.remove("on");
  }
}

/* ---------- ゆびで うごかす ---------- */
function bindStick(){
  const area = $("#mapArea");
  if (area.dataset.bound) return;
  area.dataset.bound = "1";

  const setVec = (e) => {
    if (!st.origin) return;
    let dx = e.clientX - st.origin.x, dy = e.clientY - st.origin.y;
    const len = Math.hypot(dx, dy);
    if (len < 6){ st.vx = st.vy = 0; moveKnob(0, 0); return; }
    const k = Math.min(1, len / STICK_MAX);
    st.vx = (dx / len) * SPEED * k;
    st.vy = (dy / len) * SPEED * k;
    const cl = Math.min(len, STICK_MAX);
    moveKnob((dx / len) * cl, (dy / len) * cl);
  };

  area.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    st.origin = { x: e.clientX, y: e.clientY };
    showStick(e.clientX, e.clientY);
    area.setPointerCapture && area.setPointerCapture(e.pointerId);
    setVec(e);
  });
  area.addEventListener("pointermove", (e) => { if (st.origin) setVec(e); });
  ["pointerup", "pointercancel", "pointerleave"].forEach(ev =>
    area.addEventListener(ev, () => { st.origin = null; st.vx = st.vy = 0; hideStick(); }));
}

function showStick(x, y){
  const s = $("#stick"), r = $("#mapArea").getBoundingClientRect();
  s.style.left = (x - r.left) + "px";
  s.style.top  = (y - r.top) + "px";
  s.classList.add("on");
  moveKnob(0, 0);
}
function hideStick(){ const s = $("#stick"); if (s) s.classList.remove("on"); }
function moveKnob(dx, dy){
  const k = $("#stickKnob");
  if (k) k.style.transform = `translate(${dx}px,${dy}px)`;
}

/* =========================================================
   ちかくの ばしょで なにか する
   ========================================================= */
export function nearSpot(){ return st.near; }

export function faceHint(){
  // ひつじの さくに いるとき、きょう たべたいものを おしえる
  const want = S.data.wantFood;
  return want;
}
