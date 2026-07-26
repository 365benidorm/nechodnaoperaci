/* ==========================================================================
   NASTAVENÍ ODESÍLÁNÍ POKROKU
   Sem vlož adresu nasazené Apps Script webové aplikace (viz apps-script.gs).
   Necháš-li prázdné, appka funguje normálně, jen se nic neodesílá.
   ========================================================================== */
const SYNC_URL = "https://script.google.com/macros/s/AKfycbzQuEOFL1Jy9sCt5-x-MYCXobG8pupvOMnoxFSB3IsU0Utp-Qd2VOKtj69tgKdhxbkc/exec";
const KDO = "Máma";

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
function tyden() {
  const diff = Math.floor((new Date(dnes()) - new Date(startDate())) / 86400000);
  return Math.max(1, Math.floor(diff / 7) + 1);
}
function blok() { return Math.min(3, Math.max(1, Math.floor((tyden() - 1) / 3) + 1)); }

/* ========================== VÝBĚR CVIKŮ ================================= */
const KAT = { rozhybani: 'Rozhýbání', automasaz: 'Automasáž', sila: 'Síla', rovnovaha: 'Rovnováha' };
const KAT_PORADI = ['rozhybani', 'automasaz', 'sila', 'rovnovaha'];

function vypnute() { return store.get('off', []); }
function aktivni() {
  const off = vypnute(), b = blok();
  return CVIKY
    .map((c, i) => ({ c, i }))
    .filter(x => x.c.blok <= b && off.indexOf(x.c.id) === -1)
    .sort((a, b2) => (KAT_PORADI.indexOf(a.c.kat) - KAT_PORADI.indexOf(b2.c.kat)) || (a.i - b2.i))
    .map(x => x.c);
}
function davka(c) { return c.davka[blok()] || c.davka[3]; }
function trvaniS(c) {
  const b = blok();
  if (c.typ === 'cas') return (c.cas[b] || 60);
  return (c.opak[b] || 8) * 5;
}
function odhadMinut(list) {
  const s = list.reduce((a, c) => a + trvaniS(c) + 25, 0);
  return Math.max(5, Math.round(s / 60));
}

/* ========================== ZÁZNAM A ODESLÁNÍ =========================== */
function log() { return store.get('log', {}); }
function hotovoDnes() { return (log()[dnes()] || []); }
function zapis(id) {
  const l = log(); const d = dnes();
  l[d] = l[d] || [];
  if (l[d].indexOf(id) === -1) l[d].push(id);
  store.set('log', l);
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
  if (!SYNC_URL) return;
  const fronta = store.get('fronta', []);
  fronta.push(payload);
  store.set('fronta', fronta);
  poslatFrontu();
}
function poslatFrontu() {
  if (!SYNC_URL) return;
  const fronta = store.get('fronta', []);
  if (!fronta.length || !navigator.onLine) return;
  const kopie = fronta.slice();
  store.set('fronta', []);
  Promise.all(kopie.map(p => fetch(SYNC_URL, {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(p)
  }))).catch(() => { store.set('fronta', store.get('fronta', []).concat(kopie)); });
}
window.addEventListener('online', poslatFrontu);

