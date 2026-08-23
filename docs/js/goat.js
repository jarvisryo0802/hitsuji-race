// ===== おさんぽ やぎ（ルーレット → みちを はずれないように リードする さんぽ）=====
import { GOAT_PRICE, GOAT_SUCCESS_M, goatLevelWeight, findGoatRewardPool, findFood, findItem, findSkill } from "./data.js";
import * as S from "./save.js";
import { goatArt } from "./map.js";
import { today } from "./save.js";
import { $, tap, good, bad, sound, toast, confetti, yen, maa, munch } from "./ui.js";

export let backToMap = () => {};
export function setBackToMap(fn){ backToMap = fn; }

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- ハイスコア（きせつ・日を またいで のこる）---------- */
const BOARD_KEY = "makainoSheepRaceGoatBoard";
function loadBoard(){
  try { return JSON.parse(localStorage.getItem(BOARD_KEY)) || []; } catch (e){ return []; }
}
function saveBoard(list){
  try { localStorage.setItem(BOARD_KEY, JSON.stringify(list.slice(0, 10))); } catch (e) {}
}
function addScore(m){
  const list = loadBoard();
  list.push({ m: Math.floor(m), d: today() });
  list.sort((a, b) => b.m - a.m);
  const top = list.slice(0, 10);
  saveBoard(top);
  return top;
}
function boardHTML(board){
  if (!board.length){
    return `<p class="note center">まだ きろくが ないよ。さいしょの きろくを つくろう！</p>`;
  }
  const rows = board.map((b, i) => `
    <div class="hrow"><span class="hrank">${i + 1}</span><span class="hdist">${b.m}m</span><span class="hdate">${b.d.slice(5)}</span></div>`).join("");
  return `<div class="hboard"><p class="lbl center">とおくまで ランキング（トップ10）</p>${rows}</div>`;
}

/* =========================================================
   ① ルーレットで きょう おさんぽする やぎを きめる
   ========================================================= */
