/* ==========================================================================
   ODKAZY NA VIDEA  —  UPRAVUJ POUZE TENTO BLOK
   Klíč = id cviku (viz níže). Hodnota = plná URL na YouTube.
   Prázdný řetězec "" = u cviku se tlačítko videa nezobrazí.
   ========================================================================== */
const VIDEA = {
  dychani:        "",
  rucnik_hrudni:  "",
  sfinga:         "",
  ctyri_houpani:  "",
  kyvadlo:        "",
  micek_chodidlo: "",
  micek_hyzde:    "",
  valec_stehno:   "",
  valec_lytko:    "",
  rucnik_masaz:   "",
  rucnik_lytko:   "",
  rucnik_kolena:  "",
  zidle_vstavani: "",
  unozeni:        "",
  zanozeni:       "",
  vypony:         "",
  most:           "",
  lopatky:        "",
  jedna_noha:     "",
  tandem:         ""
};

/* ==========================================================================
   KRESLICÍ NÁSTROJE
   Panel má souřadnice 0–400 × 0–400. Podlaha je na y = 352.
   ========================================================================== */
const D = (pts) => pts.filter(Boolean).map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');

function fig(o) {
  const c = o.bad ? 'f-bad' : 'f-line';
  const t = o.bad ? 'f-bad' : (o.cue ? 'f-cue' : 'f-line');
  let s = '';
  if (o.hip && o.kn) s += `<path class="${c}" d="${D([o.hip, o.kn, o.an, o.toe])}"/>`;
  if (o.kn2) s += `<path class="${c}" d="${D([o.hip, o.kn2, o.an2, o.toe2])}"/>`;
  if (o.curve) s += `<path class="${t}" d="M${o.hip[0]} ${o.hip[1]} Q ${o.curve[0]} ${o.curve[1]} ${o.sh[0]} ${o.sh[1]}"/>`;
  else s += `<path class="${t}" d="${D([o.hip, o.sh])}"/>`;
  if (o.el) s += `<path class="${c}" d="${D([o.sh, o.el, o.hd])}"/>`;
  if (o.el2) s += `<path class="${c}" d="${D([o.sh, o.el2, o.hd2])}"/>`;
  s += `<circle class="${o.bad ? 'f-badhead' : 'f-head'}" cx="${o.head[0]}" cy="${o.head[1]}" r="19"/>`;
  return s;
}

const FLOOR  = `<line class="f-floor" x1="26" y1="352" x2="374" y2="352"/>`;
const MAT    = `<rect x="34" y="336" width="332" height="12" rx="6" fill="#D7E1E6"/>`;
const CHAIR  = `<path class="f-chair" d="M78 215H210"/><path class="f-chair" d="M88 215V352"/>
                <path class="f-chair" d="M200 215V352"/><path class="f-chair" d="M84 215V96"/>
                <path class="f-chair" d="M84 118H128"/>`;
const WALL   = `<rect x="24" y="34" width="16" height="318" fill="#DAE4E9"/>`;
const LINKA  = `<rect x="26" y="196" width="120" height="16" rx="6" fill="#C7D5DB"/>
                <rect x="32" y="212" width="12" height="140" fill="#DAE4E9"/>`;

/* Linka VPRAVO — postava v bočním pohledu míří špičkami vpravo,
   takže jen s touhle variantou stojí čelem k lince, jak říkají instrukce. */
const LINKA_R = `<rect x="254" y="196" width="120" height="16" rx="6" fill="#C7D5DB"/>
                 <rect x="336" y="212" width="12" height="140" fill="#DAE4E9"/>`;

/* ---- POHLED ZPŘEDU ----
   Pohyby do strany (únožení, stisk kolen) se v bočním pohledu nakreslit nedají.
   Tady je postava čelem k divákovi: dvě paže, dvě nohy. */
function figF(o) {
  const c = o.bad ? 'f-bad' : 'f-line';
  const t = o.bad ? 'f-bad' : (o.cue ? 'f-cue' : 'f-line');
  let s = '';
  s += `<path class="${c}" d="${D([o.hip, o.knL, o.anL])}"/>`;
  s += `<path class="${c}" d="${D([o.hip, o.knR, o.anR])}"/>`;
  s += `<path class="${c}" d="${D([[o.anL[0] - 17, o.anL[1] + 6], [o.anL[0] + 13, o.anL[1] + 6]])}"/>`;
  s += `<path class="${c}" d="${D([[o.anR[0] - 13, o.anR[1] + 6], [o.anR[0] + 17, o.anR[1] + 6]])}"/>`;
  s += `<path class="${t}" d="${D([o.hip, o.sh])}"/>`;
  if (o.hdL) s += `<path class="${c}" d="${D([o.sh, o.elL, o.hdL])}"/>`;
  if (o.hdR) s += `<path class="${c}" d="${D([o.sh, o.elR, o.hdR])}"/>`;
  s += `<circle class="${o.bad ? 'f-badhead' : 'f-head'}" cx="${o.head[0]}" cy="${o.head[1]}" r="19"/>`;
  return s;
}
/* linka z pohledu zpředu — svislá deska po straně */
const LINKA_FL = `<rect x="26" y="212" width="104" height="15" rx="6" fill="#C7D5DB"/>
                  <rect x="30" y="227" width="12" height="125" fill="#DAE4E9"/>`;
/* sedátko z pohledu zpředu */
const ZIDLE_F = `<rect x="140" y="228" width="120" height="14" rx="5" fill="#A9B8C0"/>
                 <rect x="146" y="242" width="11" height="108" fill="#BCC9D0"/>
                 <rect x="243" y="242" width="11" height="108" fill="#BCC9D0"/>`;

/* ---- POHLED ZESHORA (tandem chůze) ---- */
const chodidlo = (x, y, uhel = 0, zvyr = false) =>
  `<g transform="translate(${x},${y}) rotate(${uhel})">
     <rect x="-13" y="-26" width="26" height="52" rx="13"
       fill="${zvyr ? '#DCF0EA' : '#EEF3F5'}" stroke="${zvyr ? '#0E7C6B' : '#8FA5AF'}" stroke-width="3"/>
     <circle cx="0" cy="-15" r="5" fill="${zvyr ? '#0E7C6B' : '#A9B8C0'}"/>
   </g>`;
const cara = (x1, y1, x2, y2) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#0E7C6B" stroke-width="3" stroke-dasharray="8 8"/>`;
const LINKA_TOP = `<rect x="40" y="60" width="320" height="20" rx="7" fill="#C7D5DB"/>`;

