# T1 — Spike: current vs stripe-based sizer width (GATE, measurement-only)

## Context
The sizer's `creoleVisibleText` (`leaf-sizing.ts:376`) uses `parseCreole`, which
leaves unclosed/`:`-variant tags literal; the renderer's `buildStripeAtoms`
strips them (S1L-b-unicode T3). Before rewiring the sizer, MEASURE the corpus
impact: how many goldens' node widths change, and in which direction (ADR-4).

## Task (measurement-only — NO production change)
Create `scripts/measure-creole-lexer-delta.ts`:
1. For each description golden (`oracle/goldens/description/<slug>/`), render it
   with the deterministic measurer, capturing layout inputs — reuse
   `captureGraphs`/the observer pattern from
   `scripts/measure-description-size-deltas.ts` (import or mirror; do NOT
   reimplement rendering).
2. For each leaf display, compute TWO per-line visible-text widths:
   - **current:** `parseCreole(line)`-based (today's `creoleVisibleText`).
   - **stripe:** the renderer's path — `classifyStripeLine(line)` then
     HR→'' / LITERAL→`buildLiteralAtoms` / else→`buildStripeAtoms`, concatenating
     text-atom `.text` (a prototype of the ADR-1 helper; inline is fine here).
   Decode both with `resolveTextEscapes` per line (match T1-unicode ordering).
3. Report per fixture: max node-width delta (stripe − current, in px and in),
   classified widen / shrink / neutral (±0.01in). Print a summary: counts per
   class, the target fixtures (lurupu-11-fubo915, gafico-37-cuma657,
   nujito-06-neca370) called out explicitly, and the top-N movers each way.
4. Exit 0 always (this is a report, not a gate test); the GO/NO-GO is read from
   its output.

## Read-set
- `scripts/measure-description-size-deltas.ts` (captureGraphs, fixture discovery,
  the WidthTableMeasurer + stdlib wiring) — reuse, don't duplicate.
- `src/diagrams/description/leaf-sizing.ts:376-401` (`creoleVisibleText`,
  `maxLineWidth`).
- `src/core/klimt/creole/legacy/CreoleStripeSimpleParser.ts#classifyStripeLine`,
  `src/core/klimt/creole/legacy/StripeSimple.ts#buildStripeAtoms`/`buildLiteralAtoms`.
- `plans/creole-lexer-unification/decisions.md#adr-4`.

## Write-set
- `scripts/measure-creole-lexer-delta.ts` (new).

## Architecture (locked)
ADR-4 — this is the gate. Do NOT edit `leaf-sizing.ts` or any production file in
this task. The stripe-path prototype here is throwaway; T2 extracts the real
shared helper.

## Interface contract (consumed by T2/T3)
Stdout summary must include: `{widen, shrink, neutral}` fixture counts; the three
target fixtures' deltas; and the list of any NON-target fixtures that widen
(these drive the STOP decision and T3's re-baseline).

## Observability
N/A — measurement script, no observable runtime operations.

## Rollback
Reversible — delete the script. No production impact.

## Quality bar
`npm run typecheck` clean; the script runs exit 0 and prints the summary.
No production file changed (verify `git diff --name-only` = the script only).

## Acceptance criteria (Given/When/Then)
- Given all 351 goldens, when the script runs, then it prints per-class counts
  (widen/shrink/neutral) and exits 0.
- Given lurupu-11 / gafico-37 / nujito-06, when reported, then each shows a
  SHRINK (stripe width < current) on its driver node.
- Given the summary, when read, then the GO/NO-GO per ADR-4 is unambiguous
  (shrinks+neutral dominate, non-target widening enumerated).

## Commit
`test(description): spike script for sizer creole-lexer width delta (creole-lexer-unification T1)`
