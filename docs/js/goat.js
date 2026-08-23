// ===== おさんぽ やぎ（ルーレット → ゴールまで みちを はずれずに リードする さんぽ）=====
import { GOAT_PRICE, GOAT_GOAL_M, goatLevelWeight, findGoatRewardPool, findFood, findItem, findSkill } from "./data.js";
import * as S from "./save.js";
import { goatArt } from "./map.js";
import { $, tap, good, bad, sound, toast, confetti, yen, maa, munch } from "./ui.js";

export let backToMap = () => {};
export function setBackToMap(fn){ backToMap = fn; }

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* =========================================================
   ① ルーレットで きょう おさんぽする やぎを きめる
   ========================================================= */
export function renderGoatEntry(){
  $("#goatStage").innerHTML = `
    <div class="card center">
      <p class="stagettl">ルーレットで おさんぽする やぎを きめよう！</p>
      <p class="hintline">たかい レベルの やぎほど なかなか でないけど、<br>
        ゴールまで たどりつけると すごい ごほうびが もらえるよ</p>
      <div class="groulette" id="groulette">
        <div class="gwindow"><span id="gLevelBig">Lv1</span></div>
      </div>
      <button class="btn big pink" id="gSpinBtn">🎡 <b>${GOAT_PRICE}</b>えんで やぎを よぶ</button>
      <p class="note center">もっている おかね：💰 ${S.data.money.toLocaleString()}えん</p>
    </div>`;
  const btn = $("#gSpinBtn");
  btn.disabled = S.data.money < GOAT_PRICE;
  btn.onclick = () => spin();
}

function pickLevel(){
  const weights = [];
  let total = 0;
  for (let lv = 1; lv <= 10; lv++){ const w = goatLevelWeight(lv); weights.push(w); total += w; }
  let r = Math.random() * total;
  for (let lv = 1; lv <= 10; lv++){
    r -= weights[lv - 1];
    if (r <= 0) return lv;
  }
  return 1;
}

function spin(){
  if (!S.pay(GOAT_PRICE)){ bad(); toast("おかねが たりないよ"); return; }
  const btn = $("#gSpinBtn");
  btn.disabled = true;
  const finalLevel = pickLevel();
  const big = $("#gLevelBig");
  const totalTicks = 20;
  let n = 0;

  const tick = () => {
    n++;
    const showLv = n < totalTicks ? 1 + Math.floor(Math.random() * 10) : finalLevel;
    big.textContent = `Lv${showLv}`;
    sound(300 + showLv * 22, 0.045, "square", 0.09);
    if (n < totalTicks){
      setTimeout(tick, 40 + n * 7);
    } else {
      finish(finalLevel);
    }
  };
  tick();
}

function finish(level){
  const rare = level >= 9;
  $("#groulette").classList.toggle("rare", rare);
  rare ? (good(), confetti(36)) : tap();
  setTimeout(() => showConfirm(level), 550);
}

const FLAVOR = {
  low:  "のんびりやさんの やぎ。いっしょに ゆっくり あるこう。",
  mid:  "げんきいっぱい！ すすみたい ほうこうが はっきりしてるよ。",
  high: "きまぐれで あしも はやい やぎ！ うまく リードできるかな？",
};
function flavorText(level){
  if (level <= 3) return FLAVOR.low;
  if (level <= 7) return FLAVOR.mid;
  return FLAVOR.high;
}

function showConfirm(level){
  $("#goatStage").innerHTML = `
    <div class="card">
      <div class="gresult">
        <div class="glevel ${level >= 9 ? "lvrare" : level >= 4 ? "mid" : ""}">Lv.${level}</div>
        <svg class="gprevsvg" viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
          ${goatArt(60, 78)}
        </svg>
        <p class="note center">${flavorText(level)}</p>
        <p class="note center">ゴールまで <b>${GOAT_GOAL_M}m</b></p>
      </div>
      <button class="btn big green" id="gGoBtn">この やぎと おさんぽ する</button>
      <button class="btn small gray" id="gBackBtn">やめる</button>
    </div>`;
  $("#gGoBtn").onclick = () => startWalk(level);
  $("#gBackBtn").onclick = () => backToMap();
}

