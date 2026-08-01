// ===== セーブデータと 1日の きりかえ =====
import { START_MONEY, ALLOWANCE, CARE_PER_DAY, RACE_PER_DAY, FOODS, SKILL_UNLOCK } from "./data.js";

const KEY = "makainoSheepRace";

// きょうの ひづけを "2026-08-01" のかたちで かえす（時差の えいきょうを うけない ローカル日付）
export function today(d = new Date()){
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function blank(){
  return {
    v: 1,
    name: "", color: "#ff6b9d",
    speed: 10, stamina: 10, love: 10,
    money: START_MONEY,
    foods: { hoshikusa: 2, ninjin: 1 },   // もっている エサ
    skills: ["dash"],
    items: [],
    equipSkill: "dash",
    equipItem: null,
    careLeft: CARE_PER_DAY,
    raceLeft: RACE_PER_DAY,
    lastDay: "",
    wantFood: "ninjin",     // きょう たべたいもの
    days: 0, races: 0, wins: 0,
    bestTime: 0,
    log: [],                // さいきんの できごと
  };
}

export let data = blank();

export function load(){
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = Object.assign(blank(), JSON.parse(raw));
  } catch (e) { data = blank(); }
  return data;
}

export function save(){
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
}

export function reset(){
  data = blank();
  save();
}

export const isNew = () => !data.name;

// 日づけが かわっていたら おこづかいを わたして かいすうを もどす。
// もらえた ぶんを かえす（もらえなければ null）
export function newDay(){
  const t = today();
  if (data.lastDay === t) return null;

  // 時計を むかしに もどされた ときも こわれないようにする
  const first = !data.lastDay;
  data.lastDay = t;
  data.careLeft = CARE_PER_DAY;
  data.raceLeft = RACE_PER_DAY;
  data.days += 1;
  data.wantFood = FOODS[Math.floor(Math.random() * FOODS.length)].id;

  if (first) { save(); return null; }        // はじめての日は おこづかいなし
  data.money += ALLOWANCE;
  save();
  return ALLOWANCE;
}

// ---- おかね ----
export function pay(n){
  if (data.money < n) return false;
  data.money -= n;
  save();
  return true;
}
export function earn(n){ data.money += n; save(); }

// ---- もちもの ----
export function addFood(id, n = 1){ data.foods[id] = (data.foods[id] || 0) + n; save(); }
export function useFood(id){
  if (!data.foods[id]) return false;
  data.foods[id] -= 1;
  if (!data.foods[id]) delete data.foods[id];
  save();
  return true;
}
export const foodCount = () => Object.values(data.foods).reduce((a, b) => a + b, 0);

export function addSkill(id){
  if (data.skills.includes(id)) return false;
  data.skills.push(id); save(); return true;
}
export function addItem(id){ data.items.push(id); save(); }
export function useItem(id){
  const i = data.items.indexOf(id);
  if (i < 0) return false;
  data.items.splice(i, 1); save(); return true;
}

// ---- ステータス ----
export function grow(up, mult = 1){
  const got = {};
  for (const k of ["speed", "stamina", "love"]){
    if (!up[k]) continue;
    const n = Math.max(1, Math.round(up[k] * mult));
    data[k] = Math.min(99, data[k] + n);
    got[k] = n;
  }
  save();
  return got;
}

// ステータスが のびて あたらしい わざを おぼえたか しらべる
export function checkUnlock(){
  const got = [];
  for (const [id, c] of Object.entries(SKILL_UNLOCK)){
    if (data[c.stat] >= c.need && addSkill(id)) got.push(id);
  }
  return got;
}

export const totalStat = () => data.speed + data.stamina + data.love;

// そうごうりょくから ランクを だす
export function rank(){
  const t = totalStat();
  if (t >= 240) return "でんせつ";
  if (t >= 180) return "チャンピオン";
  if (t >= 130) return "ベテラン";
  if (t >= 90)  return "なかまつ";
  if (t >= 60)  return "みならい";
  return "ひよっこ";
}

export function addLog(text){
  data.log.unshift({ d: today(), t: text });
  data.log = data.log.slice(0, 8);
  save();
}