const ball   = (x, y, r = 15) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#E9A63C" stroke="#B57A1C" stroke-width="3"/>`;
const roller = (x, y, w = 96) => `<rect x="${x - w / 2}" y="${y - 23}" width="${w}" height="46" rx="23" fill="#CBD9DF" stroke="#8FA5AF" stroke-width="3"/>`;
const towel  = (x, y, w = 76, h = 26) => `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="#F4E8D2" stroke="#C6B089" stroke-width="3"/>`;
const band   = (a, b, lift = 30) => `<path d="M${a[0]} ${a[1]} Q ${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2 - lift} ${b[0]} ${b[1]}" fill="none" stroke="#D9B23C" stroke-width="7" stroke-linecap="round"/>`;
const tag    = (x, y, t, bad) => `<text class="${bad ? 'f-tagbad' : 'f-tag'}" x="${x}" y="${y}">${t}</text>`;
const dash   = (a, b) => `<path class="f-dash" d="${D([a, b])}"/>`;
const arrUp  = (x, y) => `<path class="f-arrow" d="M${x - 7} ${y} l0 -40 l-13 0 l20 -28 l20 28 l-13 0 l0 40 z"/>`;
const arrR   = (x, y) => `<path class="f-arrow" d="M${x} ${y - 7} l40 0 l0 -13 l28 20 l-28 20 l0 -13 l-40 0 z"/>`;
const arrL   = (x, y) => `<path class="f-arrow" d="M${x} ${y - 7} l-40 0 l0 -13 l-28 20 l28 20 l0 -13 l40 0 z"/>`;
const cross  = (x, y) => `<g class="f-cross"><line x1="${x}" y1="${y}" x2="${x + 40}" y2="${y + 40}"/><line x1="${x + 40}" y1="${y}" x2="${x}" y2="${y + 40}"/></g>`;

const panel = (inner, bad) =>
  `<svg viewBox="0 0 400 400" class="panel${bad ? ' panel-bad' : ''}" role="img">${inner}</svg>`;

/* --- často používané pozice --- */
const SED = { hip: [195, 208], kn: [268, 208], an: [268, 345], toe: [306, 350],
              sh: [190, 112], el: [214, 162], hd: [250, 196], head: [192, 90] };
const STOJ = { hip: [248, 178], kn: [252, 262], an: [252, 348], toe: [290, 352],
               sh: [244, 84], el: [250, 132], hd: [254, 180], head: [243, 62] };
const LEH = { hip: [248, 306], kn: [306, 306], an: [352, 306], toe: [352, 284],
              sh: [150, 302], el: [180, 326], hd: [214, 330], head: [110, 298] };

const cp = (base, over) => Object.assign({}, base, over);

/* ==========================================================================
   KNIHOVNA CVIKŮ
   ========================================================================== */
