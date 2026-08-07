# F1-a — G2 `measureNote` rebuild

## Context

`plantuml-ts` is a TypeScript port of upstream PlantUML (`~/git/plantuml`,
Java). This task is part of the `s1l-tail-fix` mission, batch 1 — see
`../README.md` for mission-wide gates/stop-conditions and `../decisions.md`
for the nine binding ADRs. Description-diagram size conformance sits at
321/351; this task alone is worth **+5** (326/351).

`measureNote` (`src/diagrams/description/leaf-sizing.ts:215-226`) models a
note body as flat `lineCount(display) × NOTE_FONT_SIZE(13)`. Upstream
(`EntityImageNote.java:116-117`) instead builds the note body through
`BodyFactory.create3` → `BodyEnhanced2`, the same real text-block model
already wired for entity `desc` (`EntityImageDescriptionDelegates.ts:296-333`,
function `buildDesc` — **read this as your working precedent**, it is the
identical `BodyFactory.create3` call shape you need, just for a different
caller). That model is already fully ported in this repo — `BodyFactory.ts`,
`BodyEnhanced2.ts`, `BodyEnhancedAbstract.ts` all exist and need no new
porting work. Your job is wiring `measureNote` (the sizer) and
`drawNoteFallback` (the renderer, `renderer-entity.ts:284-298`) onto that
existing model, in lock-step — they must never diverge (per
`planning/sizer-renderer-parity.md`).

**Required reading before starting (CLAUDE.md mandate, any sizing bug in any
engine):** `planning/usymbol-composition.md` and
`planning/sizer-renderer-parity.md`.

## Task

Rebuild `measureNote` so it routes the note display through
`BodyFactory.create3` → `BodyEnhanced2` instead of the flat
`lineCount × 13` model, and update `drawNoteFallback`
(`renderer-entity.ts:284-298`) to build its `TextBlock` the same way (it
currently uses a `buildTextBlock` scoped substitute, per its own doc comment
at `:270-283`, referencing `EntityImageNote.java`'s real
`BodyFactory.create3(strings, ..., style.wrapWidth(), style)` call — the
SAME call `EntityImageDescription.java`'s `desc` uses). Sizer and renderer
must move together or they will disagree three ways, as they do today (flat
13px lines / creole heading + literal separator text / upstream's real block
model).

This one 12-line function serves **four independently-diagnosed causes**
(SYNTHESIS §3). ADR-3 requires the full `BodyEnhanced2` route (not four
patches) but also requires **verifying each cause separately** — routing
through `BodyEnhanced2` plausibly subsumes C3 and C4, but that is an
expectation, not a measured claim.

| # | Cause | Origin | Fixtures | Mechanism |
|---|---|---|---|---|
| C1 | Block-separator geometry never applied | `leaf-sizing.ts:224` | `xufexu-38-fola855`, `pivudu-29-pele178` | Body never split on `BodyEnhancedAbstract.isBlockSeparator` (`:84-90`), never `decorate`d (`:100-125`) |
| C2 | `{{ … }}` never collapses to an `EmbeddedDiagram` atom | `leaf-sizing.ts:223` | `kovaxi-11-reti348`, `zidebi-71-nocu387` | Display never reaches `CreoleParser`'s `{{` dispatch (`CreoleParser.ts:305-320`, `processEmbedded`) |
| C3 | `NOTE_FONT_SIZE` hardcoded; `opts.fontSize` delivered and ignored | `leaf-sizing.ts:221` | `tijexo-10-zipo222` | `measureNote`'s `noteFont` always forces `size: NOTE_FONT_SIZE`, discarding any per-element override |
| C4 | Height blind to a line whose RUN font is the img-fallback 14, not the note's 13 | `leaf-sizing.ts:224` | `nobiza-91-fimo741` (residual — **not closed by this task**, see below) | `lineCount × 13` cannot distinguish a note text line from an `<img:…>` cannot-decode fallback line, fixed at monospace 14 |

**Maintainer ruling folded in (2026-08-06, SYNTHESIS §5):** C2 must reproduce
`EmbeddedDiagram.java:149`'s 42×42 catch-block fallback **faithfully — no
divergence is declared.** The 42×42 IS the jar's own measurement of its own
render *failure*; this port's job is to reproduce that failure exactly, not
to render a working nested diagram. `EmbeddedDiagram.ts:405-417`
(`calculateDimensionSlow`) already implements this catch → `new
XDimension2D(42, 42)` fallback verbatim — do not touch it, do not build a
real nested-diagram pipeline, and do not raise this as a new divergence
question; it is closed.

### `nobiza-91-fimo741` — C4 is necessary but not sufficient here

`nobiza-91`'s **dominant** delta (0.276910in) is G3 (stereotype-as-sprite,
`EntityImageDescriptionDelegates.ts:337`, `buildStereo`) — out of this
task's write-set, fixed in F2-b (batch 2). C4's fix (the note residual,
0.013889in) is necessary for `nobiza-91` to close but not sufficient on its
own. **Do not report `nobiza-91` as closed** even if C4 verifies clean in
isolation — SYNTHESIS's co-requisites table (§1) requires both G2 and G3.

