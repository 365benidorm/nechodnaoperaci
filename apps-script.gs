/**
 * Denní pohyb — příjem záznamů o cvičení.
 *
 * NASAZENÍ
 * 1. Vytvoř nový Google Sheet.
 * 2. Rozšíření → Apps Script. Vlož tento kód a ulož.
 * 3. Nasadit → Nová nasazení → typ „Webová aplikace“.
 *      Spustit jako:      Já
 *      Kdo má přístup:    Kdokoli
 * 4. Zkopíruj vygenerovanou URL (končí na /exec)
 *    a vlož ji do app.js na řádek  const SYNC_URL = "...";
 * 5. Volitelně spusť jednou funkci nastavTydenniSouhrn() — pak ti každé
 *    pondělí ráno přijde e-mail s přehledem za minulý týden.
 */

const LIST = 'Cvičení';
const KOMU = Session.getEffectiveUser().getEmail();   // kam chodí týdenní souhrn

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    list_().appendRow([
      new Date(),
      d.kdo || '',
      d.datum || '',
      d.tyden || '',
      d.blok || '',
      d.hotovo || 0,
      d.celkem || 0,
      d.cviky || ''
    ]);
  } catch (err) {
    console.error(err);
  }
  return ContentService.createTextOutput('ok');
}

function doGet() {
  return ContentService.createTextOutput('Denní pohyb — endpoint běží.');
}

function list_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(LIST);
  if (!sh) {
    sh = ss.insertSheet(LIST);
    sh.appendRow(['Přijato', 'Kdo', 'Datum', 'Týden', 'Blok', 'Hotovo', 'Celkem', 'Cviky']);
    sh.setFrozenRows(1);
    sh.getRange('A1:H1').setFontWeight('bold');
  }
  return sh;
}

/* ---------- volitelný týdenní souhrn e-mailem ---------- */

function nastavTydenniSouhrn() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'tydenniSouhrn')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('tydenniSouhrn')
    .timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).create();
}

function tydenniSouhrn() {
  const data = list_().getDataRange().getValues().slice(1);
  const od = new Date(); od.setDate(od.getDate() - 7);

  const dny = {};
  data.forEach(r => {
    const d = new Date(r[0]);
    if (d >= od) dny[r[2]] = { hotovo: r[5], celkem: r[6], blok: r[4] };
  });

  const klice = Object.keys(dny).sort();
  if (!klice.length) {
    MailApp.sendEmail(KOMU, 'Máma — cvičení: minulý týden nic',
      'Za posledních 7 dní nedorazil žádný záznam.\n\n' +
      'Může to znamenat, že necvičila, nebo že telefon nebyl online — ' +
      'appka záznamy odesílá se zpožděním, až se připojí.');
    return;
  }

  let telo = 'Přehled za posledních 7 dní:\n\n';
  klice.forEach(d => {
    const z = dny[d];
    telo += `${d}   ${z.hotovo}/${z.celkem} cviků   (blok ${z.blok})\n`;
  });
  telo += `\nOdcvičených dní: ${klice.length} ze 7.\n`;

  MailApp.sendEmail(KOMU, `Máma — cvičení: ${klice.length}/7 dní`, telo);
}
