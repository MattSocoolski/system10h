#!/usr/bin/env python3
"""
INFOGRAPHIC GENERATOR AGENT — System 10h+
==========================================
Generuje 10 infografik social media co 1 minutę.
Każda daje WARTOŚĆ handlowcowi B2B (tipy, statystyki, frameworki).

Uruchomienie:  python3 materialy/infografiki/generator.py
Zatrzymanie:   Ctrl+C (bezpieczne przerwanie)
Koszt:         ~$0.04-0.10/obraz × 10 = ~$0.40-1.00
"""

import os
import sys
import json
import time
import base64
import signal
import urllib.request
import urllib.error
from datetime import datetime

# ══════════════════════════════════════════════════
# KONFIGURACJA
# ══════════════════════════════════════════════════

PROJECT_DIR = "/Users/mateuszsokolski/asystent"
OUTPUT_DIR = os.path.join(PROJECT_DIR, "materialy/infografiki")
ENV_FILE = os.path.join(PROJECT_DIR, ".env")
MODEL = "gemini-3-pro-image-preview"  # Nano Banana Pro — 4K studio quality
API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent"
TOTAL = 10
DELAY = 60  # sekund między obrazkami

# ══════════════════════════════════════════════════
# 10 PROMPTÓW — każdy inny typ infografiki
# ══════════════════════════════════════════════════

