// ===== ぼくじょう・キッズファーム（おせわ）・じはんき・ガチャ =====
import {
  FOODS, ITEMS, SKILLS, GACHA_POOL, GACHA_PRICE, CARE_PER_DAY,
  findFood, findSkill, findItem,
} from "./data.js";
import * as S from "./save.js";
import { sheepSVG, happySheep, sheepArt, FOOT_X, FOOT_Y, LEG_X, LEG_PHASE } from "./sheep.js";
import { $, show, tap, good, bad, coin, sound, toast, dialog, confetti, yen,
         baa, munch } from "./ui.js";

/* =========================================================
   ひつじの ようす（かいわの なかで みせる）
   ========================================================= */
export function sheepStatusHTML(){
  const d = S.data;
  const row = (icon, name, v) =>
    `<span class="stline">${icon} ${name}
       <i class="minibar"><b style="width:${Math.min(100, v)}%"></b></i> ${v}</span>`;
  return `${row("⚡", "はやさ", d.speed)}${row("💪", "スタミナ", d.stamina)}${row("💖", "なかよし", d.love)}`;
}

export const wantHint = () => findFood(S.data.wantFood).hint;

/* =========================================================
   キッズファーム（おせわ）
   ========================================================= */
export function renderCare(){
  $("#careCount").textContent = S.data.careLeft;
  $("#careFoodNum").textContent = S.foodCount();
  $("#careMenu").classList.remove("hide");
  $("#careStage").classList.add("hide");
  $("#careStage").innerHTML = "";
}

function useCare(){
  S.data.careLeft -= 1;
  S.save();
}

// おせわが おわったあとの しめくくり
function finishCare(title, gained, extra = ""){
  const names = { speed:"はやさ", stamina:"スタミナ", love:"なかよし" };
  const list = Object.entries(gained).map(([k, v]) =>
    `<div class="gainrow"><span>${names[k]}</span><b>+${v}</b></div>`).join("");
  const unlocked = S.checkUnlock();
  const skillMsg = unlocked.length
    ? `<div class="unlock">✨ あたらしい わざを おぼえた！<br><b>${unlocked.map(i => findSkill(i).name).join("・")}</b></div>`
    : "";

  $("#careStage").innerHTML = `
    <div class="carefin">
      <div class="fintitle">${title}</div>
      ${extra}
      <div class="gains">${list}</div>
      ${skillMsg}
      <button class="btn" id="careAgain">つぎへ</button>
    </div>`;
  if (unlocked.length) confetti(40);
  $("#careAgain").onclick = () => {
    tap();
    if (S.data.careLeft > 0) renderCare();
    else backToMap();
  };
  S.addLog(title);
}

// ぼくじょうに もどる（main.js から わりあてる）
export let backToMap = () => {};
export function setBackToMap(fn){ backToMap = fn; }

// ---- ① ごはん ----
export function careFood(){
  const d = S.data;
  const owned = Object.entries(d.foods);
  $("#careMenu").classList.add("hide");
  $("#careStage").classList.remove("hide");

  if (!owned.length){
    $("#careStage").innerHTML = `
      <div class="carefin">
        <div class="fintitle">エサが ないよ</div>
        <p class="note">じはんきで エサを かってこよう。</p>
        <button class="btn blue" id="toShop">じはんきへ いく</button>
        <button class="btn small gray" id="backCare">もどる</button>
      </div>`;
    $("#toShop").onclick = () => { tap(); show("shop"); renderShop(); };
    $("#backCare").onclick = () => { tap(); renderCare(); };
    return;
  }

  const want = findFood(d.wantFood);
  $("#careStage").innerHTML = `
    <p class="stagettl">どれを あげる？</p>
    <p class="hintline">「${want.hint} が たべたいなあ」</p>
    <div class="foodpick" id="foodPick">
      ${owned.map(([id, n]) => {
        const f = findFood(id);
        return `<button class="foodcard" data-id="${id}">
          <span class="fi">${f.icon}</span><span class="fn">${f.name}</span>
          <span class="fnum">×${n}</span></button>`;
      }).join("")}
    </div>
    <button class="btn small gray" id="backCare">もどる</button>`;

  $("#backCare").onclick = () => { tap(); renderCare(); };
  $("#foodPick").querySelectorAll(".foodcard").forEach(b => {
    b.onclick = () => { tap(); feedScene(b.dataset.id); };
  });
}