const CVIKY = [

/* ---------- 1 ---------- */
{
  id: 'dychani', nazev: 'Dýchání do žeber', kat: 'rozhybani', blok: 1,
  typ: 'cas', cas: { 1: 90, 2: 120, 3: 120 },
  davka: { 1: '90 vteřin', 2: '2 minuty', 3: '2 minuty' },
  pomucky: ['podložka nebo koberec'],
  kroky: [
    'Lehni si na záda, kolena pokrč a chodidla opři o zem.',
    'Dlaně polož na boční strany žeber, palce směrem k zádům.',
    'Nádech nosem — snaž se roztáhnout žebra do dlaní, do stran. Břicho nech klidné.',
    'Výdech ústy pomalu, dvakrát déle než nádech. Žebra se samovolně sníží.',
    'Opakuj klidným tempem. Nikam nespěchej.'
  ],
  pozor: 'Neprohýbej bedra při nádechu. Když se zvedají ramena, dýcháš moc nahoru — zpomal.',
  proc: 'Bránice je součástí stabilizace páteře. Bez ní pracují záda za ni. Tímhle začíná každá lekce.',
  faze: [
    { popis: 'Výchozí poloha', svg: () => panel(FLOOR + MAT +
        fig(cp(LEH, { kn: [304, 268], an: [318, 336], toe: [352, 340], el: [176, 322], hd: [204, 316] })) +
        tag(150, 240, 'dlaně na žebrech')) },
    { popis: 'Nádech — žebra do stran', svg: () => panel(FLOOR + MAT +
        fig(cp(LEH, { kn: [304, 268], an: [318, 336], toe: [352, 340], el: [176, 322], hd: [204, 316] })) +
        `<ellipse cx="196" cy="304" rx="46" ry="30" fill="none" stroke="#0E7C6B" stroke-width="4" stroke-dasharray="8 8"/>` +
        arrR(250, 262) + tag(120, 232, 'roztáhni žebra')) },
    { popis: 'Výdech — dlouhý a klidný', svg: () => panel(FLOOR + MAT +
        fig(cp(LEH, { kn: [304, 268], an: [318, 336], toe: [352, 340], el: [176, 322], hd: [204, 316] })) +
        tag(130, 240, 'výdech 2× delší')) }
  ]
},

/* ---------- 2 ---------- */
{
  id: 'rucnik_hrudni', nazev: 'Ručník pod hrudní páteří', kat: 'rozhybani', blok: 1,
  typ: 'cas', cas: { 1: 60, 2: 90, 3: 120 },
  davka: { 1: '1 minuta', 2: '90 vteřin', 3: '2 minuty' },
  pomucky: ['ručník'],
  kroky: [
    'Sroluj ručník do válečku o průměru zhruba 8 cm.',
    'Polož ho na podložku PODÉLNĚ — bude ležet ve směru páteře, ne napříč.',
    'Lehni si na něj tak, aby váleček byl přesně pod páteří od kostrče po krk. Hlavu měj podepřenou.',
    'Kolena pokrč, chodidla na zemi. Paže volně do stran, dlaně vzhůru.',
    'Jen lež a klidně dýchej. Ramena se sama rozevřou do stran.'
  ],
  pozor: 'Váleček musí být podélně, ne napříč. Napříč vytvoří páku přes obratle — to nikdy.',
  proc: 'Jemné otevření hrudníku v opačném směru, než jakým se páteř po zlomeninách hroutí. Nulové zatížení.',
  faze: [
    { popis: 'Sroluj ručník podélně', svg: () => panel(FLOOR + MAT + towel(200, 322, 240, 30) +
        arrR(160, 280) + tag(96, 262, 've směru páteře')) },
    { popis: 'Lehni si na něj', svg: () => panel(FLOOR + MAT + towel(200, 322, 240, 30) +
        fig(cp(LEH, { hip: [248, 296], kn: [304, 258], an: [318, 330], toe: [352, 334],
                      sh: [150, 292], el: [136, 326], hd: [108, 336], head: [110, 288] })) +
        tag(126, 226, 'páteř na ručníku')) },
    { popis: 'Dýchej a nech ramena klesnout', svg: () => panel(FLOOR + MAT + towel(200, 322, 240, 30) +
        fig(cp(LEH, { hip: [248, 296], kn: [304, 258], an: [318, 330], toe: [352, 334],
                      sh: [150, 292], el: [136, 326], hd: [108, 336], head: [110, 288] })) +
        tag(150, 226, 'ramena k zemi')) }
  ],
  spatne: { popis: 'Ručník napříč páteří', svg: () => panel(FLOOR + MAT +
      `<rect x="176" y="290" width="30" height="60" rx="14" fill="#F4E8D2" stroke="#B3261E" stroke-width="4"/>` +
      fig(cp(LEH, { bad: true, hip: [248, 296], kn: [304, 258], an: [318, 330], toe: [352, 334],
                    sh: [150, 292], el: [136, 326], hd: [108, 336], head: [110, 288],
                    curve: [196, 268] })) + cross(300, 70) + tag(96, 230, 'páka přes obratle', true), true) }
},

/* ---------- 3 ---------- */
{
  id: 'sfinga', nazev: 'Sfinga — jemné napřímení', kat: 'rozhybani', blok: 1,
  typ: 'cas', cas: { 1: 30, 2: 45, 3: 60 },
  davka: { 1: '2× 30 vteřin', 2: '2× 45 vteřin', 3: '3× 45 vteřin' },
  pomucky: ['podložka'],
  kroky: [
    'Lehni si na břicho, čelo na podložce, nohy natažené.',
    'Předloktí polož na zem tak, aby lokty byly přímo pod rameny.',
    'Pomalu se opři o předloktí a zvedni hrudník. Jen tolik, kolik jde bez bolesti.',
    'Ramena táhni dolů od uší. Hlavu drž v prodloužení páteře, nezaklánět.',
    'Vydrž a klidně dýchej. Pak se pomalu polož zpět.'
  ],
  pozor: 'Když ucítíš ostrou bolest v zádech nebo vystřelování do nohy, okamžitě přestaň. Jdeš jen do rozsahu bez bolesti.',
  proc: 'Extenze hrudní páteře — přesný opak předklonu. Po kompresivních zlomeninách je to bezpečný směr.',
  faze: [
    { popis: 'Vleže na břiše', svg: () => panel(FLOOR + MAT +
        fig({ hip: [258, 316], kn: [312, 318], an: [356, 320], toe: [356, 340],
              sh: [156, 314], el: [178, 336], hd: [212, 338], head: [120, 312] })) },
    { popis: 'Opři se o předloktí', svg: () => panel(FLOOR + MAT +
        fig({ hip: [258, 314], kn: [312, 316], an: [356, 318], toe: [356, 340],
              sh: [160, 268], el: [162, 338], hd: [206, 338], head: [130, 244], cue: true }) +
        arrUp(180, 230) + tag(196, 292, 'hrudník nahoru')) },
    { popis: 'Ramena dolů, dýchej', svg: () => panel(FLOOR + MAT +
        fig({ hip: [258, 314], kn: [312, 316], an: [356, 318], toe: [356, 340],
              sh: [160, 268], el: [162, 338], hd: [206, 338], head: [130, 244] }) +
        tag(180, 224, 'ramena od uší')) }
  ],
  spatne: { popis: 'Záklon hlavy a tlak do beder', svg: () => panel(FLOOR + MAT +
      fig({ bad: true, hip: [258, 312], kn: [312, 314], an: [356, 316], toe: [356, 340],
            sh: [166, 232], el: [166, 336], hd: [210, 338], head: [126, 200], curve: [188, 300] }) +
      cross(304, 66) + tag(150, 288, 'záklon hlavy — ne', true), true) }
},

/* ---------- 4 ---------- */
{
  id: 'ctyri_houpani', nazev: 'Na čtyřech — houpání do kyčlí', kat: 'rozhybani', blok: 2,
  typ: 'opak', opak: { 1: 8, 2: 10, 3: 12 },
  davka: { 1: '8 opakování', 2: '10 opakování', 3: '12 opakování' },
  pomucky: ['podložka'],
  kroky: [
    'Klekni si na čtyři. Dlaně pod rameny, kolena pod kyčlemi.',
    'Nastav záda do rovné linky — od kostrče po temeno. Ani prohnutá, ani kulatá.',
    'Tuhle linku už neměň. Pohyb dělají jen kyčle.',
    'Pomalu posuň pánev vzad, směrem k patám. Jdi jen tak daleko, dokud záda zůstávají rovná.',
    'Vrať se do výchozí polohy. Pomalu, bez švihu.'
  ],
  pozor: 'Jakmile se záda začnou kulatit, jsi za svým rozsahem. Vrať se. Rozsah tady není cíl.',
  proc: 'Rozhýbe kyčle bez toho, aby se zapojila páteř. Právě proto se ta linka nesmí měnit.',
  faze: [
    { popis: 'Na čtyřech, záda rovná', svg: () => panel(FLOOR + MAT +
        fig({ hip: [278, 244], kn: [286, 336], an: [330, 340], toe: [356, 330],
              sh: [154, 240], el: [148, 292], hd: [144, 336], head: [122, 232], cue: true }) +
        dash([120, 226], [292, 246])) },
    { popis: 'Pánev vzad ke patám', svg: () => panel(FLOOR + MAT +
        fig({ hip: [300, 274], kn: [292, 338], an: [334, 342], toe: [358, 332],
              sh: [176, 262], el: [156, 300], hd: [144, 338], head: [144, 252], cue: true }) +
        arrR(320, 224) + tag(138, 214, 'jen kyčle')) },
    { popis: 'Zpět do výchozí', svg: () => panel(FLOOR + MAT +
        fig({ hip: [278, 244], kn: [286, 336], an: [330, 340], toe: [356, 330],
              sh: [154, 240], el: [148, 292], hd: [144, 336], head: [122, 232] }) + arrL(160, 214)) }
  ],
  spatne: { popis: 'Kulatá záda', svg: () => panel(FLOOR + MAT +
      fig({ bad: true, hip: [300, 268], kn: [292, 338], an: [334, 342], toe: [358, 332],
            sh: [176, 268], el: [158, 302], hd: [146, 338], head: [148, 262], curve: [238, 214] }) +
      cross(300, 66) + tag(120, 228, 'záda se kulatí', true), true) }
},

/* ---------- 5 ---------- */
{
  id: 'kyvadlo', nazev: 'Kyvadlo nohou u linky', kat: 'rozhybani', blok: 2,
  typ: 'opak', opak: { 1: 10, 2: 12, 3: 15 },
  davka: { 1: '10× každá noha', 2: '12× každá noha', 3: '15× každá noha' },
  pomucky: ['kuchyňská linka nebo pevná opěrka'],
  kroky: [
    'Postav se bokem ke kuchyňské lince a chyť se jí jednou rukou.',
    'Váhu přenes na nohu blíž k lince. Druhá noha je volná.',
    'Volnou nohou kývej dopředu a dozadu jako kyvadlo. Uvolněně, bez síly.',
    'Trup drž vzpřímený a klidný — kýve jen noha, ne tělo.',
    'Vyměň strany.'
  ],
  pozor: 'Rozsah je malý a bezbolestný. Žádné švihy a žádné otáčení trupu.',
  proc: 'Prokrví a rozhýbe kyčelní kloub bez zatížení. Dobrá příprava před silovou částí.',
  faze: [
    { popis: 'Opora o linku', svg: () => panel(FLOOR + LINKA +
        fig(cp(STOJ, { hip: [244, 178], sh: [240, 84], el: [190, 128], hd: [140, 196], head: [239, 62] }))) },
    { popis: 'Noha dopředu', svg: () => panel(FLOOR + LINKA +
        fig(cp(STOJ, { hip: [244, 178], sh: [240, 84], el: [190, 128], hd: [140, 196], head: [239, 62],
                       kn2: [292, 250], an2: [318, 322], toe2: [352, 326] })) + arrR(300, 300)) },
    { popis: 'Noha dozadu', svg: () => panel(FLOOR + LINKA +
        fig(cp(STOJ, { hip: [244, 178], sh: [240, 84], el: [190, 128], hd: [140, 196], head: [239, 62],
                       kn2: [204, 250], an2: [176, 322], toe2: [206, 328] })) + arrL(190, 300) +
        tag(120, 246, 'trup se nehýbe')) }
  ]
},

/* ---------- 6 ---------- */
{
  id: 'micek_chodidlo', nazev: 'Tenisák pod chodidlem', kat: 'automasaz', blok: 1,
  typ: 'cas', cas: { 1: 60, 2: 60, 3: 90 },
  davka: { 1: '1 minuta každá noha', 2: '1 minuta každá noha', 3: '90 vteřin každá noha' },
  pomucky: ['tenisák', 'židle'],
  kroky: [
    'Sedni si na židli, obě chodidla na zemi.',
    'Tenisák polož pod klenbu jednoho chodidla.',
    'Pomalu chodidlo přejížděj po míčku — od paty ke špičce a zpět.',
    'Tlak řídíš tím, jak moc se do nohy opřeš. Má to být příjemný tlak, ne bolest.',
    'Když najdeš citlivé místo, zůstaň na něm 20 vteřin a klidně dýchej. Pak pokračuj.'
  ],
  pozor: 'Vsedě, ne vestoje. Vestoje se špatně dávkuje tlak a hrozí ztráta rovnováhy.',
  proc: 'Chodidlo je začátek celého řetězce nahoru. Uvolnění se často projeví až v kyčli a zádech.',
  faze: [
    { popis: 'Sed, míček pod chodidlem', svg: () => panel(FLOOR + CHAIR +
        fig(cp(SED, { an: [268, 336], toe: [304, 340] })) + ball(288, 342)) },
    { popis: 'Přejíždění od paty ke špičce', svg: () => panel(FLOOR + CHAIR +
        fig(cp(SED, { an: [268, 336], toe: [304, 340] })) + ball(250, 342) + arrL(240, 300) +
        tag(120, 286, 'pomalu tam a zpět')) },
    { popis: 'Na citlivém místě vydrž', svg: () => panel(FLOOR + CHAIR +
        fig(cp(SED, { an: [268, 336], toe: [304, 340] })) + ball(270, 342) +
        tag(138, 286, '20 vteřin, dýchej')) }
  ]
},

/* ---------- 7 ---------- */
{
  id: 'micek_hyzde', nazev: 'Tenisák na hýždě u stěny', kat: 'automasaz', blok: 2,
  typ: 'cas', cas: { 1: 60, 2: 90, 3: 90 },
  davka: { 1: '1 minuta každá strana', 2: '90 vteřin každá strana', 3: '90 vteřin každá strana' },
  pomucky: ['tenisák', 'stěna'],
  kroky: [
    'Postav se zády ke stěně, chodidla kousek od ní.',
    'Vlož tenisák mezi stěnu a hýždi — do masa hýžďového svalu, ne na kost.',
    'Opři se o něj a pomalu se posouvej do stran a nahoru dolů.',
    'Tlak řídíš tím, jak moc se opřeš. Kdykoli můžeš ubrat.',
    'Vyměň strany.'
  ],
  pozor: 'U stěny vestoje, ne vleže na zemi. Vestoje máš tlak plně pod kontrolou. Nikdy na kostrč, kyčelní kost ani páteř.',
  proc: 'Napětí v hýždích souvisí s bolestí kyčle i beder. U stěny je to bezpečná varianta klasického rolování.',
  faze: [
    { popis: 'Zády ke stěně', svg: () => panel(FLOOR + WALL +
        fig(cp(STOJ, { hip: [92, 182], kn: [108, 264], an: [116, 348], toe: [156, 352],
                       sh: [86, 88], el: [116, 134], hd: [128, 184], head: [86, 66] }))) },
    { popis: 'Míček do hýždě', svg: () => panel(FLOOR + WALL +
        fig(cp(STOJ, { hip: [98, 182], kn: [112, 264], an: [118, 348], toe: [158, 352],
                       sh: [92, 88], el: [122, 134], hd: [134, 184], head: [92, 66] })) +
        ball(60, 186) + tag(146, 172, 'do svalu, ne na kost')) },
    { popis: 'Pomalé posouvání', svg: () => panel(FLOOR + WALL +
        fig(cp(STOJ, { hip: [98, 194], kn: [112, 270], an: [118, 348], toe: [158, 352],
                       sh: [92, 100], el: [122, 146], hd: [134, 196], head: [92, 78] })) +
        ball(60, 200) + arrUp(150, 274)) }
  ]
},

/* ---------- 8 ---------- */
{
  id: 'valec_stehno', nazev: 'Válec pod stehnem vsedě', kat: 'automasaz', blok: 2,
  typ: 'cas', cas: { 1: 60, 2: 90, 3: 90 },
  davka: { 1: '1 minuta každá noha', 2: '90 vteřin každá noha', 3: '90 vteřin každá noha' },
  pomucky: ['masážní válec', 'židle'],
  kroky: [
    'Sedni si na kraj židle. Válec polož na zem před sebe.',
    'Polož si stehno na válec tak, že nohu natáhneš dopředu a patu opřeš o zem.',
    'Rukama si přidržuj válec a pomalu jím přejížděj po přední a boční straně stehna.',
    'Můžeš i tlačit dlaněmi shora — tak si dávkuješ tlak přesně.',
    'Vyhni se oblasti kolem kolena a kyčelní kosti.'
  ],
  pozor: 'Nelehej si na válec celou vahou těla. Vsedě máš tlak pod kontrolou a záda zůstávají v klidu.',
  proc: 'Přední strana stehna táhne za pánev a ovlivňuje kyčel i bedra. Uvolnit se dá bez toho, aby ses na válec položila.',
  faze: [
    { popis: 'Válec pod stehnem', svg: () => panel(FLOOR + CHAIR +
        fig(cp(SED, { kn: [276, 236], an: [326, 326], toe: [356, 320], hd: [268, 236], el: [222, 172] })) +
        roller(258, 250, 70)) },
    { popis: 'Přejíždění nahoru', svg: () => panel(FLOOR + CHAIR +
        fig(cp(SED, { kn: [276, 236], an: [326, 326], toe: [356, 320], hd: [244, 214], el: [214, 166] })) +
        roller(232, 226, 70) + arrL(210, 292) + tag(96, 306, 'ke kyčli')) },
    { popis: 'Přejíždění dolů', svg: () => panel(FLOOR + CHAIR +
        fig(cp(SED, { kn: [276, 236], an: [326, 326], toe: [356, 320], hd: [290, 254], el: [232, 182] })) +
        roller(286, 268, 70) + arrR(232, 292) + tag(120, 306, 'ne přes koleno')) }
  ]
},

/* ---------- 9 ---------- */
{
  id: 'valec_lytko', nazev: 'Válec pod lýtkem', kat: 'automasaz', blok: 2,
  typ: 'cas', cas: { 1: 60, 2: 60, 3: 90 },
  davka: { 1: '1 minuta každá noha', 2: '1 minuta každá noha', 3: '90 vteřin každá noha' },
  pomucky: ['masážní válec', 'židle'],
  kroky: [
    'Sedni si na židli. Válec polož na zem před sebe.',
    'Polož lýtko jedné nohy na válec, patu nech volně viset.',
    'Druhou nohou si můžeš pomáhat — polož ji křížem přes první, když chceš přidat tlak.',
    'Pomalu přejížděj od kotníku po lýtko, ne přes podkolenní jamku.',
    'Vyměň nohy.'
  ],
  pozor: 'Nikdy nepřejížděj podkolenní jamku — vede tudy céva a nerv.',
  proc: 'Zkrácená lýtka mění způsob chůze a zatěžují koleno. Tady je vidět efekt často rychle.',
  faze: [
    { popis: 'Lýtko na válci', svg: () => panel(FLOOR + CHAIR +
        fig(cp(SED, { kn: [272, 214], an: [330, 318], toe: [356, 306] })) + roller(316, 330, 76)) },
    { popis: 'Přejíždění ke kolenu', svg: () => panel(FLOOR + CHAIR +
        fig(cp(SED, { kn: [272, 214], an: [330, 318], toe: [356, 306] })) + roller(292, 316, 76) +
        arrL(272, 372 - 100) + tag(110, 288, 'ne přes jamku')) },
    { popis: 'Přejíždění ke kotníku', svg: () => panel(FLOOR + CHAIR +
        fig(cp(SED, { kn: [272, 214], an: [330, 318], toe: [356, 306] })) + roller(334, 336, 76) +
        arrR(280, 272)) }
  ]
},

/* ---------- 10 ---------- */
{
  id: 'rucnik_masaz', nazev: 'Klouzavá masáž ručníkem', kat: 'automasaz', blok: 1,
  typ: 'cas', cas: { 1: 90, 2: 120, 3: 120 },
  davka: { 1: '90 vteřin', 2: '2 minuty', 3: '2 minuty' },
  pomucky: ['ručník', 'židle'],
  kroky: [
    'Sedni si na židli. Ručník chytni oběma rukama za konce.',
    'Přilož ho na stehno a táhni ho po kůži — jednou rukou nahoru, druhou dolů, jako když si sušíš záda.',
    'Postupuj po celém stehně, pak po lýtku. Tempo klidné.',
    'Tlak volíš tak, aby to bylo příjemné a kůže se jen zahřála.',
    'Vyměň nohy.'
  ],
  pozor: 'Jen po kůži, žádné drhnutí do bolesti. Na místa s křečovými žilami netlač.',
  proc: 'Podráždí receptory v kůži a podkoží, zlepší prokrvení a sníží svalové napětí. Příjemný a bezpečný začátek uvolnění.',
  faze: [
    { popis: 'Ručník kolem stehna', svg: () => panel(FLOOR + CHAIR +
        fig(cp(SED, { el: [206, 158], hd: [232, 190] })) + towel(240, 200, 110, 22)) },
    { popis: 'Táhni jednou rukou nahoru', svg: () => panel(FLOOR + CHAIR +
        fig(cp(SED, { el: [200, 148], hd: [216, 176] })) + towel(240, 200, 110, 22) +
        arrR(292, 174) + tag(112, 288, 'střídavě tam a zpět')) },
    { popis: 'Přejdi na lýtko', svg: () => panel(FLOOR + CHAIR +
        fig(cp(SED, { el: [232, 200], hd: [258, 268] })) + towel(268, 286, 100, 22)) }
  ]
},

/* ---------- 11 ---------- */
{
  id: 'rucnik_lytko', nazev: 'Protažení lýtka ručníkem', kat: 'automasaz', blok: 1,
  typ: 'cas', cas: { 1: 30, 2: 40, 3: 45 },
  davka: { 1: '2× 30 vteřin každá noha', 2: '2× 40 vteřin každá noha', 3: '2× 45 vteřin každá noha' },
  pomucky: ['ručník', 'židle'],
  kroky: [
    'Sedni si na židli a natáhni jednu nohu dopředu, patu opři o zem.',
    'Ručník přehoď přes špičku chodidla a chyť oba konce.',
    'Zády zůstáváš vzpřímená — nepředkláněj se. Táhneš jen rukama.',
    'Jemně přitáhni špičku k sobě, dokud necítíš tah v lýtku a pod chodidlem.',
    'Vydrž, klidně dýchej. Pak povol a vyměň nohy.'
  ],
  pozor: 'Nepředkláněj se za ručníkem. Tah dělají ruce, záda zůstávají rovná a opřená.',
  proc: 'Klasické protažení lýtka bez předklonu — proto ručník. Pomáhá i na bolest paty.',
  faze: [
    { popis: 'Noha natažená, ručník přes špičku', svg: () => panel(FLOOR + CHAIR +
        fig(cp(SED, { kn: [280, 224], an: [340, 328], toe: [356, 302], el: [222, 176], hd: [286, 250] })) +
        towel(330, 300, 60, 20)) },
    { popis: 'Přitáhni špičku, záda rovná', svg: () => panel(FLOOR + CHAIR +
        fig(cp(SED, { kn: [280, 224], an: [340, 328], toe: [348, 292], el: [216, 172], hd: [278, 244], cue: true })) +
        towel(324, 288, 60, 20) + arrL(268, 214) + tag(96, 152, 'záda opřená')) },
    { popis: 'Vydrž a dýchej', svg: () => panel(FLOOR + CHAIR +
        fig(cp(SED, { kn: [280, 224], an: [340, 328], toe: [348, 292], el: [216, 172], hd: [278, 244] })) +
        towel(324, 288, 60, 20) + tag(120, 152, '30 vteřin')) }
  ],
  spatne: { popis: 'Předklon za ručníkem', svg: () => panel(FLOOR + CHAIR +
      fig(cp(SED, { bad: true, kn: [280, 224], an: [340, 328], toe: [348, 292],
                    sh: [252, 158], el: [284, 200], hd: [316, 254], head: [268, 140], curve: [212, 156] })) +
      cross(298, 66) + tag(96, 300, 'kulatá záda — ne', true), true) }
},

/* ---------- 12 ---------- */
{
  id: 'rucnik_kolena', nazev: 'Ručník mezi koleny', kat: 'sila', blok: 2,
  typ: 'opak', opak: { 1: 8, 2: 10, 3: 12 },
  davka: { 1: '8× výdrž 5 vteřin', 2: '10× výdrž 5 vteřin', 3: '12× výdrž 8 vteřin' },
  pomucky: ['ručník', 'židle'],
  kroky: [
    'Sedni si vzpřímeně na židli, chodidla na zemi na šířku pánve.',
    'Sroluj ručník a vlož ho mezi kolena.',
    'Stiskni kolena k sobě zhruba na 70 % síly. Ne naplno.',
    'Drž stisk 5 vteřin a normálně u toho dýchej — nezadržuj dech.',
    'Povol a chvíli počkej, než zopakuješ.'
  ],
  pozor: 'Nezadržuj dech. Při zadrženém dechu stoupá tlak a to se u tebe nehodí.',
  proc: 'Posílí vnitřní stranu stehen a podpoří stabilitu pánve. Izometrie nezatěžuje kloub pohybem — vhodné i při bolavé kyčli.',
  pohled: 'zpředu',
  faze: [
    { popis: 'Ručník mezi koleny', svg: () => panel(FLOOR + ZIDLE_F +
        figF({ head: [200, 84], sh: [200, 124], hip: [200, 224],
               elL: [166, 166], hdL: [172, 216], elR: [234, 166], hdR: [228, 216],
               knL: [174, 258], anL: [172, 338], knR: [226, 258], anR: [228, 338] }) +
        towel(200, 258, 40, 30) + tag(112, 146, 'pohled zpředu')) },
    { popis: 'Stiskni a drž 5 vteřin', svg: () => panel(FLOOR + ZIDLE_F +
        figF({ head: [200, 84], sh: [200, 124], hip: [200, 224], cue: true,
               elL: [166, 166], hdL: [172, 216], elR: [234, 166], hdR: [228, 216],
               knL: [182, 258], anL: [176, 338], knR: [218, 258], anR: [224, 338] }) +
        towel(200, 258, 30, 30) + arrR(110, 258) + arrL(290, 258) +
        tag(102, 316, 'dýchej, nezadržuj')) },
    { popis: 'Povol', svg: () => panel(FLOOR + ZIDLE_F +
        figF({ head: [200, 84], sh: [200, 124], hip: [200, 224],
               elL: [166, 166], hdL: [172, 216], elR: [234, 166], hdR: [228, 216],
               knL: [174, 258], anL: [172, 338], knR: [226, 258], anR: [228, 338] }) +
        towel(200, 258, 40, 30)) }
  ]
},

/* ---------- 13 ---------- */
{
  id: 'zidle_vstavani', nazev: 'Vstávání ze židle', kat: 'sila', blok: 1,
  typ: 'opak', opak: { 1: 6, 2: 8, 3: 10 },
  davka: { 1: '2× 6 opakování', 2: '2× 8 opakování', 3: '3× 10 opakování' },
  pomucky: ['pevná židle bez koleček'],
  kroky: [
    'Sedni si na kraj židle. Chodidla polož pod kolena, celou plochou na zemi.',
    'Zpevni trup a nakloň se dopředu — ale z kyčlí, ne ohnutím zad. Nos míří nad špičky.',
    'Zatlač patami do země a vstaň. Zkus to bez pomoci rukou.',
    'Nahoře se úplně narovnej a propni kyčle.',
    'Zpátky sedej pomalu, počítej do tří. Pomalé sedání je půlka cvičení.'
  ],
  pozor: 'Záda zůstávají rovná po celou dobu. Když to bez rukou nejde, opři se lehce o stehna — ne o židli za sebou.',
  proc: 'Nejužitečnější silový cvik, jaký existuje. Trénuje přesně ten pohyb, který děláš denně desetkrát, a chrání před pádem.',
  faze: [
    { popis: 'Sed na kraji židle', svg: () => panel(FLOOR + CHAIR + fig(SED)) },
    { popis: 'Náklon z kyčlí, záda rovná', svg: () => panel(FLOOR + CHAIR +
        fig(cp(SED, { sh: [258, 150], el: [272, 198], hd: [282, 238], head: [274, 132], cue: true })) +
        dash([258, 150], [300, 112]) +
        `<circle cx="195" cy="208" r="9" fill="#fff" stroke="#0E7C6B" stroke-width="5"/>` +
        tag(140, 300, 'ohyb v kyčli, ne v zádech')) },
    { popis: 'Vstaň bez rukou', svg: () => panel(FLOOR + CHAIR + fig(STOJ) + arrUp(330, 300)) }
  ],
  spatne: { popis: 'Kulatá záda a hlava dolů', svg: () => panel(FLOOR + CHAIR +
      fig(cp(SED, { bad: true, sh: [276, 150], el: [286, 200], hd: [292, 240], head: [284, 164],
                    curve: [212, 148] })) + cross(310, 74) + tag(116, 300, 'kulatá záda — nikdy', true), true) }
},

/* ---------- 14 ---------- */
{
  id: 'unozeni', nazev: 'Únožení s gumou', kat: 'sila', blok: 3,
  typ: 'opak', opak: { 1: 8, 2: 10, 3: 12 },
  davka: { 1: '8× každá noha', 2: '10× každá noha', 3: '2× 12 každá noha' },
  pomucky: ['žlutá guma', 'kuchyňská linka'],
  kroky: [
    'Uvaž gumu kolem obou kotníků.',
    'Postav se bokem k lince a jednou rukou se jí přidrž. Noha blíž k lince je stojná.',
    'Váhu přenes na stojnou nohu a stůj vzpřímeně.',
    'Vzdálenější nohu odtáhni do strany, od linky. Špička míří dopředu, ne nahoru.',
    'Trup zůstává svislý — nenaklánět se na opačnou stranu.',
    'Pomalu vrať zpět. Otoč se a vyměň nohy.'
  ],
  pozor: 'Rozsah je malý, zhruba 20–30 cm. Důležitější než výška nohy je, že se trup nehne.',
  proc: 'Střední hýžďový sval drží pánev při každém kroku. Když je slabý, přetěžuje se kyčel a roste riziko pádu.',
  pohled: 'zpředu',
  faze: [
    { popis: 'Bokem u linky, guma na kotnících', svg: () => panel(FLOOR + LINKA_FL +
        figF({ head: [200, 70], sh: [200, 112], hip: [200, 216],
               elL: [162, 158], hdL: [116, 210], elR: [238, 160], hdR: [252, 208],
               knL: [180, 286], anL: [176, 344], knR: [222, 286], anR: [226, 344] }) +
        band([176, 350], [226, 350], 8) + tag(120, 128, 'pohled zpředu')) },
    { popis: 'Odtáhni nohu od linky', svg: () => panel(FLOOR + LINKA_FL +
        figF({ head: [200, 70], sh: [200, 112], hip: [200, 216], cue: true,
               elL: [162, 158], hdL: [116, 210], elR: [238, 160], hdR: [252, 208],
               knL: [180, 286], anL: [176, 344], knR: [258, 274], anR: [300, 330] }) +
        band([176, 350], [300, 336], 16) + arrR(302, 300) +
        tag(118, 128, 'trup zůstává svislý') + dash([200, 108], [200, 224])) },
    { popis: 'Pomalu zpět', svg: () => panel(FLOOR + LINKA_FL +
        figF({ head: [200, 70], sh: [200, 112], hip: [200, 216],
               elL: [162, 158], hdL: [116, 210], elR: [238, 160], hdR: [252, 208],
               knL: [180, 286], anL: [176, 344], knR: [222, 286], anR: [226, 344] }) +
        band([176, 350], [226, 350], 8) + arrL(268, 300)) }
  ],
  spatne: { popis: 'Náklon trupu místo práce kyčle', svg: () => panel(FLOOR + LINKA_FL +
      figF({ bad: true, head: [166, 78], sh: [176, 118], hip: [204, 216],
             elL: [140, 162], hdL: [116, 212], elR: [212, 164], hdR: [232, 210],
             knL: [186, 286], anL: [182, 344], knR: [262, 276], anR: [306, 330] }) +
      cross(304, 64) + tag(96, 130, 'naklonila ses', true), true) }
},

/* ---------- 15 ---------- */
{
  id: 'zanozeni', nazev: 'Zanožení s oporou', kat: 'sila', blok: 3,
  typ: 'opak', opak: { 1: 8, 2: 10, 3: 12 },
  davka: { 1: '8× každá noha', 2: '10× každá noha', 3: '2× 12 každá noha' },
  pomucky: ['kuchyňská linka'],
  kroky: [
    'Postav se čelem k lince, oběma rukama se přidrž.',
    'Váhu přenes na jednu nohu.',
    'Druhou nohu táhni dozadu — noha zůstává natažená, pohyb vychází z hýždě.',
    'Bedra se nesmí prohnout. Když se prohýbají, jdeš moc daleko.',
    'Pomalu vrať. Vyměň nohy.'
  ],
  pozor: 'Prohnutí v bedrech je hlavní chyba a u tebe zbytečné riziko. Radši menší rozsah a rovná záda.',
  proc: 'Velký hýžďový sval je hlavní motor při chůzi do schodů a při vstávání. Zároveň drží tělo vzpřímené.',
  faze: [
    { popis: 'Čelem k lince, přidrž se', svg: () => panel(FLOOR + LINKA_R +
        fig(cp(STOJ, { hip: [246, 180], sh: [242, 86], el: [276, 136], hd: [304, 190], head: [241, 64] }))) },
    { popis: 'Noha vzad z hýždě', svg: () => panel(FLOOR + LINKA_R +
        fig(cp(STOJ, { hip: [246, 180], sh: [242, 86], el: [276, 136], hd: [304, 190], head: [241, 64],
                       kn2: [204, 254], an2: [166, 328], toe2: [138, 336], cue: true })) +
        arrL(196, 292) + tag(70, 250, 'bedra se neprohýbají')) },
    { popis: 'Pomalu zpět', svg: () => panel(FLOOR + LINKA_R +
        fig(cp(STOJ, { hip: [246, 180], sh: [242, 86], el: [276, 136], hd: [304, 190], head: [241, 64] })) +
        arrR(210, 292)) }
  ],
  spatne: { popis: 'Prohnutá bedra', svg: () => panel(FLOOR + LINKA_R +
      fig({ bad: true, hip: [252, 180], kn: [250, 262], an: [248, 348], toe: [286, 352],
            kn2: [200, 248], an2: [156, 318], toe2: [130, 328],
            sh: [232, 88], el: [268, 138], hd: [300, 190], head: [228, 66], curve: [268, 132] }) +
      cross(190, 66) + tag(56, 250, 'prohnutá bedra', true), true) }
},

/* ---------- 16 ---------- */
{
  id: 'vypony', nazev: 'Výpony na špičky', kat: 'sila', blok: 1,
  typ: 'opak', opak: { 1: 8, 2: 12, 3: 15 },
  davka: { 1: '8 opakování', 2: '12 opakování', 3: '2× 15 opakování' },
  pomucky: ['kuchyňská linka'],
  kroky: [
    'Postav se čelem k lince, chodidla na šířku pánve, lehce se přidrž.',
    'Pomalu se zvedni na špičky. Pata jde přímo nahoru, ne do strany.',
    'Nahoře se na vteřinu zastav.',
    'Klesej dolů pomalu, počítej do tří. Pomalé klesání je důležitější než výška.',
    'Ruce používej jen na rovnováhu, netlač se jimi nahoru.'
  ],
  pozor: 'Žádné poskoky ani rychlé opakování. Otřesy jsou u tebe zbytečné riziko.',
  proc: 'Lýtka a chodidla jsou první, co tě zachrání při zakopnutí. Zároveň podporují prokrvení dolních končetin.',
  faze: [
    { popis: 'Čelem k lince', svg: () => panel(FLOOR + LINKA_R +
        fig(cp(STOJ, { hip: [246, 180], sh: [242, 86], el: [276, 136], hd: [304, 190], head: [241, 64] }))) },
    { popis: 'Zvedni se na špičky', svg: () => panel(FLOOR + LINKA_R +
        fig(cp(STOJ, { hip: [246, 156], kn: [250, 240], an: [250, 326], toe: [292, 350],
                       sh: [242, 62], el: [274, 116], hd: [304, 186], head: [241, 40] })) +
        arrUp(196, 300) + tag(58, 250, 'pata přímo nahoru')) },
    { popis: 'Klesej pomalu — tři vteřiny', svg: () => panel(FLOOR + LINKA_R +
        fig(cp(STOJ, { hip: [246, 180], sh: [242, 86], el: [276, 136], hd: [304, 190], head: [241, 64] })) +
        tag(70, 250, 'počítej do tří')) }
  ]
},

/* ---------- 17 ---------- */
{
  id: 'most', nazev: 'Most — zvedání pánve', kat: 'sila', blok: 2,
  typ: 'opak', opak: { 1: 6, 2: 8, 3: 10 },
  davka: { 1: '6× výdrž 3 vteřiny', 2: '8× výdrž 5 vteřin', 3: '2× 10 výdrž 5 vteřin' },
  pomucky: ['podložka'],
  kroky: [
    'Lehni si na záda, kolena pokrč, chodidla na šířku pánve opři o zem.',
    'Paže volně podél těla, dlaně dolů.',
    'Zatlač patami do země a zvedni pánev — jen do roviny, kde tvoří stehna a trup přímku.',
    'Nahoře stiskni hýždě a vydrž. Dýchej.',
    'Pokládej se zpět pomalu a plynule, ne pádem.'
  ],
  pozor: 'Nezvedej pánev výš, než kam vede přímka. Vyšší už není lepší — jen víc zatížíš bedra.',
  proc: 'Posílí hýždě a zadní stranu stehen v poloze, kde je páteř podepřená zemí. Bezpečná varianta silového cviku na kyčel.',
  faze: [
    { popis: 'Výchozí poloha', svg: () => panel(FLOOR + MAT +
        fig(cp(LEH, { hip: [244, 312], kn: [306, 262], an: [318, 336], toe: [352, 340],
                      el: [178, 328], hd: [212, 334] }))) },
    { popis: 'Zvedni pánev do přímky', svg: () => panel(FLOOR + MAT +
        fig(cp(LEH, { hip: [246, 268], kn: [306, 260], an: [318, 336], toe: [352, 340],
                      sh: [150, 300], el: [178, 328], hd: [212, 334], cue: true })) +
        dash([150, 300], [306, 258]) + arrUp(228, 236) + tag(150, 214, 'jen do přímky')) },
    { popis: 'Pokládej pomalu', svg: () => panel(FLOOR + MAT +
        fig(cp(LEH, { hip: [244, 312], kn: [306, 262], an: [318, 336], toe: [352, 340],
                      el: [178, 328], hd: [212, 334] })) + tag(140, 240, 'plynule dolů')) }
  ],
  spatne: { popis: 'Přezvednutá pánev, prohnutá bedra', svg: () => panel(FLOOR + MAT +
      fig({ bad: true, hip: [248, 236], kn: [308, 258], an: [318, 336], toe: [352, 340],
            sh: [150, 300], el: [176, 330], hd: [210, 336], head: [110, 298], curve: [206, 240] }) +
      cross(300, 66) + tag(126, 200, 'moc vysoko', true), true) }
},

/* ---------- 18 ---------- */
{
  id: 'lopatky', nazev: 'Odtah lopatek s gumou', kat: 'sila', blok: 3,
  typ: 'opak', opak: { 1: 8, 2: 10, 3: 12 },
  davka: { 1: '8 opakování', 2: '10 opakování', 3: '2× 12 opakování' },
  pomucky: ['žlutá guma', 'židle'],
  kroky: [
    'Sedni si vzpřímeně na židli, chodidla na zemi.',
    'Gumu chyť oběma rukama před sebou, paže natažené ve výšce hrudníku.',
    'Táhni ruce do stran a lopatky přitáhni k sobě a dolů.',
    'Ramena drž dole, netáhni je k uším.',
    'Pomalu povol zpátky. Nenech gumu, aby tě táhla.'
  ],
  pozor: 'Nezaklánět se. Trup zůstává vzpřímený a nehybný, pracují jen paže a lopatky.',
  proc: 'Vyrovnává předsunuté držení, které se po zlomeninách obratlů prohlubuje. Zádové svaly drží páteř vzpřímenou.',
  faze: [
    { popis: 'Guma před tělem', svg: () => panel(FLOOR + CHAIR +
        fig(cp(SED, { el: [222, 132], hd: [268, 140] })) + band([254, 140], [300, 140], 4) +
        `<path class="f-line" d="M190 112 L232 130 L282 138"/>`) },
    { popis: 'Táhni do stran, lopatky k sobě', svg: () => panel(FLOOR + CHAIR +
        fig(cp(SED, { el: [212, 128], hd: [244, 152], cue: true })) +
        band([222, 152], [312, 148], 20) + arrR(320, 128) +
        tag(96, 292, 'ramena dolů, ne k uším')) },
    { popis: 'Pomalu povol', svg: () => panel(FLOOR + CHAIR +
        fig(cp(SED, { el: [222, 132], hd: [268, 140] })) + band([254, 140], [300, 140], 4) +
        arrL(180, 128)) }
  ]
},

/* ---------- 19 ---------- */
{
  id: 'jedna_noha', nazev: 'Stoj na jedné noze', kat: 'rovnovaha', blok: 1,
  typ: 'cas', cas: { 1: 15, 2: 25, 3: 35 },
  davka: { 1: '3× 15 vteřin každá noha', 2: '3× 25 vteřin každá noha', 3: '3× 35 vteřin každá noha' },
  pomucky: ['kuchyňská linka'],
  kroky: [
    'Postav se čelem k lince, obě ruce polož na desku.',
    'Přenes váhu na jednu nohu a druhou lehce zvedni ze země.',
    'Stůj vzpřímeně, pohled dopředu na pevný bod.',
    'Až si budeš jistá, zkus se držet jen jednou rukou. Později jen prsty.',
    'Vyměň nohy.'
  ],
  pozor: 'Ruce měj vždy nad linkou, i když se nedržíš. Cílem není zvládnout to bez opory, ale trénovat bezpečně.',
  proc: 'Nejúčinnější prevence pádu, jakou máš k dispozici doma. U tebe je pád hlavní riziko další zlomeniny.',
  faze: [
    { popis: 'Obě ruce na lince', svg: () => panel(FLOOR + LINKA_R +
        fig(cp(STOJ, { hip: [246, 180], sh: [242, 86], el: [276, 134], hd: [306, 188], head: [241, 64] }))) },
    { popis: 'Zvedni jednu nohu', svg: () => panel(FLOOR + LINKA_R +
        fig(cp(STOJ, { hip: [246, 180], sh: [242, 86], el: [276, 134], hd: [306, 188], head: [241, 64],
                       kn2: [248, 262], an2: [212, 300], toe2: [240, 314] })) +
        tag(58, 250, 'pohled na pevný bod')) },
    { popis: 'Postupně uber oporu', svg: () => panel(FLOOR + LINKA_R +
        fig(cp(STOJ, { hip: [246, 180], sh: [242, 86], el: [272, 140], hd: [300, 192], head: [241, 64],
                       kn2: [248, 262], an2: [212, 300], toe2: [240, 314] })) +
        tag(64, 250, 'jen jedna ruka')) }
  ]
},

/* ---------- 20 ---------- */
{
  id: 'tandem', nazev: 'Tandem chůze u linky', kat: 'rovnovaha', blok: 3,
  typ: 'opak', opak: { 1: 4, 2: 6, 3: 8 },
  davka: { 1: '4 kroky tam a zpět', 2: '6 kroků tam a zpět', 3: '8 kroků tam a zpět' },
  pomucky: ['kuchyňská linka'],
  kroky: [
    'Postav se bokem k lince a chyť se jí jednou rukou.',
    'Jdi podél linky tak, že pokládáš patu jedné nohy těsně před špičku druhé — jako po čáře.',
    'Kroky dělej pomalu a pohled drž dopředu, ne na nohy.',
    'Dojdi na konec linky, otoč se opatrně a jdi zpět.',
    'Kdykoli se cítíš nejistá, přidrž se pevněji.'
  ],
  pozor: 'Jen podél opory, které se držíš. Nikdy uprostřed místnosti a nikdy bez opory na dosah.',
  proc: 'Trénuje rovnováhu v pohybu, což je situace, ve které lidé skutečně padají. Náročnější než stoj na jedné noze.',
  pohled: 'zeshora',
  faze: [
    { popis: 'Výchozí postoj u linky', svg: () => panel(LINKA_TOP +
        cara(70, 240, 340, 240) +
        chodidlo(120, 214, 0) + chodidlo(120, 268, 0) +
        tag(96, 128, 'pohled zeshora — chodidla') +
        tag(112, 322, 'linka po tvé levé ruce')) },
    { popis: 'Pata těsně před špičku', svg: () => panel(LINKA_TOP +
        cara(70, 240, 340, 240) +
        chodidlo(120, 240, 0) + chodidlo(172, 240, 0, true) +
        arrR(214, 240) + tag(84, 128, 'jako po jedné čáře')) },
    { popis: 'Pokračuj krok za krokem', svg: () => panel(LINKA_TOP +
        cara(70, 240, 340, 240) +
        chodidlo(120, 240, 0) + chodidlo(172, 240, 0) +
        chodidlo(224, 240, 0) + chodidlo(276, 240, 0, true) +
        arrR(306, 240) + tag(78, 128, 'pohled dopředu, ne na nohy')) }
  ]
}
];

