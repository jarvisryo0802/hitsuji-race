// ===== レース（コーナーのある しゅうかいコース／見守るのが メイン）=====
import {
  LAPS, RACE_SECONDS, RACE_PRICE, PRIZE, RIVALS, RUNNERS, SKILLS, CALLOUTS,
  findSkill, findItem,
} from "./data.js";
import * as S from "./save.js";
import { sheepArt, FOOT_X, FOOT_Y, LEG_X, LEG_PHASE } from "./sheep.js";
import { $, show, sound, tap, good, bad, fanfare, confetti, toast, yen,
         startMusic, stopMusic, setTempo, cheer } from "./ui.js";

/* ---------- コースの かたち ---------- */
// 1がめんには おさまらない、よこに ながーい だえん（はじから はじまで
// がめん 3つぶんくらい）。じぶんの ひつじを おいかけて カメラが よこに
// スクロールする。ひつじは よこむきの えなので、よこに はしるほうが
// はしって いるように 見える。カーブは ひだり(25%)と みぎ(75%)の はし。
const CX = 520, CY = 200;          // コースの まんなか（ワールドざひょう）
const LANE = [                     // そとがわ から うちがわ へ 4レーン（ゆったり）
  { rx:460, ry:112 }, { rx:444, ry:100 }, { rx:428, ry:88 }, { rx:412, ry:76 },
];
const Y_TOP = CY - LANE[0].ry, Y_BOT = CY + LANE[0].ry;
const TRACK_TAN   = { rx: LANE[0].rx + 16, ry: LANE[0].ry + 14 };
const TRACK_GREEN = { rx: TRACK_TAN.rx + 8, ry: TRACK_TAN.ry + 8 };
const INFIELD     = { rx: LANE[3].rx - 16, ry: LANE[3].ry - 24 };
const GOAL_Y = CY + LANE[0].ry * 0.6;
const VIEW_W = 340;                       // #trackSvg の viewBox はば と そろえる
const TRACK_W = 1040;                     // コース ぜんたいの はば（カメラが うごく はんい）
const SVGNS = "http://www.w3.org/2000/svg";

// したの まんなかから スタートして、ひだり → うえ → みぎ と まわる
function ellipsePath(rx, ry, steps = 200){
  let d = "";
  for (let i = 0; i <= steps; i++){
    const th = Math.PI / 2 + (i / steps) * Math.PI * 2;
    d += (i ? "L" : "M") + (CX + rx * Math.cos(th)).toFixed(2) + "," + (CY + ry * Math.sin(th)).toFixed(2);
  }
  return d;
}

// コーナー（カーブの きつい ところ）は 1しゅうの 25% と 75% のあたり
const inCorner = (p) => Math.min(Math.abs(p - 0.25), Math.abs(p - 0.75)) < 0.13;

/* ---------- じょうたい ---------- */
const st = {
  racers: [], t: 0, last: 0, raf: 0, timer: 0,
  running: false, finished: 0, unit: 0,
  used: false, nextCall: 0, lapShown: 1, leader: null,
};

/* =========================================================
   レースの じゅんび
   ========================================================= */
export function renderReady(){
  const d = S.data;
  const sk = findSkill(d.equipSkill) || SKILLS[0];
  const it = d.equipItem ? findItem(d.equipItem) : null;

  $("#readySheep").innerHTML = `<svg viewBox="0 0 100 76" class="rs">${sheepArt(d.color, { run:true })}</svg>`;
  $("#readyName").textContent = d.name;
  $("#readySpeed").textContent = d.speed;
  $("#readyStam").textContent  = d.stamina;
  $("#readyLove").textContent  = d.love;
  $("#readySkill").innerHTML = `<b>${sk.icon} ${sk.name}</b><small>${sk.desc}<br>${sk.tip}</small>`;
  $("#readyItem").innerHTML = it
    ? `<b>${it.icon} ${it.name}</b><small>${it.desc}</small>`
    : `<b>どうぐ なし</b><small>もちものから えらべるよ</small>`;
  $("#readyLaps").textContent = LAPS;
  $("#readyPrice").textContent = RACE_PRICE;
  $("#readyGo").disabled = d.money < RACE_PRICE;
}

/* =========================================================
   レースの かいし
   ========================================================= */