/* =========================================================
   エサやり体験
   さくの そとから エサを みせる → ひつじが おくから やってくる →
   ながおしで たべさせる
   ========================================================= */
const FAR  = { x: 56,  y: 104, s: 0.26 };   // ぼくじょうの おくに いるとき
const NEAR = { x: 186, y: 203, s: 0.95 };   // さくの まえまで きたとき

// てまえの さく。ひくくして、ひつじの からだと かおが よく見えるようにする
function fenceFront(){
  let posts = "";
  for (let x = -12; x < 350; x += 54){
    posts += `<rect x="${x}" y="188" width="9" height="80" rx="4" fill="url(#fdFenceG)"/>`;
  }
  return `<g class="fencefront" filter="url(#fdSoft)">${posts}
    <rect x="-20" y="195" width="380" height="9" rx="4.5" fill="url(#fdFenceG)"/>
    <rect x="-20" y="226" width="380" height="9" rx="4.5" fill="url(#fdFenceG)"/></g>`;
}

function feedDefs(){
  return `
  <defs>
    <radialGradient id="fdGrass" cx="42%" cy="18%" r="95%">
      <stop offset="0%" stop-color="#c8f0a4"/>
      <stop offset="100%" stop-color="#8fce78"/>
    </radialGradient>
    <linearGradient id="fdFenceG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fffdf4"/>
      <stop offset="100%" stop-color="#ecdcb2"/>
    </linearGradient>
    <linearGradient id="fdHandG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffe4c4"/>
      <stop offset="100%" stop-color="#f0c294"/>
    </linearGradient>
    <filter id="fdSoft" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="3" stdDeviation="2.2" flood-color="#1f3018" flood-opacity=".22"/>
    </filter>
  </defs>`;
}

