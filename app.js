/* ==========================================================================
   NASTAVENÍ ODESÍLÁNÍ POKROKU
   Sem vlož adresu nasazené Apps Script webové aplikace (viz apps-script.gs).
   Necháš-li prázdné, appka funguje normálně, jen se nic neodesílá.
   ========================================================================== */
const SYNC_URL_VYCHOZI = "https://script.google.com/macros/s/AKfycbzQuEOFL1Jy9sCt5-x-MYCXobG8pupvOMnoxFSB3IsU0Utp-Qd2VOKtj69tgKdhxbkc/exec";
const KDO = "Máma";

/* Označení verze. Až budeš něco měnit, přepiš datum — objeví se dole
   v Nastavení a posílá se s každým záznamem do Sheetu, takže na dálku
   poznáš, jestli mamce nová verze skutečně dojela. */
const VERZE_APP = "2026-09-03b";

/* stav automatické aktualizace — musí být deklarované dřív, než poprvé
   proběhne render(), jinak appka spadne na temporal dead zone */
let CEKA_UPDATE = false;
let NACITAM = false;
let REG = null;

/* ========================== ÚLOŽIŠTĚ ==================================== */
let LS = true;
try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); } catch (e) { LS = false; }
const mem = {};
const store = {
  get(k, d) {
    if (!LS) return (k in mem) ? mem[k] : d;
    try { const v = localStorage.getItem('pohyb.' + k); return v === null ? d : JSON.parse(v); }
    catch (e) { return d; }
  },
  set(k, v) {
    if (!LS) { mem[k] = v; return; }
    try { localStorage.setItem('pohyb.' + k, JSON.stringify(v)); } catch (e) { mem[k] = v; }
  }
};

/* ========================== ČAS A BLOKY ================================= */
const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const dnes = () => iso(new Date());
const DNY = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
const MES = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];

function startDate() {
  let s = store.get('start', null);
  if (!s) { s = dnes(); store.set('start', s); }
  return s;
}
function den() {
  return Math.max(0, Math.floor((new Date(dnes()) - new Date(startDate())) / 86400000));
}
function tyden() { return Math.floor(den() / 7) + 1; }
function blok() { return Math.min(3, Math.max(1, Math.floor((tyden() - 1) / 3) + 1)); }

/* ========================== VÝBĚR CVIKŮ ================================= */
const KAT = { rozhybani: 'Rozhýbání', automasaz: 'Automasáž', sila: 'Síla', rovnovaha: 'Rovnováha' };
const KAT_PORADI = ['rozhybani', 'automasaz', 'sila', 'rovnovaha'];
const ROZESTUP = 3;     // po kolika dnech přibude v bloku další nový cvik
const ROTUJE = 'automasaz';   // jediná kategorie, kde nevadí střídání

function vypnute() { return store.get('off', []); }

/* Cviky bloku 1 jsou k dispozici hned. Ve vyšších blocích přibývají po jednom
   každé tři dny, aby lekce nenarostla ze dne na den o polovinu. */
function serazene() {
  return CVIKY.map((c, i) => ({ c, i }))
    .sort((a, b) => (KAT_PORADI.indexOf(a.c.kat) - KAT_PORADI.indexOf(b.c.kat)) || (a.i - b.i))
    .map(x => x.c);
}
function odemcenoDen(c) {
  if (c.blok <= 1) return 0;
  const vBloku = serazene().filter(x => x.blok === c.blok);
  return (c.blok - 1) * 21 + vBloku.indexOf(c) * ROZESTUP;
}
function odemcene() {
  const off = vypnute(), d = den();
  return serazene().filter(c => off.indexOf(c.id) === -1 && odemcenoDen(c) <= d);
}

/* Z odemčených se sestaví dnešní lekce. Masáže se střídají — každý den jich
   je zhruba polovina a okno se posouvá, takže se všechny prostřídají. */
function aktivni() {
  const vse = odemcene();
  const rot = vse.filter(c => c.kat === ROTUJE && !c.vzdy);
  if (rot.length < 3) return vse;
  const kolik = Math.ceil(rot.length / 2);
  const posun = den() % rot.length;
  const dnesni = [];
  for (let i = 0; i < kolik; i++) dnesni.push(rot[(posun + i) % rot.length]);
  return vse.filter(c => c.kat !== ROTUJE || c.vzdy || dnesni.indexOf(c) !== -1);
}

function davka(c) { return c.davka[blok()] || c.davka[3]; }

/* ---- SÉRIE A STRANY ----------------------------------------------------
   Počty kol jsou zapsané v cviky.js (objekt KOLA), ne odvozené z textu. */
function serii(c) { return (c.serie && c.serie[blok()]) || 1; }
function stran(c) { return c.strany || 1; }
function pocetKol(c) { return serii(c) * stran(c); }
function stranaSlovo(c, i) {
  const s = c.slovo === 'strana' ? ['levá strana', 'pravá strana'] : ['levá noha', 'pravá noha'];
  return s[i];
}
/* Popisek kola (k = 0 pro první). Prázdný, když je kolo jen jedno. */
function popisKola(c, k) {
  const s = serii(c), n = stran(c);
  if (s === 1 && n === 1) return '';
  const serie = Math.floor(k / n) + 1;
  const strana = stranaSlovo(c, k % n);
  if (s > 1 && n > 1) return serie + '. série — ' + strana;
  if (s > 1) return serie + '. série z ' + s;
  return strana;
}
function trvaniS(c) {
  const b = blok();
  if (c.typ === 'cas') return (c.cas[b] || 60);
  return (c.opak[b] || 8) * 5;
}
function cilOpak(c) { return c.opak[blok()] || c.opak[3]; }
function odhadMinut(list) {
  if (!list.length) return 0;
  const s = list.reduce((a, c) => a + pocetKol(c) * trvaniS(c) + 25, 0);
  return Math.max(5, Math.round(s / 60));
}

