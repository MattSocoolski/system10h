#!/usr/bin/env python3
"""
TELEGRAM AUTOMATION AGENT — System 10h+
=========================================
Co 1 minutę wysyła na Telegram 1 pomysł na automatyzację
z Twojego sejfu narzędzi (api-inventory.md).

5 wiadomości × 1 minuta = 5 minut pracy.

Uruchomienie:  python3 materialy/infografiki/telegram_agent.py
Zatrzymanie:   Ctrl+C
"""

import os
import sys
import json
import time
import signal
import urllib.request
from datetime import datetime

# ══════════════════════════════════════════════════
# KONFIGURACJA
# ══════════════════════════════════════════════════

PROJECT_DIR = "/Users/mateuszsokolski/asystent"
ENV_FILE = os.path.join(PROJECT_DIR, ".env")
CHAT_ID = "1304598782"
TOTAL = 5
DELAY = 60

# ══════════════════════════════════════════════════
# 5 AUTOMATYZACJI Z API-INVENTORY.MD (HTML format)
# ══════════════════════════════════════════════════

AUTOMATIONS = [
    {
        "title": "MailerLite + Telegram = Speed-to-Lead Alert",
        "message": """⚡ <b>AUTOMATYZACJA 1/5</b>
<b>MailerLite + Telegram = Speed-to-Lead Alert</b>

🔧 <b>Narzędzia:</b> MailerLite API + Telegram Bot

📋 <b>Jak działa:</b>
Ktoś wypełnia Self-Discovery na system10h.com → MailerLite łapie email → webhook odpala Telegram notification → dostajesz PUSH na telefon w 5 SEKUND.

🎯 <b>Efekt:</b>
Odpowiadasz leadowi w 5 min zamiast następnego dnia. Speed-to-Lead: 100× lepsza konwersja.

⏱ <b>Czas budowy:</b> ~30 min (Cloudflare Worker jako webhook)

💡 <b>Co masz:</b> MailerLite MCP ✅ | Cloudflare Workers ✅ | Telegram Bot ✅"""
    },
    {
        "title": "Resend + Ghost + Pipeline = Auto Follow-up",
        "message": """✉️ <b>AUTOMATYZACJA 2/5</b>
<b>Resend + Ghost + Pipeline = Auto Follow-up</b>

🔧 <b>Narzędzia:</b> Resend API + @ghost + @pipeline

📋 <b>Jak działa:</b>
@pipeline generuje nudge D+3 → @ghost pisze go w TWOIM stylu → Resend wysyła email z hello@system10h.com automatycznie → Ty śpisz spokojnie.

🎯 <b>Efekt:</b>
Zero "zapomniałem odezwać się do X". Każdy lead dostaje follow-up ON TIME. Pipeline nie umiera w ciszy.

⏱ <b>Czas budowy:</b> ~1h (skrypt Python + cron)

💡 <b>Co masz:</b> Resend MCP ✅ | Pipeline prompt ✅ | Ghost prompt ✅"""
    },
    {
        "title": "Notion CRM + Telegram = Pipeline Dashboard",
        "message": """📊 <b>AUTOMATYZACJA 3/5</b>
<b>Notion CRM + Telegram = Poranny Pipeline Brief</b>

🔧 <b>Narzędzia:</b> Notion API (MCP) + Telegram Bot

📋 <b>Jak działa:</b>
Codziennie o 9:30 skrypt czyta Notion CRM → zlicza gorące/ciepłe/zimne leady → oblicza Pipeline Velocity → wysyła Ci brief na Telegram ZANIM otworzysz laptopa.

🎯 <b>Efekt:</b>
Wstajesz → patrzysz na telefon → wiesz DOKŁADNIE co robić w Golden Hour. Zero logowania do Notion.

⏱ <b>Czas budowy:</b> ~45 min (Python + cron 9:30)

💡 <b>Co masz:</b> Notion MCP ✅ | CRM System 10h+ ✅ | Telegram Bot ✅"""
    },
    {
        "title": "Gemini + Content Machine = Fabryka Postów",
        "message": """🎨 <b>AUTOMATYZACJA 4/5</b>
<b>Gemini + Content Machine = Fabryka Postów</b>

🔧 <b>Narzędzia:</b> Gemini API + @content + Notion

📋 <b>Jak działa:</b>
Co poniedziałek: Gemini Deep Research skanuje trendy w B2B → @content generuje 5 postów na tydzień → Nano Banan Pro tworzy infografiki → wszystko ląduje w Notion jako kalendarz contentu.

🎯 <b>Efekt:</b>
Tydzień contentu gotowy w 15 min. Posty z infografikami = 2-3× więcej zasięgu na LinkedIn.

⏱ <b>Czas budowy:</b> ~2h (rozbudowa istniejącego generatora)

💡 <b>Co masz:</b> Gemini MCP ✅ | Content Machine ✅ | Generator infografik ✅ | Notion MCP ✅"""
    },
    {
        "title": "Calendly + Gmail + Telegram = Deal Flow",
        "message": """🗓 <b>AUTOMATYZACJA 5/5</b>
<b>Calendly + Gmail + Telegram = Deal Flow</b>

🔧 <b>Narzędzia:</b> Calendly webhook + Gmail API + Telegram Bot

📋 <b>Jak działa:</b>
Lead klika link Calendly → booking confirmed → Gmail wysyła potwierdzenie z agendą audytu AI → Telegram powiadamia: "🔥 NOWY AUDYT: [imię] za [X]h — przygotuj demo!" → @cso dostaje kartę leada.

🎯 <b>Efekt:</b>
Od "klik w Calendly" do "demo ready" = ZERO ręcznej roboty. Profesjonalizm + speed.

⏱ <b>Czas budowy:</b> ~1.5h (Calendly webhook + Cloudflare Worker)

💡 <b>Co masz:</b> Calendly ✅ | Gmail MCP ✅ | Cloudflare Workers ✅ | Telegram Bot ✅

---

🏁 <b>To było 5/5 automatyzacji z Twojego sejfu narzędzi.</b>
Każdą można zbudować z tego co JUŻ MASZ — zero nowych subskrypcji.
Wpisz @cto żeby zacząć budować!"""
    },
]