INFOGRAPHICS = [
    {
        "name": "Checklist — Pipeline",
        "prompt": """Generate a professional social media infographic, 1080x1080 pixels, vertical square format.

DESIGN: Dark navy blue gradient background (#0a1628 to #1a2744). White and gold (#d4a843) text. Clean modern sans-serif font. Subtle geometric patterns in background. No watermarks, no stock photos.

CONTENT (in Polish language):
Title at top in large bold gold text: "5 SYGNAŁÓW ŻE TWÓJ PIPELINE UMIERA"

5 items as a checklist with red X icons:
✗ Follow-up po 1 próbie? Deal stracony.
✗ Brak CRM? Leady giną w mailach.
✗ "Odezwę się" bez daty? Nigdy nie zadzwoni.
✗ Ręczne maile do każdego? Wypalenie.
✗ Zero demo w tym miesiącu? Pipeline nie istnieje.

Bottom bar in gold: "System 10h+ | AI dla handlowców B2B"

Style: Premium, minimalist, professional LinkedIn infographic."""
    },
    {
        "name": "Statystyka — Czas handlowca",
        "prompt": """Generate a professional social media infographic, 1080x1080 pixels, square format.

DESIGN: Dark elegant background (#0f1923). White text, accent colors: red (#e74c3c), green (#2ecc71), blue (#3498db). Modern clean typography.

CONTENT (in Polish language):
Title: "GDZIE IDZIE TWÓJ CZAS?" in large white bold text
Subtitle: "Typowy dzień handlowca B2B"

Show a visual comparison with two horizontal bar charts:

TERAZ (in red tones):
███████████████ 60% Admin (CRM, raporty, maile)
██████ 25% Sprzedaż (rozmowy, demo)
████ 15% Strategia

Z AI (in green tones):
████ 15% Admin
████████████████████ 70% Sprzedaż
████ 15% Strategia

Arrow between them saying "ZMIANA"

Bottom: "System 10h+ | Odzyskaj 10h tygodniowo"

Style: Data visualization, clean, professional."""
    },
    {
        "name": "Porównanie — Solo vs AI",
        "prompt": """Generate a professional social media infographic, 1080x1080 pixels, square format.

DESIGN: Split design — left side dark red (#2d1f1f), right side dark green (#1f2d1f). White text. Clean modern layout.

CONTENT (in Polish language):
Title at top spanning both sides: "HANDLOWIEC SOLO vs Z AI"

LEFT SIDE (with sad/tired icon):
❌ 40 maili ręcznie
❌ Zapomina follow-upy
❌ 1 propozycja dziennie
❌ Pipeline w głowie
❌ Wieczory z laptopem

RIGHT SIDE (with energetic/happy icon):
✅ 40 maili w 10 minut
✅ Auto-przypomnienia
✅ 10 propozycji dziennie
✅ Pipeline w systemie
✅ Wieczory z rodziną

Bottom center: "System 10h+ | Done-for-you AI"

Style: VS comparison format, bold contrast, LinkedIn-ready."""
    },
    {
        "name": "Czy wiesz że — Follow-upy",
        "prompt": """Generate a professional social media infographic, 1080x1080 pixels, square format.

DESIGN: Deep dark blue background (#0b1426). Large bold numbers in gold (#d4a843). White supporting text. Dramatic, attention-grabbing.

CONTENT (in Polish language):
Top: "CZY WIESZ, ŻE..." in smaller gold text

Center — giant number: "80%" in very large gold bold text (takes up most of the image)

Below the number: "dealów B2B zamyka się po 5+ follow-upach"

Then in smaller text: "A większość handlowców robi... 1-2"

Visual element: A funnel or staircase showing:
1 follow-up → 2% close
3 follow-upy → 12% close
5+ follow-upów → 80% close

Bottom: "System 10h+ | Nigdy nie zapomnij follow-upu"

Style: Impact statistics, bold typography, shareable."""
    },
    {
        "name": "Framework — Golden Hour",
        "prompt": """Generate a professional social media infographic, 1080x1080 pixels, square format.

DESIGN: Dark background with gold accents (#d4a843). White text on dark. Clock or timer visual element. Premium feel.

CONTENT (in Polish language):
Title: "GOLDEN HOUR" in large gold text
Subtitle: "30 minut dziennie × 5 dni = pipeline, który sprzedaje"

Show a 5-step daily framework as a visual timeline or numbered list:

⏱️ 9:30 — Speed Check (5 min)
Kto odpowiedział? Reaguj NATYCHMIAST.

📊 9:35 — Pipeline Review (5 min)
Kto się ruszył? Kto stoi?

✉️ 9:40 — 3× Follow-up (15 min)
Wyślij 3 nudge'e. Gotowe drafty.

📈 9:55 — Scoring (5 min)
Kto gorący? Kto do odpuszczenia?

Bottom: "30 min/dzień = 3× więcej dealów | System 10h+"

Style: Framework diagram, step-by-step, professional."""
    },
    {
        "name": "Tips — Follow-upy",
        "prompt": """Generate a professional social media infographic, 1080x1080 pixels, square format.

DESIGN: Dark slate background (#1a1f2e). Two-column layout. Green checkmarks and red X marks. Clean modern design.

CONTENT (in Polish language):
Title: "FOLLOW-UPY W B2B" in bold white text
Subtitle: "Co DZIAŁA vs co ZABIJA deal"

LEFT COLUMN — green header "DZIAŁA ✅":
1. "Twój wynik SD pokazał X — masz 11 min w czwartek?"
   → Konkret + wartość + dziwna liczba

2. "Natan z CNC kupił po 1 audycie. Chcesz zobaczyć jak?"
   → Social proof + ciekawość

3. "Zamykam temat. Wrócisz — wiesz gdzie mnie znaleźć."
   → Breakup = 76% odpowiedzi

RIGHT COLUMN — red header "ZABIJA ❌":
1. "Hej, sprawdzam czy coś tam?"
   → Zero wartości

2. "Przypominam o ofercie..."
   → Presja bez kontekstu

3. "Mamy promocję -20%!"
   → Desperacja

Bottom: "System 10h+ | AI pisze follow-upy za Ciebie"

Style: Comparison list, clean, actionable."""
    },
    {
        "name": "Statystyka — Speed to Lead",
        "prompt": """Generate a professional social media infographic, 1080x1080 pixels, square format.

DESIGN: Dramatic dark background. Bright accent color (electric blue #00a8ff or gold). Large bold numbers. Urgency feel.

CONTENT (in Polish language):
Title: "SPEED-TO-LEAD" in large bold text

Show a dramatic timeline/graph dropping down:

⚡ 5 MINUT → 100× szansa na konwersję (large, bright, positive)
↓
⏰ 30 MINUT → 10× mniej (medium, fading)
↓
😴 1 GODZINA → szansa prawie zero (small, dim, negative)

Center quote: "Lead skontaktowany w 5 min jest 100× bardziej skłonny do zakupu niż po 30 minutach."

Source small text: "Lead Response Management Study"

Bottom: "System 10h+ | Auto-alerty = zero opóźnień"

Style: Dramatic data visualization, urgency, eye-catching."""
    },
    {
        "name": "Checklist — Cold mail",
        "prompt": """Generate a professional social media infographic, 1080x1080 pixels, square format.

DESIGN: Dark navy background. Gold checkbox icons. White text. Numbered list with clean spacing. Premium look.

CONTENT (in Polish language):
Title: "PRZED COLD MAILEM" in bold gold text
Subtitle: "5-punktowa checklist handlowca"

Checklist with gold checkboxes:

☐ 1. RESEARCH — 3 minuty na LinkedIn. Firma, stanowisko, ostatni post.

☐ 2. HOOK — Pierwsza linijka = o NIM, nie o Tobie. Zero "Nazywam się..."

☐ 3. BÓL — Jeden konkretny problem. "Tracisz leady przez..." nie "Oferujemy..."

☐ 4. DOWÓD — Case study w 1 zdaniu. "Natan z CNC oszczędza 10h/tyg."

☐ 5. CTA — Jedno pytanie zamknięte. "Masz 11 min w czwartek?" nie "Kiedy Ci pasuje?"

Bottom: "System 10h+ | AI pisze cold maile w Twoim stylu"

Style: Checklist, actionable, professional, ready to screenshot and save."""
    },
    {
        "name": "Porównanie — Email ręczny vs AI",
        "prompt": """Generate a professional social media infographic, 1080x1080 pixels, square format.

DESIGN: Dark background with two contrasting sections. Numbers prominently displayed. Clean data comparison layout.

CONTENT (in Polish language):
Title: "EMAIL RĘCZNY vs AI-ASSISTED" in bold white text

Comparison table or side-by-side:

                    RĘCZNIE         Z AI
Czas na email:     12-15 min       2 min
Personalizacja:    Generyczna      Pod branżę + imię + ból
Follow-upy:       "Zapomniałem"    Auto-reminder D+3, D+7, D+14
Maili dziennie:    5-8              30-40
Styl:             "Korporacyjny"   Twój głos
Wieczory:          Z laptopem      Z rodziną

Bottom highlight: "10× więcej maili. 6× szybciej. W TWOIM stylu."

Bottom bar: "System 10h+ | Bliźniak Biznesowy"

Style: Comparison table, data-driven, professional."""
    },
    {
        "name": "Framework — AIDA Cold Mail",
        "prompt": """Generate a professional social media infographic, 1080x1080 pixels, square format.

DESIGN: Dark gradient background. Four distinct colored sections or steps (gold, blue, green, red). Modern funnel or step visualization. Bold letters A-I-D-A prominent.

CONTENT (in Polish language):
Title: "FORMULA AIDA" in bold text
Subtitle: "Jak napisać cold mail który OTWIERAJĄ"

Four steps displayed as a funnel or staircase:

A — ATTENTION (gold)
Hook personalny: "Widziałem Twój post o [temat]..."
→ O NIM, nie o Tobie

I — INTEREST (blue)
Insight: "Handlowcy w [branża] tracą 10h/tyg na admin..."
→ Pokaż że ROZUMIESZ

D — DESIRE (green)
Konkret: "Pokażę Ci jak AI pisze maile w TWOIM stylu..."
→ Co ZYSKA

A — ACTION (red)
Jedno CTA: "Masz 11 minut w czwartek?"
→ Dziwna liczba + zamknięte pytanie

Bottom: "System 10h+ | AI które pisze JAK TY"

Style: Framework/funnel diagram, educational, save-worthy."""
    },
]