/* ========================== ZÁZNAM A ODESLÁNÍ =========================== */
function syncUrl() { return (store.get('syncUrl', '') || SYNC_URL_VYCHOZI || '').trim(); }

function log() { return store.get('log', {}); }
function hotovoDnes() { return (log()[dnes()] || []); }
function zapis(id) {
  const l = log(); const d = dnes();
  l[d] = l[d] || [];
  if (l[d].indexOf(id) === -1) l[d].push(id);
  store.set('log', l);
  posliSouhrn();
}

/* Souhrn dne se posílá po každém odcvičeném cviku, ne až na konci lekce.
   Dřív se odesílalo jen z dokončovací obrazovky — když ji mamka nedošla,
   nedorazilo nic. Skript si u každého data nechá poslední řádek. */
let SOUHRN_T = null;
function posliSouhrn() {
  clearTimeout(SOUHRN_T);
  SOUHRN_T = setTimeout(() => {
    const hot = hotovoDnes();
    odesli({
      kdo: KDO, datum: dnes(), tyden: tyden(), blok: blok(),
      hotovo: hot.length, celkem: aktivni().length,
      cviky: hot.join(', '), verze: VERZE_APP
    });
  }, 1500);
}
function serie() {
  let n = 0; const l = log();
  for (let i = 0; i < 60; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if ((l[iso(d)] || []).length) n++; else if (i > 0) break;
  }
  return n;
}
function poslednich7() {
  const l = log(), out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    out.push((l[iso(d)] || []).length > 0);
  }
  return out;
}
function odesli(payload) {
  if (!syncUrl()) return;
  const fronta = store.get('fronta', []);
  fronta.push(payload);
  store.set('fronta', fronta);
  poslatFrontu();
}
function poslatFrontu() {
  if (!syncUrl()) return;
  const fronta = store.get('fronta', []);
  if (!fronta.length || !navigator.onLine) return;
  const kopie = fronta.slice();
  store.set('fronta', []);
  Promise.all(kopie.map(p => fetch(syncUrl(), {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(p)
  }))).catch(() => { store.set('fronta', store.get('fronta', []).concat(kopie)); });
}
window.addEventListener('online', poslatFrontu);

/* ========================== ZVUK A VIBRACE ============================== */
let AC = null;
function odemkniZvuk() {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
  } catch (e) { }
}
document.addEventListener('touchstart', odemkniZvuk, { once: true });
document.addEventListener('click', odemkniZvuk, { once: true });

function ton(f, zpozdeni, delka, hlasitost) {
  const t = AC.currentTime + zpozdeni;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = 'sine'; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(hlasitost, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + delka);
  o.connect(g); g.connect(AC.destination);
  o.start(t); o.stop(t + delka + 0.05);
}

/* krátké pípnutí tři vteřiny před koncem */
function pip() {
  odemkniZvuk();
  try { ton(740, 0, 0.28, 0.18); } catch (e) { }
}

/* cinknutí při KAŽDÉM spuštění časovače — dva stoupající tóny.
   Záměrně hlubší a kratší než cink() na konci, aby se to nedalo splést. */
function cinkStart() {
  odemkniZvuk();
  try {
    ton(523.25, 0.00, 0.22, 0.30);
    ton(698.46, 0.13, 0.30, 0.32);
  } catch (e) { }
}

/* cinknutí na konci časovače — tři tóny, ať je slyšet i přes místnost */
function cink() {
  odemkniZvuk();
  try {
    ton(880, 0.00, 0.85, 0.38);
    ton(1174.7, 0.20, 0.85, 0.38);
    ton(1567.98, 0.40, 1.25, 0.42);
  } catch (e) { }
}

/* ==================== OBRAZOVKA NEZHASNE PŘI CVIČENÍ ==================== */
let WL = null;
function drzObrazovku() {
  try {
    if ('wakeLock' in navigator && !WL)
      navigator.wakeLock.request('screen').then(w => {
        WL = w; w.addEventListener('release', () => { WL = null; });
      }).catch(() => { });
  } catch (e) { }
}
function uvolniObrazovku() {
  try { if (WL) { WL.release(); WL = null; } } catch (e) { }
}
/* Obrazovka nezhasne, dokud je mamka v appce. Po 10 minutách bez dotyku
   ji pustíme, aby appka zapomenutá na lince nevysála baterku; první dotyk
   ji vrátí. Při běžícím časovači se nepouští nikdy. */
let WL_IDLE = null;
function planujUvolneni() {
  clearTimeout(WL_IDLE);
  WL_IDLE = setTimeout(() => {
    if (!(SES && SES.bezi)) uvolniObrazovku();
  }, 10 * 60 * 1000);
}
function obrazovkuVzhuru() {
  if (document.visibilityState !== 'visible') return;
  drzObrazovku();
  planujUvolneni();
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') obrazovkuVzhuru();
  else { clearTimeout(WL_IDLE); uvolniObrazovku(); }
});
['pointerdown', 'keydown', 'touchstart'].forEach(ev =>
  document.addEventListener(ev, obrazovkuVzhuru, { passive: true }));