function feedScene(id){
  const d = S.data;
  const f = findFood(id);
  const hit = id === d.wantFood;
  S.useFood(id);
  useCare();

  $("#careStage").innerHTML = `
    <div class="feedwrap">
      <svg class="feedsvg" viewBox="0 0 340 260" xmlns="http://www.w3.org/2000/svg">
        ${feedDefs()}
        <rect x="-20" y="0" width="380" height="260" fill="url(#fdGrass)"/>
        <ellipse cx="30"  cy="34" rx="150" ry="40" fill="#8ad57a" opacity=".6"/>
        <ellipse cx="300" cy="28" rx="125" ry="36" fill="#7ecb6d" opacity=".55"/>
        <ellipse cx="250" cy="78" rx="16" ry="9" fill="#9bdc86" opacity=".7"/>
        <ellipse cx="96"  cy="92" rx="20" ry="10" fill="#9bdc86" opacity=".7"/>
        <g id="feedSheep"><g class="body">${sheepArt(d.color)}</g></g>
        <text id="feedMark" x="0" y="0" class="feedmark" opacity="0">！</text>
        ${fenceFront()}
        <g id="feedHand" opacity="0">
          <path d="M356,260 L350,214 Q322,188 292,176" stroke="url(#fdHandG)" stroke-width="28"
                stroke-linecap="round" fill="none"/>
          <circle cx="276" cy="173" r="18" fill="url(#fdHandG)"/>
          <text id="feedFood" x="256" y="172" text-anchor="middle" class="feedfood">${f.icon}</text>
        </g>
      </svg>
      <p class="feedmsg" id="feedMsg">${d.name}は とおくで くさを たべているよ</p>
      <div class="eatbar hide" id="eatBarWrap"><i id="eatBar"></i></div>
      <button class="btn big" id="feedBtn">${f.icon} エサを みせる</button>
    </div>`;

  const sheepG = $("#feedSheep");
  const body   = sheepG.querySelector(".body");
  const legs   = [...sheepG.querySelectorAll(".lg1,.lg2,.lg3,.lg4")];
  const hand   = $("#feedHand");
  const mark   = $("#feedMark");
  const foodEl = $("#feedFood");
  const btn    = $("#feedBtn");
  const msg    = $("#feedMsg");

  let stage = "call";          // call → coming → hold → eat → done
  let walk = 0, eat = 0, gait = 0, holding = false, releases = 0, munchT = 0;
  let raf = 0, timer = 0, last = performance.now(), alive = true;

  const ease = (k) => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

  function draw(){
    const k = ease(Math.min(1, walk));
    const eating = stage === "eat" && holding;
    const lean = (stage === "eat" || stage === "done") ? 6 : 0;    // エサに むかって のりだす
    const x = FAR.x + (NEAR.x - FAR.x) * k + lean;
    const y = FAR.y + (NEAR.y - FAR.y) * k;
    const s = FAR.s + (NEAR.s - FAR.s) * k;
    sheepG.setAttribute("transform",
      `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s.toFixed(3)}) translate(${-FOOT_X},${-FOOT_Y})`);

    const moving = stage === "coming";
    // もぐもぐ しているときは あたまを 小さく うえした させる
    const bob = moving ? Math.sin(gait * 2) * 2 : (eating ? Math.sin(gait * 3) * 2 : 0);
    const tilt = eating ? Math.sin(gait * 3) * 4 + 3 : 0;
    body.setAttribute("transform", `translate(0 ${bob.toFixed(2)}) rotate(${tilt.toFixed(1)} 64 58)`);
    for (let i = 0; i < legs.length; i++){
      const a = moving ? Math.sin(gait + LEG_PHASE[i]) * 21 : 0;
      legs[i].setAttribute("transform", `rotate(${a.toFixed(1)} ${LEG_X[i]} 48)`);
    }
    mark.setAttribute("x", (x + 4).toFixed(1));
    mark.setAttribute("y", (y - 74 * s).toFixed(1));
  }

  function step(ts){
    if (!alive) return;
    cancelAnimationFrame(raf); clearTimeout(timer);
    const dt = Math.max(0, Math.min(0.05, (ts - last) / 1000));
    last = ts;

    if (stage === "coming"){
      gait += dt * 13;
      walk += dt / 3.2;                         // 3.2びょう かけて ちかづく
      if (walk >= 1){
        walk = 1; stage = "hold";
        msg.innerHTML = `${d.name}が やってきた！<br><b>ボタンを ながおし</b>して たべさせよう`;
        btn.textContent = "ながおしして たべさせる";
        btn.classList.add("green");
        $("#eatBarWrap").classList.remove("hide");
        baa();
      }
    } else if (stage === "eat"){
      if (holding){
        gait += dt * 12;
        eat += dt / 2.4;                        // 2.4びょうで たべおわる
        munchT -= dt;
        if (munchT <= 0){ munchT = 0.26; munch(); }
        $("#eatBar").style.width = Math.min(100, eat * 100) + "%";
        foodEl.setAttribute("font-size", (30 - 22 * Math.min(1, eat)).toFixed(1));
        if (eat >= 1){ stage = "done"; finish(); return; }
      }
    }

    draw();
    raf = requestAnimationFrame(step);
    timer = setTimeout(() => step(performance.now()), 40);
  }

  function stop(){ alive = false; cancelAnimationFrame(raf); clearTimeout(timer); }

  function finish(){
    stop();
    hand.setAttribute("opacity", "0");
    const perfect = releases === 0;
    const gained = S.grow(f.up, hit ? 2 : 1);
    if (hit){ S.grow({ love: 2 }); gained.love = (gained.love || 0) + 2; }
    if (perfect){ S.grow({ love: 1 }); gained.love = (gained.love || 0) + 1; }
    (hit || perfect) ? good() : tap();
    baa();

    const face = hit ? "😍" : "😋";
    const line = hit
      ? `だいせいこう！ たべたかった <b>${f.name}</b> だった！`
      : `${f.name} を もぐもぐ たべたよ。`;
    const extra = `<div class="eat">${face}</div><p class="note">${line}${
      perfect ? "<br>いちども てを はなさずに あげられた！" : ""}</p>`;
    finishCare(`${f.name}を あげた`, gained, extra);
  }

  btn.onclick = () => {
    if (stage !== "call") return;
    stage = "coming";
    hand.setAttribute("opacity", "1");
    mark.setAttribute("opacity", "1");
    setTimeout(() => mark.setAttribute("opacity", "0"), 1200);
    msg.textContent = `${d.name}が きづいた！ こっちに くるよ…`;
    btn.disabled = true;
    baa();
    setTimeout(() => { btn.disabled = false; }, 3200);
  };

  // ながおしで たべさせる
  btn.addEventListener("pointerdown", (e) => {
    if (stage !== "hold" && stage !== "eat") return;
    e.preventDefault();
    if (stage === "hold") stage = "eat";
    holding = true;
    msg.textContent = "そのまま もっていてね…";
  });
  const release = () => {
    if (stage !== "eat" || !holding) return;
    holding = false; releases++;
    msg.textContent = "あれ？ もういちど ながおししてね";
  };
  ["pointerup", "pointerleave", "pointercancel"].forEach(ev => btn.addEventListener(ev, release));

  draw();
  raf = requestAnimationFrame(step);
  timer = setTimeout(() => step(performance.now()), 40);
}