### The arithmetic you must reproduce exactly, zero free parameters

From `../s1l-tail-diagnosis/findings/creole-titled-separator.md`
(`xufexu-38-fola855`, notes 1 and 2) — both numbers must fall out of the
Java expression, not be curve-fitted:

- Note 1 (5 text lines + separators `--`, `==toto==`, `==`, `--`):
  `5×13 + (8 + 17 + 8 + 8) + 10 = 116px = 1.611111in`
- Note 2 (6 text lines, same 4 separators):
  `6×13 + 41 + 10 = 129px = 1.791667in`

Where the separator costs come from `BodyEnhancedAbstract.decorate`
(`:100-125`): untitled separator (`getTitle` returns `undefined` for
`s.length <= 4`, `BodyEnhanced2.ts:208-212`) costs **+8** (`4 + 4`
top/bottom margin); a titled separator (`==toto==`, length > 4) costs
**`4 + titleHeight`** = **+17** for a 13px title line.

## Write-set

- `src/diagrams/description/leaf-sizing.ts` — `measureNote` (`:215-226`) and
  its caller `measureLeafNode`'s note case (`:128-129`); the trap below also
  touches how `opts` reaches `measureNote`.
- `src/diagrams/description/renderer-entity.ts` — `drawNoteFallback`
  (`:284-298`), to keep sizer and renderer in lock-step.
- `src/core/klimt/creole/legacy/CreoleParser.ts` — only if the `{{`
  dispatch wiring seam (`:305-320`) needs a note-specific hook; the dispatch
  itself is already implemented and should not be reimplemented.

## Read-set

- `src/diagrams/description/leaf-sizing.ts:100-226` — `measureLeafNode`
  (the `opts?.fontSize` collapse at `:109`, the note case at `:128-129`,
  `measureNote` at `:215-226`).
- `src/core/cucadiagram/BodyFactory.ts:129-136` — `create3`'s exact
  signature: `create3(rawBody: Display, config: BodyEnhanced2Config,
  styleValues: BodyEnhanced2StyleValues, atomOps: AtomOps): TextBlock`.
- `src/core/cucadiagram/BodyEnhanced2.ts` (whole file, 284 lines) —
  `getMarginX` (`:128-130`, returns 0 — asymmetric vs `BodyEnhanced1`),
  `getArea`/`collectBlocks` (`:140-194`, the separator loop and the `{{`
  embedded-line consumption at `:177-181`), `getTitle` (`:203-212`, **ported
  privately here**, not on the abstract base — see its own doc comment
  `:64-77` for why).
- `src/core/cucadiagram/BodyEnhancedAbstract.ts` (whole file, 127 lines) —
  `isBlockSeparator` (`:84-90`, static, verbatim port), `decorate`
  (`:100-125`, the three-branch geometry).
- `src/core/svek/image/EntityImageDescriptionDelegates.ts:270-333` — your
  working precedent. `buildDesc` (`:296-333`) is the existing, correct
  `BodyFactory.create3` call for entity `desc`: `Display.create
  (labels.displayText.split('\n'))`, `buildLocalSkinSimple`, `descAtomOps`,
  `LineBreakStrategy`. Mirror this shape for the note path — do not
  reinvent the wiring.
- `src/diagrams/description/renderer-entity.ts:270-298` — `drawNoteFallback`
  and its own doc comment, which already names the upstream call you are
  reproducing.
- `src/core/EmbeddedDiagram.ts:396-417` — `calculateDimensionSlow`, the
  already-ported 42×42 catch fallback (C2). Do not modify.
