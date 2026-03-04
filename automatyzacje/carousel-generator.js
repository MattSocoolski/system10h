// Carousel Generator — Gemini Nano Banana 2 (gemini-3.1-flash-image-preview)
// Zero dependencies (Node 18+ z natywnym fetch)
// Czyta markdown z treścią slajdów → generuje PNG per slajd
//
// Użycie:
//   node automatyzacje/carousel-generator.js materialy/2026-03-06_linkedin_karuzela_personalizacja.md
//   node automatyzacje/carousel-generator.js materialy/2026-03-06_linkedin_karuzela_personalizacja.md --model pro
//   node automatyzacje/carousel-generator.js materialy/2026-03-06_linkedin_karuzela_personalizacja.md --dry-run
//
// Output: materialy/carousel_2026-03-06/slajd_01.png ... slajd_10.png
// Koszt: ~$0.04/slajd (Flash) lub ~$0.08/slajd (Pro)

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// --- .env loader (z lib.js) ---
function loadEnv() {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) throw new Error('.env not found at ' + envPath);
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

// --- Konfiguracja ---
const MODELS = {
  flash: 'gemini-3.1-flash-image-preview',   // Nano Banana 2 — szybki, tani
  pro: 'gemini-3-pro-image-preview',          // Nano Banana Pro — jakość studio
  legacy: 'gemini-2.5-flash-image',           // Nano Banana 1 — fallback
};

const BRAND = {
  // System 10H brand — ciemny, technologiczny, profesjonalny
  palette: 'dark navy (#0A1628) background, electric blue (#3B82F6) accents, white (#FFFFFF) text, subtle gradient overlays',
  typography: 'modern sans-serif font (like Inter or Montserrat), bold headings, clean body text',
  style: 'minimalist tech aesthetic, subtle geometric patterns, professional LinkedIn carousel slide',
  logo: 'small "System 10h+" watermark in bottom-right corner, very subtle',
};

const ASPECT_RATIO = '4:5';   // LinkedIn carousel optimal (1080x1350)
const IMAGE_SIZE = '2K';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// --- Parser markdown → slajdy ---
function parseSlides(markdown) {
  const slides = [];
  // Szukaj sekcji ### SLAJD N
  const slideRegex = /### SLAJD (\d+)[^\n]*\n([\s\S]*?)(?=### SLAJD|\n---\n## NOTATKI|\*Wygenerowano|$)/gi;
  let match;
  while ((match = slideRegex.exec(markdown)) !== null) {
    const num = parseInt(match[1]);
    const block = match[2].trim();

    // Parsuj nagłówek
    const headlineMatch = block.match(/\*\*NAGLOWEK:\*\*\s*([\s\S]*?)(?=\*\*BODY|\*\*ZRODLO|$)/i);
    const headline = headlineMatch ? headlineMatch[1].trim() : '';

    // Parsuj body
    const bodyMatch = block.match(/\*\*BODY:\*\*\s*([\s\S]*?)(?=\*\*ZRODLO|$)/i);
    const body = bodyMatch ? bodyMatch[1].trim() : '';

    // Parsuj źródło
    const sourceMatch = block.match(/\*\*ZRODLO:\*\*\s*(.*)/i);
    const source = sourceMatch ? sourceMatch[1].trim() : '';

    slides.push({ num, headline, body, source });
  }
  return slides;
}

// --- Buduj prompt obrazu dla slajdu ---
function buildImagePrompt(slide, totalSlides) {
  const isHook = slide.num === 1;
  const isCTA = slide.num === totalSlides;

  let prompt = `Create a professional LinkedIn carousel slide image with the following specifications:

VISUAL STYLE:
- ${BRAND.palette}
- ${BRAND.typography}
- ${BRAND.style}
- Aspect ratio: 4:5 (portrait, 1080x1350px equivalent)
- ${BRAND.logo}
- Slide ${slide.num} of ${totalSlides} indicator in top-right corner

CONTENT TO DISPLAY ON THE SLIDE:
`;

  if (isHook) {
    prompt += `
THIS IS THE HOOK SLIDE (first slide — must grab attention):
- Large, bold headline text: "${slide.headline}"
- Smaller subtitle: "${slide.body}"
- Make the headline VERY prominent, eye-catching
- Add a subtle arrow or "swipe" indicator at the bottom
`;
  } else if (isCTA) {
    prompt += `
THIS IS THE CTA SLIDE (last slide — call to action):
- Large headline: "${slide.headline}"
- CTA text in a prominent button-like element: "${slide.body}"
- Make the CTA stand out with a bright accent color
- Clean, focused layout — no clutter
`;
  } else {
    prompt += `
HEADLINE (large, bold, top of slide): "${slide.headline}"
BODY TEXT (medium size, below headline): "${slide.body}"
`;
    if (slide.source) {
      prompt += `SOURCE (small, bottom of slide, subtle): ${slide.source}\n`;
    }
  }

  prompt += `
CRITICAL RULES:
- Text MUST be readable and correctly spelled — this is the most important requirement
- Use POLISH language exactly as provided (do not translate or change text)
- Keep layout clean and professional
- Do NOT add stock photos or people — only geometric/abstract design elements
- Maintain consistent brand look across all slides in the series
- Text should be the hero — graphics are supporting elements only
`;

  return prompt;
}