# ══════════════════════════════════════════════════
# LOGIKA
# ══════════════════════════════════════════════════

running = True

def signal_handler(sig, frame):
    global running
    print("\n⛔ Ctrl+C — zatrzymuję agenta.\n")
    running = False

signal.signal(signal.SIGINT, signal_handler)


def load_token():
    try:
        with open(ENV_FILE) as f:
            for line in f:
                line = line.strip()
                if line.startswith("TELEGRAM_BOT_TOKEN="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    except FileNotFoundError:
        pass
    print("❌ Brak TELEGRAM_BOT_TOKEN w .env")
    sys.exit(1)


def send_telegram(token, text):
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = json.dumps({
        "chat_id": CHAT_ID,
        "text": text,
        "parse_mode": "HTML"
    }).encode("utf-8")
    req = urllib.request.Request(
        url, data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read()).get("ok", False)


def main():
    token = load_token()

    print()
    print("═" * 50)
    print("  🤖 TELEGRAM AUTOMATION AGENT — Ultron")
    print(f"  📦 {TOTAL} automatyzacji co {DELAY}s")
    print(f"  📱 Chat ID: {CHAT_ID}")
    print(f"  🛑 Zatrzymanie: Ctrl+C")
    print("═" * 50)
    print()

    sent = 0

    for i in range(TOTAL):
        if not running:
            break

        num = f"{i+1:02d}"
        auto = AUTOMATIONS[i]

        print(f"[{num}/{TOTAL:02d}] 📤 {auto['title']}...")

        try:
            ok = send_telegram(token, auto["message"])
            if ok:
                sent += 1
                print(f"[{num}/{TOTAL:02d}] ✅ Wysłano!")
            else:
                print(f"[{num}/{TOTAL:02d}] ❌ Telegram zwrócił błąd")
        except Exception as e:
            print(f"[{num}/{TOTAL:02d}] ❌ {e}")

        if i < TOTAL - 1 and running:
            print(f"         ⏳ Następna za {DELAY}s...")
            for _ in range(DELAY):
                if not running:
                    break
                time.sleep(1)

    print()
    print("═" * 50)
    print(f"  📊 Wysłano: {sent}/{TOTAL}")
    print("═" * 50)
    print()


if __name__ == "__main__":
    main()
