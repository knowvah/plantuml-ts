# T5 — Re-express `pathBBox` over `UPath`

## Context

See [`../README.md`](../README.md) for the mission mechanism (jar-verified).

`svg-path-bbox.ts` (179 lines) tokenizes an SVG path `d` and folds it into a
bounding box, discarding the segments. Upstream has no such function: it
parses `d` → `UPath` via `SvgPath`, and `UPath` carries BOTH the segments
(for drawing) and the minmax (the box) — see `UPath.addInternal`.

T1 has now built that parser. This task removes the duplicate.

## Task

Re-express `pathBBox` in `src/core/klimt/sprite/svg-path-bbox.ts` over T1's
`parseSvgPath` + `UPath.getMinX/getMaxX/getMinY/getMaxY`. Keep the exported
`pathBBox` signature and `PathBox` type exactly as they are — callers
(`SpriteSvg.ts#svgInkBox`) must not need changes.

## Write-set

- `src/core/klimt/sprite/svg-path-bbox.ts` (modify)

The existing `svg-path-bbox` test file is **read-only in this task** — see
Boundaries.

## Read-set

- `src/core/klimt/sprite/svg-path-bbox.ts` (all 179 lines) — especially the
  doc comment `:1-32`, which records exactly why the box is the
  control-polygon box and not a true-extrema box
- `src/core/klimt/sprite/SvgPath.ts` — T1's output
- `src/core/klimt/shape/UPath.ts:141-149` — `addInternal`'s minmax rule, and
  `:225-238` for the getters
- `src/core/klimt/sprite/SpriteSvg.ts:72-93` — `svgInkBox`, the only caller
- `plans/s1l-leaf-sizing/ledger.md` § S1L-k — the jar measurements this
  reproduces

## Architecture decisions (locked)

- [ADR-1](../decisions.md#adr-1). The equivalence is provable, not hopeful:
  `UPath.ts:141-149` already implements the exact rule `svg-path-bbox.ts:1-32`
  documents — `SEG_ARCTO` contributes ONLY its endpoint, every other segment
  contributes every coordinate pair including Bézier control points. Same
  rule ⇒ same numbers.

## Interface contract

Unchanged, deliberately:

```ts
export interface PathBox { minX; minY; maxX; maxY }
export function pathBBox(d: string): PathBox | undefined;
```

## Acceptance criteria

1. Given the existing `pathBBox` test suite, when run against the new
   implementation, then **every test passes unmodified**. This IS the proof
   of ADR-1's equivalence.
2. Given `bi-globe`'s path data, when boxed, then the result is bit-identical
   to the pre-change implementation (capture before/after in the journal).
3. Given `SpriteSvg.ts#svgInkBox`, when unchanged, then it still compiles and
   produces identical ink boxes.
4. Given the 389 SVG goldens and the description size-delta script, then
   byte-identical and zero widened respectively.
5. Given a path with no drawable commands, then `undefined` — the existing
   contract.

## Quality bar

All four gates exit 0. SVG goldens 310/22/57 byte-identical.
`npx tsx scripts/measure-description-size-deltas.ts` exits 0.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible** — revert the commit; `pathBBox`'s signature is unchanged so no
caller churns.

## Boundaries

**Always:** preserve the doc comment's explanation of why this box is the
control-polygon box; update it to say the rule now lives in `UPath` rather
than deleting the reasoning.

**Never — this is a STOP:** modify, relax, or delete any existing `pathBBox`
test to make the new implementation pass. That suite is the evidence. If a
test fails, the new implementation is wrong, or you have found a real
divergence between `UPath.addInternal` and the old fold — either way,
journal it and STOP. Do not adjust the test.

**Never:** change `pathBBox`'s exported signature, or "improve" the box to
compute true curve extrema. The jar's own numbers depend on the
control-polygon granularity (see CLAUDE.md's `simulateCompound` precedent).

## Method rules

1. **Trace two dependency levels** — enumerate `pathBBox`'s callers, then
   THEIR callers, before declaring the signature safe to keep.
2. **Verify any "already fixed" claim against the CURRENT call graph.**

## Commit

One commit: `refactor(T5): express pathBBox over UPath's own minmax`