export function renderGoatEntry(){
  $("#goatStage").innerHTML = `
    <p class="stagettl">ルーレットで おさんぽする やぎを きめよう！</p>
    <p class="hintline">たかい レベルの やぎほど なかなか でないけど、<br>
      とおくまで あるけると すごい ごほうびが もらえるよ</p>
    <div class="groulette" id="groulette">
      <div class="gwindow"><span id="gLevelBig">Lv1</span></div>
    </div>
    <button class="btn big pink" id="gSpinBtn">🎡 <b>${GOAT_PRICE}</b>えんで やぎを よぶ</button>
    <p class="note center">もっている おかね：💰 ${S.data.money.toLocaleString()}えん</p>`;
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
    <div class="gresult">
      <div class="glevel ${level >= 9 ? "lvrare" : level >= 4 ? "mid" : ""}">Lv.${level}</div>
      <svg class="gprevsvg" viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
        ${goatArt(60, 78)}
      </svg>
      <p class="note center">${flavorText(level)}</p>
    </div>
    <button class="btn big green" id="gGoBtn">この やぎと おさんぽ する</button>
    <button class="btn small gray" id="gBackBtn">やめる</button>`;
  $("#gGoBtn").onclick = () => startWalk(level);
  $("#gBackBtn").onclick = () => backToMap();
}

/* =========================================================
   ② おさんぽ：みちを はずれないように フリック／ドラッグで リードする
   ========================================================= */
const VIEW_W = 220, VIEW_H = 300, GOAT_Y = 230, PPM = 3;

function startWalk(level){
  const pathW    = 100 - (level - 1) * 5;                 // みちの はば（せまいほど むずかしい）
  const wanderA  = 30 + level * 4;                         // やぎが かってに よろける つよさ
  const baseSpeed = 3.2 + (level - 1) * 0.35;               // びょうそく（メートル）

  $("#goatStage").innerHTML = `
    <p class="stagettl">Lv.${level} の やぎと おさんぽ！</p>
    <p class="hintline">ゆびで ドラッグして やぎを <b>みちの うえ</b> に リードしよう。<br>
      みちの そとの くさを たべすぎると おなかいっぱいで おしまい！</p>
    <div class="gwalkwrap">
      <svg class="gwalksvg" id="gWalkSvg" viewBox="0 0 ${VIEW_W} ${VIEW_H}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${VIEW_W}" height="${VIEW_H}" fill="#9ddc84"/>
        <path id="gPath" fill="none" stroke="#e3c9a0" stroke-linecap="round"/>
        <path id="gPathLine" fill="none" stroke="#fffaf0" stroke-width="2" stroke-dasharray="7 8" opacity=".7"/>
        <g id="gWalker"></g>
      </svg>
      <div class="hhud">
        <span id="gDist">0m</span>
      </div>
    </div>
    <div class="timebar" id="gFullWrap"><i id="gFullBar"></i></div>
    <p class="note center">おなかいっぱい メーター</p>`;

  const svg = $("#gWalkSvg");
  const pathEl = $("#gPath");
  const lineEl = $("#gPathLine");
  const walker = $("#gWalker");
  const distEl = $("#gDist");
  const fullBar = $("#gFullBar");
  const fullWrap = $("#gFullWrap");

  // びっしり サンプリングして、ふとい ストロークで みちを えがく
  const ROWS = 26;
  function centerX(d){
    const raw = 110 + Math.sin(d * 0.05) * 60 + Math.sin(d * 0.13 + 1.3) * 26;
    return clamp(raw, 60, 160);
  }

  let goatX = 110, goatVX = 0, fullness = 0, distance = 0;
  let wanderDir = 0, nextWanderAt = 0, elapsed = 0;
  let munchT = 0;
  let alive = true, raf = 0, timer = 0, last = performance.now();

  function drawPath(){
    let d = "", dl = "";
    for (let i = 0; i <= ROWS; i++){
      const y = (VIEW_H / ROWS) * i;
      const ahead = (GOAT_Y - y) / PPM;
      const cx = centerX(distance + ahead);
      d  += (i ? "L" : "M") + cx.toFixed(1) + "," + y.toFixed(1);
      dl += (i ? "L" : "M") + cx.toFixed(1) + "," + y.toFixed(1);
    }
    pathEl.setAttribute("d", d);
    pathEl.setAttribute("stroke-width", pathW);
    lineEl.setAttribute("d", dl);
  }

  function drawGoat(face){
    walker.innerHTML = goatArt(goatX, GOAT_Y, face);
  }

  function updateHud(){
    distEl.textContent = Math.floor(distance) + "m";
    fullBar.style.width = clamp(fullness, 0, 100) + "%";
    fullWrap.classList.toggle("warn", fullness > 65);
  }

  // ゆびで ドラッグして やぎを うごかす
  let dragging = false, lastPX = 0;
  function pointToX(clientX){
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = 0;
    const ctm = svg.getScreenCTM();
    if (!ctm) return goatX;
    return pt.matrixTransform(ctm.inverse()).x;
  }
  svg.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastPX = pointToX(e.clientX);
    svg.setPointerCapture && svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const px = pointToX(e.clientX);
    const dx = px - lastPX;
    lastPX = px;
    goatVX += dx * 7;   // ドラッグの いきおいを そのまま つたえる
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach(ev =>
    svg.addEventListener(ev, () => { dragging = false; }));

  function loop(ts){
    if (!alive) return;
    cancelAnimationFrame(raf); clearTimeout(timer);
    const dt = Math.max(0, Math.min(0.05, (ts - last) / 1000));
    last = ts;
    elapsed += dt;

    // やぎ じしんの きまぐれな よろけ
    if (elapsed >= nextWanderAt){
      wanderDir = [-1, 0, 1][Math.floor(Math.random() * 3)];
      nextWanderAt = elapsed + rand(0.8, 1.7);
    }
    if (!dragging) goatVX += wanderDir * wanderA * dt;

    goatVX *= Math.max(0, 1 - 2.6 * dt);          // まさつで だんだん おそくなる
    goatVX = clamp(goatVX, -170, 170);
    goatX = clamp(goatX + goatVX * dt, 14, VIEW_W - 14);

    distance += baseSpeed * dt + Math.min(2.2, distance * 0.0035) * dt;

    const cx = centerX(distance);
    const offPath = Math.abs(goatX - cx) > pathW / 2;
    if (offPath){
      fullness = clamp(fullness + 15 * dt, 0, 100);
      munchT -= dt;
      if (munchT <= 0){ munchT = 0.3; munch(); }
    } else {
      fullness = clamp(fullness - 9 * dt, 0, 100);
    }

    drawPath();
    drawGoat(goatVX < -4 ? -1 : 1);
    updateHud();

    if (fullness >= 100){ finishWalk(level); return; }
    raf = requestAnimationFrame(loop);
    timer = setTimeout(() => loop(performance.now()), 40);
  }

  function finishWalk(level){
    alive = false;
    cancelAnimationFrame(raf); clearTimeout(timer);
    maa();
    setTimeout(() => showResult(Math.floor(distance), level), 350);
  }

  drawPath(); drawGoat(1); updateHud();
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

function showResult(distance, level){
  const board = addScore(distance);
  const rank = board.findIndex(b => b.m === distance) + 1;
  const madeTop10 = rank >= 1 && rank <= 10;
  const success = distance >= GOAT_SUCCESS_M;

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
  if (madeTop10 && rank <= 3) confetti(30);

  const gained = S.grow({ love: success ? 3 : 1, stamina: success ? 2 : 1 });
  const names = { speed:"はやさ", stamina:"スタミナ", love:"なかよし" };
  const gainList = Object.entries(gained).map(([k, v]) =>
    `<div class="gainrow"><span>${names[k]}</span><b>+${v}</b></div>`).join("");

  $("#goatStage").innerHTML = `
    <div class="carefin">
      <div class="fintitle">${Math.floor(distance)}m すすんだ！</div>
      <div class="eat">${success ? "🐐💖" : "🐐💦"}</div>
      <p class="note">${madeTop10 ? `ランキング <b>${rank}い</b> に ランクイン！<br>` : ""}${success
        ? `${GOAT_SUCCESS_M}m を こえて せいこう！`
        : `${GOAT_SUCCESS_M}m まで あるけると ごほうびが もらえるよ。`}</p>
      <div class="gains">${gainList}</div>
      ${rewardHTML}
      ${boardHTML(board)}
      <button class="btn" id="gAgainBtn">つぎへ</button>
    </div>`;
  S.addLog(success ? `やぎの おさんぽ せいこう（Lv.${level}／${Math.floor(distance)}m）` : `やぎの おさんぽ Lv.${level}（${Math.floor(distance)}m）`);

  $("#gAgainBtn").onclick = () => { tap(); renderGoatEntry(); };
}
