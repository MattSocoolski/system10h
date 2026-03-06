#!/usr/bin/env node
// STYLE MATCH TEST — Lead magnet System 10h+
// Przyjmuje mail biznesowy → przepisuje przez Claude Haiku → wysyla wynik Resend → MailerLite + Telegram alert
//
// Uzycie:
//   echo '{"email":"jan@firma.pl","branza":"IT","coSprzedajesz":"szkolenia","mailTresc":"Dzien dobry..."}' | node automatyzacje/style-match.js

import { loadEnv, sendTelegram } from './lib.js';

loadEnv();

// --- Stdin reader ---
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// --- Claude API ---
async function callClaude(branza, coSprzedajesz, mailTresc) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const systemPrompt = `Jestes ghostwriterem sprzedazowym. Twoim zadaniem jest przepisac mail biznesowy tak, zeby byl bardziej skuteczny, ale zachowal naturalny styl autora.

ZASADY:
- Bezposredniosc: od razu do rzeczy, zero wstepow
- Krotkie zdania: 8-15 slow
- Zero corpo-mowy ("Z powazaniem", "holistyczne podejscie", "synergia")
- Zero AI-jezyka ("wykorzystaj potencjal", "transformacyjny")
- Konkretna propozycja wartosci w pierwszym zdaniu
- Miekki CTA — oparty na ciekawosci, nie presji
- Ciepny ton, partnerski, zero nachalnosci

FORMAT ODPOWIEDZI (DOKLADNIE TEN FORMAT, po polsku):
PRZEPISANY MAIL:
[tutaj przepisany mail]

CO ZMIENILISMY:
1. [zmiana 1 + dlaczego]
2. [zmiana 2 + dlaczego]
3. [zmiana 3 + dlaczego]`;

  const userPrompt = `Branza autora: ${branza}
Co sprzedaje: ${coSprzedajesz}

ORYGINALNY MAIL:
${mailTresc}

Przepisz ten mail. Zachowaj intencje, zmien wykonanie.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  if (!text) throw new Error('Claude API zwrocil pusta odpowiedz');
  return text;
}

// --- Parsowanie odpowiedzi Claude ---
function parseClaudeResponse(text) {
  const rewrittenMatch = text.match(/PRZEPISANY MAIL:\s*([\s\S]*?)(?=CO ZMIENILISMY:|$)/i);
  const changesMatch = text.match(/CO ZMIENILISMY:\s*([\s\S]*?)$/i);

  const rewritten = rewrittenMatch ? rewrittenMatch[1].trim() : text;
  const changes = changesMatch ? changesMatch[1].trim() : '';

  return { rewritten, changes };
}

// --- Resend email ---
async function sendEmail(to, originalMail, rewritten, changes) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not set');

  const changesHtml = changes
    .split('\n')
    .filter(line => line.trim())
    .map(line => `<li style="margin-bottom:8px;color:#374151;font-size:15px;line-height:1.5;">${escapeHtml(line.replace(/^\d+\.\s*/, ''))}</li>`)
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0A1628 0%,#1e293b 100%);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">System 10h+</h1>
          <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Style Match Test — Twoj wynik</p>
        </td></tr>

        <!-- Intro -->
        <tr><td style="padding:32px 40px 16px;">
          <p style="margin:0;color:#374151;font-size:16px;line-height:1.6;">
            Twoj mail przeszedl przez Style Match. Ponizej widzisz oryginal i przepisana wersje — oraz co dokladnie zmienilismy i dlaczego.
          </p>
        </td></tr>

        <!-- Oryginal -->
        <tr><td style="padding:16px 40px;">
          <h2 style="margin:0 0 12px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Oryginal</h2>
          <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;color:#4b5563;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(originalMail)}</div>
        </td></tr>

        <!-- Przepisany -->
        <tr><td style="padding:16px 40px;">
          <h2 style="margin:0 0 12px;color:#7c3aed;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Przepisany przez AI</h2>
          <div style="background-color:#faf5ff;border:2px solid #7c3aed;border-radius:8px;padding:20px;color:#1f2937;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(rewritten)}</div>
        </td></tr>

        <!-- Co zmienilismy -->
        <tr><td style="padding:16px 40px;">
          <h2 style="margin:0 0 12px;color:#374151;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Co zmienilismy</h2>
          <ol style="margin:0;padding-left:20px;">
            ${changesHtml}
          </ol>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:32px 40px;text-align:center;">
          <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;font-weight:500;">
            Testowal${'\u0065'}s na jednym mailu. Wyobraz sobie caly pipeline.
          </p>
          <a href="https://calendly.com/mt-sokolski/30min" style="display:inline-block;background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;letter-spacing:-0.3px;">
            Umow 15-min demo
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background-color:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:13px;">
            System 10h+ by Mateusz Sokolski | <a href="https://system10h.com" style="color:#7c3aed;text-decoration:none;">system10h.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'System 10h+ <hello@system10h.com>',
      to: [to],
      subject: 'Twoj mail po Style Match — zobacz roznice',
      html: html
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend API ${res.status}: ${errText}`);
  }

  return res.json();
}