/* ========================== ZVUK A VIBRACE ============================== */
let AC = null;
function pip(dvakrat) {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = AC.currentTime;
    const beep = (t) => {
      const o = AC.createOscillator(), g = AC.createGain();
      o.frequency.value = 760; o.type = 'sine';
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.28, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + 0.34);
    };
    beep(t0); if (dvakrat) beep(t0 + 0.42);
  } catch (e) { }
  if (navigator.vibrate) navigator.vibrate(dvakrat ? [180, 90, 180] : 180);
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
  const v = VIDEA[c.id];
  return `
    ${faze(c)}
    <div class="card">
      <h3>Jak na to</h3>
      <ol class="kroky">${c.kroky.map(k => `<li>${esc(k)}</li>`).join('')}</ol>
    </div>
    <div class="note red"><div class="h">Pozor</div>${esc(c.pozor)}</div>
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
      <div class="n">${splneno ? 'Dnes máš hotovo' : 'Dnešní lekce'}</div>
      <div class="s">${list.length} cviků · zhruba ${odhadMinut(list)} minut</div>
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
  SES = { list, idx, zbylo: 0, bezi: false, opak: 0 };
  if (location.hash === '#/lekce') viewLekce(); else location.hash = '#/lekce';
}

function viewLekce() {
  if (!SES) { zacniLekci(); return; }
  if (SES.idx >= SES.list.length) return viewHotovo();
  const c = SES.list[SES.idx];
  lista(`${SES.idx + 1} z ${SES.list.length}`, '#/', 'Ukončit');
  stopTik();
  SES.zbylo = trvaniS(c);
  SES.opak = 0;
  SES.bezi = false;

  app.innerHTML = `
    <div class="prog">${SES.list.map((_, i) => `<i class="${i <= SES.idx ? 'on' : ''}"></i>`).join('')}</div>
    <h1 style="margin-top:14px">${esc(c.nazev)}</h1>
    <p class="meta" style="margin-bottom:14px"><b>${esc(davka(c))}</b></p>
    ${c.pomucky.map(p => `<span class="tagline">${esc(p)}</span>`).join('')}

    <div class="card" style="padding:14px 18px 18px">
      ${c.typ === 'cas'
        ? `<div class="timer" id="tmr">${fmt(SES.zbylo)}</div>
           <div class="row" style="margin-top:14px">
             <button class="btn small" id="bstart" onclick="prepniTimer()">Spustit</button>
             <button class="btn ghost small" onclick="resetTimer()">Vynulovat</button>
           </div>`
        : `<div class="counter" id="cnt">0 z ${c.opak[blok()] || c.opak[3]}</div>
           <div class="row" style="margin-top:14px">
             <button class="btn small" onclick="pridejOpak(1)">+ 1 opakování</button>
             <button class="btn ghost small" onclick="pridejOpak(-1)">−</button>
           </div>`}
    </div>

    ${detailBody(c, true)}

    <div class="sticky">
      <button class="btn" onclick="dalsi(true)">${SES.idx === SES.list.length - 1 ? 'Hotovo — ukončit lekci' : 'Hotovo — další cvik'}</button>
      <div class="row">
        <button class="btn ghost small" onclick="zpetNaPredchozi()" ${SES.idx === 0 ? 'disabled' : ''}>← Předchozí cvik</button>
        <button class="btn ghost small" onclick="dalsi(false)">Dnes vynechat</button>
      </div>
    </div>
  `;
}

const fmt = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
function stopTik() { if (TIK) { clearInterval(TIK); TIK = null; } }
function resetTimer() {
  stopTik(); SES.bezi = false; SES.zbylo = trvaniS(SES.list[SES.idx]);
  const t = document.getElementById('tmr'); if (t) { t.textContent = fmt(SES.zbylo); t.classList.remove('done'); }
  const b = document.getElementById('bstart'); if (b) b.textContent = 'Spustit';
}
function prepniTimer() {
  const b = document.getElementById('bstart');
  if (SES.bezi) { stopTik(); SES.bezi = false; b.textContent = 'Pokračovat'; return; }
  if (SES.zbylo <= 0) {
    SES.zbylo = trvaniS(SES.list[SES.idx]);
    const t = document.getElementById('tmr');
    if (t) { t.textContent = fmt(SES.zbylo); t.classList.remove('done'); }
  }
  SES.bezi = true; b.textContent = 'Pauza';
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); AC.resume(); } catch (e) { }
  TIK = setInterval(() => {
    SES.zbylo--;
    const t = document.getElementById('tmr');
    if (!t) return stopTik();
    t.textContent = fmt(Math.max(0, SES.zbylo));
    if (SES.zbylo === 3) pip(false);
    if (SES.zbylo <= 0) {
      stopTik(); SES.bezi = false; SES.zbylo = 0;
      t.classList.add('done'); pip(true);
      const bb = document.getElementById('bstart'); if (bb) bb.textContent = 'Znovu';
    }
  }, 1000);
}
function pridejOpak(n) {
  const c = SES.list[SES.idx], cil = c.opak[blok()] || c.opak[3];
  SES.opak = Math.max(0, SES.opak + n);
  const el = document.getElementById('cnt');
  if (el) el.textContent = SES.opak + ' z ' + cil;
  if (SES.opak === cil) pip(true);
}
function odeber(id) {
  const l = log(), d = dnes();
  if (!l[d]) return;
  const i = l[d].indexOf(id);
  if (i !== -1) { l[d].splice(i, 1); store.set('log', l); }
}
function zpetNaPredchozi() {
  stopTik();
  if (!SES || SES.idx === 0) return;
  SES.idx--;
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
  SES = { list, idx, zbylo: 0, bezi: false, opak: 0 };
  if (location.hash === '#/lekce') viewLekce(); else location.hash = '#/lekce';
}
function dalsi(hotovo) {
  stopTik();
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
  const klic = dnes() + ':' + hot.length;
  if (POSLANO !== klic) {
    POSLANO = klic;
    odesli({ kdo: KDO, datum: dnes(), tyden: tyden(), blok: blok(), hotovo: hot.length, celkem: list.length, cviky: hot.join(', ') });
  }
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
    <h2>Odesílání pokroku</h2>
    <p class="meta">${SYNC_URL
      ? 'Po každé lekci se odešle souhrn (datum, počet cviků). Neodesílá se nic jiného.'
      : 'Zatím vypnuto. Adresa se nastavuje v souboru app.js na prvním řádku.'}</p>

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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
}
