// ===== ぼくじょうを あるきまわる がめん（とりのめ）=====
// ゆびで がめんを おして うごかすと、しゅじんこうが ぼくじょうを あるく。
// 入口（ひだり した）から みぎへ すすむと おさんぽ やぎ、さらに ずーっと
// みぎ・したへ あるくと じょうばたいけん、いちばん みぎしたの すみに
// レースかいじょうが ある（あるくのが たのしくなるよう、わざと とおくに した）。
// 右上（すこし ひだりより）に ひつじと ふれあえる さく・じはんきが ある。
// 羊・じはんき・ガチャ・レースゲート・スタッフに ちかづくと、その もの じたいを
// ちょくせつ タップして はなしかけられる（したの ボタンからも できる）。
import * as S from "./save.js";
import { sheepArt, FOOT_X, FOOT_Y } from "./sheep.js";
import { $, show, tap, toast, say, yen, startFarmMusic, stopFarmMusic } from "./ui.js";

const W = 1350, H = 1150;              // ぼくじょう ぜんたいの ひろさ
const VIEW_W = 440, VIEW_H = 704;      // がめんに うつる ぶん（index.html の viewBox と そろえる）
const SPEED = 165;                     // 1びょうに あるく きょり
const STICK_MAX = 58;                  // ゆびを うごかす さいだい（ピクセル）

// いける ばしょ。hit は「がめんを タップしたとき、ここに あたったら はんのう する」
// という はんい（ワールドざひょう）。r は「ここまで ちかづいたら はなしかけられる」きょり。
// staff の x/y/hit は buildMap() の たびに ランダムに きめなおす。
export const SPOTS = [
  { id:"pen",   x:440, y:160, r:120, name:"ひつじの さく",     act:"あいさつする",
    hit:{ x:312, y:10,  w:258, h:210 } },
  { id:"race",  x:1170, y:1082, r:130, name:"レースかいじょう",   act:"はいる",
    hit:{ x:1046, y:912, w:248, h:212 } },
  { id:"shop",  x:600, y:240, r:88,  name:"エサの じはんき",   act:"かう",
    hit:{ x:543, y:158, w:114, h:108 } },
  { id:"gacha", x:230, y:970, r:82,  name:"ガチャ",            act:"まわす",
    hit:{ x:180, y:896, w:96,  h:104 } },
  { id:"goats", x:540, y:760, r:100, name:"おさんぽ やぎ",     act:"のぞいてみる",
    hit:{ x:455, y:660, w:170, h:170 } },
  { id:"horse", x:980, y:930, r:110, name:"じょうばたいけん",   act:"みてみる",
    hit:{ x:890, y:860, w:180, h:150 } },
  { id:"staff", x:0,   y:0,   r:82,  name:"スタッフの おねえさん", act:"はなす",
    hit:{ x:0, y:0, w:66, h:80 } },
];

// スタッフが けさ どこに いるかは この なかから ランダムに えらぶ
const STAFF_SPOTS = [
  { x:250, y:1000 },
  { x:420, y:920 },
  { x:600, y:820 },
  { x:760, y:500 },
  { x:480, y:300 },
];

// とおれない ばしょ
const SOLID = [
  { x:320, y:66,  w:242, h:150 },   // ひつじの さく
  { x:500, y:10,  w:180, h:155 },   // なや
  { x:567, y:196, w:66,  h:62 },    // じはんき
  { x:200, y:932, w:62,  h:60 },    // ガチャ
  { x:1060, y:1004, w:220, h:34 },  // レースゲートの よこぼう
  { x:475, y:710, w:130, h:100 },   // おさんぽ やぎ の さく
  { x:900, y:875, w:160, h:110 },   // じょうばたいけんの リング
];

const st = {
  x: 150, y: 1060, face: 1, gait: 0,
  vx: 0, vy: 0, near: null,
  raf: 0, timer: 0, last: 0, on: false,
  stick: null, origin: null,
};

