# T6 — Route `measureLeafNode` through `EntityImageDescription`

**Read `decisions.md` ADR-6 first.** This task IS that decision. It runs
alone in its own commit — see `batch-4/overview.md` for why.

## Context

`measureLeafNode` re-derives leaf geometry from five flat tables keyed by
symbol. `EntityImageDescription.calculateDimensionSlow(stringBounder)`
(`src/core/svek/image/EntityImageDescription.ts:288`) already computes it
correctly, via `symbol.asSmall(...).calculateDimension` — upstream's own
sizing entry point — and the RENDERER already uses that path. The sizer is a
parallel, lossy reimplementation of shipping code.

## Task

Make the sizer call the faithful path.

1. Add a `StringMeasurer` → `StringBounder` adapter
   (`src/core/measurer-bounder.ts`). `StringBounder.calculateDimension(font,
   text)` vs `StringMeasurer.measure(text, font)` is an argument swap
   returning `XDimension2D` vs `{width, height}`; `getDescent` exists on
   both. Keep it thin — it is a shim, not a layer.
2. Construct an `EntityImageDescription` inside `measureLeafNode` from what
   `BoxSizingOpts`/`ClassifyCtx` already carry, and return
   `calculateDimensionSlow(adapter)`.
3. Delete the per-symbol branches the routing supersedes.

## Write-set

- `src/core/measurer-bounder.ts` (new)
- `src/diagrams/description/leaf-sizing.ts`
- `src/diagrams/description/leaf-sizing-consts.ts`
- `src/diagrams/description/layout-dot-tree.ts` (only if `BoxSizingOpts`
  must carry more to build the params)

## Read-set

- `src/core/svek/image/EntityImageDescription.ts:244-292` — the constructor
  and `calculateDimensionSlow`; note it is PURE DATA (labels, fonts, paint,
  symbol), nothing render-time-only
- `src/core/svek/image/EntityImageDescriptionSupport.ts` — `buildDesc`,
  `buildTextBlock`, `buildStereo`, `buildWrappedLines`
- `src/diagrams/description/renderer-symbol.ts`, `renderer-entity.ts` — how
  the renderer already assembles these params; REUSE that assembly, do not
  invent a second one
- `src/core/measurer.ts`, `src/core/klimt/font/StringBounder.ts`
- `planning/usymbol-composition.md`, `planning/sizer-renderer-parity.md`

## Acceptance criteria

- Given a leaf of every USymbol, when measured, then the dimension comes
  from `calculateDimensionSlow`, not from a per-symbol table branch
- Given the ratchet, then `widened` is 0 and `conformant` **rises** — this
  change is expected to flip HEXAGON, PERSON, USECASE_BUSINESS, Shadowing,
  LineThickness and the `wrapWidth`/`guillemet` per-path fixtures
- Given each fixture that flips, then its backlog pin is deleted in THIS
  commit
- Given `dot-sync-report.ts`, then 262 / 90 / 708 EQUAL is unchanged —
  routing changes node DIMENSIONS, never graph STRUCTURE. A structural move
  means something else broke.
- Given the class ratchet, then 219/708 with zero widened is unchanged
- Given `tests/architecture/sizer-renderer-parity.test.ts`, then any
  `KNOWN_GAPS` entry this closes is DELETED (shrink-only), never moved to
  `SIZE_NEUTRAL`

## If a pin WIDENS — this is the important part

**Stop. Do not re-baseline, and do not revert-and-patch-around.** A widened
pin means the flat tables encoded a behaviour the routing lost. Per
`diagnosis.md`: state the mechanism — cause, `file:line`, causal chain, what
you ruled out — before any fix. That lost behaviour is exactly the kind of
accreted special case `CLAUDE.md` says is the deliverable; find it and carry
it across. If you cannot, STOP and report with the fixture and the numbers.

## Observability / Rollback

N/A — no new observable operations. Reversible: revert the commit and the
flat tables return. Take nothing else into this commit, so the revert is
clean and a bisect has one candidate.

## Quality bar

All four gates, plus the three ratchets. Expect file splits — the 500-line
cap and CCN 10 are enforced by a pre-commit hook, and `leaf-sizing.ts` has
already been split three times.