# ══════════════════════════════════════════════════
# LOGIKA
# ══════════════════════════════════════════════════

running = True

def signal_handler(sig, frame):
    global running
    print("\n\n⛔ Ctrl+C — ZATRZYMUJĘ agenta. Wygenerowane grafiki zostają.\n")
    running = False

signal.signal(signal.SIGINT, signal_handler)


def load_api_key():
    """Wczytaj klucz API z .env"""
    try:
        with open(ENV_FILE) as f:
            for line in f:
                line = line.strip()
                if line.startswith("GOOGLE_AI_STUDIO_API_KEY="):
                    key = line.split("=", 1)[1].strip().strip('"').strip("'")
                    if key:
                        return key
    except FileNotFoundError:
        pass
    print("❌ BŁĄD: Nie znaleziono GOOGLE_AI_STUDIO_API_KEY w .env")
    sys.exit(1)


def generate_image(api_key, prompt, output_path):
    """Wywołaj Gemini API i zapisz wygenerowany obraz."""
    url = API_URL.format(MODEL) + "?key=" + api_key

    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "responseModalities": ["IMAGE", "TEXT"],
            "temperature": 1.0
        }
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=180) as resp:
        result = json.loads(resp.read().decode("utf-8"))

    # Wyciągnij obraz z odpowiedzi
    candidates = result.get("candidates", [])
    if not candidates:
        raise ValueError("Brak candidates w odpowiedzi API")

    parts = candidates[0].get("content", {}).get("parts", [])
    for part in parts:
        if "inlineData" in part:
            img_bytes = base64.b64decode(part["inlineData"]["data"])
            mime = part["inlineData"].get("mimeType", "image/png")

            # Ustal rozszerzenie
            ext = "png"
            if "jpeg" in mime or "jpg" in mime:
                ext = "jpg"

            # Zmień rozszerzenie w ścieżce jeśli trzeba
            final_path = output_path.rsplit(".", 1)[0] + "." + ext

            with open(final_path, "wb") as f:
                f.write(img_bytes)

            return final_path, len(img_bytes)

    raise ValueError("Brak obrazu (inlineData) w odpowiedzi API")


