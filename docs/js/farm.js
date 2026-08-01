// ===== ぼくじょう・キッズファーム（おせわ）・じはんき・ガチャ =====
import {
  FOODS, ITEMS, SKILLS, GACHA_POOL, GACHA_PRICE, CARE_PER_DAY,
  findFood, findSkill, findItem,
} from "./data.js";
import * as S from "./save.js";
import { sheepSVG, happySheep } from "./sheep.js";
import { $, show, tap, good, bad, coin, toast, dialog, confetti, yen } from "./ui.js";

/* =========================================================
   ぼくじょう（ホーム）
   ========================================================= */
export function renderFarm(){
  const d = S.data;
  $("#farmName").textContent = d.name;
  $("#farmRank").textContent = S.rank();
  $("#farmMoney").textContent = d.money.toLocaleString();
  $("#farmSheep").innerHTML = happySheep(d.color, 170);
  $("#farmDays").textContent = d.days;

  bars();

  // きょう たべたいもの の ヒント
  const want = findFood(d.wantFood);
  $("#farmWant").innerHTML = `<b>${d.name}</b>のこえ：「${want.hint} が たべたいなあ」`;

  $("#careLeft").textContent = d.careLeft;
  $("#raceLeft").textContent = d.raceLeft;
  $("#btnCare").disabled = d.careLeft <= 0;
  $("#btnRace").disabled = d.raceLeft <= 0;
  $("#btnCare").querySelector(".sub").textContent =
    d.careLeft > 0 ? `あと ${d.careLeft}かい` : "きょうは おしまい";
  $("#btnRace").querySelector(".sub").textContent =
    d.raceLeft > 0 ? "1日 1かい" : "また あした";

  const log = d.log.length
    ? d.log.map(l => `<li>${l.t}</li>`).join("")
    : "<li>まだ なにも していないよ</li>";
  $("#farmLog").innerHTML = log;
}

function bars(){
  const d = S.data;
  const set = (id, v) => {
    $(id + "Val").textContent = v;
    $(id + "Bar").style.width = Math.min(100, v) + "%";
  };
  set("#stSpeed", d.speed);
  set("#stStam",  d.stamina);
  set("#stLove",  d.love);
}

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
    else { show("farm"); renderFarm(); }
  };
  S.addLog(title);
  bars();
}

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
    b.onclick = () => feed(b.dataset.id);
  });
}

function feed(id){
  const d = S.data;
  const f = findFood(id);
  const hit = id === d.wantFood;
  S.useFood(id);
  useCare();

  const gained = S.grow(f.up, hit ? 2 : 1);
  if (hit) S.grow({ love: 2 }, 1), gained.love = (gained.love || 0) + 2;

  hit ? good() : tap();
  const face = hit ? "😍" : "😋";
  const extra = `
    <div class="eat">${face}</div>
    <p class="note">${hit ? `だいせいこう！ たべたかった <b>${f.name}</b> だ！` : `${f.name} を もぐもぐ たべた。`}</p>`;
  finishCare(`${f.name}を あげた`, gained, extra);
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

export function pullGacha(){
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

  $("#gachaResult").innerHTML = `
    <div class="gacharesult ${g.rare ? "rare" : ""}">
      <div class="gicon">${icon}</div>
      <div class="gname">${name}</div>
      <div class="gnote">${note}</div>
    </div>`;
  g.rare ? (good(), confetti(40)) : coin();
  S.addLog(`ガチャで ${name} を あてた`);
  refreshGacha();
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