// ---- ② ブラッシング（よごれを タップして おとす）----
export function careBrush(){
  $("#careMenu").classList.add("hide");
  $("#careStage").classList.remove("hide");
  const d = S.data;
  const N = 6;

  $("#careStage").innerHTML = `
    <p class="stagettl">よごれを ぜんぶ タップしよう！</p>
    <p class="hintline">のこり <b id="dirtLeft">${N}</b>こ　じかん <b id="brushTime">10.0</b>びょう</p>
    <div class="brusharea" id="brushArea">
      <div class="brushsheep">${sheepSVG(d.color)}</div>
    </div>`;

  const area = $("#brushArea");
  let left = N, t = 10.0, done = false;

  for (let i = 0; i < N; i++){
    const s = document.createElement("button");
    s.className = "dirt";
    s.textContent = "💦";
    s.style.left = (18 + Math.random() * 60) + "%";
    s.style.top  = (20 + Math.random() * 55) + "%";
    s.onclick = () => {
      if (done) return;
      s.classList.add("gone");
      setTimeout(() => s.remove(), 250);
      left -= 1;
      $("#dirtLeft").textContent = left;
      tap();
      if (left <= 0) end();
    };
    area.appendChild(s);
  }

  const timer = setInterval(() => {
    t -= 0.1;
    if (t <= 0){ t = 0; end(); }
    const el = $("#brushTime");
    if (el) el.textContent = t.toFixed(1);
  }, 100);

  function end(){
    if (done) return;
    done = true;
    clearInterval(timer);
    useCare();
    const cleared = N - left;
    const perfect = left === 0;
    const gained = S.grow({ love: perfect ? 5 : 2, stamina: perfect ? 1 : 1 }, 1);
    perfect ? good() : tap();
    finishCare("ブラッシングした", gained,
      `<div class="eat">${perfect ? "😊" : "🙂"}</div>
       <p class="note">${perfect ? "ピカピカに なった！ とても きもちよさそう。" : `${cleared}こ おとせた。つぎは ぜんぶ ねらおう！`}</p>`);
  }
}