/* ---------- しゅじんこうの え（あしもとが 0,0）---------- */
function kidArt(){
  return `
    <ellipse cx="0" cy="1" rx="15" ry="4.5" fill="rgba(0,0,0,.16)"/>
    <rect class="kl1" x="-8.5" y="-15" width="7.5" height="16" rx="3.5" fill="#4a6b9a"/>
    <rect class="kl2" x="1"    y="-15" width="7.5" height="16" rx="3.5" fill="#4a6b9a"/>
    <rect x="-12" y="-36" width="24" height="23" rx="8" fill="#ff8a2b"/>
    <rect class="ka1" x="-17.5" y="-34" width="6.5" height="16" rx="3.2" fill="#f6d3ae"/>
    <rect class="ka2" x="11"    y="-34" width="6.5" height="16" rx="3.2" fill="#f6d3ae"/>
    <circle cx="0" cy="-46" r="13.5" fill="#f6d3ae"/>
    <path d="M-13.5,-48 a13.5,13.5 0 0 1 27,0 q-13.5,-8 -27,0z" fill="#5a4636"/>
    <circle cx="-4.8" cy="-45" r="2.1" fill="#3a3a4a"/>
    <circle cx="4.8"  cy="-45" r="2.1" fill="#3a3a4a"/>
    <path d="M-3,-39 q3,3 6,0" stroke="#c9736b" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
}

/* ---------- スタッフの え ---------- */
function staffArt(){
  return `
    <ellipse cx="0" cy="1" rx="15" ry="4.5" fill="rgba(0,0,0,.16)"/>
    <rect x="-8.5" y="-15" width="7.5" height="16" rx="3.5" fill="#6b6f7a"/>
    <rect x="1"    y="-15" width="7.5" height="16" rx="3.5" fill="#6b6f7a"/>
    <rect x="-12" y="-36" width="24" height="23" rx="8" fill="#4ec26a"/>
    <rect x="-17.5" y="-34" width="6.5" height="16" rx="3.2" fill="#f6d3ae"/>
    <rect x="11"    y="-34" width="6.5" height="16" rx="3.2" fill="#f6d3ae"/>
    <circle cx="0" cy="-46" r="13.5" fill="#f6d3ae"/>
    <path d="M-14,-49 a14,14 0 0 1 28,0 q-14,-9 -28,0z" fill="#3f2f22"/>
    <rect x="-16" y="-52" width="32" height="5" rx="2.5" fill="#e0625e"/>
    <path d="M-16,-52 a16,10 0 0 1 32,0z" fill="#e0625e"/>
    <circle cx="-4.8" cy="-45" r="2.1" fill="#3a3a4a"/>
    <circle cx="4.8"  cy="-45" r="2.1" fill="#3a3a4a"/>
    <path d="M-3.5,-39 q3.5,3.5 7,0" stroke="#c9736b" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
}

/* ---------- やぎ・うま の え（かんたん・かるい）---------- */
export function goatArt(x, y, flip = 1){
  return `<g transform="translate(${x},${y}) scale(${flip},1)">
    <ellipse cx="0" cy="18" rx="13" ry="3.5" fill="rgba(0,0,0,.15)"/>
    <rect x="-7" y="2" width="5" height="14" rx="2" fill="#5a5a6e"/>
    <rect x="3"  y="2" width="5" height="14" rx="2" fill="#5a5a6e"/>
    <ellipse cx="0" cy="-4" rx="15" ry="11" fill="#f5f1e6"/>
    <ellipse cx="12" cy="-10" rx="8" ry="7" fill="#f5f1e6"/>
    <path d="M8,-20 q4,-6 8,-2" stroke="#c9c1b0" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M14,-19 q4,-6 8,-2" stroke="#c9c1b0" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="17" cy="-11" r="1.6" fill="#2b2b3a"/>
  </g>`;
}
export function horseArt(x, y){
  return `<g transform="translate(${x},${y})">
    <ellipse cx="0" cy="22" rx="20" ry="4.5" fill="rgba(0,0,0,.15)"/>
    <rect x="-13" y="2" width="6" height="20" rx="2.5" fill="#8a5f38"/>
    <rect x="-4"  y="2" width="6" height="20" rx="2.5" fill="#8a5f38"/>
    <rect x="6"   y="2" width="6" height="20" rx="2.5" fill="#6b4526"/>
    <rect x="14"  y="2" width="6" height="20" rx="2.5" fill="#6b4526"/>
    <ellipse cx="0" cy="-6" rx="22" ry="13" fill="#a5764a"/>
    <ellipse cx="20" cy="-16" rx="10" ry="8" fill="#a5764a"/>
    <path d="M-4,-24 q10,-8 8,4" fill="#5a3d22"/>
    <circle cx="25" cy="-17" r="1.8" fill="#2b2b3a"/>
  </g>`;
}

