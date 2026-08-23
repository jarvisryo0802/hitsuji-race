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
    <p class="stagettl">🐎 じょうばたいけん</p>
    <p class="hintline">がめんの どこでも タップすると ジャンプ！<br>
      しょうがいぶつに ${HORSE_LIVES}かい あたったら おわりだよ。<br>
      すすむほど しょうがいぶつが おおきく はやく なるよ。</p>
    ${boardHTML(board)}
    <button class="btn big pink" id="hStartBtn">🐎 <b>${HORSE_PRICE}</b>えんで スタート！</button>
    <p class="note center">もっている おかね：💰 ${S.data.money.toLocaleString()}えん</p>`;
  const btn = $("#hStartBtn");
  btn.disabled = S.data.money < HORSE_PRICE;
  btn.onclick = () => {
    if (!S.pay(HORSE_PRICE)){ bad(); toast("おかねが たりないよ"); return; }
    tap(); startGame();
  };
}

/* =========================================================
   ② ゲーム ほんたい
   ========================================================= */
function startGame(){
  const GROUND_Y = 132, HORSE_X = 70, HB = 16;   // HB=ひつじ／うまの あたり判定 はんぶんの はば

  $("#horseStage").innerHTML = `
    <div class="hwrap" id="hArea">
      <svg class="hsvg" viewBox="0 0 300 170" xmlns="http://www.w3.org/2000/svg">
        <rect x="-20" y="0" width="340" height="170" fill="#bfe6ff"/>
        <ellipse cx="60" cy="30" rx="90" ry="26" fill="#eaf7ff"/>
        <ellipse cx="240" cy="24" rx="70" ry="20" fill="#eaf7ff"/>
        <rect x="-20" y="${GROUND_Y}" width="340" height="38" fill="#8fd36a"/>
        <rect x="-20" y="${GROUND_Y}" width="340" height="6" fill="#79c158"/>
        <g id="hObstacles"></g>
        <g id="hHorse"></g>
      </svg>
      <div class="hhud">
        <span id="hDist">0m</span>
        <span id="hLives">${"❤️".repeat(HORSE_LIVES)}</span>
      </div>
    </div>
    <p class="note center">がめんを タップして ジャンプ！</p>`;

  const area  = $("#hArea");
  const horseG = $("#hHorse");
  const obsG  = $("#hObstacles");
  const distEl = $("#hDist");
  const livesEl = $("#hLives");

  let distance = 0, misses = 0, alive = true;
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
    obstacles.push({ x: 310, w: rand(stage.w[0], stage.w[1]), h: rand(stage.h[0], stage.h[1]), resolved: false });
  }

  function drawHorse(){ horseG.innerHTML = horseArt(HORSE_X, GROUND_Y - y); }
  function drawObstacles(){
    obsG.innerHTML = obstacles.map(o =>
      `<rect x="${o.x.toFixed(1)}" y="${(GROUND_Y - o.h).toFixed(1)}" width="${o.w.toFixed(1)}" height="${o.h.toFixed(1)}" rx="3" fill="#a5764a"/>
       <rect x="${o.x.toFixed(1)}" y="${(GROUND_Y - o.h).toFixed(1)}" width="${o.w.toFixed(1)}" height="5" rx="2" fill="#c98a4b"/>`
    ).join("");
  }

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

    drawHorse(); drawObstacles();
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

  drawHorse(); drawObstacles();
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
    <div class="carefin">
      <div class="fintitle">${distance}m すすんだ！</div>
      <div class="eat">${madeTop10 ? "🏆" : "🐎"}</div>
      <p class="note">${madeTop10 ? `ランキング <b>${rank}い</b> に ランクイン！` : "つぎは もっと とおくまで いけるかな？"}</p>
      ${boardHTML(board)}
      <button class="btn" id="hAgainBtn">もういちど</button>
    </div>`;
  $("#hAgainBtn").onclick = () => { tap(); renderHorseEntry(); };
}
