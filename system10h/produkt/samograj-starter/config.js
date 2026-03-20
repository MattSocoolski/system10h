// Samograj Starter — configuration file
// All 3 scripts (morning-brief, followup-alert, weekly-pulse) read from this file.
// Fill in your details below and you're good to go.

export default {
  // === TWOJE DANE (uzupelnij) ===
  businessName: 'Moja Firma',            // Nazwa Twojej firmy
  ownerName: 'Jan Kowalski',             // Twoje imie i nazwisko
  telegramBotToken: '',                   // Token bota Telegram (od @BotFather)
  telegramChatId: '',                     // Twoj chat ID (od @userinfobot)

  // === SCIEZKI ===
  stanPath: './stan.md',                  // Sciezka do pliku stanu biznesu

  // === HARMONOGRAM ===
  morningHour: 8,                         // O ktorej rano briefing (0-23)
  followupCheckHour: 17,                  // O ktorej sprawdzac follow-upy (0-23)
  weeklyReportDay: 5,                     // Dzien raportu tygodniowego (1=pon, 5=pt)

  // === REGULY ===
  followupDays: 3,                        // Po ilu dniach bez odpowiedzi -> alert
  criticalDays: 14,                       // Po ilu dniach -> PILNE
  maxAlertsPerRun: 10                     // Max alertow na uruchomienie
};
