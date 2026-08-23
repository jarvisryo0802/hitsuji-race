// ===== 乗馬たいけん（タップで ジャンプする エンドレスゲーム）=====
import { HORSE_GRAVITY, HORSE_JUMP_V, HORSE_STAGES, HORSE_LIVES, HORSE_PRICE } from "./data.js";
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

/* ---------- うまに ひとが のった え（あしは じめんに いるか・とんでいるか、
   はしっている あいだは がいと（あしの しゅうき）で うごかす）---------- */
function mountArt(x, y, jumping, gait){
  let back1, back2, front1, front2, bob;
  if (jumping){
    // まえあしも うしろあしも おなじ むきに（うしろへ）おりまげる
    back1 = back2 = front1 = front2 = 52;
    bob = 0;
  } else {
    // はしっている あいだは あしを こうごに ふって、はしっている かんじを だす
    const amp = 30;
    back1  = Math.sin(gait) * amp;
    back2  = Math.sin(gait + 2.6) * amp;
    front1 = Math.sin(gait + Math.PI) * amp;
    front2 = Math.sin(gait + Math.PI + 2.6) * amp;
    bob = Math.abs(Math.sin(gait)) * 2.2;
  }
  return `<g transform="translate(${x},${(y - bob).toFixed(2)})">
    <ellipse cx="0" cy="${(24 + bob).toFixed(2)}" rx="19" ry="4" fill="rgba(0,0,0,.16)" opacity="${jumping ? 0.35 : 0.75}"/>

    <!-- しっぽ -->
    <path d="M-23,-10 Q-33,-2 -27,14 Q-25,0 -19,-6 Z" fill="#5a3d22"/>

    <!-- うしろあし（こかんせつは からだの したらへん） -->
    <g transform="rotate(${back1.toFixed(1)} -10 3)">
      <rect x="-13.5" y="3" width="7" height="20" rx="3" fill="#8a5f38"/>
    </g>
    <g transform="rotate(${back2.toFixed(1)} -2.5 3)">
      <rect x="-6" y="3" width="7" height="20" rx="3" fill="#8a5f38"/>
    </g>

    <!-- どう -->
    <ellipse cx="-2" cy="-6" rx="23" ry="13.5" fill="#a5764a"/>

    <!-- くび -->
    <path d="M13,-15 Q28,-34 22,-6 Q17,-9 12,-5 Z" fill="#a5764a"/>
    <!-- たてがみ -->
    <path d="M15,-32 Q26,-38 21,-18 Q18,-22 14,-16 Q17,-25 15,-32 Z" fill="#5a3d22"/>

    <!-- あたま -->
    <ellipse cx="27" cy="-23" rx="9.5" ry="7.5" fill="#a5764a"/>
    <ellipse cx="35" cy="-19" rx="4.5" ry="3.6" fill="#a5764a"/>
    <!-- みみ -->
    <polygon points="21,-29 24.5,-39 27.5,-30" fill="#a5764a"/>
    <polygon points="29,-28.5 32.5,-38 34.5,-29" fill="#a5764a"/>
    <polygon points="22,-29 24.5,-36 26.5,-30" fill="#6b4526"/>
    <polygon points="30,-28.5 32.5,-35 34,-29.5" fill="#6b4526"/>
    <!-- め・はな -->
    <circle cx="30.5" cy="-23" r="1.7" fill="#2b2b3a"/>
    <ellipse cx="38.5" cy="-17.5" rx="1.6" ry="1.1" fill="#4a3220"/>

    <!-- まえあし（こかんせつは からだの したらへん） -->
    <g transform="rotate(${front1.toFixed(1)} 7 3)">
      <rect x="4" y="3" width="7" height="20" rx="3" fill="#6b4526"/>
    </g>
    <g transform="rotate(${front2.toFixed(1)} 15 3)">
      <rect x="12" y="3" width="7" height="20" rx="3" fill="#6b4526"/>
    </g>
  </g>${riderArt(x, y - bob)}`;
}

function riderArt(x, y){
  return `<g transform="translate(${x},${y})">
    <path d="M-9,-14 Q-1,-23 7,-14" stroke="#3a2a1a" stroke-width="5.5" fill="none" stroke-linecap="round"/>
    <rect x="-4.5" y="-32" width="12" height="18" rx="5.5" fill="#ff8a2b"/>
    <rect x="6" y="-29" width="11" height="4.5" rx="2.2" fill="#ff8a2b" transform="rotate(-16 6 -29)"/>
    <circle cx="2" cy="-38" r="6.8" fill="#f6d3ae"/>
    <path d="M-4.8,-41 a6.8,6.8 0 0 1 13.6,0 q-6.8,-4.6 -13.6,0z" fill="#5a4636"/>
  </g>`;
}

/* ---------- けしき：とおくに ふじさん（うごかない）、くも・おか・じめんの すじが スクロール ---------- */
const VIEW_W = 300, VIEW_H = 480, GROUND_Y = 380;

