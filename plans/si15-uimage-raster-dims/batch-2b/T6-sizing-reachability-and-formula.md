# T6 — raster dims reach the sizing path; formula = Math.round(declared)

## Context

`plantuml-ts`, branch `feature/si15-uimage-raster-dims` (T1/T2/T3 landed).
T4's diagnosis (`.agent-notes/si15-ink-offset.md` — read it first) found
two gaps in T1:

1. **Reachability.** `src/diagrams/description/leaf-sizing-entity.ts:61-72`
   (`sizingAtomImageResolverFor`) resolves monochrome sprites at SIZING
   time with a rasterization-free fallback (`href: ''`) that omits
   `rasterWidth`/`rasterHeight`, so `Footprint.MyUGraphic.drawImage`'s
   raster branch never fires on the description-engine sizing path
   (`measureUsecaseOrActorLeaf` → `Footprint#getEllipse`). The class-engine
   path works (T1's cleared rx/ry); the sizer path silently kept the old
   behaviour — the recurring sizer/renderer gap.
2. **Formula.** T1 populated raster dims with the RAW grid (sprite) / IHDR
   (img) values. The jar's actual PNG raster is resampled:
   `Math.round(native × scale)` — proven by IHDR-decoding the oracle's own
   emitted PNG for a 16×16 grid sprite at scale 14/13 → **17**px, and by
   T4's controlled experiment (patching raster to 17 reproduces the jar on
   BOTH orderings to ~1e-3px). SI14's 3×2 fixture matched only because
   `round(3.2308)=3` coincides with the grid. Note the convergence: this is
   the SAME `Math.round(natural × scale)` D9 Amendment 1 jar-verified for
   emission — the raster IS what gets emitted.

## Task

1. In `render-atoms.ts`, change both resolvers' raster fields to the
   rounded scaled value: sprite → `Math.round(dims.width)`/
   `Math.round(dims.height)` (declared dims are already `grid × scale`);
   img → `Math.round(dims.width)`/`Math.round(dims.height)` (declared =
   IHDR × scale). Update the doc comments citing T4's IHDR-decode evidence.
2. In `leaf-sizing-entity.ts`'s `sizingAtomImageResolverFor`, populate the
   same rounded raster dims on the monochrome fallback object (cheap grid
   lookup — do NOT add rasterization to the sizing path).
3. Update `tests/unit/core/svek/footprint-raster-dims.test.ts` and
   `tests/unit/creole-img-render.test.ts` expectations for the new formula
   (the 2×2 scale-1 cases are unchanged: round(2)=2). Add cases at a
   rounding boundary (e.g. 16×16 grid at font 14 → raster 17) for both the
   resolver output and the Footprint corner points, and one asserting the
   sizing resolver's fallback now carries raster dims.
4. Re-measure and re-pin as needed:
   - T4's probe inputs (reconstruct from the note; probes stay in the
     scratchpad): both orderings should now match the jar (~1e-3).
   - `class-usecase-inline-sprite` + `class-usecase-inline-img` pins
     (expected unchanged — round(3.23)=3 etc.; verify, don't assume).
   - Size-deltas: `widened 0`; report whether the sprite bucket (5) moves.

## Write-set

- `src/diagrams/description/leaf-sizing-entity.ts`
- `src/diagrams/description/render-atoms.ts`
- `tests/unit/core/svek/footprint-raster-dims.test.ts`
- `tests/unit/creole-img-render.test.ts`
- `tests/oracle/svg-conformance/class-usecase-actor.test.ts` (only if pins
  measurably move)

## Read-set

- `.agent-notes/si15-ink-offset.md` (whole — the diagnosis)
- `plans/si15-uimage-raster-dims/decisions.md` (ADR-1/ADR-2)
- `src/core/svek/image/Footprint.ts#drawImage` (consumption — do not edit)
- `src/core/klimt/drawing/svg/driver-image-svg.ts` (T3's rounding — do not
  edit; note it rounds the DECLARED dims at emission, which equals the
  raster by construction after this task)

## Acceptance criteria

1. Given T4's 16×16 ink-offset probe, when fit post-change, then BOTH
   orderings match the fresh jar oracle within ~1e-2px.
2. Given the boundary case (grid 16, scale 14/13), when resolved, then
   rasterWidth = 17 (not 16), and Footprint corners use 16 (raster − 1).
3. Given `npm test` + size-deltas, when run settled, then exit 0 and
   `widened 0`.
4. Given `class-usecase-inline-sprite`/`-img` pins, when re-run, then
   values match what is checked in (or are re-pinned with measured values
   and a doc-comment note).

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint` exit 0.

## Boundaries

**Always:** measure before re-pinning; probes in the scratchpad. **Ask
first:** any file outside the write-set. **Never:** git mutations;
rasterization on the sizing path; editing Footprint/driver.

## Observability

N/A.

## Rollback

Reversible — revert the commit.

## Commit

`fix(T6): raster dims reach the sizing path; raster = round(scaled dims)`
