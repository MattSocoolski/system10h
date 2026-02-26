# 🎥 INSTRUKCJA WIDEO MARKETING (Remotion)

W folderze `../video-marketing` znajduje się projekt Remotion do generowania programatycznych wideo.

## 🎯 Cel
Tworzenie spersonalizowanych intro (5-10 sekund) do Twoich nagrań Loom.
Zamiast: *"Cześć, tu Mateusz..."*
Wideo zaczyna się od: *Animacji z logiem klienta, jego imieniem i tekstem "Audyt dla Firmy X"*.

## 🚀 Jak używać

### 1. Wymagania
Musisz mieć zainstalowane Node.js.
Sprawdź w terminalu: `node -v`

### 2. Instalacja
Otwórz terminal w folderze `video-marketing` i wpisz:
```bash
npm install
```

### 3. Konfiguracja Klienta
Edytuj plik `src/SceneIntro.tsx` (lub dedykowany plik konfiguracyjny jeśli istnieje), aby zmienić:
- `companyName`: Nazwa firmy klienta
- `clientName`: Imię klienta
- `logo`: Ścieżka do logo (wrzuć do folderu `public/`)

### 4. Generowanie Wideo
W terminalu wpisz:
```bash
npm run build
```
Wygenerowany plik `out/video.mp4` to Twoje intro.

### 5. Łączenie z Loom
1. Nagraj właściwe szkolenie/audyt na Loomie.
2. W programie do montażu (CapCut, Premiere, darmowy online) połącz: `[INTRO REMOTION] + [NAGRANIE LOOM]`.
3. Wyślij klientowi.

## 💡 Best Practices (z `remotion-best-practices`)
- **Assets**: Obrazki (loga) zawsze trzymaj w `public/` i używaj funkcji `staticFile()`.
- **Krótko**: Intro max 5-8 sekund. Nie zanudzaj.
- **Personalizacja**: Upewnij się, że logo klienta jest dobrej jakości. To buduje efekt "WOW".
