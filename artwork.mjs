// Original, lightweight vector artwork for Learnway. No remote images or fonts.
// Each cover uses the same visual language while keeping the subject recognizable.

const C = (cx, cy, r, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" ${extra}/>`;
const L = (x1, y1, x2, y2, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;
const R = (x, y, width, height, rx = 0, extra = '') => `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" ${extra}/>`;
const P = (d, extra = '') => `<path d="${d}" ${extra}/>`;
const T = (x, y, text, extra = '') => `<text x="${x}" y="${y}" ${extra}>${text}</text>`;

function cover(kind, content) {
  return `<div class="course-art art-${kind}" aria-hidden="true">
    <svg viewBox="0 0 360 150" role="presentation" focusable="false">
      <g class="art-grid" opacity=".16">
        ${L(24, 28, 336, 28)}${L(24, 75, 336, 75)}${L(24, 122, 336, 122)}
        ${L(70, 14, 70, 136)}${L(180, 14, 180, 136)}${L(290, 14, 290, 136)}
      </g>
      <g class="art-subject" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${content}</g>
      <g class="art-spark" fill="currentColor">${C(320, 28, 2.5)}${C(38, 120, 1.8, 'opacity=".55"')}${C(308, 126, 1.4, 'opacity=".4"')}</g>
    </svg>
  </div>`;
}

function molecule() {
  return `${C(176, 74, 36, 'class="art-pulse" opacity=".12" fill="currentColor"')}
    ${C(176, 74, 31, 'opacity=".5"')}${C(176, 74, 19, 'class="art-pulse"')}
    ${P('M157 70 C157 56 168 54 176 64 C184 74 195 72 195 58 M157 79 C157 93 168 95 176 85 C184 75 195 77 195 91')}
    ${C(160, 61, 5, 'fill="currentColor" stroke="none"')}${C(192, 86, 5, 'fill="currentColor" stroke="none"')}
    ${L(105, 42, 139, 58, 'opacity=".45"')}${L(213, 92, 250, 110, 'opacity=".45"')}
    ${C(98, 39, 9)}${C(258, 114, 9)}${C(139, 58, 4, 'fill="currentColor"')}${C(213, 92, 4, 'fill="currentColor"')}`;
}

function dna() {
  const rungs = Array.from({ length: 7 }, (_, i) => {
    const y = 35 + i * 13;
    const left = 146 + Math.sin(i * .95) * 24;
    const right = 214 - Math.sin(i * .95) * 24;
    return `${L(left.toFixed(1), y, right.toFixed(1), y, 'opacity=".55"')}${C(left.toFixed(1), y, 3.2, 'fill="currentColor" stroke="none"')}${C(right.toFixed(1), y, 3.2, 'fill="currentColor" stroke="none"')}`;
  }).join('');
  return `${P('M146 28 C232 47 128 80 214 119', 'class="art-helix" stroke-width="3"')}${P('M214 28 C128 47 232 80 146 119', 'class="art-helix" stroke-width="3"')}${rungs}
    ${C(103, 44, 14, 'opacity=".35"')}${T(103, 49, 'A', 'text-anchor="middle" stroke="none" fill="currentColor" font-size="14"')}
    ${C(265, 103, 14, 'opacity=".35"')}${T(265, 108, 'a', 'text-anchor="middle" stroke="none" fill="currentColor" font-size="14"')}`;
}

function chemistry() {
  return `${P('M161 30 H199 M170 30 V61 L143 112 Q139 124 153 124 H207 Q221 124 217 112 L190 61 V30')}
    ${P('M153 96 Q180 83 207 96 L217 114 Q219 124 207 124 H153 Q141 124 143 114 Z', 'class="art-liquid" fill="currentColor" opacity=".16"')}
    ${P('M153 96 Q180 83 207 96')}${C(172, 105, 4)}${C(191, 113, 3)}${C(184, 91, 2.5)}
    ${C(248, 48, 12)}${C(279, 74, 8)}${C(246, 96, 7)}${L(256, 55, 273, 68)}${L(253, 59, 248, 89)}
    ${C(99, 73, 18, 'opacity=".35"')}${T(99, 78, 'H₂O', 'text-anchor="middle" stroke="none" fill="currentColor" font-size="12"')}`;
}

function rocket() {
  return `${P('M180 25 C158 43 154 75 162 96 H198 C206 75 202 43 180 25 Z', 'class="art-rocket"')}
    ${P('M162 73 L145 92 V110 L164 99 M198 73 L215 92 V110 L196 99')}
    ${C(180, 59, 10)}${C(180, 59, 6, 'opacity=".35"')}
    ${P('M171 98 L180 127 L189 98', 'class="art-flame" fill="currentColor" opacity=".22"')}
    ${P('M175 100 L180 118 L185 100', 'class="art-flame"')}
    ${P('M65 111 C99 18 267 12 299 93', 'opacity=".35" stroke-dasharray="3 7"')}
    ${C(279, 48, 6, 'class="art-orbit" fill="currentColor" stroke="none"')}${C(73, 93, 3)}${C(268, 115, 2)}`;
}

function engine() {
  return `${R(126, 29, 108, 77, 9)}${P('M126 48 H234 M142 29 V20 H158 V29 M202 29 V20 H218 V29')}
    ${R(161, 48, 38, 30, 4, 'class="art-piston" fill="currentColor" opacity=".18"')}
    ${L(180, 78, 180, 110)}${C(180, 116, 21)}${C(180, 116, 6, 'fill="currentColor"')}
    ${L(180, 116, 197, 105, 'class="art-crank"')}${P('M105 58 H126 M105 58 L92 45 M234 58 H255 M255 58 L268 45')}
    ${P('M91 45 L86 35 M91 45 L80 47 M269 45 L274 35 M269 45 L280 47', 'class="art-sparks"')}`;
}

function circuit() {
  return `${P('M75 75 H129 M154 75 H206 M231 75 H285 V116 H75 V75')}
    ${P('M129 64 V86 M154 64 V86 M129 75 L141 60 L154 75', 'class="art-current"')}
    ${P('M206 58 L187 82 H203 L194 99 L224 69 H208 L218 58 Z', 'class="art-pulse" fill="currentColor" opacity=".25"')}
    ${P('M206 58 L187 82 H203 L194 99 L224 69 H208 L218 58 Z')}
    ${C(75, 75, 5, 'fill="currentColor"')}${C(285, 116, 5, 'fill="currentColor"')}
    ${C(112, 39, 15, 'opacity=".4"')}${P('M106 39 H118 M112 33 V45')}${C(282, 38, 14, 'opacity=".4"')}${P('M275 38 H289')}`;
}

function satellite() {
  return `${C(180, 78, 37, 'opacity=".35"')}${P('M153 95 C166 84 189 82 207 90 M158 103 C175 96 190 96 201 100', 'opacity=".45"')}
    ${P('M62 108 C102 7 267 12 303 94', 'opacity=".35" stroke-dasharray="3 7"')}
    ${R(157, 23, 46, 24, 4, 'class="art-satellite"')}${R(124, 27, 27, 16, 2)}${R(209, 27, 27, 16, 2)}
    ${L(151, 35, 157, 35)}${L(203, 35, 209, 35)}${P('M171 47 L165 58 H195 L189 47 M180 58 V68')}
    ${C(180, 69, 3, 'fill="currentColor"')}${P('M180 69 L202 90 M180 69 L159 92', 'opacity=".5" stroke-dasharray="2 5')}
    ${C(275, 52, 4, 'class="art-orbit" fill="currentColor" stroke="none"')}`;
}

function weather() {
  return `${P('M130 94 H222 C240 94 245 69 227 63 C225 40 192 35 180 54 C163 39 135 51 138 71 C119 72 115 91 130 94 Z', 'class="art-cloud" fill="currentColor" opacity=".13"')}
    ${P('M130 94 H222 C240 94 245 69 227 63 C225 40 192 35 180 54 C163 39 135 51 138 71 C119 72 115 91 130 94 Z')}
    ${L(150, 106, 143, 119, 'class="art-rain"')}${L(178, 106, 171, 124, 'class="art-rain"')}${L(206, 106, 199, 119, 'class="art-rain"')}
    ${C(94, 42, 17, 'opacity=".5"')}${P('M94 16 V9 M94 75 V68 M68 42 H61 M127 42 H120 M76 24 L70 18 M112 60 L118 66')}
    ${P('M237 113 C257 102 273 105 288 113 M249 124 H299', 'opacity=".45"')}`;
}

function tectonics() {
  return `${P('M62 56 L142 43 L180 58 L225 39 L298 54 V123 H62 Z', 'fill="currentColor" opacity=".08"')}
    ${P('M62 56 L142 43 L180 58 L225 39 L298 54 M62 79 L137 68 L181 83 L229 65 L298 78 M62 103 L145 91 L182 107 L228 89 L298 101')}
    ${P('M180 58 L181 83 L182 107 L180 128', 'class="art-fault" stroke-dasharray="3 5"')}
    ${P('M124 32 L142 43 L158 32 M213 30 L225 39 L240 28', 'class="art-shift"')}
    ${C(105, 68, 3, 'fill="currentColor" stroke="none"')}${C(253, 91, 3, 'fill="currentColor" stroke="none"')}`;
}

function sound() {
  const bars = Array.from({ length: 13 }, (_, i) => {
    const x = 84 + i * 16;
    const h = 22 + Math.abs(Math.sin(i * .78)) * 64;
    return R(x, 75 - h / 2, 5, h, 2.5, `class="art-equalizer" style="--i:${i}" fill="currentColor" stroke="none" opacity="${.35 + i % 3 * .2}"`);
  }).join('');
  return `${bars}${P('M67 75 H293', 'opacity=".25"')}${P('M71 42 C99 42 99 108 127 108 C155 108 155 42 183 42 C211 42 211 108 239 108 C267 108 267 42 295 42', 'opacity=".65"')}`;
}

function probability() {
  return `${R(105, 38, 66, 66, 13, 'class="art-die" transform="rotate(-9 138 71)"')}${R(190, 48, 66, 66, 13, 'class="art-die" transform="rotate(10 223 81)"')}
    ${C(124, 57, 4, 'fill="currentColor" stroke="none"')}${C(151, 85, 4, 'fill="currentColor" stroke="none"')}${C(138, 71, 4, 'fill="currentColor" stroke="none"')}
    ${C(207, 66, 4, 'fill="currentColor" stroke="none"')}${C(239, 96, 4, 'fill="currentColor" stroke="none"')}
    ${P('M83 117 H277', 'opacity=".25"')}${C(101, 117, 3)}${C(143, 117, 5)}${C(185, 117, 7)}${C(227, 117, 5)}${C(269, 117, 3)}`;
}

function machines() {
  return `${P('M92 97 L262 55', 'class="art-lever" stroke-width="5"')}${P('M164 107 L180 76 L198 107 Z', 'fill="currentColor" opacity=".18"')}${P('M164 107 L180 76 L198 107 Z')}
    ${R(69, 72, 42, 42, 6, 'class="art-load"')}${C(270, 45, 18, 'class="art-effort"')}${C(270, 45, 5, 'fill="currentColor"')}
    ${P('M70 125 H289', 'opacity=".3"')}${P('M263 19 L270 27 L282 22', 'class="art-effort"')}`;
}

function generic(seed) {
  const shift = seed % 34;
  return `${C(180, 74, 34 + shift % 8, 'class="art-pulse" opacity=".14" fill="currentColor"')}
    ${C(180, 74, 31)}${C(180, 74, 13, 'fill="currentColor" opacity=".22"')}
    ${P(`M${82 + shift} 92 C126 12 245 10 ${282 - shift} 82`, 'opacity=".45"')}
    ${C(105 + shift, 43, 7)}${C(258 - shift, 101, 9)}${L(111 + shift, 48, 159, 66, 'opacity=".45"')}${L(201, 83, 250 - shift, 96, 'opacity=".45"')}
    ${P('M165 74 H195 M180 59 V89', 'class="art-pulse"')}`;
}

export function courseArtwork(title = '', topic = '') {
  const value = `${title} ${topic}`.toLowerCase();
  let kind = 'generic', content;
  if (value.includes('biology') || value.includes('cell')) { kind = 'biology'; content = molecule(); }
  else if (value.includes('genetic')) { kind = 'genetics'; content = dna(); }
  else if (value.includes('chemistry')) { kind = 'chemistry'; content = chemistry(); }
  else if (value.includes('rocket')) { kind = 'rocket'; content = rocket(); }
  else if (value.includes('engine')) { kind = 'engine'; content = engine(); }
  else if (value.includes('wiring') || value.includes('electric')) { kind = 'circuit'; content = circuit(); }
  else if (value.includes('gps')) { kind = 'gps'; content = satellite(); }
  else if (value.includes('weather')) { kind = 'weather'; content = weather(); }
  else if (value.includes('tectonic')) { kind = 'tectonics'; content = tectonics(); }
  else if (value.includes('sound') || value.includes('music')) { kind = 'sound'; content = sound(); }
  else if (value.includes('probability')) { kind = 'probability'; content = probability(); }
  else if (value.includes('machine') || value.includes('physics')) { kind = 'machines'; content = machines(); }
  else {
    const seed = [...value].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
    content = generic(seed);
  }
  return cover(kind, content);
}

export function brandMark() {
  return `<svg class="brand-symbol" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <path d="M16 3 L27 9.5 V22.5 L16 29 L5 22.5 V9.5 Z" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <path d="M10 12 L16 8 L22 12 L16 16 Z M10 12 V20 L16 24 V16 M22 12 V20 L16 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
  </svg>`;
}

export function heroArtwork() {
  return `<div class="hero-visual" aria-hidden="true">
    <div class="hero-glow"></div>
    <svg class="hero-orbit-art" viewBox="0 0 500 380" focusable="false" role="presentation">
      <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <ellipse class="hero-orbit hero-orbit-a" cx="250" cy="190" rx="176" ry="86" transform="rotate(-17 250 190)" opacity=".25"/>
        <ellipse class="hero-orbit hero-orbit-b" cx="250" cy="190" rx="132" ry="156" transform="rotate(39 250 190)" opacity=".16"/>
        <g class="hero-orbiter">
          <circle cx="410" cy="137" r="14" fill="var(--panel-raised)" stroke-width="1.5"/>
          <path d="M404 137 L409 142 L417 132" stroke-width="2"/>
        </g>
        <g class="hero-orbiter hero-orbiter-late">
          <circle cx="113" cy="250" r="11" fill="var(--panel-raised)" stroke-width="1.5"/>
          <path d="M109 250 H117 M113 246 V254" stroke-width="1.8"/>
        </g>
        <path d="M203 113 Q250 91 297 113 V259 Q250 237 203 259 Z" fill="var(--panel-raised)" opacity=".96"/>
        <path d="M250 105 V246 M203 113 Q227 103 250 116 Q273 103 297 113" opacity=".65"/>
        <path d="M218 143 Q232 138 241 142 M218 158 Q232 153 241 157 M218 173 Q232 168 241 172 M259 142 Q273 137 282 141 M259 157 Q273 152 282 156 M259 172 Q273 167 282 171" opacity=".42"/>
        <path class="hero-page" d="M297 113 V259 Q273 247 250 259 V116 Q273 103 297 113 Z" fill="var(--accent)" opacity=".08"/>
        <circle cx="250" cy="207" r="25" fill="var(--accent)" opacity=".1" stroke="none" class="hero-core"/>
        <path d="M239 207 L247 215 L263 197" stroke="var(--accent)" stroke-width="3"/>
      </g>
    </svg>
    <div class="hero-chip hero-chip-top"><span class="chip-dot"></span><span><strong>6 study views</strong><small>One idea, every angle</small></span></div>
    <div class="hero-chip hero-chip-bottom"><span class="chip-check">✓</span><span><strong>Built for recall</strong><small>Read · test · remember</small></span></div>
  </div>`;
}