/* ---------- ぼくじょうの え ---------- */
function tree(x, y, s = 1){
  return `<g transform="translate(${x},${y}) scale(${s})">
    <ellipse cx="0" cy="2" rx="17" ry="5" fill="rgba(0,0,0,.13)"/>
    <rect x="-4" y="-26" width="8" height="28" rx="3" fill="#a5764a"/>
    <circle cx="0" cy="-40" r="24" fill="#5fb455"/>
    <circle cx="-13" cy="-31" r="16" fill="#6ec263"/>
    <circle cx="13" cy="-32" r="15" fill="#6ec263"/></g>`;
}
function flowers(x, y, n, c){
  let s = "";
  for (let i = 0; i < n; i++){
    const fx = x + (i % 3) * 15 + (i % 2) * 6, fy = y + Math.floor(i / 3) * 13;
    s += `<circle cx="${fx}" cy="${fy}" r="4" fill="${c}"/>
          <circle cx="${fx}" cy="${fy}" r="1.6" fill="#fff6c0"/>`;
  }
  return s;
}

// ひくい さく（コラル）。ろうやみたいに ならないよう、ふちを ぐるっと
// かこむ ひくい てすりに して、なかの どうぶつが よく見えるようにする
function corralFence(x, y, w, h){
  const postH = 15, spacing = 30;
  let posts = "";
  const post = (px, py) =>
    `<rect x="${(px - 2.5).toFixed(1)}" y="${(py - postH).toFixed(1)}" width="5" height="${postH}" rx="2" fill="#f3ead6"/>`;
  for (let px = x; px <= x + w + 0.1; px += spacing) posts += post(px, y) + post(px, y + h);
  for (let py = y + spacing; py < y + h; py += spacing) posts += post(x, py) + post(x + w, py);
  const rails = `
    <rect x="${x - 3}" y="${y - 5}" width="${w + 6}" height="4" rx="2" fill="#fffaf0"/>
    <rect x="${x - 3}" y="${y + h + 1}" width="${w + 6}" height="4" rx="2" fill="#fffaf0"/>
    <rect x="${x - 5}" y="${y - 3}" width="4" height="${h + 6}" rx="2" fill="#fffaf0"/>
    <rect x="${x + w + 1}" y="${y - 3}" width="4" height="${h + 6}" rx="2" fill="#fffaf0"/>`;
  return posts + rails;
}

// レースかいじょうの ゲート（おくに トラックが 見える）。もとの ずが
// cx=360,crossbar-y=92 を きじゅんに かいてあるので、あとから
// <g transform="translate(...)"> で すきな ばしょへ うつす。
function raceGateArt(){
  return `
    <ellipse cx="360" cy="40" rx="150" ry="36" fill="#8fce78"/>
    <ellipse cx="360" cy="40" rx="140" ry="29" fill="#d9b381"/>
    <ellipse cx="360" cy="40" rx="137" ry="26" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="6 6" opacity=".5"/>
    <ellipse cx="360" cy="40" rx="66" ry="12" fill="#7bd06a"/>
    <rect x="234" y="20" width="8" height="10" rx="2" fill="#ff8fb4"/>
    <rect x="478" y="20" width="8" height="10" rx="2" fill="#7fc7ff"/>
    <rect x="250" y="92" width="220" height="34" rx="10" fill="#e0625e"/>
    <text x="360" y="116" text-anchor="middle" class="gatetxt">レースかいじょう</text>
    <rect x="248" y="112" width="20" height="96" rx="8" fill="#c9c1b0"/>
    <rect x="452" y="112" width="20" height="96" rx="8" fill="#c9c1b0"/>
    <g class="flagl"><polygon points="258,86 258,62 292,74" fill="#ffd45e"/></g>
    <g class="flagr"><polygon points="462,86 462,62 428,74" fill="#ffd45e"/></g>`;
}

