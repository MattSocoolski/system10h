# PROTOKÓŁ WDROŻENIA MCP (MODEL CONTEXT PROTOCOL)
### Produkt: System 10h+ PREMIUM (FULL)
**Wersja dokumentu:** 1.0 (Luty 2026)
**Przeznaczenie:** Instrukcja dla wdrożeniowca (Mateusz) lub działu IT klienta.

---

## 1. ARGUMENTACJA BIZNESOWA (Dla Klienta)
*   **Bezpieczeństwo:** Dane nie opuszczają komputera klienta (protokół lokalny).
*   **Automatyzacja:** Koniec z kopiowaniem notatek. AI ma bezpośredni dostęp do bazy wiedzy.
*   **Oszczędność:** Brak opłat abonamentowych za narzędzia pośredniczące (typu Zapier/Make).

---

## 2. WYMAGANIA TECHNICZNE
1.  **System:** Windows 10/11 lub macOS.
2.  **Środowisko:** Node.js (v18 lub nowszy).
3.  **Aplikacja:** Claude Desktop (nie działa w przeglądarce).
4.  **Dostęp:** Uprawnienia administratora w Notion i na komputerze.

---

## 3. PROCEDURA KROK PO KROKU

### KROK 1: Instalacja Node.js
1. Pobierz wersję LTS z `https://nodejs.org/`.
2. Zainstaluj, akceptując domyślne ustawienia.
3. Sprawdź poprawność w terminalu: `node -v` (powinien pojawić się numer wersji).

### KROK 2: Konfiguracja Integracji Notion
1. Wejdź na `https://www.notion.so/my-integrations`.
2. Stwórz nową integrację: `System 10h+ Agent`.
3. Skopiuj **Internal Integration Token** (zachowaj go bezpiecznie).
4. **WAŻNE:** W Notion przejdź do strony/bazy, którą chcesz udostępnić. Kliknij `...` -> `Connect to` -> Wybierz `System 10h+ Agent`.

### KROK 3: Konfiguracja Pliku Sterującego (JSON)
Otwórz plik konfiguracyjny Claude Desktop:
- **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Wklej poniższą strukturę:
```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-notion"
      ],
      "env": {
        "NOTION_API_TOKEN": "TWÓJ_TOKEN_SECRET"
      }
    }
  }
}
```

### KROK 4: Weryfikacja
1. Zrestartuj Claude Desktop.
2. Sprawdź, czy obok paska wpisywania pojawiła się ikona 🔌 (wtyczki).
3. Wpisz: "Pokaż mi listę moich baz danych w Notion".

---

## 4. TROUBLESHOOTING (Co jeśli nie działa?)
*   **Błąd NPX:** Sprawdź czy Node.js jest poprawnie dodany do zmiennej PATH (restart komputera zazwyczaj pomaga).
*   **Claude nie widzi bazy:** Upewnij się, że w Notion wykonano krok "Connect to" dla konkretnej bazy danych.
*   **Puste odpowiedzi:** Sprawdź, czy w pliku JSON nie ma literówki w nazwie tokena lub brakującego przecinka.

---
© 2026 System 10h+ | Mateusz Sokólski
