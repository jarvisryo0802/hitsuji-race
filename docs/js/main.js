// ===== がめんの つなぎ =====
import { MY_COLORS, NAME_IDEAS, ALLOWANCE, GACHA_PRICE, findFood } from "./data.js";
import * as S from "./save.js";
import { sheepSVG } from "./sheep.js";
import { $, $$, show, current, tap, coin, toast, dialog, say, muted, setMuted, yen,
         startMusic, startFarmMusic } from "./ui.js";
import * as F from "./farm.js";
import * as R from "./race.js";
import * as M from "./map.js";

// あたらしい バージョンに いれかえる ための めじるし
let reloading = false, pendingReload = false;

/* ---------- はじめての とうろく ---------- */
function renderBoot(){
  let color = MY_COLORS[0], name = NAME_IDEAS[0];
  const clean = (s) => s.replace(/[<>&"']/g, "").trim().slice(0, 8);

  const paint = () => {
    $("#bootSheep").innerHTML = sheepSVG(color, { run:true });
    $("#bootColors").innerHTML = MY_COLORS.map(c =>
      `<button class="cchip ${c === color ? "sel" : ""}" data-c="${c}" style="background:${c}"></button>`).join("");
    $("#bootIdeas").innerHTML = NAME_IDEAS.map(n =>
      `<button class="chip ${n === name ? "sel" : ""}" data-n="${n}">${n}</button>`).join("");
    $("#bootName").value = name;
    $$("[data-c]", $("#bootColors")).forEach(b => b.onclick = () => { tap(); color = b.dataset.c; paint(); });
    $$("[data-n]", $("#bootIdeas")).forEach(b => b.onclick = () => { tap(); name = b.dataset.n; paint(); });
  };
  paint();

  $("#bootName").oninput = (e) => { name = clean(e.target.value); };
  $("#bootGo").onclick = async () => {
    S.data.name = clean($("#bootName").value || "") || NAME_IDEAS[0];
    S.data.color = color;
    S.save();
    tap();
    startDay(true);
  };
  show("boot");
}

/* ---------- ぼくじょうに はいる ---------- */
function goMap(){
  M.stopMap();
  show("map");
  M.refreshHud();
  M.startMap();
}

async function startDay(first = false){
  const got = S.newDay();
  M.buildMap();
  goMap();
  if (first){
    await say("スタッフの おねえさん",
      `ようこそ まきばへ！<br>あなたの あいぼうの <b>${S.data.name}</b> は むこうの さくに いるよ。<br>がめんを ゆびで おして あるいてみてね。`);
  }
  if (got){
    coin();
    await say("スタッフの おねえさん", `きょうの おこづかい <b>${yen(got)}</b> を どうぞ！`);
    M.refreshHud();
  }
}

/* ---------- ばしょごとの できること ---------- */
async function doSpot(sp){
  if (!sp) return;
  M.stopMap();
  const d = S.data;

  if (sp.id === "pen"){
    const care = d.careLeft;
    const choices = [
      { label:"🍽 ごはんを あげる", value:"food" },
      { label:"🧽 ブラッシング",   value:"brush" },
      { label:"🥾 さんぽ",         value:"walk" },
      { label:"やめる",            value:null },
    ];
    const body = `<div class="statbox">${F.sheepStatusHTML()}</div>
      「${F.wantHint()} が たべたいなあ」<br>
      <small>きょう おせわ できるのは あと ${care}かい</small>`;
    if (care <= 0){
      await say(d.name, `${body}<br>きょうは もう おなかいっぱい！ また あした あそぼうね。`);
      return goMap();
    }
    const pick = await say(d.name, body, choices);
    if (!pick) return goMap();
    show("care");
    F.renderCare();
    if (pick === "food")  F.careFood();
    if (pick === "brush") F.careBrush();
    if (pick === "walk")  F.careWalk();
    return;
  }

  if (sp.id === "shop"){
    await shopTalk();
    return goMap();
  }

  if (sp.id === "gacha"){
    if (d.money < GACHA_PRICE){
      await say("ガチャ", `1かい <b>${GACHA_PRICE}えん</b> だよ。<br>おかねが たりないみたい…`);
      return goMap();
    }
    const ok = await say("ガチャ", `1かい <b>${GACHA_PRICE}えん</b>。まわしてみる？`, [
      { label:"まわす", value:true }, { label:"やめる", value:false },
    ]);
    if (!ok) return goMap();
    show("gacha"); F.renderGacha(); F.pullGacha();
    return;
  }

  if (sp.id === "race"){
    if (d.raceLeft <= 0){
      await say("スタッフの おにいさん", "きょうの レースは おわっちゃった！<br>また あした きてね。");
      return goMap();
    }
    const ok = await say("スタッフの おにいさん",
      `きょうの レースが はじまるよ！<br><b>${d.name}</b>で しゅつじょうする？`, [
        { label:"でる！", value:true }, { label:"まだ やめておく", value:false },
      ]);
    if (!ok) return goMap();
    show("ready"); R.renderReady();
    return;
  }

  if (sp.id === "staff"){
    await staffTalk();
    return goMap();
  }

  if (sp.id === "goats" || sp.id === "horse"){
    await say("スタッフの おにいさん", "ここは いま じゅんびちゅうです。<br>もう すこし まっててね！");
    return goMap();
  }
  goMap();
}

/* ---------- じはんき（どうぶつの森みたいな かいもの）---------- */
async function shopTalk(){
  const d = S.data;
  const foods = (await import("./data.js")).FOODS;
  while (true){
    const choices = foods.map(f => ({
      label: `${f.icon} ${f.name}  ${f.price}えん${d.money < f.price ? "（たりない）" : ""}`,
      value: f.id,
    }));
    choices.push({ label:"かうのを やめる", value:null });

    const pick = await say("エサの じはんき",
      `もっている おかね：<b>${d.money.toLocaleString()}えん</b><br>どれに する？`, choices);
    if (!pick) return;

    const f = foods.find(x => x.id === pick);
    if (d.money < f.price){
      await say("エサの じはんき", "ごめんね、おかねが たりないみたい…");
      continue;
    }
    S.pay(f.price);
    S.addFood(f.id);
    coin();
    M.refreshHud();
    const more = await say("エサの じはんき",
      `${f.icon} <b>${f.name}</b> が でてきた！<br>もっている かず：${d.foods[f.id]}こ<br>まだ かう？`, [
        { label:"もっと かう", value:true }, { label:"もう いい", value:false },
      ]);
    if (!more) return;
  }
}

/* ---------- スタッフとの おしゃべり ---------- */
async function staffTalk(){
  const d = S.data;
  const lines = [
    `こんにちは！ きょうは <b>${d.days}日め</b> だね。`,
    `<b>${d.name}</b>は いま <b>${S.rank()}</b> ランクだよ。`,
    `レースの わざは <b>もちもの</b>（かばんの ボタン）で かえられるよ。`,
    `エサは その日 たべたい ものを あげると ぐんと そだつよ。`,
    `おせわを たくさんすると あたらしい わざを おぼえるんだ。`,
  ];
  const pick = await say("スタッフの おねえさん",
    `いらっしゃい！ なにか きく？`, [
      { label:"きょうの ヒント", value:"hint" },
      { label:"ひつじの ぐあいは？", value:"stat" },
      { label:"なんでもない", value:null },
    ]);
  if (pick === "hint") await say("スタッフの おねえさん", lines[Math.floor(Math.random() * lines.length)]);
  if (pick === "stat") await say("スタッフの おねえさん",
    `<div class="statbox">${F.sheepStatusHTML()}</div>きょうは 「${F.wantHint()}」が たべたいみたいよ。`);
}

/* ---------- ボタンの わりあて ---------- */
function wire(){
  let bagFrom = "map";

  F.setBackToMap(() => { M.refreshHud(); goMap(); });

  $("#actBtn").onclick = () => { tap(); doSpot(M.nearSpot()); };
  $("#mapBag").onclick = () => { tap(); bagFrom = "map"; M.stopMap(); show("bag"); F.renderBag(); };

  // ⚙ メニュー（リセットは ここ）
  $("#mapMenu").onclick = async () => {
    tap(); M.stopMap();
    const pick = await say("メニュー", "なにを する？", [
      { label:"あそびかたを みる", value:"help" },
      { label:"🔄 さいしょから やりなおす", value:"reset" },
      { label:"とじる", value:null },
    ]);
    if (pick === "help"){
      await say("あそびかた",
        `がめんを ゆびで おすと あるけるよ。<br>
         ばしょに ちかづくと したに ボタンが でるので、それを おしてね。<br>
         1日に おせわ3かい・レース1かい あそべるよ。`);
    }
    if (pick === "reset"){
      const ok = await dialog({
        title: "さいしょから やりなおす？",
        body: "そだてた ひつじ・おかね・もちものが ぜんぶ きえます。<br>もとには もどせません。",
        ok: "けす", cancel: "やめる",
      });
      if (ok){ S.reset(); location.reload(); return; }
    }
    goMap();
  };

  // おせわの メニュー（さくの かいわから ひらく）
  $("#careFood").onclick  = () => { tap(); F.careFood(); };
  $("#careBrush").onclick = () => { tap(); F.careBrush(); };
  $("#careWalk").onclick  = () => { tap(); F.careWalk(); };

  // もどる
  $$(".backBtn").forEach(b => b.onclick = () => {
    tap();
    const here = b.closest(".screen").id;
    if (here === "bag" && bagFrom === "ready"){ bagFrom = "map"; show("ready"); R.renderReady(); return; }
    M.refreshHud(); goMap();
  });

  $("#gachaBtn").onclick  = () => { tap(); F.pullGacha(); };
  $("#readyGo").onclick   = () => { tap(); R.startRace(); };
  $("#readyBag").onclick  = () => { tap(); bagFrom = "ready"; show("bag"); F.renderBag(); };
  $("#resultBack").onclick= () => {
    tap();
    if (pendingReload && !reloading){ reloading = true; location.reload(); return; }
    M.refreshHud(); goMap();
  };

  const mb = $("#muteBtn");
  mb.textContent = muted ? "🔇" : "🔊";
  mb.onclick = () => {
    setMuted(!muted);
    mb.textContent = muted ? "🔇" : "🔊";
    if (!muted){
      tap();
      if (current() === "race") startMusic();
      if (current() === "map") startFarmMusic();
    }
  };

  document.addEventListener("gesturestart", e => e.preventDefault());
}

/* ---------- はじめる ---------- */
S.load();
wire();
if (S.isNew()) renderBoot();
else startDay();

// いちど ひらいておけば、つぎからは ネットに つながっていなくても あそべる
if ("serviceWorker" in navigator && location.protocol.startsWith("http")){
  const had = !!navigator.serviceWorker.controller;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!had || reloading) return;
    if (current() === "race"){ pendingReload = true; return; }
    reloading = true;
    location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" })
      .then(reg => reg.update())
      .catch(() => {});
    setTimeout(primeCache, 2500);
  });
}

// ブラウザに よっては ServiceWorker の install が はしらず、
// ファイルが ためこまれない ことがある。その ときは ページのほうから ためこむ。
async function primeCache(){
  try {
    const c = await fetch("./precache.json", { cache: "no-store" }).then(r => r.json());
    const box = await caches.open(c.cache);
    if ((await box.keys()).length >= c.files.length) return;
    // ふるい ファイルが まざらないよう、かならず ネットから とりなおす
    await Promise.all(c.files.map(f =>
      fetch(f, { cache: "reload" })
        .then(res => (res.ok ? box.put(f, res) : null))
        .catch(() => null)));
  } catch (e) {}
}
