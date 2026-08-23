// ===== 乗馬たいけん（タップで ジャンプする エンドレスゲーム）=====
import { HORSE_GRAVITY, HORSE_JUMP_V, HORSE_STAGES, HORSE_LIVES, HORSE_PRICE } from "./data.js";
import { horseArt } from "./map.js";
import * as S from "./save.js";
import { today } from "./save.js";
import { $, tap, good, bad, sound, toast, confetti } from "./ui.js";

export let backToMap = () => {};
export function setBackToMap(fn){ backToMap = fn; }

const rand = (a, b) => a + Math.random() * (b - a);

/* ---------- ハイスコア（きせつ・日を またいで のこる）---------- */
const BOARD_KEY = "makainoSheepRaceHorseBoard";
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
   ① スタート がめん
   ========================================================= */
export function renderHorseEntry(){
  const board = loadBoard();
  $("#horseStage").innerHTML = `
    <div class="card center">
      <p class="stagettl">🐎 じょうばたいけん</p>
      <p class="hintline">がめんの どこでも タップすると ジャンプ！<br>
        しょうがいぶつに ${HORSE_LIVES}かい あたったら おわりだよ。<br>
        すすむほど しょうがいぶつが おおきく はやく なるよ。</p>
      ${boardHTML(board)}
      <button class="btn big pink" id="hStartBtn">🐎 <b>${HORSE_PRICE}</b>えんで スタート！</button>
      <p class="note center">もっている おかね：💰 ${S.data.money.toLocaleString()}えん</p>
    </div>`;
  const btn = $("#hStartBtn");
  btn.disabled = S.data.money < HORSE_PRICE;
  btn.onclick = () => {
    if (!S.pay(HORSE_PRICE)){ bad(); toast("おかねが たりないよ"); return; }
    tap(); startGame();
  };
}

/* ---------- ひとが うまに のった え（horseArt と おなじ きじゅんてん）---------- */
function riderArt(x, y){
  return `<g transform="translate(${x},${y})">
    <path d="M-9,-14 Q-1,-23 7,-14" stroke="#3a2a1a" stroke-width="5.5" fill="none" stroke-linecap="round"/>
    <rect x="-4.5" y="-32" width="12" height="18" rx="5.5" fill="#ff8a2b"/>
    <rect x="6" y="-29" width="11" height="4.5" rx="2.2" fill="#ff8a2b" transform="rotate(-16 6 -29)"/>
    <circle cx="2" cy="-38" r="6.8" fill="#f6d3ae"/>
    <path d="M-4.8,-41 a6.8,6.8 0 0 1 13.6,0 q-6.8,-4.6 -13.6,0z" fill="#5a4636"/>
  </g>`;
}

/* ---------- けしき：とおくに ふじさん、くも・おか・じめんの すじが スクロール ---------- */
const VIEW_W = 300, VIEW_H = 480, GROUND_Y = 380;

function fujiArt(scrollX){
  const dx = -(scrollX * 0.04) % VIEW_W;
  return `<g transform="translate(${dx.toFixed(1)},0)">
      <polygon points="150,120 260,300 40,300" fill="#93a3c9"/>
      <polygon points="150,120 185,182 178,190 165,168 158,182 150,168 142,182 135,168 122,190 115,182" fill="#f4f7ff"/>
      <polygon points="150,120 260,300 220,300 150,168" fill="#7f90b8" opacity=".55"/>
    </g>
    <g transform="translate(${(dx + VIEW_W).toFixed(1)},0)">
      <polygon points="150,120 260,300 40,300" fill="#93a3c9"/>
      <polygon points="150,120 185,182 178,190 165,168 158,182 150,168 142,182 135,168 122,190 115,182" fill="#f4f7ff"/>
      <polygon points="150,120 260,300 220,300 150,168" fill="#7f90b8" opacity=".55"/>
    </g>`;
}

function tileLayer(scrollX, patW, unit){
  let s = "";
  const start = -patW - (scrollX % patW);
  for (let x = start; x < VIEW_W + patW; x += patW){
    s += `<g transform="translate(${x.toFixed(1)},0)">${unit}</g>`;
  }
  return s;
}
const CLOUD = `<ellipse cx="30" cy="60" rx="26" ry="13" fill="#fff" opacity=".85"/>
  <ellipse cx="52" cy="54" rx="18" ry="10" fill="#fff" opacity=".85"/>`;
const HILL = `<ellipse cx="60" cy="${GROUND_Y + 30}" rx="130" ry="46" fill="#8fd07a"/>`;
const DASH = `<rect x="0" y="${GROUND_Y + 14}" width="16" height="5" rx="2.5" fill="#fffaf0" opacity=".8"/>`;

function scenery(scrollX){
  return `
    <rect x="0" y="0" width="${VIEW_W}" height="${VIEW_H}" fill="#bfe6ff"/>
    ${fujiArt(scrollX)}
    ${tileLayer(scrollX * 0.15, 160, CLOUD)}
    ${tileLayer(scrollX * 0.4, 220, HILL)}
    <rect x="0" y="${GROUND_Y}" width="${VIEW_W}" height="${VIEW_H - GROUND_Y}" fill="#8fd36a"/>
    <rect x="0" y="${GROUND_Y}" width="${VIEW_W}" height="6" fill="#79c158"/>
    ${tileLayer(scrollX, 40, DASH)}`;
}

/* =========================================================
   ② ゲーム ほんたい
   ========================================================= */