export function startRace(){
  const d = S.data;
  if (!S.pay(RACE_PRICE)){
    bad();
    toast("おかねが たりないよ");
    return;
  }
  const mine = {
    name: d.name, color: d.color, isPlayer: true,
    sp: d.speed, sta: d.stamina, love: d.love,
    skill: findSkill(d.equipSkill) || SKILLS[0],
    item: d.equipItem ? findItem(d.equipItem) : null,
  };

  // ライバルは じぶんの つよさに あわせて でてくる（いつでも いいしょうぶに なるように）
  const avg = (d.speed + d.stamina + d.love) / 3;
  const pool = [...RIVALS].sort(() => Math.random() - 0.5).slice(0, RUNNERS - 1);
  const rivals = pool.map(r => {
    const j = () => Math.max(5, Math.min(99, Math.round(avg + (Math.random() * 13 - 6))));
    return {
      name: r.name, color: r.color, isPlayer: false,
      sp: j(), sta: j(), love: j(),
      skill: SKILLS[Math.floor(Math.random() * SKILLS.length)],
      item: null,
    };
  });

  const all = [mine, ...rivals].sort(() => Math.random() - 0.5);
  st.racers = all.map((r, i) => ({
    ...r,
    lane: i, p: 0, v: 0,
    boostM: 1, boostT: 0, slowM: 1, slowT: 0,
    guard: r.item && r.item.id === "omamori",
    noTire: r.item && r.item.id === "drink",
    ribbon: r.item && r.item.id === "ribbon" ? 2 : 0,
    shoesT: r.item && r.item.id === "shoes" ? 6 : 0,
    cpuFire: r.isPlayer ? -1 : 6 + Math.random() * 20,
    phase: Math.random() * 6.3, freq: 0.5 + Math.random() * 0.7,
    finished: false, time: 0, rank: 0,
  }));

  // ぜんいんの ちからの へいきんから、レースが だいたい きまった びょうすうに なるよう ちょうせい
  const avgPow = st.racers.reduce((a, r) => a + power(r), 0) / st.racers.length;
  st.unit = LAPS / (RACE_SECONDS * avgPow);

  st.t = 0; st.finished = 0; st.used = false; st.nextCall = 3;
  st.lapShown = 1; st.running = false; st.leader = null;
  st.myRank = 0; st.spurt = false; st.goalShown = false;
  $("#race").classList.remove("spurt");

  buildTrack();
  buildSkillButton();
  show("race");
  update(0);
  countdown(() => {
    st.running = true;
    st.last = performance.now();
    schedule();
    startMusic();
    cheer(1.2, 1.8);
    callout(pick(CALLOUTS.start), true);
  });
}

const power = (r) => 1 + (r.sp - 10) * 0.010;
const pick  = (a) => a[Math.floor(Math.random() * a.length)];

/* =========================================================
   コースを えがく
   ========================================================= */
// ぼくじょうの けしき（コースの うしろがわ）。ながい コース ぜんたいに
// とどくよう、はじから はじまで しきつめる。き・なや・いけは いくつか
// ばしょを かえて くりかえし、みちのりに へんかを つける。
const WORLD_L = -60, WORLD_R = TRACK_W + 60;

function scenery(){
  let fence = "";
  for (let x = WORLD_L; x < WORLD_R; x += 21){
    fence += `<rect x="${x}" y="124" width="4.5" height="19" rx="2" fill="#f3ead6"/>`;
  }
  const trees = [170, 430, 650, 900].map((x, i) =>
    `<rect x="${x}" y="106" width="${i % 2 ? 5 : 6}" height="${i % 2 ? 16 : 22}" fill="#a5764a"/>
     <circle cx="${x + (i % 2 ? 2.5 : 3)}" cy="${i % 2 ? 107 : 100}" r="${i % 2 ? 13 : 18}" fill="${i % 2 ? "#72c464" : "#63b85a"}"/>`
  ).join("");
  return `
    <rect x="${WORLD_L}" y="126" width="${WORLD_R - WORLD_L}" height="420" fill="#a9e394"/>
    <ellipse cx="40"  cy="162" rx="130" ry="48" fill="#8ad57a"/>
    <ellipse cx="360" cy="157" rx="150" ry="42" fill="#7ecb6d"/>
    <ellipse cx="760" cy="160" rx="160" ry="46" fill="#8ad57a"/>
    <!-- なや（スタートの ちかく）-->
    <polygon points="24,100 58,76 92,100" fill="#f7f7f7"/>
    <rect x="31" y="98" width="54" height="30" fill="#e0625e"/>
    <rect x="50" y="112" width="16" height="16" fill="#8b3a3a"/>
    <rect x="94" y="92" width="16" height="36" rx="3" fill="#ece4d4"/>
    <ellipse cx="102" cy="92" rx="8" ry="5.5" fill="#cfc5b2"/>
    <!-- いけ（みちのりの めじるし）-->
    <ellipse cx="560" cy="112" rx="46" ry="16" fill="#8fd3ff"/>
    <ellipse cx="560" cy="112" rx="46" ry="16" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/>
    <!-- き -->
    ${trees}
    <!-- おうえんの ひとたち -->
    ${crowd()}
    <!-- さく -->
    ${fence}
    <rect x="${WORLD_L}" y="128" width="${WORLD_R - WORLD_L}" height="4" rx="2" fill="#fffaf0"/>
    <rect x="${WORLD_L}" y="137" width="${WORLD_R - WORLD_L}" height="4" rx="2" fill="#fffaf0"/>`;
}

