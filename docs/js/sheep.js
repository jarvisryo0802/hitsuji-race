// ===== ひつじの え =====
// もとの おおきさは よこ100 × たて76。あしもとの まんなかは (49, 67)。
export const ART_W = 100, ART_H = 76, FOOT_X = 49, FOOT_Y = 67;

// <svg> の なかみだけを かえす（レースの がめんに そのまま うめこめる）
export function sheepArt(color, opts = {}){
  const run = opts.run ? "leg" : "";
  const wool = opts.wool || "#fff";
  return `
    <ellipse cx="46" cy="70" rx="30" ry="4" fill="rgba(0,0,0,.12)"/>
    <g fill="#4a4a5e">
      <rect class="${run} lg1" x="30" y="48" width="7" height="19" rx="3.5"/>
      <rect class="${run} lg2" x="41" y="48" width="7" height="19" rx="3.5"/>
      <rect class="${run} lg3" x="52" y="48" width="7" height="19" rx="3.5"/>
      <rect class="${run} lg4" x="61" y="48" width="7" height="19" rx="3.5"/>
    </g>
    <circle cx="20" cy="36" r="9" fill="${wool}" stroke="#e2e6ee" stroke-width="2"/>
    <g fill="${wool}" stroke="#e2e6ee" stroke-width="2">
      <circle cx="34" cy="30" r="14"/><circle cx="50" cy="25" r="16"/>
      <circle cx="66" cy="31" r="14"/><circle cx="36" cy="44" r="14"/>
      <circle cx="54" cy="45" r="15"/><circle cx="66" cy="42" r="12"/>
    </g>
    <circle cx="34" cy="30" r="13" fill="${wool}"/><circle cx="50" cy="25" r="15" fill="${wool}"/>
    <circle cx="66" cy="31" r="13" fill="${wool}"/><circle cx="36" cy="44" r="13" fill="${wool}"/>
    <circle cx="54" cy="45" r="14" fill="${wool}"/>
    <path d="M70 38 q10 2 12 8 q-8 4 -14 1 z" fill="${color}"/>
    <ellipse cx="70" cy="24" rx="7" ry="4.5" fill="#4a4a5e" transform="rotate(-24 70 24)"/>
    <ellipse cx="84" cy="32" rx="11" ry="12.5" fill="#5a5a6e"/>
    <ellipse cx="86" cy="38" rx="6" ry="4.5" fill="#6e6e82"/>
    <circle cx="88" cy="28" r="3.2" fill="#fff"/><circle cx="89" cy="28.5" r="1.7" fill="#2b2b3a"/>
    <circle cx="82" cy="27" r="2.6" fill="#fff"/><circle cx="82.6" cy="27.5" r="1.4" fill="#2b2b3a"/>
    <path d="M60 15 q6 -8 14 -4" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>
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