// エサの じはんき。もとの ずは x=470,y=628 あたりを きじゅんに かいてある。
function vendingArt(){
  return `
    <rect x="470" y="628" width="66" height="62" rx="8" fill="#3fa3f5"/>
    <rect x="476" y="634" width="38" height="34" rx="4" fill="#dff1ff"/>
    <circle cx="484" cy="642" r="4" fill="#ffb02e"/><circle cx="497" cy="642" r="4" fill="#4ec26a"/>
    <circle cx="484" cy="656" r="4" fill="#ff6b9d"/><circle cx="497" cy="656" r="4" fill="#a97cff"/>
    <rect x="520" y="634" width="10" height="24" rx="3" fill="#1f6fb0"/>
    <rect x="476" y="674" width="52" height="10" rx="4" fill="#1f6fb0"/>
    <rect x="452" y="596" width="104" height="24" rx="12" fill="#fff" opacity=".9"/>
    <text x="504" y="613" text-anchor="middle" class="signtxt">エサ 100えん〜</text>`;
}

// ガチャ。もとの ずは x=598,y=752 あたりを きじゅんに かいてある。
function gachaArt(){
  return `
    <rect x="598" y="752" width="62" height="60" rx="8" fill="#a97cff"/>
    <circle cx="629" cy="772" r="19" fill="#fff" opacity=".92"/>
    <circle cx="622" cy="768" r="6" fill="#ff8fb4"/><circle cx="636" cy="774" r="6" fill="#ffd45e"/>
    <circle cx="627" cy="780" r="6" fill="#7fc7ff"/>
    <circle cx="629" cy="798" r="6" fill="#ffd45e"/>
    <rect x="584" y="722" width="90" height="24" rx="12" fill="#fff" opacity=".9"/>
    <text x="629" y="739" text-anchor="middle" class="signtxt">ガチャ 300えん</text>`;
}