// ---- ③ さんぽ（メーターを みどりで とめる）----
export function careWalk(){
  $("#careMenu").classList.add("hide");
  $("#careStage").classList.remove("hide");

  $("#careStage").innerHTML = `
    <p class="stagettl">みどりの ところで とめよう！</p>
    <p class="hintline">ちょうど まんなかだと だいせいこう</p>
    <div class="meter">
      <div class="zone ok"></div><div class="zone great"></div>
      <div class="needle" id="needle"></div>
    </div>
    <button class="btn big" id="stopBtn">とめる！</button>`;

  let x = 0, dir = 1, raf = 0, stopped = false;
  const needle = $("#needle");
  const speed = 0.9 + Math.random() * 0.35;   // 1びょうで うごく わりあい
  let last = performance.now();

  const loop = (ts) => {
    const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
    x += dir * speed * dt;
    if (x >= 1){ x = 1; dir = -1; }
    if (x <= 0){ x = 0; dir = 1; }
    needle.style.left = (x * 100) + "%";
    if (!stopped) raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  $("#stopBtn").onclick = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(raf);
    useCare();

    const dist = Math.abs(x - 0.5);      // まんなかから どれだけ ずれたか
    let gained, msg, face;
    if (dist <= 0.06){
      gained = S.grow({ stamina: 5, speed: 2 }); good();
      msg = "だいせいこう！ たっぷり あるけた。"; face = "🤩";
    } else if (dist <= 0.17){
      gained = S.grow({ stamina: 3, speed: 1 }); tap();
      msg = "せいこう！ いい さんぽに なった。"; face = "😊";
    } else {
      gained = S.grow({ stamina: 1 }); bad();
      msg = "ちょっと つかれちゃった…"; face = "😅";
    }
    finishCare("さんぽに いった", gained, `<div class="eat">${face}</div><p class="note">${msg}</p>`);
  };
}

/* =========================================================
   じはんき（エサを かう）
   ========================================================= */
export function renderShop(){
  const d = S.data;
  $("#shopMoney").textContent = d.money.toLocaleString();
  $("#shopList").innerHTML = FOODS.map(f => `
    <div class="shoprow">
      <span class="si">${f.icon}</span>
      <span class="sinfo">
        <b>${f.name}</b>
        <small>${upText(f.up)}　もっている：${d.foods[f.id] || 0}こ</small>
      </span>
      <button class="btn small buy" data-id="${f.id}" ${d.money < f.price ? "disabled" : ""}>
        ${f.price}えん
      </button>
    </div>`).join("");

  $("#shopList").querySelectorAll(".buy").forEach(b => {
    b.onclick = () => {
      const f = findFood(b.dataset.id);
      if (!S.pay(f.price)) { bad(); toast("おかねが たりないよ"); return; }
      S.addFood(f.id);
      coin();
      toast(`${f.icon} ${f.name} を かった！`);
      renderShop();
    };
  });
}

function upText(up){
  const names = { speed:"はやさ", stamina:"スタミナ", love:"なかよし" };
  return Object.entries(up).map(([k, v]) => `${names[k]}+${v}`).join(" ");
}

/* =========================================================
   ガチャ
   ========================================================= */
export function renderGacha(){
  $("#gachaResult").innerHTML = "";   // がめんを ひらいたときだけ けっかを けす
  refreshGacha();
}

// おかねと ボタンだけ かきかえる（あたったものは のこす）
function refreshGacha(){
  $("#gachaMoney").textContent = S.data.money.toLocaleString();
  $("#gachaPrice").textContent = GACHA_PRICE;
  $("#gachaBtn").disabled = S.data.money < GACHA_PRICE;
}

function drawOne(){
  const total = GACHA_POOL.reduce((a, g) => a + g.weight, 0);
  let r = Math.random() * total;
  for (const g of GACHA_POOL){
    r -= g.weight;
    if (r <= 0) return g;
  }
  return GACHA_POOL[0];
}

let pulling = false;

export function pullGacha(){
  if (pulling) return;
  if (!S.pay(GACHA_PRICE)) { bad(); toast("おかねが たりないよ"); return; }
  const g = drawOne();

  let icon, name, note = "";
  if (g.kind === "food"){
    const f = findFood(g.id); S.addFood(g.id);
    icon = f.icon; name = f.name; note = "エサが 1こ ふえた！";
  } else if (g.kind === "item"){
    const it = findItem(g.id); S.addItem(g.id);
    icon = it.icon; name = it.name; note = it.desc;
  } else if (g.kind === "skill"){
    const sk = findSkill(g.id);
    const isNew = S.addSkill(g.id);
    icon = sk.icon; name = sk.name;
    note = isNew ? sk.desc : "もう もっていたので エサに かわった！";
    if (!isNew) S.addFood("ringo");
  } else {
    S.earn(g.amount);
    icon = "💰"; name = yen(g.amount); note = "おかねが ふえた！";
  }

  S.addLog(`ガチャで ${name} を あてた`);
  playGachaShow(g, icon, name, note);
}

