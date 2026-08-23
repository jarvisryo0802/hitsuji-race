// ===== まかいの ひつじレース：ゲームのデータ =====
// ここの すうじを かえると ゲームバランスが かわります。

export const START_MONEY  = 1000;  // さいしょに もっている おかね
export const ALLOWANCE    = 300;   // まいにち もらえる おこづかい
export const CARE_PER_DAY = 3;     // 1日に できる おせわの かず
export const GACHA_PRICE  = 300;   // ガチャ 1かいの ねだん
// レース・おさんぽやぎ・じょうばたいけんは 回数せいげん なし。
// おかねが ある かぎり なんかいでも あそべる（そのかわり おかねが かかる）
export const RACE_PRICE   = 500;   // レース 1かいの さんかひ
export const GOAT_PRICE   = 500;   // おさんぽ やぎ 1かいの りょうきん
export const HORSE_PRICE  = 800;   // じょうばたいけん 1かいの りょうきん
export const LAPS         = 1;     // レースの しゅうかいすう（おおきな コースを 1しゅう）
// コーナーの げんそくや ばてる ぶんが あるので、じっさいは この 1.1ばい くらいに なる
export const RACE_SECONDS = 30;    // レース1かいの めやす（びょう）
export const RUNNERS      = 4;     // レースに でる ひつじの かず（じぶん＋ライバル）
export const PRIZE        = [1000, 500, 250, 100];     // 1い〜4いの しょうきん

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

// ---- おさんぽ やぎ ----
// ルーレットで レベル(1〜10)が でる おもさ。たかいレベルほど でにくい
export const goatLevelWeight = (lv) => 11 - lv;
export const GOAT_SUCCESS_M  = 40;   // これより とおくまで あるけたら「せいこう」で ごほうび

// レベルの はんいごとの ごほうび（weight が おおきいほど よく でる）
export const GOAT_REWARDS = [
  { min:1, max:3, pool:[
    { kind:"food",  id:"hoshikusa", weight:14 },
    { kind:"food",  id:"ninjin",    weight:14 },
    { kind:"food",  id:"pan",       weight:12 },
    { kind:"money", amount:50,      weight:10 },
  ]},
  { min:4, max:6, pool:[
    { kind:"food", id:"kyabetsu", weight:14 },
    { kind:"food", id:"ringo",    weight:10 },
    { kind:"item", id:"shoes",    weight:12 },
    { kind:"item", id:"omamori",  weight:12 },
    { kind:"money", amount:150,   weight:8  },
  ]},
  { min:7, max:8, pool:[
    { kind:"food", id:"tokusei", weight:10, rare:true },
    { kind:"item", id:"drink",   weight:14 },
    { kind:"item", id:"ribbon",  weight:10, rare:true },
    { kind:"money", amount:300,  weight:10 },
  ]},
  { min:9, max:10, pool:[
    { kind:"item",  id:"ribbon",   weight:14, rare:true },
    { kind:"skill", id:"jama",     weight:12, rare:true },
    { kind:"skill", id:"mofumofu", weight:12, rare:true },
    { kind:"money", amount:500,    weight:8,  rare:true },
  ]},
];
export const findGoatRewardPool = (level) =>
  (GOAT_REWARDS.find(t => level >= t.min && level <= t.max) || GOAT_REWARDS[0]).pool;

// ---- 乗馬たいけん（ジャンプで しょうがいぶつを こえる エンドレスゲーム）----
// とおくまで すすむほど しょうがいぶつが おおきく・ひんぱんに なる。
// たかさは いつも ジャンプの MAX_CLEAR より ひくく なるように しておく（ぜったいに こえられない、が おきないように）
// ひくく・ふわっと とぶように（たかさ ひかえめ、たいくうじかんは ながめ）
export const HORSE_GRAVITY  = 540;    // じゅうりょく（1びょうの おちるはやさの ぞうか）
export const HORSE_JUMP_V   = 245;    // ジャンプの はじめの はやさ（さいこうたかさ ≒ 56）
export const HORSE_STAGES = [
  { m:0,   speed:170, h:[16, 22], w:[20, 26], gap:[250, 330] },
  { m:100, speed:200, h:[20, 28], w:[24, 32], gap:[215, 295] },
  { m:250, speed:235, h:[26, 34], w:[28, 38], gap:[185, 260] },
  { m:450, speed:270, h:[30, 40], w:[32, 44], gap:[160, 230] },
  { m:700, speed:310, h:[34, 46], w:[36, 50], gap:[145, 210] },
];
export const HORSE_LIVES = 3;         // これに たっしたら おわり

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
  start:  ["スタート！", "いっせいに とびだした！", "レースが はじまった！"],
  corner: ["コーナーに はいった！", "カーブを まがる！", "インを せめる！"],
  lastLap:["さいしゅうしゅう！", "のこり 1しゅう！"],
  lead:   ["が せんとうに たった！", "が とびだした！", "が とっぷに おどりでた！"],
  final:  ["さいごの ちょくせん！", "ゴールは すぐそこ！", "ラストスパート！"],
  close:  ["だんごレースだ！", "よこならびで あらそう！", "きわどい！"],
  gap:    ["が ぐんぐん にげる！", "が リードを ひろげた！"],
  chase:  ["が おいあげてきた！", "が すごい いきおいだ！"],
};

export const findFood  = (id) => FOODS.find(f => f.id === id);
export const findSkill = (id) => SKILLS.find(s => s.id === id);
export const findItem  = (id) => ITEMS.find(i => i.id === id);
