# Mission — BodyEnhanced + atom-pipeline seams

Port upstream's text-block **body** layer and wire the two shared-pipeline
seams, so the T6 routing can widen past the box family.

## Objective

The description-leaf-sizing-audit closed at **317/351 (90.3%)**. Its T6
routed `measureLeafNode` through `EntityImageDescription
.calculateDimensionSlow` — upstream's own sizing entry point — but could
only route the **box family**, and had to narrow four times. **This mission
removes the reason for three of those four narrowings.**

**Revised 2026-07-29 (ADR-10): this mission delivers narrowings #2 and #3.**
Narrowing #1 moved to mission SI1 — `name` routes `create2` →
`BodyEnhanced1`, which needs `MethodsOrFieldsArea` and a ≈12,100-line
cascade through `CucaDiagram`/`Entity`/`Bodier` and the 40-file `skin/`
package. That is SI1's scope by `CLAUDE.md` and by this README's own
out-of-scope list.

The ADR-6 AMENDMENT in `plans/description-leaf-sizing-audit/decisions.md`
is the authoritative statement of why, and it is required reading: the
ported `decoration/symbol/` classes and our flat sizing tables are faithful
in **different places**, not faithful-vs-lossy. The ported classes carry
SYMBOL-COMPOSITION facts read from Java; the flat tables carry TEXT-BLOCK
facts learned from fixtures. This mission ports the missing text-block
layer so the two stop disagreeing.

## What T6 proved — do NOT re-derive

| # | narrowing | mechanism | cost of routing anyway |
|---|---|---|---|
| 1 | folder/package | `EntityImageDescription.ts:43` — none of `BodyFactory`/`BodyEnhanced*` are ported, so the ported path has NO title margin. Our `FOLDER_SHOWN_TITLE_EXTRA_WIDTH=12` traces to `BodyEnhanced1.getMarginX()`=6 via `BodyEnhancedAbstract.decorate`'s `withMargin(block,6,0)` | widened 8 fixtures |
| 2 | usecase + sprite | `AtomImageResolver` (`creole-atoms.ts:120`) returns `{href,width,height}` — no ink field at all | widened bootstrap-0, ruziru-69 |
| 3 | box + `<img>` | the cannot-decode fallback must draw at the DIAGRAM-default font (S1L-h) | widened jecici-56 |
| 4 | box + `<latex>` | the shared pipeline does a REAL KaTeX render, **worse** than our deliberate 0-width approximation | **NOT IN SCOPE — a divergence to preserve** |

Why `name` takes the +12 and `desc` does not: `name` routes
`create2`→`BodyEnhanced1` (`getMarginX`=6); `desc` routes
`create3`→`BodyEnhanced2` (`getMarginX`=0).

## Branch

`feat/bodyenhanced-atom-seams` — branch BEFORE the first edit. Merge with
`--no-ff` (per-task commit IDs are cited from ledgers).

## Quality gates — ALL must pass before every commit

```sh
npm test          # baseline 400 files / 10419 tests
npm run typecheck
npm run lint
npm run build
```

Ratchets — a regression in any is a STOP condition:

```sh
npx tsx scripts/measure-description-size-deltas.ts    # widened 0; conformant >= 317/351
npx tsx scripts/dot-sync-report.ts component usecase class   # 262 / 90 / 708 EQUAL
npx tsx scripts/measure-class-size-deltas.ts          # 219/708, widened 0
npx vitest run tests/architecture/sizer-renderer-parity.test.ts   # green
```

`KNOWN_GAPS` in the parity guard is **shrink-only**: deleting an entry the
port closes is allowed; moving one to `SIZE_NEUTRAL` never is.

Baseline: main @ `7267187`, **317/351 (90.3%)**, 34 pins, zero widened.

### Pre-flight — verified 2026-07-29

| Check | Result |
|---|---|
| four gates at `7267187` | 400 files / 10419 tests, typecheck + lint + build clean |
| description / class / DOT ratchets | 317/351 w0 · 219/708 w0 · 262/90/708 EQUAL |
| write-set paths (Modify) | all present |
| `src/core/cucadiagram/` | absent — T2a creates it; parent exists |
| upstream sources | `BodyFactory`, `BodyEnhanced1/2/Abstract`, `TextBlockLineBefore` all present |
| `feat/bodyenhanced-atom-seams` | does not exist |
| per-task observability + rollback | present on all seven |
| `.claude/settings.autonomous.json` | present, includes `Bash(java *:*)` |

`plans/` is deliberately TRACKED in this repo (briefs are cited from commit
messages and `planning/mission-index.md`), deviating from the plan-mission
skill's gitignore instruction. `.claude/` is ignored.

## Batches