/* =========================================================
   ② おさんぽ：ゴールまで みちを はずれないように フリック／ドラッグで リードする
   ========================================================= */
const VIEW_W = 240, VIEW_H = 440, GOAT_Y = 270, PPM = 3;

// プレイヤーが やぎに リードを つけて あるいている ように みせる
const PLAYER_X = 120, PLAYER_Y = GOAT_Y + 55;

function playerArt(x, y, lean){
  const armRot = -20 + lean * 40;   // ひっぱっている ほうこうへ うでを ふる
  return `<g transform="translate(${x},${y}) rotate(${(lean * 7).toFixed(1)})">
    <ellipse cx="0" cy="26" rx="12" ry="3.5" fill="rgba(0,0,0,.15)"/>
    <rect x="-6" y="4" width="5.5" height="20" rx="2.7" fill="#4a6b9a"/>
    <rect x="1"  y="4" width="5.5" height="20" rx="2.7" fill="#4a6b9a"/>
    <rect x="-9" y="-16" width="18" height="20" rx="7" fill="#ff8a2b"/>
    <circle cx="0" cy="-24" r="8.5" fill="#f6d3ae"/>
    <path d="M-8.5,-27 a8.5,8.5 0 0 1 17,0 q-8.5,-5.5 -17,0z" fill="#5a4636"/>
    <g transform="rotate(${armRot.toFixed(1)} 6 -12)"><rect x="4" y="-14" width="6" height="16" rx="3" fill="#f6d3ae"/></g>
  </g>`;
}
function leashArt(px, py, gx, gy){
  const midX = (px + gx) / 2, midY = (py + gy) / 2 + 8;
  return `<path d="M${px.toFixed(1)},${py.toFixed(1)} Q${midX.toFixed(1)},${midY.toFixed(1)} ${gx.toFixed(1)},${gy.toFixed(1)}"
    stroke="#8a6d4a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
}

// 0〜1の きまった ぎじらんすう（おなじ すうじなら いつも おなじ あたい）
function hash(n){ const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); }
const TUFT = `<path d="M-4,4 Q-3,-6 -1,3" stroke="#5aa83f" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M0,4.5 Q0,-8 0,3.5" stroke="#4d9636" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M4,4 Q3,-6 1,3" stroke="#5aa83f" stroke-width="2" fill="none" stroke-linecap="round"/>`;

function startWalk(level){
  const basePathW = 50 - (level - 1) * 3;                      // みちの はば（せまいほど むずかしい）
  const wanderA   = 54 + level * 6;                             // やぎが かってに よろける つよさ
  const baseSpeed = 6.0 + (level - 1) * 0.5;                    // びょうそく（メートル）。はやめ
  const offRate   = 20 + level * 2.2;                           // みちの そとで メーターが ふえる はやさ

  // ゴールに ちかづくほど みちが せまく なる（こうはん50%で さいだい45%まで せばめる）
  function pathWidthAt(d){
    const t = clamp(d / GOAT_GOAL_M, 0, 1);
    const narrow = t > 0.5 ? (t - 0.5) / 0.5 : 0;
    return basePathW * (1 - narrow * 0.45);
  }

  $("#goatStage").innerHTML = `
    <div class="gwalkwrap" id="gWrap">
      <svg class="gwalksvg" id="gWalkSvg" viewBox="0 0 ${VIEW_W} ${VIEW_H}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${VIEW_W}" height="${VIEW_H}" fill="#9ddc84"/>
        <g id="gGrass"></g>
        <path id="gPath" fill="none" stroke="#e3c9a0" stroke-linecap="round"/>
        <g id="gGoalLine"></g>
        <g id="gLeash"></g>
        <g id="gPlayer"></g>
        <g id="gWalker"></g>
      </svg>
      <div class="gfullwrap" id="gFullWrap"><i id="gFullBar"></i><span class="gfullwarn">⚠️</span></div>
      <div class="ggoalhud">
        <span class="ggoalflagtop">🏁</span>
        <div class="ggoaltrack"><i id="gGoalFill"></i><span class="ggoalmark" id="gGoalMark">🐐</span></div>
        <span class="ggoaltxt" id="gGoalTxt">0m</span>
      </div>
    </div>`;

  const wrap = $("#gWrap");
  const svg = $("#gWalkSvg");
  const pathEl = $("#gPath");
  const grassEl = $("#gGrass");
  const goalLineEl = $("#gGoalLine");
  const walker = $("#gWalker");
  const playerEl = $("#gPlayer");
  const leashEl = $("#gLeash");
  const goalTxtEl = $("#gGoalTxt");
  const goalFillEl = $("#gGoalFill");
  const goalMarkEl = $("#gGoalMark");
  const fullBar = $("#gFullBar");
  const fullWrap = $("#gFullWrap");

  // びっしり サンプリングして、ふとい ストロークで みちを えがく。
  // みちじたいは ゆるやかに するだけ（クネクネの メインは やぎの きまぐれさ）
  const ROWS = 30;
  function centerX(d){
    const raw = 120 + Math.sin(d * 0.018) * 24 + Math.sin(d * 0.05 + 1.3) * 9;
    return clamp(raw, 88, 152);
  }

  let goatX = 120, goatVX = 0, fullness = 0, distance = 0;
  let wanderDir = 0, nextWanderAt = 0, elapsed = 0;
  let munchT = 0, lean = 0;
  let alive = true, raf = 0, timer = 0, last = performance.now();

  function drawPath(){
    let d = "";
    for (let i = 0; i <= ROWS; i++){
      const y = (VIEW_H / ROWS) * i;
      const ahead = (GOAT_Y - y) / PPM;
      const wd = distance + ahead;
      const cx = centerX(wd);
      d += (i ? "L" : "M") + cx.toFixed(1) + "," + y.toFixed(1);
    }
    pathEl.setAttribute("d", d);
    pathEl.setAttribute("stroke-width", pathWidthAt(distance).toFixed(1));
  }

  // すすんだ きょりに ひもづけて くさむらを えがく（せかいざひょうなので
  // みちと おなじように なめらかに スクロールする）
  function drawGrass(){
    const stepWorld = 16;
    const minD = distance - (VIEW_H - GOAT_Y) / PPM - 10;
    const maxD = distance + GOAT_Y / PPM + 10;
    const pw = pathWidthAt(distance);
    let s = "";
    for (let d0 = Math.floor(minD / stepWorld) * stepWorld; d0 <= maxD; d0 += stepWorld){
      if (hash(d0) > 0.5) continue;
      const side = hash(d0 + 1000) < 0.5 ? -1 : 1;
      const cx = centerX(d0);
      const off = pw / 2 + 8 + hash(d0 + 2000) * 24;
      const tx = clamp(cx + side * off, 6, VIEW_W - 6);
      const ty = GOAT_Y - (d0 - distance) * PPM;
      if (ty < -10 || ty > VIEW_H + 10) continue;
      s += `<g transform="translate(${tx.toFixed(1)},${ty.toFixed(1)})">${TUFT}</g>`;
    }
    grassEl.innerHTML = s;
  }

  // ゴールの バナー（チェックもよう）を せかいざひょうに おいて えがく
  function drawGoalLine(){
    const ty = GOAT_Y - (GOAT_GOAL_M - distance) * PPM;
    if (ty < -40 || ty > VIEW_H + 40){ goalLineEl.innerHTML = ""; return; }
    const cx = centerX(GOAT_GOAL_M);
    const w = pathWidthAt(GOAT_GOAL_M) + 14;
    const n = 6;
    let squares = "";
    for (let i = 0; i < n; i++){
      const sx = cx - w / 2 + (w / n) * i;
      squares += `<rect x="${sx.toFixed(1)}" y="${(ty - 5).toFixed(1)}" width="${(w / n).toFixed(1)}" height="10"
        fill="${i % 2 === 0 ? '#3c3a4e' : '#fff'}"/>`;
    }
    goalLineEl.innerHTML = `${squares}<text x="${cx.toFixed(1)}" y="${(ty - 10).toFixed(1)}" text-anchor="middle" class="ggoalflag">🏁 ゴール</text>`;
  }

  function drawGoat(face, grazing){
    walker.innerHTML = goatArt(goatX, GOAT_Y, face, grazing);
  }
  function drawPlayer(){
    playerEl.innerHTML = playerArt(PLAYER_X, PLAYER_Y, lean);
    leashEl.innerHTML = leashArt(PLAYER_X + lean * 5, PLAYER_Y - 34, goatX, GOAT_Y + 6);
  }

  function updateHud(){
    const shown = Math.min(GOAT_GOAL_M, Math.floor(distance));
    const pct = clamp((distance / GOAT_GOAL_M) * 100, 0, 100);
    goalTxtEl.textContent = `${shown}m`;
    goalFillEl.style.height = pct + "%";
    goalMarkEl.style.bottom = pct + "%";
    fullBar.style.width = clamp(fullness, 0, 100) + "%";
    fullWrap.classList.toggle("warn", fullness > 60);
  }

  // ゆびで ドラッグして やぎを うごかす。おもい ものを ひっぱる かんじに
  // したいので、ドラッグの いどうりょうを そのまま そくどに しない。
  // ドラッグを はじめた ところからの「ずれ」を ちからとして あたえ、
  // ちからは じわじわ（かそくど）としか きかないようにする
  const PULL_ACCEL = 85, PULL_RANGE = 60;
  let dragging = false, dragStartX = 0, pullX = 0;
  function pointToX(clientX){
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = 0;
    const ctm = svg.getScreenCTM();
    if (!ctm) return goatX;
    return pt.matrixTransform(ctm.inverse()).x;
  }
  svg.addEventListener("pointerdown", (e) => {
    dragging = true;
    dragStartX = pointToX(e.clientX);
    pullX = 0;
    svg.setPointerCapture && svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    pullX = pointToX(e.clientX) - dragStartX;
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach(ev =>
    svg.addEventListener(ev, () => { dragging = false; pullX = 0; }));

  function loop(ts){
    if (!alive) return;
    cancelAnimationFrame(raf); clearTimeout(timer);
    const dt = Math.max(0, Math.min(0.05, (ts - last) / 1000));
    last = ts;
    elapsed += dt;

    let force = 0;
    if (dragging){
      force = clamp(pullX / PULL_RANGE, -1, 1) * PULL_ACCEL;
      goatVX += force * dt;
    } else {
      // やぎ じしんの きまぐれな よろけ（ひっぱっていない あいだ だけ）。
      // すでに みちから ずれている ほうこうへ さらに いきたがる
      if (elapsed >= nextWanderAt){
        const cx = centerX(distance);
        const awayDir = goatX >= cx ? 1 : -1;
        wanderDir = Math.random() < 0.65 ? awayDir : [-1, 0, 1][Math.floor(Math.random() * 3)];
        nextWanderAt = elapsed + rand(0.5, 1.1);
      }
      goatVX += wanderDir * wanderA * dt;
      goatVX *= Math.max(0, 1 - 2.2 * dt);          // まさつで だんだん おそくなる
    }
    lean += ((dragging ? Math.sign(force) : 0) - lean) * Math.min(1, dt * 6);

    goatVX = clamp(goatVX, -170, 170);
    goatX = clamp(goatX + goatVX * dt, 14, VIEW_W - 14);

    distance += baseSpeed * dt + Math.min(3.5, distance * 0.005) * dt;

    const cx = centerX(distance);
    const offPath = Math.abs(goatX - cx) > pathWidthAt(distance) / 2;
    wrap.classList.toggle("danger", offPath);
    if (offPath){
      fullness = clamp(fullness + offRate * dt, 0, 100);
      munchT -= dt;
      if (munchT <= 0){ munchT = 0.28; munch(); }
    } else {
      fullness = clamp(fullness - 6 * dt, 0, 100);
    }

    drawPath(); drawGrass(); drawGoalLine();
    drawGoat(goatVX < -4 ? -1 : 1, offPath);
    drawPlayer();
    updateHud();

    if (distance >= GOAT_GOAL_M){ distance = GOAT_GOAL_M; finishWalk(level, true); return; }
    if (fullness >= 100){ finishWalk(level, false); return; }
    raf = requestAnimationFrame(loop);
    timer = setTimeout(() => loop(performance.now()), 40);
  }

  function finishWalk(level, success){
    alive = false;
    cancelAnimationFrame(raf); clearTimeout(timer);
    maa();
    setTimeout(() => showResult(level, success), 350);
  }

  drawPath(); drawGrass(); drawGoalLine(); drawGoat(1, false); drawPlayer(); updateHud();
  raf = requestAnimationFrame(loop);
  timer = setTimeout(() => loop(performance.now()), 40);
}

/* =========================================================
   ③ けっか・ごほうび
   ========================================================= */
function drawReward(pool){
  const total = pool.reduce((a, g) => a + g.weight, 0);
  let r = Math.random() * total;
  for (const g of pool){
    r -= g.weight;
    if (r <= 0) return g;
  }
  return pool[0];
}
function rewardLabel(r){
  if (r.kind === "food"){ const f = findFood(r.id); return { icon:f.icon, name:f.name }; }
  if (r.kind === "item"){ const it = findItem(r.id); return { icon:it.icon, name:it.name }; }
  if (r.kind === "skill"){ const sk = findSkill(r.id); return { icon:sk.icon, name:sk.name }; }
  return { icon:"💰", name:yen(r.amount) };
}
function applyReward(r){
  if (r.kind === "food") S.addFood(r.id);
  else if (r.kind === "item") S.addItem(r.id);
  else if (r.kind === "skill"){
    const isNew = S.addSkill(r.id);
    if (!isNew) S.addFood("ringo");
  } else S.earn(r.amount);
}

function showResult(level, success){
  let rewardHTML = "";
  if (success){
    const pool = findGoatRewardPool(level);
    const reward = drawReward(pool);
    applyReward(reward);
    const { icon, name } = rewardLabel(reward);
    const shown = reward.kind === "skill" ? name : `${icon} ${name}`;
    good();
    if (reward.rare) confetti(50);
    rewardHTML = `<div class="gains"><div class="gainrow"><span>ごほうび</span><b>${shown}</b></div></div>`;
  } else {
    bad();
  }

  const gained = S.grow({ love: success ? 3 : 1, stamina: success ? 2 : 1 });
  const names = { speed:"はやさ", stamina:"スタミナ", love:"なかよし" };
  const gainList = Object.entries(gained).map(([k, v]) =>
    `<div class="gainrow"><span>${names[k]}</span><b>+${v}</b></div>`).join("");

  $("#goatStage").innerHTML = `
    <div class="card">
      <div class="carefin">
        <div class="fintitle">${success ? "ゴール！" : "とちゅうで おなかいっぱい…"}</div>
        <div class="eat">${success ? "🐐🏁" : "🐐💦"}</div>
        <p class="note">${success
          ? "さいごまで なかよく あるけたね！"
          : "みちを はずれすぎちゃったみたい。また ちょうせんしよう。"}</p>
        <div class="gains">${gainList}</div>
        ${rewardHTML}
        <button class="btn" id="gAgainBtn">つぎへ</button>
      </div>
    </div>`;
  S.addLog(success ? `やぎの おさんぽ ゴール（Lv.${level}）` : `やぎの おさんぽ Lv.${level}（とちゅう）`);

  $("#gAgainBtn").onclick = () => { tap(); renderGoatEntry(); };
}