- `src/core/klimt/creole/legacy/CreoleParser.ts:305-320` — the existing
  `{{` → `processEmbedded` dispatch that C2's fix should reach once the note
  display flows through the real `Display`/creole pipeline via
  `BodyEnhanced2.collectBlocks`'s embedded-line consumption
  (`BodyEnhanced2.ts:177-181`, `addOneSingleLineManageEmbedded2`,
  `:236-257`).
- `planning/usymbol-composition.md`, `planning/sizer-renderer-parity.md` —
  mandatory per CLAUDE.md for any sizing bug.

## Architecture decisions that bind this task

- **ADR-3** — take the full `BodyEnhanced2` route, not four patches, but
  verify C1/C2/C3/C4 **each independently**. Do not assume subsumption.
- **ADR-4** — `measureNote` must read `opts?.fontSize ?? NOTE_FONT_SIZE`.
  **Do not change `leaf-sizing.ts:109`** (the `opts?.fontSize === undefined
  ? baseFont : {...baseFont, size: opts.fontSize}` collapse in
  `measureLeafNode`). See the trap below — this is the single highest-risk
  mistake available in this task.
- **ADR-1** — do not write `oracle/goldens/description/size-backlog.json`.
  Report closed pins to the orchestrator in your completion summary; the
  orchestrator deletes them after batch gates pass.
- Maintainer ruling (SYNTHESIS §5, folded above) — C2's 42×42 fallback is
  faithful reproduction, not a divergence. Do not declare one.

## The trap (read this before touching `measureNote`'s signature)