| # | Focus | Tasks | Status |
|---|---|---|---|
| 1 | Renderer gate — GATING (ADR-5 + AMENDMENT) | T1 [x], T1b [x] | [x] |
| 2 | Port base + seams (parallel) | T2a [x], T3 [x] | [x] |
| 3a | Creole Display/Sheet layer — GATING (ADR-8) | T7–T10g, T9c [x] | [x] |
| 3 | Port the Body classes | T2b-1 [x] (T2b-2 → SI1, ADR-10) | [x] |
| 4 | Wire it in — the risky one | T4 | [ ] |
| 5 | Widen the routing (ADR-6) + close | T5, T6 | [ ] |

## Index

- [decisions.md](decisions.md) — ADR-1..10, incl. the ADR-5 AMENDMENT and ADR-8's corollary
- [batch-1/overview.md](batch-1/overview.md) … [batch-5/overview.md](batch-5/overview.md), plus [batch-3a/overview.md](batch-3a/overview.md)
- [diagrams/component-map.md](diagrams/component-map.md)
- [diagrams/data-flow.md](diagrams/data-flow.md)
- [decision-journal.md](decision-journal.md)

## Method constraints — earned, not theoretical

- **NEVER ship a fitted constant.** Every number traceable to an upstream
  expression. A scan once produced 10.9 where the answer was `size/4.5`
  from `StringBounder#getDescent`.
- **A WIDENED pin is a STOP, never a re-baseline.** Diagnose to a mechanism
  at a `file:line` first (`~/.claude/rules/diagnosis.md`). T6 is the model:
  it found what the tables encoded and KEPT it rather than forcing the
  routing.
- **Verify a write-set by READING, not grepping.** Two of the last
  mission's write-sets were wrong for exactly this reason, and a scan once
  reported 24 live constants as dead because a zsh glob failed silently.
- **Verify a load-bearing claim before repeating it.** Eight were corrected
  against the code last mission — including T6's "no defaultFont seam",
  which ADR-3 corrects: the seam EXISTS and is simply never passed.
- **"Not ported yet" is NEVER "unreachable"** (ADR-8 corollary). This port
  is porting every PlantUML diagram type, so "its only caller is a diagram
  type we have not built" does not justify dropping a member — nor does "no
  caller today". Port it, or STOP and report. T7 dropped
  `XRectangle2D#intersect` on exactly this reasoning and had to be reversed.
- **A scoped substitute may already exist — check before proposing one.**
  T2b offered the maintainer a choice between porting a foundation and
  "deciding to build a scoped substitute" that was already built and
  self-documented (`EntityImageDescriptionSupport.ts#buildTextBlock`).
- **Jar probe**, and its two traps:
  ```sh
  java -DPLANTUML_DETERMINISTIC_TEXT=true -DPLANTUML_DUMP_DOT=<dir> \
       -jar oracle/dist/plantuml-oracle.jar -tsvg -o <dir> <file.puml>
  ```
  DOT node order ≠ declaration order (isolate ONE element per diagram); a
  single-entity diagram emits NO DOT (`isDegeneratedWithFewEntities`) —
  always add a second element.
- **Watch the decoration-from-inside-a-quoted-display class**: four
  instances via four distinct paths so far. Upstream anchors
  STEREOTYPE/TAGS/URL AFTER the CODE/DISPLAY alternatives.

## Out of scope

The `<latex>` **sizing** divergence (above — the 0-width approximation
stays; `StripeLatex` PARSING was ported by T10e); `BodierSimple`/
`BodierLikeClassOrObject` and `BodyFactory.createLeaf`/`createGroup`
(mission SI1); S1L-j multiline quoted display; A2s.

**Moved to SI1 during execution (ADR-10):** `BodyEnhanced1`,
`BodyFactory.create2`, `MethodsOrFieldsArea`, `CucaDiagram`, `Entity` and
the skin/style subsystem — and with them T6 narrowing #1.

**No longer out of scope:** the creole `{{ }}` sub-diagram was listed as
UNIMPLEMENTED (A3); T10f ported `EmbeddedDiagram` including
`createAndSkip`, with nested rendering behind an injected seam.

**S1L-i (creole titled separators) IS IN SCOPE** — maintainer decision.
`decorate` carries the separator machinery, so porting it faithfully closes
S1L-i as a consequence. Stubbing that branch to keep mission boundaries
tidy would be the refactor-while-porting antipattern.

## Filed, decide during execution

`archimate` maps to the `'rectangle'` sname, so
`layout-dot-tree.ts:180`'s `ctx.fontSizeFor(node.symbol)` resolves the
wrong style bucket — `<style> archimate { FontSize 20 }` moves the node in
the jar and does nothing here. Every sname-keyed resolver is affected.
Unmeasured (no fixture); in `plans/s1l-leaf-sizing/ledger.md` as a SIZING
gap. Not required by this mission; fold in only if T4 makes it trivial.