// さくの むこうで おうえんする ひとたち（コースぜんたいに ちらばっている）
function crowd(){
  const cols = ["#ff8fb4", "#7fc7ff", "#ffd45e", "#a9e0a0", "#c3a4ff", "#ffa87a", "#8fd3ff"];
  let s = "";
  let i = 0;
  for (let x = WORLD_L + 20; x < WORLD_R - 20; x += 23){
    const xx = x + (i % 3) * 3;
    if (xx > 14 && xx < 118){ i++; continue; }     // なやの ところは あける
    const c = cols[i % cols.length];
    s += `<g class="fan" style="animation-delay:${((i % 12) * 0.11).toFixed(2)}s">
      <rect x="${(xx - 4.5).toFixed(1)}" y="119" width="9" height="14" rx="4" fill="${c}"/>
      <circle cx="${xx.toFixed(1)}" cy="115" r="4.5" fill="#f6d3ae"/>
    </g>`;
    i++;
  }
  return `<g class="crowd">${s}</g>`;
}

function buildTrack(){
  const lanes = LANE.map(l => `<path class="lanepath" d="${ellipsePath(l.rx, l.ry)}"/>`).join("");
  $("#trackSvg").innerHTML = `
    <defs>
      <pattern id="goalpat" width="7" height="7" patternUnits="userSpaceOnUse">
        <rect width="7" height="7" fill="#fff"/>
        <rect width="3.5" height="3.5" fill="#333"/>
        <rect x="3.5" y="3.5" width="3.5" height="3.5" fill="#333"/>
      </pattern>
    </defs>
    <g id="trackWorld">
      ${scenery()}
      <ellipse cx="${CX}" cy="${CY}" rx="${TRACK_GREEN.rx}" ry="${TRACK_GREEN.ry}" fill="#8fce78"/>
      <ellipse cx="${CX}" cy="${CY}" rx="${TRACK_TAN.rx}" ry="${TRACK_TAN.ry}" fill="#d9b381"/>
      <ellipse cx="${CX}" cy="${CY}" rx="${TRACK_TAN.rx - 3}" ry="${TRACK_TAN.ry - 3}" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="9 9" opacity=".65"/>
      <ellipse cx="${CX}" cy="${CY}" rx="${INFIELD.rx}" ry="${INFIELD.ry}" fill="#7bd06a"/>
      <ellipse cx="${CX}" cy="${CY}" rx="${INFIELD.rx}" ry="${INFIELD.ry}" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="8 8" opacity=".65"/>
      <rect x="${CX - 5}" y="${GOAL_Y}" width="10" height="44" fill="url(#goalpat)"/>
      <g id="laneHolder" opacity="0">${lanes}</g>
      <g id="dustHolder"></g>
      <g id="runnerHolder"></g>
    </g>`;

  const paths = [...$("#laneHolder").querySelectorAll(".lanepath")];
  const holder = $("#runnerHolder");
  st.dust = $("#dustHolder");
  st.holder = holder;
  st.world = $("#trackWorld");
  st.camX = -1;
  st.order = "";
  st.racers.forEach((r, i) => {
    r.path = paths[i];
    r.len  = r.path.getTotalLength();
    r.gait = Math.random() * 6.3;
    const g = document.createElementNS(SVGNS, "g");
    g.setAttribute("class", "runner" + (r.isPlayer ? " me" : ""));
    // あしは CSS ではなく JS で うごかす（えがきなおしで アニメが とまるため）
    g.innerHTML = `
      <g class="speedlines">
        <rect x="-20" y="26" width="17" height="3" rx="1.5"/>
        <rect x="-27" y="37" width="23" height="3" rx="1.5"/>
        <rect x="-18" y="48" width="15" height="3" rx="1.5"/>
      </g>
      <g class="body">${sheepArt(r.color)}</g>
      <g class="tagwrap">
        <circle class="badge" cx="6" cy="-4" r="11" fill="#fff" stroke="${r.color}" stroke-width="3.5"/>
        <text class="badgetxt" x="6" y="1" text-anchor="middle">-</text>
        ${r.isPlayer ? `<polygon class="arrow" points="-6,-26 18,-26 6,-14" fill="#ff4f88"/>` : ""}
      </g>`;
    holder.appendChild(g);
    r.g = g;
    r.body = g.querySelector(".body");
    r.tag  = g.querySelector(".tagwrap");
    r.badgeTxt = g.querySelector(".badgetxt");
    r.legs = [...g.querySelectorAll(".lg1,.lg2,.lg3,.lg4")];
    r.puffT = 0;
  });
}

