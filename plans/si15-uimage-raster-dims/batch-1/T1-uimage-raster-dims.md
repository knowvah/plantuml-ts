# T1 — `UImage` raster-pixel dims + guarded `Footprint.drawImage`

## Context

`plantuml-ts`, a TypeScript port of PlantUML. `~/git/plantuml` is the
canonical spec; `oracle/dist/plantuml-oracle.jar` the pinned oracle. Tests:
vitest (`npm test`). This task lands the fix for GH #26, whose mechanism is
FULLY diagnosed — read `.agent-notes/si14-ry-delta.md` first; do not
re-derive it. Summary: `Footprint.MyUGraphic.drawImage`
(`src/core/svek/image/Footprint.ts:107-112`) records ellipse-fit corner
points from `UImage.getWidth()/getHeight()`, which return the
declared/scaled placement dims; upstream `UImage.java:87-92` returns the
rasterized image's native pixel count − 1. Substituting W=2,H=1 for the 3×2
sprite reproduces the jar's rx=48.968/ry=13.0625 to 5 decimals.

## Task

Implement ADR-1 (`plans/si15-uimage-raster-dims/decisions.md#adr-1` — read
it; the fallback semantics there are LOCKED and deliberately differ from the
diagnosis note's proposal):

1. `UImage.ts`: optional `rasterWidth`/`rasterHeight` in `UImageFields`,
   threaded through `build` (keep the existing 3-arg call sites compiling —
   an optional 4th options/param or a second builder; match upstream naming
   where a name exists). Add accessors. Update the class doc comment: the
   two-notion split now mirrors upstream's declared-vs-raster distinction;
   cite `UImage.java:87-92` with a `@see`.
2. `render-atoms.ts`: `ResolvedAtomImage`'s `image` variant gains optional
   `rasterWidth`/`rasterHeight`. `resolveSpriteAtom` (monochrome branch
   only) populates them with the sprite's native GRID dims
   (`sprite.width`/`sprite.height` — one pixel per grid cell; the PNG raster
   is grid-resolution, scale stretches only SVG placement attrs).
   `resolveImgAtom` populates them with the data URI's IHDR dims (already
   parsed — see `creole-atoms.ts:358` / `measureInlineAtom`'s `img` branch:
   declared = IHDR × scale, raster = IHDR). `resolveSvgSpriteAtom` is NOT
   touched (drawable/ink-box path, no raster).
3. Thread `resolved.rasterWidth/rasterHeight` into every
   `UImage.build(resolved.width, ...)` call site for `kind === 'image'`:
   `EntityImageDescriptionTextBlock.ts:287,294` (`drawAtoms`) and
   `EntityImageDescriptionDelegates.ts` (the `descAtomOps` `drawU` image
   branch, ~line 195). The latex branches (`AtomMath.ts`,
   `drawAtoms`/delegates latex arms) stay rasterless — do NOT touch them.
4. `Footprint.ts#drawImage`: when raster dims are present use
   `rasterWidth − 1`/`rasterHeight − 1` for the corner points; otherwise
   keep the declared dims EXACTLY as today (no −1). Cite
   `Footprint.java:141-146` + `UImage.java:87-92`.
5. Re-pin `tests/oracle/svg-conformance/class-usecase-actor.test.ts`'s
   `class-usecase-inline-sprite` expected diffs with the values you MEASURE
   after the fix, and rewrite the doc comment to record what closed and what
   remains. Predicted (verify, don't assume): `ellipse/@rx`/`@ry`/`@cx`,
   `image/@x`, `text/@x`, and the viewBox/width entries clear or shrink;
   `image/@width`/`@height` (rounding, T3's job) and `image/@y`/`text/@y`
   (descent approximation, out of scope) survive. If cx/text-x do NOT clear,
   report the measured values honestly — the diagnosis rated that leg MEDIUM
   confidence.
6. New `tests/unit/core/svek/footprint-raster-dims.test.ts`: unit-prove
   (a) raster-backed UImage → corners at raster−1, (b) rasterless UImage →
   corners at declared dims (current behaviour preserved), (c)
   `resolveSpriteAtom` monochrome result carries grid dims and
   `resolveImgAtom` carries IHDR dims.

## Write-set

- `src/core/klimt/shape/UImage.ts`
- `src/diagrams/description/render-atoms.ts`
- `src/core/svek/image/Footprint.ts`
- `src/core/svek/image/EntityImageDescriptionTextBlock.ts`
- `src/core/svek/image/EntityImageDescriptionDelegates.ts`
- `tests/oracle/svg-conformance/class-usecase-actor.test.ts`
- `tests/unit/core/svek/footprint-raster-dims.test.ts` (create)

## Read-set

- `.agent-notes/si14-ry-delta.md` (whole — the diagnosis)
- `plans/si15-uimage-raster-dims/decisions.md#adr-1`
- `~/git/plantuml/.../klimt/shape/UImage.java:80-100`
- `~/git/plantuml/.../svek/image/Footprint.java:135-150`
- `src/core/creole-atoms-measure.ts:27-60` (declared-dims formulas)
- `tests/unit/description/footprint-parity.test.ts:1-70` (context only — it
  uses an SVG sprite → `drawPath`, so its expectations must NOT move; if
  they do, stop: your change leaked outside `drawImage`)

## Interface contracts

Consumed by T3/T4: `UImage` exposes the raster dims (accessor pair
returning `number | undefined`), and `ResolvedAtomImage.image` carries
`rasterWidth?: number; rasterHeight?: number`. Keep names exactly
`rasterWidth`/`rasterHeight`.

## Acceptance criteria

1. Given the 3×2 monochrome sprite fixture (`class-usecase-inline-sprite`),
   when rendered, then `ellipse/@rx` = 48.968 and `@ry` = 13.0625 within
   the comparator's 0.01 tolerance.
2. Given a rasterless `UImage` (latex path), when footprint-measured, then
   corner points are byte-identical to pre-change behaviour.
3. Given `npm test`, when run on the settled tree, then exit 0 — including
   `footprint-parity.test.ts` UNCHANGED and all 449 goldens byte-identical
   except the explicitly re-pinned fixture.
4. Given `npx jiti scripts/measure-description-size-deltas.ts`, when run,
   then `widened 0` (conformant count may rise).

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint` all exit 0 before
finishing. Run targeted suites while iterating; the orchestrator runs full
gates after the batch settles.

## Boundaries

**Always:** measure re-pinned values from actual output; keep upstream
names. **Ask first:** any edit outside the write-set (stop condition 1).
**Never:** git mutations (read-only `git show` ok); scratch test files in
`tests/` (use the session scratchpad); touching latex/`resolveSvgSpriteAtom`
paths; rounding anything at the resolver (that is T3's emission-site job).

## Observability

N/A — no new observable operations; gates are the observability.

## Rollback

Reversible — revert the commit.

## Commit

`fix(T1): footprint measures raster images by native pixel count minus one`
(orchestrator commits; body cites GH #26 and the diagnosis note).
