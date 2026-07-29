# Batch 4 — Route the sizer through upstream's own boundary (ADR-6)

The template that stood here assumed ~12 independent table patches. ADR-6
replaces it: `measureLeafNode` is a parallel reimplementation of
`EntityImageDescription.calculateDimensionSlow`, which is already faithful
and which the RENDERER already uses. Read ADR-6 before starting.

## Sequencing — T6 runs ALONE

T6 is the rewrite. It must be the only change in its commit: it has a large
blast radius, and if the ratchet moves, nothing else may be in the diff to
confound the bisect. T7 and T8 are independent of it and of each other, but
they are held until T6 lands so that a ratchet movement has exactly one
candidate cause. T9 is cleanup and depends on T6.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T6 | Route `measureLeafNode` → `EntityImageDescription` | typescript-pro | `src/core/measurer-bounder.ts` (new), `src/diagrams/description/leaf-sizing.ts`, `leaf-sizing-consts.ts`, `layout-dot-tree.ts` | — | [x] |
| T7 | Port `ActorAwesome` / `ActorHollow` + the `actorStyle` accessor | typescript-pro | `src/core/skin/ActorAwesome.ts`, `ActorHollow.ts` (new), `ActorStyle.ts`, `src/core/theme.ts`, `skinparam.ts` | T6 | [ ] |
| T8 | Wire `archimate` as a description keyword | typescript-pro | `src/core/descriptive-keywords.ts`, `src/diagrams/description/parser.ts` | T6 | [ ] |
| T9 | **RESCOPED** — delete ONLY what T6 superseded + the dead `inkSprites` field | refactoring-specialist | `src/diagrams/description/leaf-sizing-consts.ts`, `layout.ts`, `layout-dot-tree.ts` | T6, T7, T8 | [ ] |

## What T6 is expected to close, and what it is not

Expected to fall out of the routing, because the ported path already carries
them:

| finding | why routing closes it |
|---|---|
| HEXAGON (width doubles) | `USymbolHexagon.ts:102` has the `* 2` |
| PERSON (`sqrt(surface)*0.42`) | `USymbolPerson.ts:51` |
| USECASE_BUSINESS | `USymbolUsecase.ts` has `withMargin(7,7,0,0)`; `Footprint.ts:134` has the `UEmpty` rule our `footprintBoxes` lacks |
| Shadowing GAP (both tiers) | constructor's `.withShadow(paint.deltaShadow)` |
| LineThickness GAP | constructor's `.withStroke(paint.stroke)` |
| `wrapWidth` / `guillemet` per-path gaps | `buildDesc` builds the block ONCE, so every leaf shape inherits it instead of only `measureBox` |

NOT closed by routing — these are T7/T8/T9:

| finding | why |
|---|---|
| ACTOR_AWESOME, ACTOR_HOLLOW | geometry absent from the port; `actorStyleGetTextBlock` throws for both by deferral |
| ARCHIMATE | `archimate` is missing from `KEYWORD_SYMBOL_ENTRIES`, so the line never becomes a leaf — a parser gap, not a sizing one |
| `inkSprites` | threaded and unread; its feature is already delivered via `sprites` → `inlineFootprintBox`. DELETE the field; this is not a sizing fix |

## Hard rules

- **The ratchet is shrink-only and it STOPS this batch.** If T6 widens any
  pin, that is not a re-baseline: diagnose the mechanism first
  (`diagnosis.md`). A widened pin means the routing lost a behaviour the
  flat tables encoded, and that behaviour must be found before proceeding.
- **A pin deletion belongs in the same commit as the fix that flips it.**
- **Never ship a fitted constant.** If a residual needs a number you cannot
  trace to an upstream expression, the mechanism is not found yet.
- **Out of scope, do not start:** S1L-i (titled separators), S1L-j
  (multiline display), the sprite tail, the container remainder, the creole
  `{{ }}` sub-diagram (UNIMPLEMENTED), the 2 LaTeX fixtures (permanent
  DIVERGENCE).

## Batch 5

ADR-6 expects ADR-2 to be MOOT — the descriptor refactor exists to unify the
five flat tables, and T6/T9 delete them instead. After T9, confirm and
retire ADR-2 in the journal rather than executing Batch 5 out of habit.


## STATUS after T6 — read the ADR-6 AMENDMENT before continuing

T6 landed at **316/351 (90.0%)**, zero widened, but it FALSIFIED half of
ADR-6 and that changes what is left:

- **T9's premise is VOID.** The flat tables are not superseded — the ported
  path lacks the folder title margin, sprite ink offsets, the `<img>`
  default-font seam and our deliberate `<latex>` divergence. T9 now deletes
  ONLY what T6 actually replaced, plus the dead `inkSprites` field. Deleting
  the tables wholesale would lose real behaviour.
- **ADR-2 is live again**, not moot. The five tables survive, so the
  descriptor refactor it proposes still has a subject. Re-evaluate its gate
  honestly.
- **A new follow-on exists, and it is the real ceiling.** Widening the
  routing requires porting `BodyFactory`/`BodyEnhanced*` and adding
  ink-offset and default-font seams to the shared atom pipeline. Substantial
  and separable — a tracked mission, not a Batch-4 patch.

T7 (ActorAwesome/ActorHollow + the `actorStyle` accessor) and T8 (`archimate`
keyword) are UNAFFECTED by the amendment and remain as specified.