`leaf-sizing.ts:109` collapses "no font-size override" into `baseFont`
(size 14) **before** `measureNote` is called — by the time `measureNote`
runs today, its `fontSpec.size` cannot distinguish "no override, must
measure at the note default 13" from "override to 14". Today's code sidesteps
this entirely by hardcoding `NOTE_FONT_SIZE` (C3's bug). Once you make
`measureNote` respect an override (C3's fix), reading `fontSpec.size`
directly would regress **every plain note in the corpus by 1px** — a false
"fix" that trades one bug for widening 300+ passing fixtures.

The correct shape: thread `opts?: BoxSizingOpts` (or just `opts?.fontSize`)
into `measureNote` alongside `fontSpec`, and compute the note's own font
size as `opts?.fontSize ?? NOTE_FONT_SIZE` locally — never derived from the
already-collapsed `fontSpec.size`. `measureLeafNode`'s note case
(`:128-129`) currently calls `measureNote(node.display, fontSpec, measurer,
sprites)` — it must additionally pass `opts` through.

## Interface contracts

`measureNote`'s new signature (exact parameter list is your call, but it
must satisfy this contract): given `(display: string, fontSpec: FontSpec,
measurer: StringMeasurer, opts: BoxSizingOpts | undefined, sprites?:
SpriteDimsLookup)`, it must return `{ width: number; height: number }`
(the existing `Dim` type) computed via `BodyFactory.create3(...)
.calculateDimension(stringBounder)`, where the note's font size is
`opts?.fontSize ?? NOTE_FONT_SIZE` — never `fontSpec.size`.

This shape is consumed downstream by **F3** (batch 3), which threads
`BoxSizingOpts.stereotypeFontSize` and `BoxSizingOpts.lineThickness`
through the same file (`leaf-sizing.ts`) for a different leaf family. F3
extends `BoxSizingOpts`, it does not replace it — do not remove or rename
existing `BoxSizingOpts` fields, and do not change `measureNote`'s
`opts` parameter to a bespoke type; keep it `BoxSizingOpts | undefined` so
F3's later additions are additive.

## Acceptance criteria

1. **Given** `xufexu-38-fola855`'s two notes, **when** measured through
   `measureLeafNode`, **then** note 1 returns exactly 116px height
   (1.611111in) and note 2 returns exactly 129px height (1.791667in), with
   zero free parameters (both numbers must fall out of `decorate`'s Java
   expression, not be independently curve-fit).
2. **Given** a note with `{{ ... }}` embedded-diagram markup
   (`kovaxi-11-reti348`, `zidebi-71-nocu387`), **when** measured, **then**
   the collapsed content measures the fixed 42×42 fallback (via
   `EmbeddedDiagram.ts:415`, unmodified), producing a note box of
   63×52px (`21 + 42` wide, `10 + 42` tall, `NOTE_MARGIN_H`/`NOTE_MARGIN_V`).
3. **Given** `tijexo-10-zipo222`'s `<style> note { FontSize 10 }`, **when**
   measured, **then** the note measures 89.875×20.000px (jar-exact) — proving
   the override is read — **and** a plain note with no override still
   measures at 13px (the ADR-4 regression check: a synthetic
   `note "Hello"` diagram must still return 50.74×23, matching the existing
   deterministic-oracle baseline noted in `leaf-sizing.ts`'s own comment at
   `:212-214`).
4. **Given** the same display supplied to both `measureNote` and
   `drawNoteFallback`, **when** compared, **then** sizer and renderer
   compute dimensions from the same `BodyFactory.create3` call shape (no
   manual re-derivation in the renderer) — verified by a note-bearing SVG
   golden rendering without new visual diffs beyond the intended layout
   change.
5. **Given** `nobiza-91-fimo741`, **when** re-measured after this task
   alone, **then** its C4 residual (0.013889in) closes in isolation, but
   the fixture as a whole is **not** reported as conformant (its dominant
   G3 cause is still open) — confirm this explicitly in the completion
   summary rather than letting the harness's per-fixture delta imply
   closure.

## Quality bar

```sh
npm test
npm run typecheck
npm run lint
npm run build
npx tsx scripts/measure-description-size-deltas.ts
npx tsx scripts/audit-size-metric-identity.ts
```

Never pipe a gate — capture `$?` directly. Expect 5 fixtures to move to
conformant (`xufexu-38-fola855`, `pivudu-29-pele178`, `tijexo-10-zipo222`,
`kovaxi-11-reti348`, `zidebi-71-nocu387`); **`widened > 0` on any ratchet is
a STOP condition**, not a warning — this includes the description ratchet
and, because the note renderer's ink changes, note-bearing SVG goldens.
Every note-bearing golden in the corpus is a regression-risk fixture for
this change (7 of the 30 currently non-conformant carry a note, plus every
conformant note-bearing golden must stay conformant).

## Observability

N/A — `measureNote`/`drawNoteFallback` are pure sizing/rendering functions
with no logging, metrics, or externally observable operations. No new
observability surface is introduced.

## Rollback

Reversible. Pure function change inside the sizer/renderer; no data
migration, no schema change, no persisted state. A revert of this task's
commit fully restores prior behavior.

## Boundaries

**Always do:**
- Verify C1, C2, C3, and C4 as four separate, independently-confirmed
  checks — do not treat "the fixtures pass" as proof each cause was
  individually addressed.
- Read `planning/usymbol-composition.md` and
  `planning/sizer-renderer-parity.md` before writing any sizing code.
- Use Serena MCP tools (`find_symbol`, `find_referencing_symbols`, etc.) for
  navigation — not the LSP tool (unavailable to subagents).
- Report closed pins to the ORCHESTRATOR in your completion summary. Never
  edit `size-backlog.json` yourself (ADR-1).
- If a discrepancy appears between the arithmetic above and what you
  measure, enter diagnosis mode per `~/.claude/rules/diagnosis.md` — read
  that file first, it is not auto-loaded.
- Follow TDD per `~/.claude/rules/testing.md` (also not auto-loaded) — write
  the failing test against the jar arithmetic above before changing
  `measureNote`.

**Ask first:**
- If closing C2 requires any change to `EmbeddedDiagram.ts` itself (it
  should not — the 42×42 fallback is already correct and unmodified).
- If the renderer change in `renderer-entity.ts` widens any non-note SVG
  golden.

**Never do:**
- Write `oracle/goldens/description/size-backlog.json`.
- Run any state-mutating git command (the orchestrator commits after the
  batch).
- Declare a divergence for C2's 42×42 fallback — it is maintainer-ruled
  faithful reproduction, closed.
- Regenerate any existing golden.
- Report `nobiza-91-fimo741` as closed.

## Commit

`fix(F1-a): rebuild measureNote via BodyEnhanced2`

Body (required — touches 3 files): explain the four-cause structure (C1-C4),
name the ADR-4 trap and how it was avoided, and list the 5 fixtures closed
plus the `nobiza-91` residual left open pending F2-b.