// はしった あとの すなぼこり
function puff(x, y, s){
  const c = document.createElementNS(SVGNS, "circle");
  c.setAttribute("class", "puff");
  c.setAttribute("cx", x.toFixed(1));
  c.setAttribute("cy", y.toFixed(1));
  c.setAttribute("r", (3 + s * 4).toFixed(1));
  st.dust.appendChild(c);
  setTimeout(() => c.remove(), 520);
}

/* =========================================================
   わざボタン
   ========================================================= */
function buildSkillButton(){
  const me = st.racers.find(r => r.isPlayer);
  const b = $("#skillBtn");
  b.disabled = false;
  b.classList.remove("used", "ready");
  b.innerHTML = `<span class="ski">${me.skill.icon}</span>
    <span class="skname">${me.skill.name}</span>
    <span class="sktip">${me.skill.tip}</span>`;
  b.onclick = () => fireSkill(me);
}

function fireSkill(me){
  if (st.used || !st.running || me.finished) return;
  st.used = true;
  const b = $("#skillBtn");
  b.disabled = true;
  b.classList.add("used");
  b.classList.remove("ready");

  const sk = me.skill;
  const frac = me.p / LAPS;
  const lapP = me.p % 1;
  let pow = sk.power, nice = false;

  if (sk.best === "corner"){
    if (inCorner(lapP)) { pow += 0.10; nice = true; } else pow -= 0.06;
  } else if (sk.best === "last"){
    pow += frac * 0.14;
    nice = frac > 0.65;
  } else if (sk.best === "front"){
    const ahead = st.racers.filter(r => !r.finished && r.p > me.p)
                           .sort((a, b2) => a.p - b2.p)[0];
    if (ahead){
      nice = true;
      if (!ahead.guard){ ahead.slowM = 0.86; ahead.slowT = sk.dur; }
      else toast(`${ahead.name}は おまもりで ふせいだ！`);
    } else pow -= 0.04;
  } else if (sk.love){
    pow = 1.10 + me.love * 0.004;
    nice = me.love >= 40;
  }
  if (sk.guard) me.guard = true;

  me.boostM = pow; me.boostT = sk.dur;
  b.querySelector(".sktip").textContent = nice ? "ばっちり！" : "はつどう！";
  nice ? good() : sound(880, 0.14, "triangle", 0.16);
  callout(`${me.name}が ${sk.name}！${nice ? " ばっちりだ！" : ""}`, true);
  flash(me);
}

function flash(r){
  r.g.classList.add("boosting");
  setTimeout(() => r.g.classList.remove("boosting"), 900);
}

/* =========================================================
   カウントダウン
   ========================================================= */
function countdown(done){
  const box = $("#raceCount"), txt = $("#raceCountTxt");
  let n = 3;
  box.classList.add("on");
  const step = () => {
    if (n > 0){
      txt.textContent = n;
      txt.style.animation = "none"; void txt.offsetWidth; txt.style.animation = "";
      sound(520, 0.14, "triangle", 0.18);
      n--; setTimeout(step, 800);
    } else {
      txt.textContent = "スタート！";
      txt.classList.add("go");
      sound(900, 0.3, "triangle", 0.22);
      setTimeout(() => { box.classList.remove("on"); txt.classList.remove("go"); done(); }, 600);
    }
  };
  step();
}

