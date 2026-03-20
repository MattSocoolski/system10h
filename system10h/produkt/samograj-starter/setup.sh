#!/bin/bash
# SAMOGRAJ STARTER — Setup Script
# Sprawdza wymagania, konfiguruje Telegram, instaluje cron.
# Uzycie: bash setup.sh

set -e

echo ""
echo "=================================================="
echo "  SAMOGRAJ STARTER — Instalacja"
echo "  3 skrypty, 10 minut setup, biznes pilnuje sie sam"
echo "=================================================="
echo ""

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# --- Helper ---
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
fail() { echo -e "${RED}[BLAD]${NC} $1"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# === KROK 1: Sprawdz Node.js ===
echo "Krok 1/5: Sprawdzam Node.js..."

if ! command -v node &> /dev/null; then
  fail "Node.js nie znaleziony. Zainstaluj: https://nodejs.org (wersja 18+)"
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  fail "Node.js w wersji $NODE_VERSION — wymagana 18+. Zaktualizuj: https://nodejs.org"
fi

ok "Node.js v$(node -v | sed 's/v//') — OK"

# === KROK 2: Konfiguracja Telegram ===
echo ""
echo "Krok 2/5: Konfiguracja Telegram..."
echo ""
echo "Potrzebujesz 2 rzeczy:"
echo "  1. Token bota — napisz do @BotFather na Telegramie, wpisz /newbot"
echo "  2. Twoj Chat ID — napisz do @userinfobot na Telegramie"
echo ""

# Read current config
CONFIG_FILE="$SCRIPT_DIR/config.js"
CURRENT_TOKEN=$(grep 'telegramBotToken' "$CONFIG_FILE" | grep -oP "'.+?'" | tr -d "'")
CURRENT_CHAT=$(grep 'telegramChatId' "$CONFIG_FILE" | grep -oP "'.+?'" | tr -d "'")

if [ -n "$CURRENT_TOKEN" ] && [ -n "$CURRENT_CHAT" ]; then
  echo "Znaleziono istniejaca konfiguracje Telegram."
  read -p "Uzyc istniejacych danych? (t/n): " USE_EXISTING
  if [ "$USE_EXISTING" = "t" ] || [ "$USE_EXISTING" = "T" ]; then
    BOT_TOKEN="$CURRENT_TOKEN"
    CHAT_ID="$CURRENT_CHAT"
  fi
fi

if [ -z "$BOT_TOKEN" ]; then
  read -p "Telegram Bot Token: " BOT_TOKEN
  if [ -z "$BOT_TOKEN" ]; then
    warn "Brak tokenu — Telegram nie bedzie dzialal. Uzupelnij pozniej w config.js"
  fi
fi

if [ -z "$CHAT_ID" ]; then
  read -p "Telegram Chat ID: " CHAT_ID
  if [ -z "$CHAT_ID" ]; then
    warn "Brak Chat ID — Telegram nie bedzie dzialal. Uzupelnij pozniej w config.js"
  fi
fi

# Update config.js with provided values
if [ -n "$BOT_TOKEN" ]; then
  sed -i.bak "s|telegramBotToken: '.*'|telegramBotToken: '$BOT_TOKEN'|" "$CONFIG_FILE"
fi
if [ -n "$CHAT_ID" ]; then
  sed -i.bak "s|telegramChatId: '.*'|telegramChatId: '$CHAT_ID'|" "$CONFIG_FILE"
fi
rm -f "$CONFIG_FILE.bak"

ok "config.js zaktualizowany"

# === KROK 3: Przygotuj stan.md ===
echo ""
echo "Krok 3/5: Przygotowuje plik stanu..."

STAN_FILE="$SCRIPT_DIR/stan.md"
if [ -f "$STAN_FILE" ]; then
  warn "stan.md juz istnieje — nie nadpisuje"
else
  cp "$SCRIPT_DIR/stan.template.md" "$STAN_FILE"
  ok "Skopiowano stan.template.md -> stan.md"
fi

echo "  Otworz stan.md i uzupelnij swoje dane (pipeline, zadania, cel tygodnia)."

# === KROK 4: Test Telegram ===
echo ""
echo "Krok 4/5: Testuje polaczenie z Telegramem..."

if [ -n "$BOT_TOKEN" ] && [ -n "$CHAT_ID" ]; then
  RESPONSE=$(curl -s -w "\n%{http_code}" "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
    -d "chat_id=$CHAT_ID" \
    -d "text=Samograj Starter zainstalowany! Twoj biznes pilnuje sie sam." \
    -d "parse_mode=HTML")
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  if [ "$HTTP_CODE" = "200" ]; then
    ok "Telegram dziala — sprawdz wiadomosc na telefonie!"
  else
    warn "Telegram nie odpowiedzial poprawnie (kod $HTTP_CODE). Sprawdz token i chat ID w config.js"
  fi
else
  warn "Telegram nie skonfigurowany — pomijam test"
fi

# === KROK 5: Instrukcje cron ===
echo ""
echo "Krok 5/5: Konfiguracja automatycznego uruchamiania"
echo ""
echo "=================================================="
echo "  DODAJ DO CRONA (crontab -e):"
echo "=================================================="
echo ""
echo "  # Samograj Starter — morning briefing (pn-pt, 8:00)"
echo "  0 8 * * 1-5 cd $SCRIPT_DIR && node morning-brief.js >> samograj.log 2>&1"
echo ""
echo "  # Samograj Starter — follow-up alert (pn-pt, 17:00)"
echo "  0 17 * * 1-5 cd $SCRIPT_DIR && node followup-alert.js >> samograj.log 2>&1"
echo ""
echo "  # Samograj Starter — weekly pulse (piatek, 16:00)"
echo "  0 16 * * 5 cd $SCRIPT_DIR && node weekly-pulse.js >> samograj.log 2>&1"
echo ""
echo "=================================================="

# macOS launchd alternative
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo ""
  echo "macOS? Mozesz tez uzyc launchd zamiast crona."
  echo "Szczegoly: https://support.apple.com/guide/terminal/apdc6c1077b-5d5d-4d35-9c19-60f2397b2369"
fi

echo ""
echo "=================================================="
echo "  GOTOWE!"
echo "=================================================="
echo ""
echo "  Co dalej:"
echo "  1. Otworz stan.md i wpisz swoje dane (pipeline, cel tygodnia)"
echo "  2. Uruchom recznie: node morning-brief.js"
echo "  3. Dodaj cron (wyzej) — biznes pilnuje sie sam"
echo ""
echo "  Pomoc: kontakt@system10h.com"
echo ""