def main():
    api_key = load_api_key()
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    start_time = datetime.now()

    print()
    print("═" * 56)
    print("  🎨 INFOGRAPHIC GENERATOR AGENT — System 10h+")
    print(f"  📦 {TOTAL} infografik co {DELAY}s")
    print(f"  📁 Output: {OUTPUT_DIR}")
    print(f"  🤖 Model: {MODEL}")
    print(f"  💰 Szacunkowy koszt: ~$0.40-1.00")
    print(f"  ⏱️  Start: {start_time.strftime('%H:%M:%S')}")
    print(f"  🛑 Zatrzymanie: Ctrl+C")
    print("═" * 56)
    print()

    generated = 0
    errors = 0

    for i in range(TOTAL):
        if not running:
            break

        num = f"{i+1:02d}"
        info = INFOGRAPHICS[i]
        output_path = os.path.join(OUTPUT_DIR, f"{num}.png")

        print(f"[{num}/{TOTAL}] 🎨 {info['name']}...")

        try:
            final_path, size_bytes = generate_image(api_key, info["prompt"], output_path)
            size_kb = size_bytes / 1024
            generated += 1
            print(f"[{num}/{TOTAL}] ✅ Zapisano: {os.path.basename(final_path)} ({size_kb:.0f} KB)")
        except urllib.error.HTTPError as e:
            errors += 1
            error_body = ""
            try:
                error_body = e.read().decode("utf-8")[:300]
            except:
                pass
            print(f"[{num}/{TOTAL}] ❌ HTTP {e.code}: {error_body}")
        except Exception as e:
            errors += 1
            print(f"[{num}/{TOTAL}] ❌ Błąd: {e}")

        # Czekaj przed następnym (oprócz ostatniego)
        if i < TOTAL - 1 and running:
            remaining = TOTAL - i - 1
            print(f"         ⏳ Następna za {DELAY}s... (zostało {remaining})")
            # Sleep w 1s interwałach żeby Ctrl+C działał natychmiast
            for _ in range(DELAY):
                if not running:
                    break
                time.sleep(1)

    elapsed = datetime.now() - start_time
    print()
    print("═" * 56)
    print(f"  📊 WYNIK:")
    print(f"     ✅ Wygenerowano: {generated}/{TOTAL}")
    print(f"     ❌ Błędy: {errors}")
    print(f"     ⏱️  Czas: {elapsed}")
    print(f"     📁 Pliki: {OUTPUT_DIR}")
    print("═" * 56)
    print()

    if generated > 0:
        print(f"  Otwórz folder:")
        print(f"  open {OUTPUT_DIR}")
        print()


if __name__ == "__main__":
    main()