// ふじさんは おおきくて とおいので スクロールさせず、すそのを じめんの
// なかまで のばして じめんと ちゃんと つながって 見えるようにする。
// すそのは がめんの はばより ずっと ひろく とり、はみだした ぶんは きれて OK
function fujiArt(){
  return `
    <polygon points="150,100 400,${GROUND_Y + 40} -100,${GROUND_Y + 40}" fill="#93a3c9"/>
    <polygon points="150,100 188,176 180,185 166,161 158,176 150,161 142,176 134,161 120,185 112,176" fill="#f4f7ff"/>
    <polygon points="150,100 400,${GROUND_Y + 40} 300,${GROUND_Y + 40} 150,161" fill="#7f90b8" opacity=".55"/>`;
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
    ${fujiArt()}
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

  let distance = 0, misses = 0, alive = true, scrollX = 0, gait = 0;
  let y = 0, vy = 0, jumping = false;
  let obstacles = [];
  let spawnGap = 380, scrolledSincePrev = 0, forceLowNext = false, justHadTight = false;
  let raf = 0, timer = 0, last = performance.now();

  // ジャンプの たいくうじかんから、「1かいの ジャンプで ぜったい こえられる」
  // さいしょうの まちがいない かんかくを けいさんしておく
  const AIRTIME = (2 * HORSE_JUMP_V) / HORSE_GRAVITY;
  // 0（じょばん）〜1（700m いこう）で じょじょに むずかしく する すすみぐあい
  const progress = () => clamp01(distance / 700);
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  function stageFor(m){
    let s = HORSE_STAGES[0];
    for (const st of HORSE_STAGES) if (m >= st.m) s = st;
    return s;
  }

  // つぎの かんかくを きめる：じょばんは ひろめの きゅうけいが おおく、
  // すすむほど タイトな れんぞく（そのときは つぎを ひくくして いっきに とべるように）
  // が ふえていく。タイトが 2かい つづかないように ガードも かける
  function decideGap(stage, prog){
    const safe = stage.speed * AIRTIME * 1.25;
    const tightP = justHadTight ? 0 : 0.02 + prog * 0.22;
    const wideP = 0.5 - prog * 0.22;
    const r = Math.random();
    if (r < wideP) return { gap: rand(safe * 1.8, safe * 2.6), low: false, tight: false };
    if (r < 1 - tightP) return { gap: rand(safe * 1.1, safe * 1.8), low: false, tight: false };
    const tMin = 0.62 - prog * 0.18, tMax = 0.85 - prog * 0.12;
    return { gap: rand(safe * tMin, safe * tMax), low: true, tight: true };
  }

  function spawnObstacle(stage, forceLow, prog){
    const puddle = Math.random() < 0.14;
    let h = forceLow ? stage.h[0] : rand(stage.h[0], stage.h[1]);
    let w = rand(stage.w[0], stage.w[1]);
    if (puddle){ h = Math.max(9, stage.h[0] * 0.55); w *= 1.5 + prog * 0.4; }
    // すすむほど ながい しょうがいぶつが でやすくなる（ジャンプで こえられる はばには とどめる）
    else if (!forceLow && Math.random() < 0.06 + prog * 0.16) w *= 1.35 + prog * 0.35;
    obstacles.push({ x: VIEW_W + 10, w, h, resolved: false, puddle });
  }

  function drawHorse(){
    horseG.innerHTML = mountArt(HORSE_X, GROUND_Y - y, jumping, gait);
  }
  function drawObstacles(){
    // じめんに しっかり めりこませて（+8〜10）、かげも つけて、うくのを ふせぐ
    obsG.innerHTML = obstacles.map(o => {
      if (o.puddle){
        return `<ellipse cx="${(o.x + o.w / 2).toFixed(1)}" cy="${(GROUND_Y + 4).toFixed(1)}" rx="${(o.w / 2).toFixed(1)}" ry="${(o.h * 0.75).toFixed(1)}" fill="#3fa3f5" opacity=".85"/>
          <ellipse cx="${(o.x + o.w / 2).toFixed(1)}" cy="${(GROUND_Y + 2).toFixed(1)}" rx="${(o.w / 2 - 4).toFixed(1)}" ry="${(o.h * 0.5).toFixed(1)}" fill="#8fd3ff" opacity=".8"/>`;
      }
      const top = GROUND_Y - o.h;
      return `<ellipse cx="${(o.x + o.w / 2).toFixed(1)}" cy="${GROUND_Y + 3}" rx="${(o.w / 2 + 3).toFixed(1)}" ry="4" fill="rgba(0,0,0,.18)"/>
        <rect x="${o.x.toFixed(1)}" y="${top.toFixed(1)}" width="${o.w.toFixed(1)}" height="${(o.h + 10).toFixed(1)}" fill="#a5764a"/>
        <rect x="${o.x.toFixed(1)}" y="${top.toFixed(1)}" width="${o.w.toFixed(1)}" height="5" fill="#c98a4b"/>`;
    }).join("");
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
    gait += dt * (stage.speed / 22);   // はやいほど あしが はやく うごく

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
      const prog = progress();
      spawnObstacle(stage, forceLowNext, prog);
      const decided = decideGap(stage, prog);
      spawnGap = decided.gap;
      forceLowNext = decided.low;
      justHadTight = decided.tight;
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