function startGame(){
  const HORSE_X = 75, HB = 16;   // HB=うまの あたり判定 はんぶんの はば

  $("#horseStage").innerHTML = `
    <div class="hgamewrap" id="hArea">
      <svg class="hsvg" viewBox="0 0 ${VIEW_W} ${VIEW_H}" xmlns="http://www.w3.org/2000/svg">
        <g id="hScenery"></g>
        <g id="hObstacles"></g>
        <g id="hHorse"></g>
      </svg>
      <div class="hhud">
        <span id="hDist">0m</span>
        <span id="hLives">${"❤️".repeat(HORSE_LIVES)}</span>
      </div>
    </div>`;

  const area   = $("#hArea");
  const sceneG = $("#hScenery");
  const horseG = $("#hHorse");
  const obsG   = $("#hObstacles");
  const distEl = $("#hDist");
  const livesEl = $("#hLives");

  let distance = 0, misses = 0, alive = true, scrollX = 0;
  let y = 0, vy = 0, jumping = false;
  let obstacles = [];
  let spawnGap = 260, scrolledSincePrev = 0;
  let raf = 0, timer = 0, last = performance.now();

  function stageFor(m){
    let s = HORSE_STAGES[0];
    for (const st of HORSE_STAGES) if (m >= st.m) s = st;
    return s;
  }

  function spawnObstacle(stage){
    obstacles.push({ x: VIEW_W + 10, w: rand(stage.w[0], stage.w[1]), h: rand(stage.h[0], stage.h[1]), resolved: false });
  }

  function drawHorse(){
    horseG.innerHTML = horseArt(HORSE_X, GROUND_Y - y) + riderArt(HORSE_X, GROUND_Y - y);
  }
  function drawObstacles(){
    obsG.innerHTML = obstacles.map(o =>
      `<rect x="${o.x.toFixed(1)}" y="${(GROUND_Y - o.h).toFixed(1)}" width="${o.w.toFixed(1)}" height="${o.h.toFixed(1)}" rx="3" fill="#a5764a"/>
       <rect x="${o.x.toFixed(1)}" y="${(GROUND_Y - o.h).toFixed(1)}" width="${o.w.toFixed(1)}" height="5" rx="2" fill="#c98a4b"/>`
    ).join("");
  }
  function drawScenery(){ sceneG.innerHTML = scenery(scrollX); }

  function jump(){
    if (!alive || jumping) return;
    jumping = true;
    vy = HORSE_JUMP_V;
    sound(520, 0.09, "triangle", 0.15);
  }
  area.addEventListener("pointerdown", jump);

  function miss(){
    misses++;
    bad();
    area.classList.remove("shake"); void area.offsetWidth; area.classList.add("shake");
    livesEl.textContent = "❤️".repeat(Math.max(0, HORSE_LIVES - misses)) + "🖤".repeat(misses);
    if (misses >= HORSE_LIVES) gameOver();
  }

  function loop(ts){
    if (!alive) return;
    cancelAnimationFrame(raf); clearTimeout(timer);
    const dt = Math.max(0, Math.min(0.05, (ts - last) / 1000));
    last = ts;

    const stage = stageFor(distance);
    scrollX += stage.speed * dt;

    if (jumping){
      vy -= HORSE_GRAVITY * dt;
      y += vy * dt;
      if (y <= 0){ y = 0; vy = 0; jumping = false; }
    }
    distance += (stage.speed * dt) / 18;   // びょうそくを 「メートル」の しんちょくに かえる
    distEl.textContent = Math.floor(distance) + "m";

    for (const o of obstacles){
      o.x -= stage.speed * dt;
      const overlap = o.x < HORSE_X + HB && o.x + o.w > HORSE_X - HB;
      if (!o.resolved){
        if (overlap && y < o.h - 4){ o.resolved = true; miss(); }
        else if (o.x + o.w < HORSE_X - HB){ o.resolved = true; }
      }
    }
    obstacles = obstacles.filter(o => o.x > -40);

    scrolledSincePrev += stage.speed * dt;
    if (scrolledSincePrev >= spawnGap){
      scrolledSincePrev = 0;
      spawnObstacle(stage);
      spawnGap = rand(stage.gap[0], stage.gap[1]);
    }

    drawScenery(); drawHorse(); drawObstacles();
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    timer = setTimeout(() => loop(performance.now()), 40);
  }

  function gameOver(){
    alive = false;
    cancelAnimationFrame(raf); clearTimeout(timer);
    area.removeEventListener("pointerdown", jump);
    setTimeout(() => showResult(Math.floor(distance)), 400);
  }

  drawScenery(); drawHorse(); drawObstacles();
  raf = requestAnimationFrame(loop);
  timer = setTimeout(() => loop(performance.now()), 40);
}

/* =========================================================
   ③ けっか
   ========================================================= */
function showResult(distance){
  const board = addScore(distance);
  const rank = board.findIndex(b => b.m === distance) + 1;
  const madeTop10 = rank >= 1 && rank <= 10;
  if (madeTop10 && rank <= 3) confetti(40);

  $("#horseStage").innerHTML = `
    <div class="card">
      <div class="carefin">
        <div class="fintitle">${distance}m すすんだ！</div>
        <div class="eat">${madeTop10 ? "🏆" : "🐎"}</div>
        <p class="note">${madeTop10 ? `ランキング <b>${rank}い</b> に ランクイン！` : "つぎは もっと とおくまで いけるかな？"}</p>
        ${boardHTML(board)}
        <button class="btn" id="hAgainBtn">もういちど</button>
      </div>
    </div>`;
  $("#hAgainBtn").onclick = () => { tap(); renderHorseEntry(); };
}
