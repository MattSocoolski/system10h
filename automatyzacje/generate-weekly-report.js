#!/usr/bin/env node
// WEEKLY REPORT GENERATOR — format Piotra
// Notion CRM + Gmail SENT → raport tygodniowy MD + TSV (kopiowalne do Excel)
// Uruchomienie: node automatyzacje/generate-weekly-report.js [--week=YYYY-WXX]
// Schedule: piatek 16:00 lub manual

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import {
  loadEnv,
  queryCRM, parseNotionLead,
  today, formatDate, daysDiff,
  gmailGetAccessToken, gmailSearchMessages, gmailGetMessage,
  extractEmail
} from './lib.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const REPORTS_DIR = join(ROOT, 'materialy-artnapi', 'raporty');

loadEnv();

// --- Date helpers ---
function getMonday(d) {
  const dt = new Date(d);
  const day = dt.getDay();
  const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
  dt.setDate(diff);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function getFriday(monday) {
  const dt = new Date(monday);
  dt.setDate(dt.getDate() + 4);
  dt.setHours(23, 59, 59, 999);
  return dt;
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function getWeekNumber(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() + 3 - ((dt.getDay() + 6) % 7));
  const week1 = new Date(dt.getFullYear(), 0, 4);
  return Math.round(((dt - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7) + 1;
}

// --- Parse CLI args ---
const weekArg = process.argv.find(a => a.startsWith('--week='));
const now = new Date();
const monday = getMonday(weekArg ? new Date(weekArg.split('=')[1]) : now);
const friday = getFriday(monday);
const weekNum = getWeekNumber(monday);
const weekLabel = `${monday.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;

console.log(`[REPORT] Generating report for ${weekLabel} (${isoDate(monday)} – ${isoDate(friday)})`);

// --- Ensure reports dir ---
if (!existsSync(REPORTS_DIR)) mkdirSync(REPORTS_DIR, { recursive: true });

// --- 1. Fetch CRM data ---
console.log('[REPORT] Fetching Notion CRM...');
const allLeads = await queryCRM({});
const leads = allLeads.map(parseNotionLead);

const activeStatuses = [
  'Pierwszy kontakt', 'Kwalifikacja potrzeby',
  'Wysłana próbka', 'Dogrywanie'
];
const wonStatuses = ['Zamknięta-Wygrana', 'Klient/AM'];

const activeLeads = leads.filter(l => activeStatuses.includes(l.status));
const wonLeads = leads.filter(l => wonStatuses.includes(l.status));

// New leads this week (created or first contact this week)
const newThisWeek = leads.filter(l => {
  if (!l.lastContact) return false;
  return l.lastContact >= monday && l.lastContact <= friday &&
    (l.status === 'Pierwszy kontakt' || l.status === 'Kwalifikacja potrzeby');
});

// Returning clients with activity this week
const returningThisWeek = wonLeads.filter(l => {
  if (!l.lastContact) return false;
  return l.lastContact >= monday && l.lastContact <= friday;
});

// --- 2. Fetch Gmail SENT this week ---
console.log('[REPORT] Fetching Gmail sent...');
let sentCount = 0;
let followUpCount = 0;
let offerCount = 0;
const sentRecipients = new Set();

try {
  const token = await gmailGetAccessToken();
  const query = `from:mateusz.sokolski@artnapi.pl after:${isoDate(monday)} before:${isoDate(new Date(friday.getTime() + 86400000))} in:sent`;
  const sentMessages = await gmailSearchMessages(token, query, 100);
  sentCount = sentMessages.length;

  // Analyze each sent message
  for (const msg of sentMessages.slice(0, 50)) {
    try {
      const detail = await gmailGetMessage(token, msg.id);
      const subject = detail.subject || '';
      const to = detail.to || '';

      if (to) sentRecipients.add(to.split(',')[0].trim().toLowerCase());

      if (subject.toLowerCase().startsWith('re:')) {
        followUpCount++;
      }
      if (/cennik|oferta|cena|PLN|netto|paleta/i.test(subject + ' ' + detail.snippet)) {
        offerCount++;
      }
    } catch (e) {
      // skip individual message errors
    }
  }
} catch (e) {
  console.log(`[REPORT] Gmail error (continuing without): ${e.message}`);
}

// --- 3. Build KPIs ---
const kpis = {
  newFirms: newThisWeek.length,
  conversations: '—', // manual: telefony + sensowne wymiany
  offers: offerCount,
  followUps: followUpCount,
  newClients: 0, // manual: z arkusza prowizji
  returningClients: returningThisWeek.length,
  unitsSold: 0 // manual: z arkusza prowizji
};

// --- 4. Build firms list ---
const firmsList = activeLeads
  .filter(l => {
    if (!l.lastContact) return true; // no contact = show
    return l.lastContact >= monday || daysDiff(friday, l.lastContact) <= 14;
  })
  .sort((a, b) => {
    if (!a.lastContact) return 1;
    if (!b.lastContact) return -1;
    return b.lastContact - a.lastContact;
  })
  .slice(0, 20)
  .map(l => ({
    firma: l.name || l.company || '—',
    kraj: l.country || 'PL',
    segment: l.segment || '—',
    etap: l.status || '—',
    wolumen: l.value ? `${Math.round(l.value / 10)}` : '—',
    ostatniKontakt: l.lastContact ? isoDate(l.lastContact) : '—',
    nastepnyKrok: (l.notes || '').split('\n').pop()?.trim() || '—'
  }));

// --- 5. Generate report MD ---
const report = `# RAPORT TYGODNIOWY — SPRZEDAZ B2B
Tydzien: ${isoDate(monday)} – ${isoDate(friday)} | Handlowiec: Mateusz | Wersja: v1

---

## A. PODSUMOWANIE LICZBOWE

| Wskaznik | Wynik | Cel tygodniowy | Komentarz |
|----------|-------|----------------|-----------|
| Nowe firmy skontaktowane | ${kpis.newFirms} | 15 | z CRM (auto) |
| Rozmowy handlowe | ${kpis.conversations} | 8 | UZUPELNIJ RECZNIE |
| Wyslane oferty | ${kpis.offers} | 5 | z Gmail (auto) |
| Follow-upy (powroty) | ${kpis.followUps} | 10 | z Gmail (auto) |
| Nowi klienci (1. zamowienie) | ${kpis.newClients} | 1 | UZUPELNIJ z arkusza |
| Klienci powracajacy | ${kpis.returningClients} | 2 | z CRM (auto) |
| Sprzedane sztuki | ${kpis.unitsSold} | 2000 | UZUPELNIJ z arkusza |

## B. LISTA FIRM + AKTYWNE TEMATY

| Firma | Kraj | Segment | Etap | Potencjal (szt) | Ostatni kontakt | Nastepny krok |
|-------|------|---------|------|-----------------|-----------------|---------------|
${firmsList.map(f =>
  `| ${f.firma} | ${f.kraj} | ${f.segment} | ${f.etap} | ${f.wolumen} | ${f.ostatniKontakt} | ${f.nastepnyKrok} |`
).join('\n')}

## C. KOMENTARZ

1) Co domkniete: UZUPELNIJ
2) Co utknelo: UZUPELNIJ
3) Gdzie potrzebna decyzja Piotra: UZUPELNIJ