/* ==========================================================================
   ZAKÁZANÉ POHYBY  a  VAROVNÉ SIGNÁLY
   ========================================================================== */
const NEDELAT = [
  { co: 'Předklony a dosahování na špičky',
    proc: 'Ohnutí páteře dopředu stlačuje přední část obratlů — přesně tam, kde vznikají kompresivní zlomeniny.' },
  { co: 'Sedy-lehy a zvedání natažených nohou vleže',
    proc: 'Opakovaná flexe páteře pod zátěží. Nejrizikovější běžný cvik, jaký existuje.' },
  { co: 'Rolování páteře na masážním válci',
    proc: 'Válec vytvoří páku přes jednotlivé obratle. Na stehna a lýtka ano, na záda nikdy.' },
  { co: 'Rotace trupu proti odporu',
    proc: 'Kroucení se zátěží namáhá obratle ve směru, na který nejsou stavěné.' },
  { co: 'Zvedání břemen s ohnutými zády',
    proc: 'I nákupní taška se zvedá dřepem, ne předklonem. Záda rovná, práci dělají nohy.' },
  { co: 'Doskoky, poskoky, běh po schodech dolů',
    proc: 'Nárazy do páteře. Chůze ano, otřesy ne.' },
  { co: 'Cvičení se zadrženým dechem',
    proc: 'Zvyšuje nitrobřišní a krevní tlak. Při každém cviku dýchej plynule.' }
];

const VLAJKY = [
  'Nová náhlá bolest zad, hlavně po kýchnutí, kašli nebo zvednutí něčeho',
  'Bolest vystřelující do nohy',
  'Brnění, mravenčení nebo slabost v nohou',
  'Znatelný úbytek tělesné výšky nebo zhoršení předklonu postavy',
  'Bolest, která se nezlepší do 24 hodin po cvičení',
  'Jakákoli ztráta kontroly nad močením nebo stolicí'
];
