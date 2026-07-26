# Denní pohyb

Cvičební průvodce pro mobil. Česky, funguje offline, bez přihlašování a bez reklam.

Program je sestavený pro **ženu po zlomeninách obratlů, s osteoporózou a bolestí kolen
a kyčlí**. Neobsahuje flexi ani rotaci páteře pod zátěží, nárazy, ani rolování páteře
na masážním válci. Tyhle pohyby jsou naopak vypsané v sekci **Co nedělat**.

**Tohle není léčba osteoporózy.** Cvičení neovlivňuje hustotu kostí v míře, která by
nahradila farmakoterapii. Slouží k prevenci pádů, udržení síly a zmírnění bolesti.

---

## Než to mamka začne používat

1. Otevři v appce **Pro fyzioterapeuta** → *Vytisknout / uložit jako PDF*.
2. Vezmi papír fyzioterapeutovi nebo ortopedovi. U každého cviku zaškrtne **ano / ne / upravit**.
3. Co škrtne, vypni v appce v **Nastavení**. Vypnuté cviky se v lekci vůbec neobjeví.

---

## Nasazení na GitHub Pages

1. Nový repozitář, nahraj celý obsah téhle složky do kořene.
2. Settings → Pages → Source: *Deploy from a branch*, branch `main`, složka `/ (root)`.
3. Za minutu běží na `https://<účet>.github.io/<repo>/`.
4. Na mamčině telefonu otevři odkaz v prohlížeči → nabídka → **Přidat na plochu**.
   Od té chvíle se spouští jako aplikace a funguje i bez internetu.

Google Sites použij nanejvýš jako rozcestník s odkazem. **Nevkládej appku do iframu** —
v iframu nefunguje offline režim ani přidání na plochu.

---

## Co kde upravíš

| Chci změnit | Soubor | Kde |
|---|---|---|
| Odkazy na videa | `cviky.js` | objekt `VIDEA` úplně nahoře |
| Text cviku, kroky, dávkování | `cviky.js` | pole `CVIKY` |
| Seznam zakázaných pohybů | `cviky.js` | pole `NEDELAT` |
| Varovné signály | `cviky.js` | pole `VLAJKY` |
| Adresa pro odesílání pokroku | `app.js` | `SYNC_URL` na prvním řádku |
| Jméno v záznamech | `app.js` | `KDO` |

Po každé úpravě zvyš verzi v `sw.js` (`const VERZE = 'pohyb-v2'` atd.),
jinak telefon může dál používat starou verzi z cache.

### Videa

Ve výchozím stavu jsou všechna prázdná a tlačítko videa se nezobrazuje —
appka je celá funkční z textu a obrázků. Až odkazy vybereš, projdi je s mamkou
a ověř, že provedení na videu odpovídá tomu, co má na obrazovce.

---

## Sledování pokroku

Volitelné. Bez nastavení appka běží normálně, jen se nic neodesílá.

1. Postup v souboru `apps-script.gs` (nasazení jako webová aplikace).
2. Získanou URL vlož do `app.js` → `SYNC_URL`.

Odesílá se pouze datum, číslo týdne a bloku, počet dokončených cviků a jejich názvy.
Nic jiného. Když je telefon offline, záznam počká ve frontě a odešle se později.

**Řekni jí o tom dopředu.** Ať to bere jako podporu, ne jako kontrolu.

---

## Struktura programu

Devítitýdenní cyklus ve třech blocích po třech týdnech. Nové cviky se přidávají
na začátku každého bloku, dávkování se postupně zvyšuje.

| Blok | Týdny | Cviků | Zaměření |
|---|---|---|---|
| 1 | 1–3 | 9 | dech, jemné napřímení, automasáž, základní síla, rovnováha s oporou |
| 2 | 4–6 | 16 | přidání mobility kyčle a silových cviků vleže |
| 3 | 7–9 | 20 | plný objem, cviky s gumou, náročnější rovnováha |

Bloky se počítají od data v **Nastavení → Začátek programu**.
Po devátém týdnu program pokračuje v objemu bloku 3 — v tu chvíli má smysl
nechat sestavu znovu projít fyzioterapeutem a případně přitvrdit.

---

## Pravidlo bolesti

Platí u každého cviku:

- během cvičení nanejvýš **mírná** bolest, přibližně 3 z 10
- do 24 hodin zpět na úroveň před cvičením
- když je ráno horší než včera, příště **méně** — kratší výdrž, méně opakování
- nová náhlá bolest zad, vystřelování do nohy nebo brnění: přestat a k lékaři