window.addEventListener('load', obrazovkuVzhuru);

/* ========================== ČTENÍ NAHLAS ================================ */
const TTS = (() => { try { return !!window.speechSynthesis && typeof window.SpeechSynthesisUtterance === 'function'; } catch (e) { return false; } })();
let HLASY = [];
function nactiHlasy() { try { HLASY = window.speechSynthesis.getVoices() || []; } catch (e) { HLASY = []; } }
if (TTS) { nactiHlasy(); try { window.speechSynthesis.onvoiceschanged = nactiHlasy; } catch (e) { } }
function ceskyHlas() { return HLASY.filter(v => /^cs/i.test(v.lang))[0] || null; }

const RYCHLOSTI = { pomalu: 0.75, normalne: 0.92, rychle: 1.12 };
let AKT_CVIK = null;
let REC = { bezi: false, idx: 0, items: [], rate: 0.92, keep: null, hotovo: null };

function zvyrazni(sel) {
  document.querySelectorAll('.krok-akt').forEach(e => e.classList.remove('krok-akt'));
  if (!sel) return;
  const el = document.querySelector(sel);
  if (el) { el.classList.add('krok-akt'); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
}
function tlacitkoCteni(bezi) {
  const b = document.getElementById('btts');
  if (b) b.textContent = bezi ? '■  Zastavit čtení' : '▶  Přečíst nahlas';
}
function prepniCteni() {
  if (!TTS) return;
  if (REC.bezi) { zastavCteni(); return; }
  spustCteni();
}
function spustCteni(kratke, hotovo) {
  const c = AKT_CVIK;
  if (!c || !TTS) { if (hotovo) hotovo(); return; }
  REC.hotovo = hotovo || null;
  try { window.speechSynthesis.cancel(); } catch (e) { }
  if (kratke) {
    // další kolo téhož cviku — postup už slyšela, stačí připomenout na co dát pozor
    REC.items = [{ text: 'Pozor. ' + c.pozor, sel: '#kPozor' }];
  } else {
    REC.items = c.kroky.map((t, i) => ({ text: t, sel: '#k' + i }));
    REC.items.push({ text: 'Pozor. ' + c.pozor, sel: '#kPozor' });
  }
  REC.idx = 0; REC.bezi = true;
  REC.rate = RYCHLOSTI[store.get('rychlost', 'normalne')] || RYCHLOSTI.normalne;
  tlacitkoCteni(true);
  // Chrome umí čtení po chvíli uspat — tímhle ho držíme vzhůru
  clearInterval(REC.keep);
  REC.keep = setInterval(() => {
    try { if (window.speechSynthesis.speaking) window.speechSynthesis.resume(); } catch (e) { }
  }, 8000);
  dalsiVeta();
}
/* Ukončí čtení a spustí navazující krok (gong + čas). Volá se i tehdy,
   když řeč selže — jinak by appka zamrzla a časovač by se nikdy nerozjel. */
function dokonciCteni() {
  const cb = REC.hotovo; REC.hotovo = null;
  zastavCteni();
  if (cb) cb();
}
function dalsiVeta() {
  if (!REC.bezi) return;
  if (REC.idx >= REC.items.length) { dokonciCteni(); return; }
  const it = REC.items[REC.idx];
  zvyrazni(it.sel);
  let u;
  try { u = new SpeechSynthesisUtterance(it.text); } catch (e) { return dokonciCteni(); }
  u.lang = 'cs-CZ';
  u.rate = REC.rate;
  const v = ceskyHlas(); if (v) u.voice = v;
  const pokracuj = () => { REC.idx++; setTimeout(dalsiVeta, 320); };
  u.onend = pokracuj;
  u.onerror = pokracuj;
  try { window.speechSynthesis.speak(u); } catch (e) { dokonciCteni(); }
}
function zastavCteni() {
  REC.bezi = false;
  REC.hotovo = null;
  clearInterval(REC.keep); REC.keep = null;
  try { window.speechSynthesis.cancel(); } catch (e) { }
  zvyrazni(null);
  tlacitkoCteni(false);
}

/* ========================== VYKRESLOVÁNÍ ================================ */
const app = document.getElementById('app');
const bar = document.getElementById('bar');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function lista(titulek, zpet, popisek) {
  bar.innerHTML = (zpet ? `<button class="back" onclick="location.hash='${zpet}'">‹ ${esc(popisek || 'Zpět')}</button>` : '')
    + `<div class="t">${esc(titulek)}</div>`;
}

function faze(c) {
  let h = '';
  c.faze.forEach((f, i) => {
    h += `<div class="faze"><div class="lbl"><span class="num">${i + 1}</span>${esc(f.popis)}</div>${f.svg()}</div>`;
  });
  if (c.spatne) {
    h += `<div class="faze"><div class="lbl"><span class="num bad">✕</span>${esc(c.spatne.popis)}</div>${c.spatne.svg()}</div>`;
  }
  return h;
}

function detailBody(c, kompakt) {
  AKT_CVIK = c;
  const v = VIDEA[c.id];
  return `
    ${faze(c)}
    <div class="card">
      <h3>Jak na to</h3>
      <ol class="kroky">${c.kroky.map((k, i) => `<li id="k${i}">${esc(k)}</li>`).join('')}</ol>
    </div>
    ${TTS ? `<button class="btn ghost tts" id="btts" onclick="prepniCteni()">▶&nbsp; Přečíst nahlas</button>` : ''}
    <div class="note red" id="kPozor"><div class="h">Pozor</div>${esc(c.pozor)}</div>
    ${kompakt ? '' : `<div class="note"><div class="h">Proč to děláš</div>${esc(c.proc)}</div>`}
    ${v ? `<a class="btn ghost small" href="${esc(v)}" target="_blank" rel="noopener">Přehrát video ↗</a>` : ''}
  `;
}

/* ---------------------------- DOMŮ -------------------------------------- */
function viewDomu() {
  lista('Denní pohyb', null);
  const list = aktivni();
  const hot = hotovoDnes();
  const d = new Date();
  const splneno = hot.length >= list.length && list.length > 0;
  const s = serie();

  app.innerHTML = `
    <div class="hero">
      <div class="d">${DNY[d.getDay()]} ${d.getDate()}. ${MES[d.getMonth()]}</div>
      <div class="n">${list.length === 0 ? 'Není co cvičit' : (splneno ? 'Dnes máš hotovo' : 'Dnešní lekce')}</div>
      <div class="s">${list.length === 0
        ? 'Všechny cviky jsou vypnuté v Nastavení.'
        : list.length + ' ' + (list.length === 1 ? 'cvik' : (list.length < 5 ? 'cviky' : 'cviků')) + ' · zhruba ' + odhadMinut(list) + ' minut'}</div>
      <span class="pill">${tyden()}. týden · blok ${blok()} ze 3</span>
      <div class="streak">${poslednich7().map(x => `<i class="${x ? 'on' : ''}"></i>`).join('')}</div>
    </div>
    ${s > 1 ? `<p class="meta" style="text-align:center">Cvičíš ${s} ${s < 5 ? 'dny' : 'dní'} v řadě.</p>` : ''}

    ${list.length === 0
      ? `<div class="note red"><div class="h">Žádné cviky</div>V nastavení jsou všechny cviky vypnuté. Zapni alespoň jeden.</div>`
      : `<button class="btn big" onclick="zacniLekci()">${hot.length && !splneno ? 'Pokračovat v lekci' : (splneno ? 'Zacvičit si znovu' : 'Začít lekci')}</button>`}

    <button class="btn ghost" onclick="location.hash='#/nedelat'">Co nedělat &nbsp;·&nbsp; varovné signály</button>
    <button class="btn ghost" onclick="location.hash='#/knihovna'">Všechny cviky</button>
    <div class="row">
      <button class="btn ghost small" onclick="location.hash='#/tisk'">Pro fyzioterapeuta</button>
      <button class="btn ghost small" onclick="location.hash='#/nastaveni'">Nastavení</button>
    </div>
    <p class="meta" style="margin-top:22px;font-size:15px">
      Tato appka není léčba osteoporózy ani náhrada lékařské péče. Cviky používej jen v rozsahu,
      který ti schválil fyzioterapeut nebo lékař.
    </p>
  `;
}

/* ---------------------------- LEKCE ------------------------------------- */
let SES = null, TIK = null;

function zacniLekci() {
  const list = aktivni();
  const hot = hotovoDnes();
  let idx = 0;
  if (hot.length && hot.length < list.length) {
    const zbyva = list.findIndex(c => hot.indexOf(c.id) === -1);
    idx = zbyva === -1 ? 0 : zbyva;
  }
  SES = { list, idx, kolo: 0, zbylo: 0, bezi: false, opak: 0, faze: 'stoji' };
  if (location.hash === '#/lekce') viewLekce(); else location.hash = '#/lekce';
}

/* Text tlačítka podle toho, co se právě děje. */
function popisStartu() {
  const c = SES.list[SES.idx];
  if (SES.faze === 'cte') return 'Přeskočit čtení';
  if (SES.faze === 'bezi') return 'Pauza';
  if (SES.faze === 'pauza') return 'Pokračovat';
  if (SES.faze === 'pocita') {
    const p = popisKola(c, SES.kolo);
    return p ? 'Hotovo — ' + p : 'Hotovo — série odcvičena';
  }
  if (SES.faze === 'hotovo') {
    return SES.idx === SES.list.length - 1 ? 'Hotovo — ukončit lekci' : 'Hotovo — další cvik';
  }
  const p = popisKola(c, SES.kolo);
  return p ? 'Spustit — ' + p : 'Spustit';
}

function viewLekce() {
  if (!SES) { zacniLekci(); return; }
  if (SES.idx >= SES.list.length) return viewHotovo();
  const c = SES.list[SES.idx];
  stopTik();
  SES.zbylo = trvaniS(c);
  SES.bezi = false;
  SES.faze = 'stoji';
  listaLekce();

  const kol = pocetKol(c);

  app.innerHTML = `
    <div class="prog">${SES.list.map((_, i) => `<i class="${i <= SES.idx ? 'on' : ''}"></i>`).join('')}</div>
    <h1 style="margin-top:14px">${esc(c.nazev)}</h1>
    <p class="meta" style="margin-bottom:10px"><b>${esc(davka(c))}</b></p>
    ${c.pomucky.map(p => `<span class="tagline">${esc(p)}</span>`).join('')}

    <div class="card" style="padding:14px 18px 18px">
      ${kol > 1 ? `<div class="kolo" id="kolo">${esc(popisKola(c, SES.kolo))}</div>
        <div class="kolapruh">${[...Array(kol)].map((_, i) =>
          `<i class="${i < SES.kolo ? 'hotovo' : (i === SES.kolo ? 'ted' : '')}"></i>`).join('')}</div>` : ''}
      ${c.typ === 'cas'
        ? `<div class="timer" id="tmr">${fmt(SES.zbylo)}</div>`
        : `<div class="counter" id="cnt">${esc(cilOpak(c))}× opakování</div>`}
      <button class="btn" id="bstart" style="margin-top:14px" onclick="tlacitkoStart()">${esc(popisStartu())}</button>
      ${c.typ === 'cas' ? `<button class="btn ghost small" id="breset" onclick="resetTimer()">Vynulovat</button>` : ''}
    </div>

    ${detailBody(c, true)}

    <div class="patka">
      <button class="btn ghost small" onclick="zpetNaPredchozi()" ${SES.idx === 0 ? 'disabled' : ''}>← Předchozí cvik</button>
      <button class="btn ghost small" onclick="dalsi(false)">Dnes vynechat</button>
    </div>
  `;
}

/* Záhlaví lekce: zůstává nahoře, aby mamka nemusela scrollovat.
   Tlačítko vpravo ukončuje CELÝ cvik, ne jen sérii. */
function listaLekce() {
  if (!SES || SES.idx >= SES.list.length) return;
  const posledni = SES.idx === SES.list.length - 1;
  bar.innerHTML =
    `<button class="back" onclick="location.hash='#/'">‹ Ukončit</button>` +
    `<div class="t">${SES.idx + 1} z ${SES.list.length}</div>` +
    `<button class="hotovo" onclick="dalsi(true)">${posledni ? 'Konec ✓' : 'Hotovo ✓'}</button>`;
}

function prekresliKolo() {
  const c = SES.list[SES.idx];
  const k = document.getElementById('kolo');
  if (k) k.textContent = popisKola(c, SES.kolo);
  document.querySelectorAll('.kolapruh i').forEach((el, i) => {
    el.className = i < SES.kolo ? 'hotovo' : (i === SES.kolo ? 'ted' : '');
  });
  const t = document.getElementById('tmr');
  if (t) { t.textContent = fmt(trvaniS(c)); t.classList.remove('done'); }
  SES.zbylo = trvaniS(c);
  obnovTlacitko();
}
function obnovTlacitko() {
  const b = document.getElementById('bstart');
  if (!b) return;
  b.textContent = popisStartu();
  b.disabled = false;
  b.classList.remove('ghost');
  const r = document.getElementById('breset');
  if (r) r.style.display = (SES.faze === 'hotovo') ? 'none' : '';
}

const fmt = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
function stopTik() { if (TIK) { clearInterval(TIK); TIK = null; } }
function resetTimer() {
  stopTik(); zastavCteni();
  if (SES) clearTimeout(SES.pojistka);
  SES.bezi = false; SES.faze = 'stoji';
  SES.zbylo = trvaniS(SES.list[SES.idx]);
  const t = document.getElementById('tmr');
  if (t) { t.textContent = fmt(SES.zbylo); t.classList.remove('done'); }
  obnovTlacitko();
}

/* Jedno tlačítko pro všechny stavy kola. */
function tlacitkoStart() {
  const c = SES.list[SES.idx];
  if (SES.faze === 'cte') { clearTimeout(SES.pojistka); zastavCteni(); poGongu(); return; }
  if (SES.faze === 'bezi') { stopTik(); SES.bezi = false; SES.faze = 'pauza'; obnovTlacitko(); return; }
  if (SES.faze === 'pauza') { rozjedCas(); return; }
  if (SES.faze === 'pocita') { cink(); dokonciKolo(); return; }   // ruční potvrzení série
  if (SES.faze === 'hotovo') { dalsi(true); return; }             // celý cvik odcvičen

  drzObrazovku();
  const cist = TTS && AKT_CVIK && store.get('cistPriStartu', true);
  if (!cist) { poGongu(); return; }
  SES.faze = 'cte';
  obnovTlacitko();
  clearTimeout(SES.pojistka);
  SES.pojistka = setTimeout(() => {
    if (SES && SES.faze === 'cte') { zastavCteni(); poGongu(); }
  }, 45000);
  spustCteni(SES.kolo > 0, () => poGongu());
}

function poGongu() {
  if (SES) clearTimeout(SES.pojistka);
  cinkStart();
  const c = SES.list[SES.idx];
  if (c.typ === 'cas') setTimeout(() => rozjedCas(), 900);
  else { SES.faze = 'pocita'; obnovTlacitko(); }
}

function rozjedCas() {
  const c = SES.list[SES.idx];
  if (SES.zbylo <= 0) SES.zbylo = trvaniS(c);
  SES.bezi = true; SES.faze = 'bezi';
  obnovTlacitko();
  drzObrazovku();
  const konec = Date.now() + SES.zbylo * 1000;
  let varovano = false;
  stopTik();
  TIK = setInterval(() => {
    const t = document.getElementById('tmr');
    if (!t) return stopTik();
    const zb = Math.max(0, Math.round((konec - Date.now()) / 1000));
    SES.zbylo = zb;
    t.textContent = fmt(zb);
    if (zb <= 3 && zb > 0 && !varovano) { varovano = true; pip(); }
    if (zb <= 0) {
      stopTik(); SES.bezi = false;
      t.classList.add('done');
      cink();
      dokonciKolo();
    }
  }, 200);
}

/* Konec jednoho kola: buď se posuneme na další, nebo je cvik hotový.
   Cvik se zapíše jako odcvičený tady — ne až stiskem tlačítka v záhlaví. */
function dokonciKolo() {
  const c = SES.list[SES.idx];
  if (SES.kolo + 1 < pocetKol(c)) {
    SES.kolo++;
    SES.faze = 'stoji';
    setTimeout(() => { if (SES) prekresliKolo(); }, 1200);
  } else {
    SES.faze = 'hotovo';
    zapis(c.id);
    obnovTlacitko();
    listaLekce();
  }
}

function odeber(id) {
  const l = log(), d = dnes();
  if (!l[d]) return;
  const i = l[d].indexOf(id);
  if (i !== -1) { l[d].splice(i, 1); store.set('log', l); }
}
function zpetNaPredchozi() {
  stopTik(); zastavCteni();
  if (SES) { clearTimeout(SES.ttsTimer); SES.ttsTimer = null; }
  if (!SES || SES.idx === 0) return;
  SES.idx--;
  SES.kolo = 0; SES.faze = 'stoji';
  odeber(SES.list[SES.idx].id);   // odškrtnout, ať se dá rozhodnout znovu
  viewLekce();
  window.scrollTo(0, 0);
}
function zpetKPoslednimu() {
  const list = aktivni();
  if (!list.length) { location.hash = '#/'; return; }
  const idx = list.length - 1;
  odeber(list[idx].id);
  POSLANO = null;
  SES = { list, idx, kolo: 0, zbylo: 0, bezi: false, opak: 0, faze: 'stoji' };
  if (location.hash === '#/lekce') viewLekce(); else location.hash = '#/lekce';
}
function dalsi(hotovo) {
  stopTik();
  if (SES) { SES.kolo = 0; SES.faze = 'stoji'; }
  if (SES) { clearTimeout(SES.ttsTimer); SES.ttsTimer = null; }
  zastavCteni();
  if (hotovo) zapis(SES.list[SES.idx].id);
  SES.idx++;
  if (SES.idx >= SES.list.length) { location.hash = '#/hotovo'; return; }
  viewLekce();
  window.scrollTo(0, 0);
}

let POSLANO = null;
function viewHotovo() {
  lista('Hotovo', '#/');
  const hot = hotovoDnes(), list = aktivni();
  posliSouhrn();
  SES = null;
  app.innerHTML = `
    <div class="hero" style="margin-top:24px">
      <div class="d">Lekce dokončena</div>
      <div class="n">${hot.length} z ${list.length} cviků</div>
      <div class="s">${hot.length === list.length ? 'Všechno hotové. Zítra na viděnou.' : 'To stačí. Zítra zase kousek.'}</div>
    </div>
    <div class="note"><div class="h">Zapamatuj si na zítra</div>
      Bolest při cvičení má být nanejvýš mírná a do druhého dne má odeznít.
      Když je ráno horší než včera, příště uber — kratší výdrž, méně opakování.</div>
    <button class="btn" onclick="location.hash='#/'">Zpátky na začátek</button>
    <button class="btn ghost small" onclick="zpetKPoslednimu()">← Vrátit se k poslednímu cviku</button>
  `;
  window.scrollTo(0, 0);
}

/* ---------------------------- KNIHOVNA ---------------------------------- */
function viewKnihovna() {
  lista('Všechny cviky', '#/');
  const off = vypnute(), b = blok();
  let h = '';
  KAT_PORADI.forEach(k => {
    const list = CVIKY.filter(c => c.kat === k);
    if (!list.length) return;
    h += `<h2>${KAT[k]}</h2><ul class="plain">`;
    list.forEach(c => {
      const vyp = off.indexOf(c.id) !== -1;
      const pozdeji = c.blok > b;
      h += `<li onclick="location.hash='#/cvik/${c.id}'" style="cursor:pointer;display:flex;gap:12px;align-items:center">
        <div style="flex:1">
          <div style="font-weight:650${vyp ? ';opacity:.45' : ''}">${esc(c.nazev)}</div>
          <div class="meta" style="font-size:16px">${vyp ? 'Vypnuto' : (pozdeji ? 'Přidá se v bloku ' + c.blok : esc(davka(c)))}</div>
        </div><div style="color:var(--ink3)">›</div></li>`;
    });
    h += `</ul>`;
  });
  app.innerHTML = h;
}

function viewCvik(id) {
  const c = CVIKY.find(x => x.id === id);
  if (!c) { location.hash = '#/knihovna'; return; }
  lista(c.nazev, '#/knihovna');
  app.innerHTML = `
    <h1 style="margin-top:14px">${esc(c.nazev)}</h1>
    <p class="meta">${KAT[c.kat]} · <b>${esc(davka(c))}</b></p>
    ${c.pomucky.map(p => `<span class="tagline">${esc(p)}</span>`).join('')}
    ${detailBody(c, false)}
  `;
  window.scrollTo(0, 0);
}

/* ---------------------------- CO NEDĚLAT -------------------------------- */
function viewNedelat() {
  lista('Co nedělat', '#/');
  app.innerHTML = `
    <h1 style="margin-top:14px">Čemu se vyhýbat</h1>
    <p>Po zlomeninách obratlů jsou tyhle pohyby rizikové bez ohledu na to, kdo je doporučuje.
       Když ti někdo nabídne cvičení, které je obsahuje, tohle je důvod odmítnout.</p>
    <ul class="plain">
      ${NEDELAT.map(n => `<li><h3>${esc(n.co)}</h3><div class="meta" style="font-size:17px">${esc(n.proc)}</div></li>`).join('')}
    </ul>

    <h2>Kdy přestat a zavolat lékaři</h2>
    <div class="note red">
      <div class="h">Varovné signály</div>
      <ul style="margin:6px 0 0;padding-left:20px">
        ${VLAJKY.map(v => `<li style="margin-bottom:8px">${esc(v)}</li>`).join('')}
      </ul>
    </div>
    <p class="meta">Zlomenina obratle může vzniknout i bez pádu — třeba při kýchnutí nebo zvednutí tašky.
       Nová náhlá bolest zad není důvod „to rozchodit“.</p>
  `;
  window.scrollTo(0, 0);
}

/* ---------------------------- TISK -------------------------------------- */
function viewTisk() {
  lista('Pro fyzioterapeuta', '#/');
  let h = `
    <div class="noprint note"><div class="h">Jak to použít</div>
      Vytiskni tuhle stránku (tlačítko dole) a vezmi ji fyzioterapeutovi nebo ortopedovi.
      U každého cviku zaškrtne <b>ano / ne / upravit</b>. Co škrtne, pak vypneš v Nastavení.</div>

    <h1>Domácí cvičební program — ke schválení</h1>
    <p><b>Pacientka:</b> ..............................................
       &nbsp;&nbsp;<b>Datum:</b> ......................</p>
    <p style="font-size:17px">Anamnéza relevantní pro posouzení: dvě prodělané zlomeniny obratlů, osteoporóza,
       bolest kolen a kyčlí, indikovaná operace kyčle, aplikace kortikoidních injekcí, suplementace vitaminu D.</p>
    <p style="font-size:17px">Program je sestaven s vyloučením flexe a rotace páteře pod zátěží, nárazů a rolování
       páteře na válci. Prosím o posouzení jednotlivých položek a případnou úpravu dávkování.</p>
  `;
  KAT_PORADI.forEach(k => {
    const list = CVIKY.filter(c => c.kat === k);
    h += `<h2>${KAT[k]}</h2>`;
    list.forEach(c => {
      h += `<div class="card">
        <h3>${esc(c.nazev)}</h3>
        <div class="meta" style="font-size:16px">Dávkování: ${esc(c.davka[1])} → ${esc(c.davka[3])} · Pomůcky: ${c.pomucky.map(esc).join(', ')}</div>
        <div style="font-size:16px;margin-top:6px">${esc(c.kroky.join(' '))}</div>
        <div class="chk"><span>ano</span><span>ne</span><span>upravit:</span>
          <span style="flex:1;border-color:#bbb">&nbsp;</span></div>
      </div>`;
    });
  });
  h += `<div class="pr-only" style="margin-top:18px">
      <p><b>Podpis a razítko:</b> ..................................................</p>
    </div>
    <div class="noprint"><button class="btn" onclick="window.print()">Vytisknout / uložit jako PDF</button></div>`;
  app.innerHTML = h;
  window.scrollTo(0, 0);
}

/* ---------------------------- NASTAVENÍ --------------------------------- */
function viewNastaveni() {
  lista('Nastavení', '#/');
  const off = vypnute();
  let h = `
    <h2 style="margin-top:8px">Začátek programu</h2>
    <p class="meta">Podle tohoto data se počítají třítýdenní bloky. Teď je ${tyden()}. týden, blok ${blok()}.</p>
    <input type="date" value="${startDate()}" onchange="store.set('start', this.value); render();">

    <h2>Které cviky cvičit</h2>
    <p class="meta">Vypni všechno, co fyzioterapeut škrtl. Vypnuté cviky se v lekci vůbec neobjeví.</p>
  `;
  KAT_PORADI.forEach(k => {
    h += `<h3 style="margin:18px 0 2px;color:var(--ink3);font-size:16px;text-transform:uppercase;letter-spacing:.06em">${KAT[k]}</h3>`;
    CVIKY.filter(c => c.kat === k).forEach(c => {
      const on = off.indexOf(c.id) === -1;
      h += `<div class="tog"><div class="nm">${esc(c.nazev)}</div>
        <button class="sw" role="switch" aria-checked="${on}" onclick="prepniCvik('${c.id}')"></button></div>`;
    });
  });
  h += `
    <h2>Čtení nahlas</h2>
    <p class="meta">${TTS
      ? 'Pod instrukcemi u každého cviku je tlačítko <b>Přečíst nahlas</b>. Tady si nastavíš tempo.'
      : 'Tenhle prohlížeč čtení nahlas neumí. Na telefonu zkus Chrome (Android) nebo Safari (iPhone).'}</p>
    ${TTS ? `<div class="row">
      ${['pomalu', 'normalne', 'rychle'].map(r => `<button class="btn ${store.get('rychlost', 'normalne') === r ? '' : 'ghost '}small"
        onclick="store.set('rychlost','${r}'); viewNastaveni();">${{ pomalu: 'Pomalu', normalne: 'Normálně', rychle: 'Rychle' }[r]}</button>`).join('')}
    </div>
    <button class="btn ghost small" onclick="ukazkaCteni()">Přehrát ukázku</button>` : ''}

    <h2>Odesílání pokroku</h2>
    <p class="meta">${syncUrl()
      ? 'Po každém odcvičeném cviku se odešle souhrn dne (datum, počet cviků). Nic jiného.'
      : 'Vypnuto — chybí adresa.'}</p>
    <input type="url" id="syncin" placeholder="https://script.google.com/.../exec"
      value="${esc(store.get('syncUrl', '') || '')}"
      onchange="store.set('syncUrl', this.value.trim()); viewNastaveni();">
    <p class="meta" style="font-size:15px;margin-top:8px">Prázdné pole = použije se adresa zabudovaná v appce.</p>
    <button class="btn ghost small" onclick="testOdeslani(this)">Odeslat zkušební záznam</button>

    <h2>Čtení při spuštění časovače</h2>
    <p class="meta">Když se spustí časovač, appka sama přečte postup cviku. Při dalším spuštění
       téhož cviku už jen připomene „Pozor“. Čtení vždy umlkne 4 vteřiny před koncem,
       aby bylo slyšet cinknutí.</p>
    <div class="tog"><div class="nm">Číst automaticky</div>
      <button class="sw" role="switch" aria-checked="${store.get('cistPriStartu', true)}"
        onclick="store.set('cistPriStartu', !store.get('cistPriStartu', true)); viewNastaveni();"></button></div>

    <h2>Aktualizace</h2>
    <p class="meta">Appka se aktualizuje sama při spuštění. Tímhle tlačítkem se dá
       kontrola vyvolat hned — použij ho, když jsi právě něco nahrál a chceš to ověřit.</p>
    <button class="btn ghost small" onclick="rucniAktualizace(this)">Zkontrolovat aktualizaci</button>
    <p class="meta" style="font-size:15px;margin-top:10px">Verze v tomhle telefonu: <b>${esc(VERZE_APP)}</b></p>

    <h2>Vymazat data</h2>
    <p class="meta">Smaže historii cvičení i nastavení v tomto telefonu.</p>
    <button class="btn warn small" onclick="if(confirm('Opravdu smazat všechna data?')){try{localStorage.clear()}catch(e){};location.hash='#/';location.reload()}">Vymazat vše</button>
  `;
  app.innerHTML = h;
  window.scrollTo(0, 0);
}
function prepniCvik(id) {
  const off = vypnute(), i = off.indexOf(id);
  if (i === -1) off.push(id); else off.splice(i, 1);
  store.set('off', off);
  viewNastaveni();
}

/* ---------------------------- ROUTER ------------------------------------ */
function render() {
  const h = location.hash || '#/';
  stopTik();
  zastavCteni();
  if (CEKA_UPDATE && !SES) { nactiZnovu(); return; }
  if (h.indexOf('#/cvik/') === 0) return viewCvik(h.slice(7));
  switch (h) {
    case '#/lekce':     return viewLekce();
    case '#/hotovo':    return viewHotovo();
    case '#/knihovna':  return viewKnihovna();
    case '#/nedelat':   return viewNedelat();
    case '#/tisk':      return viewTisk();
    case '#/nastaveni': return viewNastaveni();
    default:            return viewDomu();
  }
}
window.addEventListener('hashchange', render);
startDate();
render();
poslatFrontu();

/* ==================== AUTOMATICKÁ AKTUALIZACE ============================
   Appka si při každém spuštění bere soubory ze sítě (viz sw.js), takže se
   změna nahraná na GitHub projeví sama. Tenhle blok navíc řeší případ,
   kdy nová verze dorazí za běhu — počká, až mamka nebude uprostřed cviku. */
function nactiZnovu() {
  if (NACITAM) return;
  NACITAM = true;
  location.reload();
}
function zkusAktualizovat() {
  if (REG) REG.update().catch(() => { });
}
function testOdeslani(btn) {
  if (!syncUrl()) { if (btn) btn.textContent = 'Chybí adresa'; return; }
  if (btn) { btn.textContent = 'Odesílám…'; btn.disabled = true; }
  odesli({ kdo: KDO, datum: dnes(), tyden: tyden(), blok: blok(),
           hotovo: 0, celkem: 0, cviky: 'ZKOUŠKA', verze: VERZE_APP });
  setTimeout(() => { if (btn) { btn.textContent = 'Odesláno — mrkni do tabulky'; btn.disabled = false; } }, 1200);
}
function rucniAktualizace(btn) {
  if (btn) { btn.textContent = 'Hledám…'; btn.disabled = true; }
  if (!REG) { setTimeout(() => nactiZnovu(), 400); return; }
  REG.update()
    .then(() => new Promise(r => setTimeout(r, 1800)))
    .then(() => nactiZnovu())
    .catch(() => nactiZnovu());
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
      .then(reg => {
        REG = reg;
        reg.update().catch(() => { });
        // kontrola při každém návratu do appky
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') zkusAktualizovat();
        });
        window.addEventListener('online', zkusAktualizovat);
      })
      .catch(() => { });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (SES) { CEKA_UPDATE = true; return; }   // uprostřed lekce nerušit
      nactiZnovu();
    });
  });
}

/* krátká ukázka čtení pro nastavení tempa */
function ukazkaCteni() {
  if (!TTS) return;
  zastavCteni();
  AKT_CVIK = { kroky: ['Takhle rychle se budou číst instrukce ke cvikům.'], pozor: 'Tempo se dá kdykoli změnit.' };
  spustCteni();
}
