# Design: Asystent Leny (Bliźniak Biznesowy — wideograf UA)

**Data:** 2026-02-23
**Status:** APPROVED
**Klient:** Lena (beta-test, wideograf/content creator, Ukraina)
**Cel strategiczny:** Testimonial + referencje na rynku UA + cross-industry proof

---

## KONTEKST

Lena zrobiła wywiad na starym Architekcie (poprzednia iteracja). Odesłała 5 plików po ukraińsku:
- 01_DNA_STYL.md → S5
- 02_MATRYCA_OFERTY.md → S3 + S4
- 03_AVATAR_I_ANTY.md → S2
- 04_KARTY_WALKY.md → S6
- 05_PROCEDURY.md → S7

Brakuje: S1 (Profil) i S8 (Workflow) — wysłano 7 pytań do Leny.

## PODEJŚCIE: C (Parallel MVP + pytania)

1. Transformuj 5 plików → dna.md (S2-S7) w nowym formacie, UA
2. Adaptuj SKILL.md pod wideografa, UA (15 WF)
3. Stwórz CLAUDE.md, UA
4. Deliver MVP (bez S1/S8)
5. Gdy Lena odpowie → uzupełnij S1 + S8 → deliver update

## DECYZJE

- **Język:** Wszystko po ukraińsku (pełna lokalizacja)
- **SKILL.md:** Adaptowany pod wideografa (nie standardowy)
- **Brakujące sekcje:** 7 pytań do Leny (S1 + S8)
- **Format delivery:** dna.md + SKILL.md + CLAUDE.md + INSTRUKCJA.md

## ADAPTACJA WF

| WF | Oryginał | Adaptacja wideograf |
|----|----------|---------------------|
| WF1 | Email Reply | Відповідь на запит клієнта |
| WF2 | Offer Creation | Розрахунок вартості зйомки |
| WF3 | Price Defense | Захист ціни |
| WF4 | Follow-up | Follow-up (клієнт мовчить) |
| WF5 | Debt Collection | Стягнення боргу |
| WF6 | Outreach | Outreach (Instagram/DM) |
| WF7 | Prospect Research | Дослідження клієнта |
| WF8 | Meeting Prep | Підготовка до зйомки |
| WF9 | Content Creation | Контент для портфоліо |
| WF10 | Pipeline Analysis | Огляд замовлень |
| WF11 | Proposal | Пропозиція співпраці |
| WF12 | Complaint Handling | Рекламація |
| WF13 | Deep Research | Дослідження трендів відео |
| WF14 | Folder Hygiene | Гігієна файлів |
| WF15 | Business Development | Розвиток бізнесу |

## PLIKI DOCELOWE

```
projekty/lena/delivery/
├── CLAUDE.md       (UA, ~100 linii)
├── dna.md          (UA, S1-S8, ~420 linii)
├── SKILL.md        (UA, 15 WF, ~600 linii)
└── INSTRUKCJA.md   (UA, quick start)
```
