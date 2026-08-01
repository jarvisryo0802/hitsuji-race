// ===== まかいの ひつじレース：ゲームのデータ =====
// ここの すうじを かえると ゲームバランスが かわります。

export const START_MONEY  = 1000;  // さいしょに もっている おかね
export const ALLOWANCE    = 300;   // まいにち もらえる おこづかい
export const CARE_PER_DAY = 3;     // 1日に できる おせわの かず
export const RACE_PER_DAY = 1;     // 1日に でられる レースの かず
export const GACHA_PRICE  = 300;   // ガチャ 1かいの ねだん
export const LAPS         = 2;     // レースの しゅうかいすう
// コーナーの げんそくや ばてる ぶんが あるので、じっさいは この 1.1ばい くらいに なる
export const RACE_SECONDS = 30;    // レース1かいの めやす（びょう）
export const PRIZE        = [1000, 500, 300, 100, 0];  // 1い〜5いの しょうきん

// ---- エサ（じはんき）----
// hint は「きょう たべたいもの」の なぞなぞヒント
export const FOODS = [
  { id:"hoshikusa", name:"ほしくさ",     icon:"🌾", price:100, up:{ stamina:3 },
    hint:"きいろくて ふわふわの くさ" },
  { id:"ninjin",    name:"にんじん",     icon:"🥕", price:100, up:{ speed:3 },
    hint:"あかくて ほそながい やさい" },
  { id:"pan",       name:"パン",         icon:"🍞", price:100, up:{ love:3 },
    hint:"ふんわり やけた いいにおいの もの" },
  { id:"kyabetsu",  name:"キャベツ",     icon:"🥬", price:200, up:{ stamina:2, love:2 },
    hint:"みどりで まるくて はっぱが かさなった やさい" },
  { id:"ringo",     name:"りんご",       icon:"🍎", price:300, up:{ speed:2, stamina:2, love:2 },
    hint:"あかくて あまい くだもの" },
  { id:"tokusei",   name:"とくせいエサ", icon:"🍱", price:500, up:{ speed:4, stamina:4, love:1 },
    hint:"ぼくじょうの ひみつの ごはん" },
];

// ---- わざ（レースで 1かいだけ つかえる）----
// best: つかうと よい ばめん。"corner"=カーブ, "last"=ゴールまえ, "front"=まえに ひつじがいるとき
export const SKILLS = [
  { id:"dash",      name:"ダッシュ",         icon:"💨", power:1.30, dur:5.0,
    desc:"5びょうかん はやくなる",            tip:"いつ つかっても おなじ" },
  { id:"corner",    name:"コーナーマスター", icon:"🌀", power:1.26, dur:5.0, best:"corner",
    desc:"カーブで つかうと すごくはやい",    tip:"カーブの とちゅうで つかおう" },
  { id:"konjo",     name:"ふんばり",         icon:"🔥", power:1.26, dur:6.0, best:"last",
    desc:"ゴールが ちかいほど つよい",        tip:"さいごの ちょくせんで つかおう" },
  { id:"jama",      name:"おじゃま！",       icon:"🌪", power:1.14, dur:4.0, best:"front",
    desc:"まえの ひつじを おそくする",        tip:"まえに ひつじが いるときに" },
  { id:"nakayoshi", name:"なかよしパワー",   icon:"💖", power:1.18, dur:6.0, love:true,
    desc:"なかよし度が たかいほど つよい",    tip:"いつ つかっても OK" },
  { id:"mofumofu",  name:"もふもふバリア",   icon:"🛡", power:1.20, dur:6.0, guard:true,
    desc:"おじゃまを ふせいで はやくなる",    tip:"いつ つかっても OK" },
];

// ステータスが この あたいを こえると わざを おぼえる
export const SKILL_UNLOCK = {
  corner:    { stat:"speed",   need:25 },
  konjo:     { stat:"stamina", need:25 },
  nakayoshi: { stat:"love",    need:25 },
};

// ---- どうぐ（レースで 1かい つかうと なくなる）----
export const ITEMS = [
  { id:"shoes",   name:"はやおきのくつ", icon:"👟", desc:"スタートから しばらく はやい" },
  { id:"omamori", name:"おまもり",       icon:"🍀", desc:"おじゃまを ふせぐ" },
  { id:"drink",   name:"げんきドリンク", icon:"🥤", desc:"さいごまで バテない" },
  { id:"ribbon",  name:"ラッキーリボン", icon:"🎀", desc:"ときどき グーンと のびる" },
];

// ---- ぼくじょうの なかま（ライバル）----
export const RIVALS = [
  { name:"ふわり",   color:"#3fa3f5" },
  { name:"くるりん", color:"#ffb02e" },
  { name:"しろっぷ", color:"#4ec26a" },
  { name:"ぽんた",   color:"#a97cff" },
  { name:"めーこ",   color:"#ff7a4d" },
  { name:"だいふく", color:"#59c8d6" },
  { name:"きなこ",   color:"#c9a06a" },
];

// ---- じぶんの ひつじの いろ ----
export const MY_COLORS = ["#ff6b9d", "#3fa3f5", "#ffb02e", "#4ec26a", "#a97cff", "#ff7a4d"];

// ---- なまえの こうほ ----
export const NAME_IDEAS = ["もこもこ", "ゆきちゃん", "ふわた", "こむぎ", "だんご", "らむね"];

// ---- ガチャ（weight が おおきいほど よく でる）----
export const GACHA_POOL = [
  { kind:"food",  id:"hoshikusa", weight:16 },
  { kind:"food",  id:"ninjin",    weight:16 },
  { kind:"food",  id:"pan",       weight:16 },
  { kind:"food",  id:"kyabetsu",  weight:10 },
  { kind:"food",  id:"ringo",     weight:7  },
  { kind:"food",  id:"tokusei",   weight:3, rare:true },
  { kind:"item",  id:"shoes",     weight:7  },
  { kind:"item",  id:"omamori",   weight:7  },
  { kind:"item",  id:"drink",     weight:5  },
  { kind:"item",  id:"ribbon",    weight:4, rare:true },
  { kind:"skill", id:"jama",      weight:3, rare:true },
  { kind:"skill", id:"mofumofu",  weight:2, rare:true },
  { kind:"money", amount:100,     weight:8  },
  { kind:"money", amount:500,     weight:3, rare:true },
];

// ---- レースの じっきょう ----
export const CALLOUTS = {
  start:  ["スタート！", "いっせいに とびだした！"],
  corner: ["コーナーに はいった！", "カーブを まがる！"],
  lastLap:["さいしゅうしゅう！", "のこり 1しゅう！"],
  lead:   ["が せんとうに たった！", "が とびだした！"],
  final:  ["さいごの ちょくせん！", "ゴールは すぐそこ！"],
};

export const findFood  = (id) => FOODS.find(f => f.id === id);
export const findSkill = (id) => SKILLS.find(s => s.id === id);
export const findItem  = (id) => ITEMS.find(i => i.id === id);
