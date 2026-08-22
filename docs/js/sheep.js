// ===== ひつじの え =====
// もとの おおきさは よこ100 × たて76。あしもとの まんなかは (49, 67)。
export const ART_W = 100, ART_H = 76, FOOT_X = 49, FOOT_Y = 67;
// あしの つけね の いち と、まえあし・うしろあし の うごく じゅんばん
export const LEG_X = [33.5, 44.5, 55.5, 64.5];
export const LEG_PHASE = [0, 0.35, Math.PI, Math.PI + 0.35];

// いろを すこし あかるく／くらく する（かげ・ひかりを つくる）
function shade(hex, amt){
  const n = parseInt(hex.slice(1), 16);
  const clip = (v) => Math.max(0, Math.min(255, v));
  const r = clip((n >> 16) + amt), g = clip(((n >> 8) & 0xff) + amt), b = clip((n & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
}

// <svg> の なかみだけを かえす（レースの がめんに そのまま うめこめる）。
//
// ★ みため の メモ：さいしょは <radialGradient>/<linearGradient> で
//   グラデーションを かけていたが、1つの がめんに ひつじが なんとうも
//   いる とき（レース・けっかの いちらん など）に、ブラウザが グラデーションの
//   とうろくに しくじり、けが（もこもこ）が まるみえに ならない ふぐあいが
//   あった。ふかさ・じょうたい・タイミングを いろいろ ためしても なおせな
//   かったので、グラデーションは つかわず、いろの こい・うすい 「たいら」な
//   パーツを かさねて りったいかんを だす やりかたに かえてある。
//   （ブラウザに よらず、いつでも かならず ひょうじされる）
export function sheepArt(color, opts = {}){
  const run = opts.run ? "leg" : "";
  const wool = opts.wool && opts.wool !== "#fff" ? opts.wool : "#ffffff";
  const woolMid = shade(wool === "#ffffff" ? "#f2f5f9" : wool, -6);
  const woolShadow = shade(wool === "#ffffff" ? "#dfe4ec" : wool, -22);
  const headLight = "#7b7b92", headDark = "#48485c";
  const legCol = "#4c4c60";
  const light = shade(color, 30), dark = shade(color, -18);

  return `
    <ellipse cx="46" cy="71" rx="33" ry="6" fill="#212736" opacity=".22"/>
    <g fill="${legCol}">
      <rect class="${run} lg1" x="30" y="48" width="7" height="19" rx="3.5"/>
      <rect class="${run} lg2" x="41" y="48" width="7" height="19" rx="3.5"/>
      <rect class="${run} lg3" x="52" y="48" width="7" height="19" rx="3.5"/>
      <rect class="${run} lg4" x="61" y="48" width="7" height="19" rx="3.5"/>
    </g>
    <!-- もこもこ：おくの ほうを すこし こいろに して、りったいかんを だす -->
    <circle cx="20" cy="36" r="9" fill="${woolMid}" stroke="#dde3ea" stroke-width="1.4"/>
    <g fill="${woolMid}" stroke="#dde3ea" stroke-width="1.4">
      <circle cx="34" cy="30" r="14"/><circle cx="66" cy="31" r="14"/>
      <circle cx="36" cy="44" r="14"/><circle cx="66" cy="42" r="12"/>
    </g>
    <g fill="${wool}" stroke="#dde3ea" stroke-width="1.4">
      <circle cx="50" cy="25" r="16"/><circle cx="54" cy="45" r="15"/>
    </g>
    <circle cx="34" cy="30" r="13" fill="${woolMid}"/><circle cx="50" cy="25" r="15" fill="${wool}"/>
    <circle cx="66" cy="31" r="13" fill="${woolMid}"/><circle cx="36" cy="44" r="13" fill="${woolMid}"/>
    <circle cx="54" cy="45" r="14" fill="${wool}"/>
    <ellipse cx="34" cy="38" rx="11" ry="6" fill="${woolShadow}" opacity=".55"/>
    <!-- ちいさな ひかり（もこもこの てっぺんに つや を だす）-->
    <ellipse cx="46" cy="17" rx="9" ry="5" fill="#ffffff" opacity=".6"/>
    <ellipse cx="27" cy="24" rx="5.5" ry="3.4" fill="#ffffff" opacity=".5"/>
    <path d="M70 38 q10 2 12 8 q-8 4 -14 1 z" fill="${dark}"/>
    <ellipse cx="70" cy="24" rx="7" ry="4.5" fill="${headDark}" transform="rotate(-24 70 24)"/>
    <ellipse cx="84" cy="32" rx="11" ry="12.5" fill="${headLight}"/>
    <ellipse cx="88" cy="38" rx="7" ry="6" fill="${headDark}"/>
    <ellipse cx="86" cy="38" rx="6" ry="4.5" fill="#7d7d94"/>
    <ellipse cx="80" cy="24" rx="3.4" ry="2.2" fill="#ffffff" opacity=".3"/>
    <circle cx="88" cy="28" r="3.2" fill="#fff"/><circle cx="89" cy="28.5" r="1.7" fill="#2b2b3a"/>
    <circle cx="82" cy="27" r="2.6" fill="#fff"/><circle cx="82.6" cy="27.5" r="1.4" fill="#2b2b3a"/>
    <path d="M60 15 q6 -8 14 -4" stroke="${light}" stroke-width="4" fill="none" stroke-linecap="round"/>
  `;
}

// たんたいの <svg> にして かえす
export function sheepSVG(color, opts = {}){
  const cls = opts.run ? ' class="bob"' : "";
  return `<svg viewBox="0 0 ${ART_W} ${ART_H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g${cls}>${sheepArt(color, opts)}</g></svg>`;
}

// しあわせそうな かお（ぼくじょうの がめんで つかう）
export function happySheep(color, size = 160){
  return `<div class="sheepbox" style="width:${size}px">${sheepSVG(color, { run:true })}</div>`;
}