/* =========================================================
   メインループ
   ========================================================= */
// ふつうは requestAnimationFrame で うごかす。それが とまる かんきょうでも
// レースが スローモーションに ならないよう、40ms の タイマーでも ほけんを かける
// （dt の じょうげんが 50ms なので、40ms なら じっさいの はやさの まま すすむ）
function schedule(){
  cancelAnimationFrame(st.raf); clearTimeout(st.timer);
  st.raf = requestAnimationFrame(loop);
  st.timer = setTimeout(() => loop(performance.now()), 40);
}

function loop(ts){
  cancelAnimationFrame(st.raf); clearTimeout(st.timer);
  let dt = (ts - st.last) / 1000;
  st.last = ts;
  dt = Math.max(0, Math.min(0.05, dt));
  st.t += dt;
  update(dt);
  if (st.finished < st.racers.length) schedule();
  else { st.running = false; setTimeout(showResult, 900); }
}

function update(dt){
  const leadP = Math.max(...st.racers.map(r => r.p));

  for (const r of st.racers){
    if (!r.finished && dt > 0){
      const frac = r.p / LAPS;
      const lapP = r.p % 1;

      let v = st.unit * power(r);

      // コーナーは すこし おそくなる
      if (inCorner(lapP) && !(r.boostT > 0 && r.skill.best === "corner")) v *= 0.94;

      // おわりの ほうで ばてる（スタミナが たかいほど ばてない）
      if (!r.noTire && frac > 0.6){
        const F = Math.max(0.05, 0.28 - r.sta * 0.003);
        v *= 1 - ((frac - 0.6) / 0.4) * F;
      }

      // くつ・リボン
      if (r.shoesT > 0){ r.shoesT -= dt; v *= 1.12; }
      if (r.ribbon > 0 && Math.random() < dt * 0.12){
        r.ribbon -= 1; r.boostM = 1.25; r.boostT = 3; flash(r);
        if (r.isPlayer) callout("ラッキーリボンが ひかった！");
      }

      // わざの こうか
      if (r.boostT > 0){ r.boostT -= dt; v *= r.boostM; if (r.boostT <= 0) r.boostM = 1; }
      if (r.slowT  > 0){ r.slowT  -= dt; v *= r.slowM;  if (r.slowT  <= 0) r.slowM  = 1; }

      // ちょっとした ゆらぎ と、はなれすぎない ちょうせい（さいごまで ドキドキするように）
      v *= 1 + Math.sin(st.t * r.freq + r.phase) * 0.05;
      const gap = leadP - r.p;
      v *= gap > 0.05 ? 1 + Math.min(0.07, (gap - 0.05) * 1.2) : 0.985;

      r.v = v;
      r.p += v * dt;

      if (r.p >= LAPS){
        r.p = LAPS; r.finished = true; r.time = st.t;
        r.rank = ++st.finished;
        r.g.classList.add("still");
        sound(r.isPlayer ? 880 : 420, 0.12, "triangle", 0.13);
      }
    }

    // ---- えがく ----
    const lp = r.finished ? 0 : (r.p % 1);
    const pt = r.path.getPointAtLength(lp * r.len);
    const nx = r.path.getPointAtLength(((lp + 0.008) % 1) * r.len);
    const dx = nx.x - pt.x;
    // すすむ むきが よこに かわった ときだけ むきを かえる（カーブの はしで 1かいだけ）
    if (Math.abs(dx) > 0.03) r.face = dx < 0 ? -1 : 1;
    const face = r.face || 1;
    const depth = (pt.y - Y_TOP) / (Y_BOT - Y_TOP);            // したに いるほど おおきく
    const s = 0.44 + 0.24 * depth;

    // あしを うごかす：はやいほど はやく かいてんする
    const speedRate = st.unit ? r.v / st.unit : 1;
    if (!r.finished) r.gait += dt * 26 * Math.max(0.4, speedRate);
    for (let i = 0; i < r.legs.length; i++){
      const a = r.finished ? 0 : Math.sin(r.gait + LEG_PHASE[i]) * 27;
      r.legs[i].setAttribute("transform", `rotate(${a.toFixed(1)} ${LEG_X[i]} 48)`);
    }
    // からだを ぴょこぴょこ させて、まえに かたむける
    const bob = r.finished ? 0 : Math.sin(r.gait * 2) * 2.2;
    r.body.setAttribute("transform", `translate(0 ${bob.toFixed(2)}) rotate(-4 49 42)`);

    r.g.setAttribute("transform",
      `translate(${pt.x.toFixed(2)},${pt.y.toFixed(2)}) scale(${(face * s).toFixed(3)},${s.toFixed(3)}) translate(${-FOOT_X},${-FOOT_Y})`);
    // なまえふだは ひっくりかえらないように もどす
    r.tag.setAttribute("transform", `translate(${FOOT_X},${FOOT_Y - 34}) scale(${face},1)`);
    r.depth = pt.y;
    r.px = pt.x;

    // すなぼこり
    if (!r.finished && dt > 0){
      r.puffT -= dt;
      if (r.puffT <= 0){
        r.puffT = 0.13;
        puff(pt.x - face * 9 * s, pt.y - 1, s);
      }
    }
  }

  // カメラは じぶんの ひつじを おいかけて よこに スクロールする
  const myPos = st.racers.find(r => r.isPlayer);
  if (myPos && myPos.px != null && st.world){
    const camX = Math.max(0, Math.min(TRACK_W - VIEW_W, myPos.px - VIEW_W / 2));
    if (Math.abs(camX - st.camX) > 0.05){
      st.camX = camX;
      st.world.setAttribute("transform", `translate(${(-camX).toFixed(1)},0)`);
    }
  }

  // まえに いる ひつじほど てまえに えがく。
  // じゅんばんが かわった ときだけ ならべかえる（まいかい やると えがきなおしで ちらつく）
  const byDepth = [...st.racers].sort((a, b) => a.depth - b.depth);
  const sig = byDepth.map(r => r.lane).join("");
  if (sig !== st.order){
    st.order = sig;
    byDepth.forEach(r => st.holder.appendChild(r.g));
  }

  // じゅんい
  const order = [...st.racers].sort((a, b) => (b.p - a.p));
  order.forEach((r, i) => {
    const n = r.finished ? r.rank : i + 1;
    if (r.badgeTxt.textContent !== String(n)) r.badgeTxt.textContent = n;
  });
  paintStandings(order);

  // しゅうかい ひょうじ
  const me = st.racers.find(r => r.isPlayer);
  const lap = Math.min(LAPS, Math.floor(me.p) + 1);
  if (lap !== st.lapShown){
    st.lapShown = lap;
    if (lap === LAPS){ callout(pick(CALLOUTS.lastLap), true); cheer(0.7, 1.2); }
  }
  $("#lapTxt").textContent = `${lap} / ${LAPS} しゅう`;
  $("#raceBar").style.width = Math.min(100, (me.p / LAPS) * 100) + "%";

  // じぶんの じゅんいが かわったら すぐ しらせる
  if (st.running && !me.finished){
    const myRank = order.indexOf(me) + 1;
    if (st.myRank && myRank !== st.myRank){
      if (myRank < st.myRank){
        callout(`${me.name}が ${myRank}いに あがった！`, true);
        cheer(0.85, 1.1);
      } else {
        callout(`${me.name}が ${myRank}いに さがった…`);
      }
    }
    st.myRank = myRank;
  }

  // さいごの ちょくせん：テンポを あげて もりあげる
  if (st.running && !st.spurt && me.p / LAPS > 0.82){
    st.spurt = true;
    setTempo(1.15);
    cheer(1.1, 1.8);
    callout(pick(CALLOUTS.final), true);
    $("#race").classList.add("spurt");
  }

  // じぶんが ゴールした しゅんかん
  if (me.finished && !st.goalShown){
    st.goalShown = true;
    cheer(1.4, 2.0);
    const fl = $("#goalFlash");
    fl.textContent = "ゴール！";
    fl.classList.add("on");
    setTimeout(() => fl.classList.remove("on"), 1100);
  }

  // 「いま つかうと つよい」ヒント
  if (st.running && !st.used){
    const sk = me.skill, lapP = me.p % 1, frac = me.p / LAPS;
    const nice = (sk.best === "corner" && inCorner(lapP))
              || (sk.best === "last" && frac > 0.7)
              || (sk.best === "front" && st.racers.some(r => !r.finished && r.p > me.p && r.p - me.p < 0.08));
    $("#skillBtn").classList.toggle("ready", !!nice);
  }

  // じっきょう（レースの ようすに あわせて しゃべる）
  if (st.running){
    st.nextCall -= dt;
    if (st.nextCall <= 0){
      st.nextCall = 2.8 + Math.random() * 2.2;
      const top = order[0], second = order[1];
      const spread = order[0].p - order[order.length - 1].p;
      if (top !== st.leader){
        st.leader = top;
        callout(`${top.name}${pick(CALLOUTS.lead)}`, top.isPlayer);
        cheer(0.6, 0.9);
      } else if (spread < 0.02){
        callout(pick(CALLOUTS.close), true);
      } else if (second && top.p - second.p > 0.06){
        callout(`${top.name}${pick(CALLOUTS.gap)}`);
      } else if (me.p / LAPS < 0.8 && order.indexOf(me) > 0 && me.v > st.unit * 1.05){
        callout(`${me.name}${pick(CALLOUTS.chase)}`, true);
      } else if (inCorner(me.p % 1)){
        callout(pick(CALLOUTS.corner));
      }
    }
  }

  // CPU も わざを つかう
  for (const r of st.racers){
    if (r.cpuFire > 0 && st.t >= r.cpuFire && !r.finished){
      r.cpuFire = -1;
      r.boostM = r.skill.power; r.boostT = r.skill.dur;
      flash(r);
      callout(`${r.name}が ${r.skill.name}！`);
    }
  }
}