// --- MailerLite ---
async function addToMailerLite(email, branza) {
  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) throw new Error('MAILERLITE_API_KEY not set');

  const mlBase = 'https://connect.mailerlite.com/api';
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  // Znajdz lub utworz grupe "style-match-test"
  const groupName = 'style-match-test';
  let groupId = null;

  const groupsRes = await fetch(`${mlBase}/groups?filter[name]=${encodeURIComponent(groupName)}`, { headers });
  if (!groupsRes.ok) throw new Error(`MailerLite groups GET ${groupsRes.status}: ${await groupsRes.text()}`);
  const groupsData = await groupsRes.json();

  const existing = (groupsData.data || []).find(g => g.name === groupName);
  if (existing) {
    groupId = existing.id;
  } else {
    // Utworz grupe
    const createRes = await fetch(`${mlBase}/groups`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: groupName })
    });
    if (!createRes.ok) throw new Error(`MailerLite group create ${createRes.status}: ${await createRes.text()}`);
    const created = await createRes.json();
    groupId = created.data.id;
    console.log(`[STYLE-MATCH] Utworzono grupe MailerLite: ${groupName} (${groupId})`);
  }

  // Dodaj subscribera
  const subRes = await fetch(`${mlBase}/subscribers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: email,
      fields: { company: branza },
      groups: [groupId]
    })
  });

  if (!subRes.ok) {
    const errText = await subRes.text();
    // 422 = juz istnieje — nie traktuj jako blad krytyczny
    if (subRes.status === 422) {
      console.log(`[STYLE-MATCH] MailerLite: subscriber juz istnieje (${email}), przypisuje do grupy`);
      // Sprobuj przypisac do grupy osobno
      const assignRes = await fetch(`${mlBase}/subscribers/${encodeURIComponent(email)}/groups/${groupId}`, {
        method: 'POST',
        headers
      });
      if (!assignRes.ok) {
        console.log(`[STYLE-MATCH] MailerLite group assign warning: ${assignRes.status}`);
      }
      return;
    }
    throw new Error(`MailerLite subscriber ${subRes.status}: ${errText}`);
  }

  console.log(`[STYLE-MATCH] MailerLite: dodano ${email} do grupy ${groupName}`);
}

// --- HTML escape ---
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --- Main ---
async function main() {
  // 1. Czytaj dane z stdin
  const raw = await readStdin();
  if (!raw.trim()) {
    throw new Error('Brak danych na stdin. Uzycie: echo \'{"email":"...","branza":"...","coSprzedajesz":"...","mailTresc":"..."}\' | node style-match.js');
  }

  const input = JSON.parse(raw);
  const { email, branza, coSprzedajesz, mailTresc } = input;

  if (!email || !branza || !coSprzedajesz || !mailTresc) {
    throw new Error('Brakujace pola. Wymagane: email, branza, coSprzedajesz, mailTresc');
  }

  console.log(`[STYLE-MATCH] Start: ${email} (${branza})`);

  // 2. Wywolaj Claude Haiku
  console.log('[STYLE-MATCH] Wywoluje Claude Haiku...');
  const claudeResponse = await callClaude(branza, coSprzedajesz, mailTresc);
  const { rewritten, changes } = parseClaudeResponse(claudeResponse);
  console.log(`[STYLE-MATCH] Claude OK — przepisany mail: ${rewritten.length} znakow`);

  // 3. Wyslij email przez Resend
  console.log('[STYLE-MATCH] Wysylam email przez Resend...');
  const emailResult = await sendEmail(email, mailTresc, rewritten, changes);
  console.log(`[STYLE-MATCH] Email wyslany: ${emailResult.id || 'ok'}`);

  // 4. Dodaj do MailerLite
  console.log('[STYLE-MATCH] Dodaje do MailerLite...');
  await addToMailerLite(email, branza);

  // 5. Telegram alert
  console.log('[STYLE-MATCH] Wysylam Telegram alert...');
  await sendTelegram(
    `<b>STYLE MATCH:</b> ${escapeHtml(email)} (${escapeHtml(branza)}) — mail przepisany i wyslany`
  );

  console.log('[STYLE-MATCH] Done.');
}

main().catch(async (err) => {
  console.error('[STYLE-MATCH] ERROR:', err.message);

  // Sprobuj wyslac alert o bledzie na Telegram
  try {
    await sendTelegram(`<b>STYLE MATCH ERROR:</b> ${escapeHtml(err.message)}`);
  } catch (tgErr) {
    console.error('[STYLE-MATCH] Telegram alert failed:', tgErr.message);
  }

  process.exit(1);
});