function worldSVG(d, penSheepHTML, staffPos){
  // ---- しんにゅうこう ちかくの ちいさな カフェふうの やたい ----
  const stall = `
    <polygon points="60,940 100,915 140,940" fill="#f7f7f7"/>
    <rect x="68" y="938" width="64" height="34" rx="4" fill="#f2b4c2"/>
    <rect x="80" y="950" width="40" height="14" rx="3" fill="#fff"/>`;

  return `
  <rect x="-40" y="-40" width="${W + 80}" height="${H + 80}" fill="#9ddc84"/>
  <ellipse cx="150" cy="200" rx="150" ry="90" fill="#a8e392"/>
  <ellipse cx="780" cy="620" rx="160" ry="120" fill="#a8e392"/>

  <!-- みち：入口（ひだりした）から おさんぽやぎ・さく へ／
       ずっと みぎしたへ すすむと じょうばたいけん・レースかいじょう へ -->
  <g fill="#e3c9a0">
    <rect x="80"  y="980"  width="160"  height="140" rx="40"/>
    <rect x="170" y="860"  width="70"   height="200" rx="35"/>
    <rect x="170" y="860"  width="260"  height="70"  rx="35"/>
    <rect x="390" y="740"  width="70"   height="200" rx="35"/>
    <rect x="390" y="740"  width="220"  height="70"  rx="35"/>
    <rect x="560" y="470"  width="70"   height="340" rx="35"/>
    <rect x="560" y="470"  width="220"  height="70"  rx="35"/>
    <rect x="700" y="150"  width="70"   height="400" rx="35"/>
    <rect x="560" y="150"  width="210"  height="70"  rx="35"/>
    <!-- ずーっと みぎへ：じょうば・レースかいじょうへ つづく ながい みち -->
    <rect x="170" y="1010" width="1150" height="80"  rx="38"/>
    <rect x="945" y="965"  width="70"   height="70"  rx="30"/>
  </g>

  <!-- いけ（かざり）-->
  <ellipse cx="180" cy="430" rx="70" ry="44" fill="#8fd3ff"/>
  <ellipse cx="180" cy="430" rx="70" ry="44" fill="none" stroke="#fff" stroke-width="4" opacity=".6"/>

  <!-- レースかいじょうの ゲート（おくに トラック）。いちばん みぎしたの すみ -->
  <g transform="translate(810,912)">${raceGateArt()}</g>

  <!-- おさんぽ やぎ（いまは じゅんびちゅう）-->
  <rect x="475" y="710" width="130" height="100" rx="10" fill="#c3ecab"/>
  ${corralFence(475, 710, 130, 100)}
  ${goatArt(520, 765)}
  ${goatArt(565, 778, -1)}
  <rect x="483" y="668" width="120" height="26" rx="13" fill="#fff" opacity=".9"/>
  <text x="543" y="686" text-anchor="middle" class="signtxt">おさんぽ やぎ</text>

  <!-- じょうばたいけん（いまは じゅんびちゅう）。入口から とおく はなす -->
  <ellipse cx="980" cy="930" rx="85" ry="58" fill="#e3c9a0"/>
  <ellipse cx="980" cy="930" rx="85" ry="58" fill="none" stroke="#f3ead6" stroke-width="6"/>
  <ellipse cx="980" cy="930" rx="85" ry="58" fill="none" stroke="#fffaf0" stroke-width="2" stroke-dasharray="8 6"/>
  ${horseArt(980, 930)}
  <rect x="910" y="852" width="140" height="26" rx="13" fill="#fff" opacity=".9"/>
  <text x="980" y="870" text-anchor="middle" class="signtxt">じょうばたいけん</text>

  <!-- ひつじの さく～なや～じはんき（ひとまとめに ひだりへ ずらす） -->
  <g transform="translate(-200,0)">
    <!-- ひつじの さく（ひくい コラルで まわりを かこむ）-->
    <rect x="520" y="66" width="242" height="150" rx="10" fill="#b6e8a0"/>
    ${flowers(538, 190, 6, "#ff8fb4")}
    <g id="penSheep">${penSheepHTML}</g>
    ${corralFence(520, 66, 242, 150)}
    <rect x="588" y="26" width="112" height="26" rx="13" fill="#fff" opacity=".9"/>
    <text x="644" y="44" text-anchor="middle" class="signtxt">ひつじの さく</text>

    <!-- なや（かざり）-->
    <polygon points="712,60 795,14 878,60" fill="#f7f7f7"/>
    <rect x="722" y="56" width="152" height="104" rx="8" fill="#e0625e"/>
    <rect x="774" y="100" width="48" height="60" rx="6" fill="#8b3a3a"/>

    <!-- エサの じはんき -->
    <g transform="translate(297,-432)">${vendingArt()}</g>
  </g>

  <!-- しんにゅうこう の やたい と ガチャ -->
  ${stall}
  <g transform="translate(-398,180)">${gachaArt()}</g>
  <rect x="60" y="1000" width="120" height="26" rx="13" fill="#fff" opacity=".9"/>
  <text x="120" y="1018" text-anchor="middle" class="signtxt">まきば ぐち</text>

  <!-- き と はな -->
  ${tree(70, 120)} ${tree(260, 60, .85)} ${tree(830, 700, .9)}
  ${tree(60, 700, .8)} ${tree(870, 300, .75)} ${tree(760, 980, .9)}
  ${tree(220, 1080, .8)} ${tree(470, 620, .8)} ${tree(200, 620, .7)}
  ${flowers(700, 250, 6, "#ffd45e")}
  ${flowers(60, 850, 6, "#c3a4ff")}
  ${flowers(650, 970, 6, "#ff8fb4")}
  ${flowers(40, 1080, 6, "#ffd45e")}

  <!-- スタッフ（ひは ランダムな ばしょに いる）-->
  <g id="npcStaff" transform="translate(${staffPos.x},${staffPos.y})"><g class="npcbob">${staffArt()}</g></g>

  <!-- しゅじんこう -->
  <g id="player"><g class="kidbody">${kidArt()}</g></g>`;
}

/* =========================================================
   がめんを つくる
   ========================================================= */
