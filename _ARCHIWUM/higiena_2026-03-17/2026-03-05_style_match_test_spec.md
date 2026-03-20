# STYLE MATCH TEST — SPEC LEAD MAGNET

> Status: SPEC | Priorytet: TERAZ (ten tydzien) | Owner: @cto (build) + @ghost (copy)

---

## KONCEPT

Lead wysyla swoj prawdziwy mail biznesowy (cold outreach, follow-up, oferta).
Dostaje w odpowiedzi ten sam mail przepisany przez Blizniaka — w swoim stylu, ale lepiej.

**Dlaczego lepsze niz PDF:**
- Pokazuje PRODUKT w akcji (nie obietnice)
- Personalizowane (kazdy dostaje cos innego)
- WOW effect = share'owalny ("zobacz co AI z tego zrobilo")
- Zbiera email (lead) + przyklad maila (kwalifikacja)

---

## FLOW

```
1. Landing page / LinkedIn CTA
   "Wyslij mi swoj najgorszy cold mail — odeslam go przepisanego przez AI ktore zna Twoj biznes."

2. Formularz (email + textarea z mailem + opcjonalnie: branża/co sprzedajesz)
   → Zapisuje do MailerLite (tag: style-match-test)

3. Backend przetwarza:
   - Claude API (Haiku — tanio) z system promptem:
     * Rola: ghostwriter sprzedazowy
     * Zasady z ghost_styl.md (sekcja B2B)
     * Kontekst z inputu (branza, co sprzedaje)
   - Generuje: przepisany mail + 3 bullet points "co zmienilismy i dlaczego"

4. Odpowiedz emailem (automatyczna):
   - Subject: "Twoj mail po Style Match — zobacz roznice"
   - Body: oryginal vs przepisany + 3 lekcje + CTA do demo

5. Follow-up D+2:
   - "Testowalem na jednym mailu. Wyobraz sobie caly pipeline."
   - CTA: Umow 15 min demo
```

---

## ARCHITEKTURA TECHNICZNA

### Opcja A: Minimalna (1 dzien)
- **Formularz:** Strona HTML na system10h.com/style-match/ (Tailwind, ten sam design)
- **Backend:** Node.js script (jak email-radar.js) odpalany przez webhook
- **AI:** Claude Haiku API (~$0.001/request)
- **Email:** Resend API (mamy juz) lub MailerLite automation
- **Trigger:** MailerLite form → webhook → script → Resend reply

### Opcja B: No-code (pol dnia)
- **Formularz:** MailerLite embedded form
- **Backend:** Make.com scenario (MailerLite trigger → Claude API → email)
- **AI:** Claude Haiku via Make HTTP module
- **Email:** MailerLite automation email

### Rekomendacja CTO: Opcja A
- Pelna kontrola nad promptem i outputem
- Mozna iterowac bez Make.com limitow
- Reuse kodu z email-radar.js (Claude API juz skonfigurowane)

---

## KOSZT

| Element | Koszt |
|---------|-------|
| Claude Haiku API | ~$0.001/request (~$1 na 1000 leadow) |
| Resend API | Darmowy tier (100 maili/dzien) |
| MailerLite | W ramach obecnego planu |
| Dev time | ~4-6h (formularz + script + email template) |

---

## METRYKI SUKCESU

| Metryka | Target |
|---------|--------|
| Submissions / tydzien | 5+ |
| Email open rate (odpowiedz) | 60%+ |
| Click CTA (demo) | 15%+ |
| Demo z Style Match | 2/msc |

---

## CTA NA STRONIE / LINKEDIN

**LinkedIn post hook:**
"Wyslij mi swojego najgorszego cold maila. Odeslam go przepisanego przez AI — w Twoim stylu, ale tak ze klient odpowie."

**Strona (pod hero lub jako osobna sekcja):**
"Przetestuj za darmo: wyslij swoj mail, zobacz jak napisalby go Twoj Blizniak."

---

## NASTEPNE KROKI

1. [ ] @cto: Stworzyc /style-match/ landing page (formularz)
2. [ ] @cto: Script przetwarzajacy (Claude Haiku + Resend)
3. [ ] @ghost: System prompt dla Style Match (ghost_styl.md B2B + feedback format)
4. [ ] @cto: Email template odpowiedzi (HTML)
5. [ ] @cto: MailerLite integration (tag + list)
6. [ ] Test end-to-end
7. [ ] Dodac CTA na glowna strone + LinkedIn bio