let standTimer = 0;
function paintStandings(order){
  if (performance.now() - standTimer < 250) return;
  standTimer = performance.now();
  $("#standings").innerHTML = order.map((r, i) => `
    <div class="strow ${r.isPlayer ? "me" : ""}">
      <span class="sno">${r.finished ? r.rank : i + 1}</span>
      <span class="sdot" style="background:${r.color}"></span>
      <span class="snm">${r.name}</span>
    </div>`).join("");
}

function callout(text, strong = false){
  const el = $("#callout");
  el.innerHTML = `<span class="${strong ? "strong" : ""}">${text}</span>`;
  el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
}

/* =========================================================
   けっか
   ========================================================= */
function showResult(){
  stopMusic();
  const d = S.data;
  const me = st.racers.find(r => r.isPlayer);
  const order = [...st.racers].sort((a, b) => a.rank - b.rank);
  const prize = PRIZE[me.rank - 1] || 0;

  d.races += 1;
  if (me.rank === 1) d.wins += 1;
  if (!d.bestTime || me.time < d.bestTime) d.bestTime = me.time;
  if (d.equipItem){ S.useItem(d.equipItem); if (!d.items.includes(d.equipItem)) d.equipItem = null; }
  S.earn(prize);
  S.addLog(`レースで ${me.rank}い（${prize ? yen(prize) : "しょうきん なし"}）`);
  S.save();

  const medal = ["🥇", "🥈", "🥉", "4"];
  $("#resultMsg").textContent =
    me.rank === 1 ? "1い！ ゆうしょう！ 🎉" :
    me.rank === 2 ? "おしい！ 2い だったよ" :
    me.rank === 3 ? "3い！ よく がんばった" : "4い… また あした！";

  $("#resultList").innerHTML = order.map(r => `
    <div class="rrow ${r.isPlayer ? "me" : ""}">
      <span class="rno">${medal[r.rank - 1]}</span>
      <svg viewBox="0 0 100 76" class="rmini">${sheepArt(r.color)}</svg>
      <span class="rnm" style="color:${r.color}">${r.name}${r.isPlayer ? "（じぶん）" : ""}</span>
      <span class="rtm">${r.time.toFixed(2)}びょう</span>
    </div>`).join("");

  $("#resultPrize").innerHTML = prize
    ? `しょうきん <b>${yen(prize)}</b> を もらった！`
    : `しょうきんは なし。つぎは がんばろう！`;
  $("#resultMoney").textContent = d.money.toLocaleString();

  if (me.rank === 1){ fanfare(); confetti(70); } else sound(300, 0.25, "triangle", 0.14);
  show("result");
}

export function stopRace(){
  cancelAnimationFrame(st.raf); clearTimeout(st.timer);
  st.running = false;
  stopMusic();
}