---

## DANE ZRODLOWE (auto)

- Gmail sent: ${sentCount} maili wyslanych
- CRM aktywne leady: ${activeLeads.length}
- CRM klienci AM: ${wonLeads.length}
- Unikalnych odbiorcow maili: ${sentRecipients.size}

---
*Wygenerowano: ${new Date().toISOString()} | Skrypt: generate-weekly-report.js*
`;

// --- 6. Generate TSV (kopiowalne do Excel) ---
const tsv = [
  'Raport tygodniowy – sprzedaz B2B',
  '',
  `Tydzien:\t${isoDate(monday)} – ${isoDate(friday)}\tHandlowiec:\tMateusz\tWersja:\tv1`,
  '',
  'PODSUMOWANIE',
  'Wskaznik\tWynik\tCel tygodniowy\tKomentarz',
  `Nowe firmy skontaktowane\t${kpis.newFirms}\t15\t`,
  `Rozmowy handlowe\t${kpis.conversations}\t8\tUZUPELNIJ`,
  `Wyslane oferty\t${kpis.offers}\t5\t`,
  `Follow-upy\t${kpis.followUps}\t10\t`,
  `Nowi klienci\t${kpis.newClients}\t1\tUZUPELNIJ`,
  `Klienci powracajacy\t${kpis.returningClients}\t2\t`,
  `Sprzedane sztuki\t${kpis.unitsSold}\t2000\tUZUPELNIJ`,
  '',
  'LISTA FIRM',
  'Firma\tKraj\tSegment\tEtap\tPotencjal (szt)\tOstatni kontakt\tNastepny krok',
  ...firmsList.map(f =>
    `${f.firma}\t${f.kraj}\t${f.segment}\t${f.etap}\t${f.wolumen}\t${f.ostatniKontakt}\t${f.nastepnyKrok}`
  ),
  '',
  'KOMENTARZ',
  '1) Co domkniete: UZUPELNIJ',
  '2) Co utknelo: UZUPELNIJ',
  '3) Decyzja Piotra: UZUPELNIJ'
].join('\n');

// --- 7. Save files ---
const mdPath = join(REPORTS_DIR, `raport_tyg_${weekLabel}.md`);
const tsvPath = join(REPORTS_DIR, `raport_tyg_${weekLabel}.tsv`);

writeFileSync(mdPath, report);
writeFileSync(tsvPath, tsv);

console.log(`[REPORT] Saved: ${mdPath}`);
console.log(`[REPORT] Saved: ${tsvPath} (wklej do Excela: zaznacz wszystko → wklej do arkusza)`);
console.log(`[REPORT] UWAGA: Uzupelnij recznie: rozmowy handlowe, nowi klienci, sztuki, komentarz`);
console.log('[REPORT] Done.');
