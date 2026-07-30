# T13 — Port `UPath.affine`/`rotate` and thread the transform through

**Inserted 2026-07-30**, after Batch 2 and before Batch 3, on a maintainer
ruling. Not in the original brief. Unblocks T8.

## Context

T6 accumulates the `<g transform=…>` stack correctly — and nothing applies
it to path geometry. Two independent causes:

1. `parseSvgPath(d, translate: UTranslate)` takes a translate. The overload
   upstream actually consumes is `SvgPath#toUPath(XAffineTransform at)`,
   which bakes the whole matrix in **at parse time**. T1 ported that
   overload's logic with an identity scale because no `XAffineTransform`
   existed when it ran.
2. `UPath.affine`/`rotate` and `USegment.affine`/`rotate` are unported.
   `UPath.ts:31` and `:91` give the reason: *"both require
   `XAffineTransform`, not part of this port's geometry surface."*
   **T3 created `XAffineTransform` in Batch 1 — that blocker is stale.**
   T8's `drawEllipse` calls `path.affine(...)` directly.

Reach: archimate has 63 `transform=`, **including this mission's own
`sprite-svg-archimate-0` golden**. Bootstrap has 1, so `bootstrap-0` /
`ruziru-69-xixo434` — the mission objective — are unaffected either way.
Stdlib-wide: 18,241.

## Task

Port the four Java methods and thread the accumulated transform into
`drawPath`.

| Java | Lines | Target |
|---|---|---|
| `klimt/geom/USegment.java#rotate` | ~10 | `src/core/klimt/shape/UPath.ts` |
| `klimt/geom/USegment.java#affine` | ~20 | same |
| `klimt/UPath.java#rotate` | ~7 | same |
| `klimt/UPath.java#affine` | ~7 | same |

`XAffineTransform` (in `src/core/klimt/UGraphicWithScale.ts`) is missing two
members these need: a **static `getRotateInstance(theta)`** and a
**point-transform** (upstream: `XPoint2D#transform(XAffineTransform)`). Add
them there; both are real upstream members, not inventions.

## Preserve this exactly — it is load-bearing

`USegment.affine` throws `UnsupportedOperationException` for any non-`SEG_ARCTO`
segment whose `coord.length != 2`. **Cubic segments cannot be affine-
transformed upstream.** That is precisely why `drawPath` bakes the transform
in at parse time instead of calling `affine`. Port the throw; do not
"generalise" `affine` to handle cubics. CLAUDE.md: do not refactor while
porting, and an odd-looking branch is usually load-bearing.

## Write-set

- `src/core/klimt/shape/UPath.ts` — add `USegment.rotate`/`affine`,
  `UPath.rotate`/`affine`; update the two deferral notes (`:31`, `:91`) to
  record that they are now ported rather than deleting the reasoning
- `src/core/klimt/UGraphicWithScale.ts` — add `XAffineTransform
  .getRotateInstance` + the point transform
- `src/core/klimt/sprite/SvgPath.ts` — `parseSvgPath` accepts the transform
- `src/core/klimt/sprite/SvgNanoParser.ts` — pass `ugs.getAffineTransform()`
  into `drawPath`; delete the doc-comment note recording the gap
- tests under `tests/unit/...` only (never colocated in `src/`)

## Hard constraint on `parseSvgPath`'s signature

Add the transform as an **optional third parameter**:

```ts
parseSvgPath(d: string, translate: UTranslate, at?: XAffineTransform): UPath
```

defaulting to identity. `svg-path-bbox.ts:53` calls it with two arguments
and **must keep compiling untouched**, because its 46 passing tests are
ADR-1's equivalence evidence (README stop condition 7). Changing the
signature so `pathBBox` has to change destroys that proof.

## Acceptance criteria

1. Given a `<g transform="translate(4,2)">` wrapping a `<path>`, when
   drawn, then the emitted geometry is offset by exactly (4,2).
2. Given a `<g transform="scale(2)">`, when drawn, then coordinates double.
3. Given nested `<g>` elements, when drawn, then the transforms compose in
   upstream's order.
4. Given a cubic segment and `USegment.affine`, then it throws — pinned by a
   test asserting the throw, not worked around.
5. Given `svg-path-bbox.ts` and its tests, then both are **unmodified** and
   still pass.
6. Given the 389 SVG goldens and the size-delta script, then byte-identical
   and zero widened. Nothing emits `drawable` until T9, so rendered output
   must not move.

## Quality bar

All four gates exit 0. SVG goldens 310/22/57 byte-identical.
`npx tsx scripts/measure-description-size-deltas.ts` exits 0.

## Method rules

1. Trace dependency cascades TWO levels before ruling on scope.
2. **Verify any "already fixed / blocked / deferred" claim against the
   CURRENT call graph.** This whole task exists because a deferral note's
   stated blocker had silently become false.

## Commit

One commit: `feat(T13): port UPath.affine/rotate and thread the transform`