export function buildMap(){
  const d = S.data;
  // スタッフの きょうの いばしょを ランダムに きめる
  const staffPos = STAFF_SPOTS[Math.floor(Math.random() * STAFF_SPOTS.length)];
  const staffSpot = SPOTS.find(s => s.id === "staff");
  staffSpot.x = staffPos.x; staffSpot.y = staffPos.y;
  staffSpot.hit = { x: staffPos.x - 40, y: staffPos.y - 70, w: 80, h: 92 };

  // さくの なかで じぶんの ひつじが くさを たべている。
  // ★ グラデーションが きえないよう、penSheep の なかみは べつどりで あとから
  //   innerHTML に つめなおすのではなく、さいしょから 1かいの innerHTML で つくる
  //   （あとから つめなおすと ブラウザが グラデーションを みうしなう ことがある）
  const penSheepHTML =
    `<g transform="translate(668,142) scale(0.86) translate(${-FOOT_X},${-FOOT_Y})">${sheepArt(d.color)}</g>`;
  $("#mapWorld").innerHTML = worldSVG(d, penSheepHTML, staffPos);
  st.x = 150; st.y = 1060; st.face = 1; st.near = null;
  refreshHud();
}

export function refreshHud(){
  $("#mapMoney").textContent = S.data.money.toLocaleString();
  $("#mapDay").textContent = S.data.days;
  $("#mapCare").textContent = S.data.careLeft;
}

/* =========================================================
   うごかす
   ========================================================= */
export function startMap(){
  st.on = true;
  st.last = performance.now();
  bindStick();
  loop(st.last);
  startFarmMusic();
}
export function stopMap(){
  st.on = false;
  cancelAnimationFrame(st.raf); clearTimeout(st.timer);
  st.vx = st.vy = 0;
  hideStick();
  stopFarmMusic();
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
    st.y = Math.max(20, Math.min(H - 24, st.y));
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

/* ---------- ゆびで うごかす／タップで はなしかける ---------- */
// がめんの ざひょうを ワールドの ざひょうに なおす（カメラの ずれも けいさんに いれる）
function screenToWorld(clientX, clientY){
  const svg = document.querySelector(".mapsvg");
  const world = $("#mapWorld");
  if (!svg || !world) return null;
  const ctm = world.getScreenCTM();
  if (!ctm) return null;
  const pt = svg.createSVGPoint();
  pt.x = clientX; pt.y = clientY;
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

// ふたつの ばしょの あたり判定が かさなっているとき（スタッフが たまたま
// ほかの たてものの すぐそばに あらわれた ときなど）、いま いちばん ちかい
// （＝したの ボタンに でている）ばしょを ゆうせんして えらぶ。
// そうしないと、はいけいの ひろい あたり判定に かくれて タップが きかない ことがある。
function hitTest(wx, wy){
  let fallback = null;
  for (const sp of SPOTS){
    const h = sp.hit;
    if (h && wx >= h.x && wx <= h.x + h.w && wy >= h.y && wy <= h.y + h.h){
      if (st.near && sp.id === st.near.id) return sp;
      if (!fallback) fallback = sp;
    }
  }
  return fallback;
}

function bindStick(){
  const area = $("#mapArea");
  if (area.dataset.bound) return;
  area.dataset.bound = "1";

  let down = null;   // { x, y, t, moved } ゆびを おいた ときの じょうほう

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
    down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 };
    st.origin = { x: e.clientX, y: e.clientY };
    showStick(e.clientX, e.clientY);
    area.setPointerCapture && area.setPointerCapture(e.pointerId);
    setVec(e);
  });
  area.addEventListener("pointermove", (e) => {
    if (down) down.moved = Math.max(down.moved, Math.hypot(e.clientX - down.x, e.clientY - down.y));
    if (st.origin) setVec(e);
  });
  area.addEventListener("pointerup", (e) => {
    // ほとんど うごかさずに はなしたら、ドラッグでは なく「タップ」とみなす
    const wasTap = down && down.moved < 14 && performance.now() - down.t < 400;
    st.origin = null; st.vx = st.vy = 0; hideStick();
    if (wasTap) handleTap(e.clientX, e.clientY);
    down = null;
  });
  ["pointercancel", "pointerleave"].forEach(ev =>
    area.addEventListener(ev, () => { st.origin = null; st.vx = st.vy = 0; hideStick(); down = null; }));
}

function handleTap(clientX, clientY){
  const w = screenToWorld(clientX, clientY);
  if (!w) return;
  const sp = hitTest(w.x, w.y);
  if (!sp) return;
  if (st.near && st.near.id === sp.id){
    // したの ボタンと おなじ どうさを おこす
    $("#actBtn").click();
  } else {
    tap();
    toast(`${sp.name}に もっと ちかづいてね`);
  }
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