/* ガチャの えんしゅつ
   ①ハンドルが まわる ②カプセルが とびだす ③カプセルが われて けっか  */
function playGachaShow(g, icon, name, note){
  pulling = true;
  const rare = !!g.rare;
  const box = $("#gachaBox");
  const stage = $("#gachaResult");
  $("#gachaBtn").disabled = true;

  box.classList.add("shake");
  stage.innerHTML = "";

  // ① ハンドルを まわす おと
  let clicks = 0;
  const clickTimer = setInterval(() => {
    sound(240 + clicks * 30, 0.05, "square", 0.1);
    if (++clicks >= 5) clearInterval(clickTimer);
  }, 170);

  // ② カプセルが とびだす（いろで レアさが わかる ＝ ドキドキする ところ）
  setTimeout(() => {
    box.classList.remove("shake");
    box.classList.add("drop");
    stage.innerHTML = `<div class="capsule ${rare ? "gold" : ""}"><span></span></div>`;
    sound(660, 0.12, "triangle", 0.16);
    if (rare) setTimeout(() => sound(880, 0.14, "triangle", 0.16), 160);
  }, 950);

  // ③ カプセルが われる
  setTimeout(() => {
    box.classList.remove("drop");
    const cap = stage.querySelector(".capsule");
    if (cap) cap.classList.add("open");
    sound(1200, 0.1, "square", 0.16);
  }, 1850);

  // ④ けっかを だす
  setTimeout(() => {
    stage.innerHTML = `
      ${rare ? `<div class="rays"></div><div class="rarebanner">レア！</div>` : ""}
      <div class="gacharesult ${rare ? "rare" : ""}">
        <div class="gicon">${icon}</div>
        <div class="gname">${name}</div>
        <div class="gnote">${note}</div>
      </div>`;
    rare ? (good(), confetti(60)) : coin();
    pulling = false;
    refreshGacha();
  }, 2150);
}

/* =========================================================
   もちもの（わざ・どうぐの そうび）
   ========================================================= */
export function renderBag(){
  const d = S.data;

  $("#bagSkills").innerHTML = SKILLS.filter(s => d.skills.includes(s.id)).map(s => `
    <button class="pickrow ${d.equipSkill === s.id ? "sel" : ""}" data-skill="${s.id}">
      <span class="pi">${s.icon}</span>
      <span class="pinfo"><b>${s.name}</b><small>${s.desc}</small></span>
      <span class="pmark">${d.equipSkill === s.id ? "そうび中" : "えらぶ"}</span>
    </button>`).join("");

  const counts = {};
  d.items.forEach(i => counts[i] = (counts[i] || 0) + 1);
  const rows = Object.entries(counts).map(([id, n]) => {
    const it = findItem(id);
    return `<button class="pickrow ${d.equipItem === id ? "sel" : ""}" data-item="${id}">
      <span class="pi">${it.icon}</span>
      <span class="pinfo"><b>${it.name}</b><small>${it.desc}</small></span>
      <span class="pmark">${d.equipItem === id ? "そうび中" : `×${n}`}</span>
    </button>`;
  }).join("");
  $("#bagItems").innerHTML = rows || `<p class="note">どうぐは まだ ないよ。ガチャで あてよう！</p>`;

  $("#bagItemNone").classList.toggle("sel", !d.equipItem);

  $("#bagSkills").querySelectorAll("[data-skill]").forEach(b => {
    b.onclick = () => { tap(); d.equipSkill = b.dataset.skill; S.save(); renderBag(); };
  });
  $("#bagItems").querySelectorAll("[data-item]").forEach(b => {
    b.onclick = () => { tap(); d.equipItem = b.dataset.item; S.save(); renderBag(); };
  });
  $("#bagItemNone").onclick = () => { tap(); d.equipItem = null; S.save(); renderBag(); };
}
