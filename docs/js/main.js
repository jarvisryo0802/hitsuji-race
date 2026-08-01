// ===== がめんの つなぎ =====
import { MY_COLORS, NAME_IDEAS, ALLOWANCE } from "./data.js";
import * as S from "./save.js";
import { sheepSVG } from "./sheep.js";
import { $, $$, show, current, tap, coin, toast, dialog, muted, setMuted, yen } from "./ui.js";
import * as F from "./farm.js";
import * as R from "./race.js";

// あたらしい バージョンに いれかえる ための めじるし
let reloading = false, pendingReload = false;

/* ---------- はじめての とうろく ---------- */
function renderBoot(){
  let color = MY_COLORS[0], name = NAME_IDEAS[0];

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

  // < > & は がめんが こわれる もとに なるので とりのぞく
  const clean = (s) => s.replace(/[<>&"']/g, "").trim().slice(0, 8);

  $("#bootName").oninput = (e) => { name = clean(e.target.value); };
  $("#bootGo").onclick = () => {
    const n = clean($("#bootName").value || "") || NAME_IDEAS[0];
    S.data.name = n;
    S.data.color = color;
    S.save();
    tap();
    startDay();
  };
  show("boot");
}

/* ---------- 1日の はじまり ---------- */
function startDay(){
  const got = S.newDay();
  show("farm");
  F.renderFarm();
  if (got) setTimeout(() => {
    coin();
    toast(`きょうの おこづかい <b>${yen(got)}</b> を もらった！`, 2400);
  }, 400);
}

/* ---------- ボタンの わりあて ---------- */
function wire(){
  let bagFrom = "farm";   // もちものを どこから ひらいたか

  // ぼくじょう
  $("#btnCare").onclick  = () => { tap(); show("care");  F.renderCare(); };
  $("#btnRace").onclick  = () => { tap(); show("ready"); R.renderReady(); };
  $("#btnShop").onclick  = () => { tap(); show("shop");  F.renderShop(); };
  $("#btnGacha").onclick = () => { tap(); show("gacha"); F.renderGacha(); };
  $("#btnBag").onclick   = () => { tap(); bagFrom = "farm"; show("bag"); F.renderBag(); };

  // おせわの メニュー
  $("#careFood").onclick  = () => { tap(); F.careFood(); };
  $("#careBrush").onclick = () => { tap(); F.careBrush(); };
  $("#careWalk").onclick  = () => { tap(); F.careWalk(); };

  // もどる（もちものは きた みちに もどる）
  $$(".backBtn").forEach(b => b.onclick = () => {
    tap();
    const here = b.closest(".screen").id;
    if (here === "bag" && bagFrom === "ready"){ bagFrom = "farm"; show("ready"); R.renderReady(); return; }
    show("farm"); F.renderFarm();
  });

  // じはんき・ガチャ・もちもの
  $("#gachaBtn").onclick = () => { tap(); F.pullGacha(); };

  // レース
  $("#readyGo").onclick   = () => { tap(); R.startRace(); };
  $("#readyBag").onclick  = () => { tap(); bagFrom = "ready"; show("bag"); F.renderBag(); };
  $("#resultBack").onclick= () => {
    tap();
    // レース中に あたらしい バージョンが きていたら ここで いれかえる
    if (pendingReload && !reloading){ reloading = true; location.reload(); return; }
    show("farm"); F.renderFarm();
  };

  // おと
  const mb = $("#muteBtn");
  mb.textContent = muted ? "🔇" : "🔊";
  mb.onclick = () => {
    setMuted(!muted);
    mb.textContent = muted ? "🔇" : "🔊";
    if (!muted) tap();
  };

  // よこむき ちゅうい
  document.addEventListener("gesturestart", e => e.preventDefault());

  // おとなメニュー：タイトルを ながおしで データを けす
  let hold = 0;
  const sign = $("#farmSign");
  const startHold = () => {
    hold = setTimeout(async () => {
      const ok = await dialog({
        title: "データを けしますか？",
        body: "そだてた ひつじ・おかね・もちものが ぜんぶ きえます。<br>もとには もどせません。",
        ok: "けす", cancel: "やめる",
      });
      if (ok){ S.reset(); location.reload(); }
    }, 2000);
  };
  const endHold = () => clearTimeout(hold);
  sign.addEventListener("pointerdown", startHold);
  ["pointerup", "pointerleave", "pointercancel"].forEach(e => sign.addEventListener(e, endHold));
}

/* ---------- はじめる ---------- */
S.load();
wire();
if (S.isNew()) renderBoot();
else startDay();

// いちど ひらいておけば、つぎからは ネットに つながっていなくても あそべる
if ("serviceWorker" in navigator && location.protocol.startsWith("http")){
  // すでに ふるい ばーじょんが うごいていたか（はじめての とうろくと 見わけるため）
  const had = !!navigator.serviceWorker.controller;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!had || reloading) return;
    // レースの とちゅうで きりかわると こまるので、おわってから いれかえる
    if (current() === "race"){ pendingReload = true; return; }
    reloading = true;
    location.reload();
  });

  window.addEventListener("load", () => {
    // updateViaCache:"none" にしないと、ブラウザが ふるい sw.js を つかいまわして
    // あたらしい バージョンに きりかわらないことがある
    navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" })
      .then(reg => reg.update())
      .catch(() => {});
  });
}