// --- Wywołanie Gemini API ---
async function generateImage(prompt, model, apiKey) {
  const url = `${API_BASE}/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio: ASPECT_RATIO,
        imageSize: IMAGE_SIZE,
      },
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API ${res.status}: ${err}`);
  }

  const data = await res.json();

  // Szukaj obrazu w odpowiedzi
  const parts = data.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return Buffer.from(part.inlineData.data, 'base64');
    }
  }

  throw new Error('Brak obrazu w odpowiedzi Gemini. Response: ' + JSON.stringify(data).slice(0, 500));
}

// --- Main ---
async function main() {
  loadEnv();

  const args = process.argv.slice(2);
  const mdPath = args.find(a => !a.startsWith('--'));
  const modelFlag = args.includes('--pro') ? 'pro' : args.includes('--legacy') ? 'legacy' : 'flash';
  const dryRun = args.includes('--dry-run');

  if (!mdPath) {
    console.error('Użycie: node carousel-generator.js <plik.md> [--pro] [--legacy] [--dry-run]');
    process.exit(1);
  }

  const fullPath = mdPath.startsWith('/') ? mdPath : join(ROOT, mdPath);
  if (!existsSync(fullPath)) {
    console.error(`Plik nie istnieje: ${fullPath}`);
    process.exit(1);
  }

  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey) {
    console.error('Brak GOOGLE_AI_STUDIO_API_KEY w .env');
    process.exit(1);
  }

  const model = MODELS[modelFlag];
  console.log(`\n🎨 CAROUSEL GENERATOR`);
  console.log(`Model: ${model} (${modelFlag})`);
  console.log(`Plik: ${basename(fullPath)}`);

  // Parse slajdy
  const markdown = readFileSync(fullPath, 'utf-8');
  const slides = parseSlides(markdown);

  if (slides.length === 0) {
    console.error('Nie znaleziono slajdów. Szukam sekcji "### SLAJD N"');
    process.exit(1);
  }

  console.log(`Slajdów: ${slides.length}`);
  console.log(`Szacowany koszt: ~$${(slides.length * 0.039).toFixed(2)} (Flash) / ~$${(slides.length * 0.08).toFixed(2)} (Pro)`);

  // Output dir
  const dateMatch = basename(fullPath).match(/(\d{4}-\d{2}-\d{2})/);
  const dateStr = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10);
  const outDir = join(ROOT, 'materialy', `carousel_${dateStr}`);

  if (!dryRun) {
    mkdirSync(outDir, { recursive: true });
  }

  console.log(`Output: ${outDir}\n`);

  // Generuj slajdy
  const results = [];
  for (const slide of slides) {
    const prompt = buildImagePrompt(slide, slides.length);
    const outFile = join(outDir, `slajd_${String(slide.num).padStart(2, '0')}.png`);

    if (dryRun) {
      console.log(`[DRY-RUN] Slajd ${slide.num}: "${slide.headline.slice(0, 50)}..."`);
      console.log(`  Prompt: ${prompt.length} znaków\n`);
      results.push({ num: slide.num, status: 'dry-run' });
      continue;
    }

    process.stdout.write(`Slajd ${slide.num}/${slides.length}: "${slide.headline.slice(0, 40)}..." `);

    try {
      const imageBuffer = await generateImage(prompt, model, apiKey);
      writeFileSync(outFile, imageBuffer);
      const sizeKB = Math.round(imageBuffer.length / 1024);
      console.log(`✅ ${sizeKB} KB`);
      results.push({ num: slide.num, status: 'ok', file: outFile, size: sizeKB });
    } catch (err) {
      console.log(`❌ ${err.message.slice(0, 100)}`);
      results.push({ num: slide.num, status: 'error', error: err.message });
    }

    // Rate limit: 200ms między requestami
    await new Promise(r => setTimeout(r, 200));
  }

  // Podsumowanie
  const ok = results.filter(r => r.status === 'ok').length;
  const errors = results.filter(r => r.status === 'error').length;

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Wygenerowane: ${ok}/${slides.length}`);
  if (errors > 0) console.log(`❌ Błędy: ${errors}`);
  if (!dryRun && ok > 0) {
    console.log(`📂 Pliki: ${outDir}/slajd_01.png ... slajd_${String(slides.length).padStart(2, '0')}.png`);
    console.log(`\nNastępny krok: Otwórz pliki → sprawdź tekst → zmerguj do PDF (np. "convert slajd_*.png karuzela.pdf")`);
  }
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
