# Batch 4 — drive round on the paint residue; pin round 3

**Written at the b3 close (close-procedure step 11), not at planning.** The
families come from `measurements/b3-classify.json`: every paint-only row
still open, grouped by its remaining diff keys and the mechanism the close
named. One task per family; file ownership per `parallelism.md` (two families
on one file ⇒ one task). Each task spec follows
[../batch-2/family-contract.md](../batch-2/family-contract.md).

Planning-time candidates (from `measurements/plan-classify.json` paint
keys; confirm or drop at b3):
- text font residue: `@font-weight` `'' → 700` (571), `@font-size`
  `11 ↔ 13` (173), `@font-style` `'' → italic` (170) — group/box/separator
  headers and creole runs;
- text `@fill` from creole colour (`#000` vs `#F00`/`#00F`/`#FFF`, ~160);
- residual dash values on non-arrow lines;
- `svg/@background` (30 fixtures' first diff) — root background from the
  style (`root`/`document`), if not chrome.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T4a](T4a-legacy-skinparam-store.md) | legacy `SkinParam#params` store; `sequenceGroupBodyBackgroundColor` (T3f item 3) | typescript-pro | `sequence-skin-param.ts`, `command-grouping.ts`, `parser.ts`, `sequence-parse-helpers.ts` + tests | b3 close | [ ] |
| close | re-pin, all-engine survey, pin round 3 | orchestrator | per close-procedure | all T4x | [ ] |

A family whose mechanism lies outside the sequence engine (creole, klimt,
chrome) is not a T4x task: file it in `fixtures.md` as `open -> sdd2` with the
mechanism (D10).

## Seeded at the b3 close (2026-10-20, journal row 51)

b3 classify leaves **4** paint-only rows, all one mechanism outside the
sequence engine: the title `FontColor %reverse_hsluv_color(...)` is off by
one in the last hex digit (davipu-63, fixecu-74, losilu-30, naliba-15),
a TIM builtin's HSLuv rounding on chrome → `open -> sdd2` per the rule
above. The planning candidates (font residue, creole fill, dash residue,
`svg/@background`) are gone from the paint-only cohort. One family remains
with a sequence-owned PAINT mechanism inside geometry rows, T3f item 3 →
T4a.
