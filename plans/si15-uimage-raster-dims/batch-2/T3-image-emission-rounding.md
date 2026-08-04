# T3 — round emitted `<image>` dims when raster-backed (D9 Amendment 1)

## Context

`plantuml-ts`. The jar MEASURES a rasterized sprite by its raw scaled dims
but EMITS `Math.round(natural × scale)` on the SVG `<image>` element —
jar-verified over 8 samples in commit `1406e139`, which fixed the
CLASS-engine emission site (`renderer-classifier-rows.ts`) and explicitly
flagged the description-engine site (klimt's shared `driver-image-svg.ts`)
as needing its own verification pass because it also serves `<img>` atoms.
SI14 T4 routed class usecase/actor labels through exactly that unrounded
path, pinning `image/@width` 3.2308 vs jar 3 and `@height` 2.1538 vs 2 on
`class-usecase-inline-sprite`. T1 (already landed) gave `UImage` optional
`rasterWidth`/`rasterHeight` — the raster-backed signal. ADR-2
(`plans/si15-uimage-raster-dims/decisions.md#adr-2`) is locked, including
what to do if the jar does not round `<img>` atoms.

## Task

1. **Jar-verify `<img>`-atom emission first.** Author a fixture whose
   usecase (or description) label carries an `<img:...>` data-URI atom at a
   font size producing non-integer scaled dims; generate its oracle golden
   (one file at a time: `java -DPLANTUML_DETERMINISTIC_TEXT=true -jar
   oracle/dist/plantuml-oracle.jar -tsvg <one.puml>`; a multi-file
   invocation returns the welcome page — misleading in both directions).
   Record what the jar emits for `image/@width`/`@height` vs the raw scaled
   product. Per CLAUDE.md the corpus is a starting point — authoring this
   fixture is required, not optional.
2. Implement per ADR-2: in `driver-image-svg.ts`, when the `UImage` carries
   raster dims, emit `Math.round(width)`/`Math.round(height)` for the
   `<image>` element's width/height attributes ONLY (never the x/y, never
   the measured dims). If step 1 shows the jar does NOT round `<img>`
   emission, narrow the gate to sprite-origin only (discrete flag threaded
   from `resolveSpriteAtom` per ADR-2) and journal the finding. If the
   jar's behaviour fits neither shape, STOP (stop condition 7).
3. Re-pin `class-usecase-inline-sprite` in
   `tests/oracle/svg-conformance/class-usecase-actor.test.ts` with measured
   values (`image/@width`/`@height` expected to clear; update the doc
   comment's residual narrative). Check in the new fixture + golden with a
   byte-exact (or pinned-diff) assertion following the existing pattern in
   that file.
4. Unit test: raster-backed image emission rounds; rasterless (latex)
   emission is byte-identical to pre-change output.

## Write-set

- `src/core/klimt/drawing/svg/driver-image-svg.ts`
- `src/diagrams/description/render-atoms.ts` (ONLY if the narrowed
  sprite-origin flag is needed per ADR-2's fallback)
- `tests/oracle/svg-conformance/class-usecase-actor.test.ts`
- New fixture `.puml` + golden under the existing authored-fixture layout
  (mirror how `class-usecase-inline-sprite`'s fixture is stored) + its test
- `tests/unit/core/klimt/driver-image-rounding.test.ts` (create)

## Read-set

- `plans/si15-uimage-raster-dims/decisions.md#adr-2`
- `git show 1406e139` (the D9 Amendment 1 commit message + diff)
- `plans/si5b-stdlib/decisions.md` § D9 Amendment 1
- `src/core/klimt/drawing/svg/driver-image-svg.ts` (whole — it is small)
- `scripts/oracle-corpus.ts#runOracle` (oracle invocation reference)

## Interface contracts

None consumed downstream; T5 re-verifies the pins this task sets.

## Acceptance criteria

1. Given `class-usecase-inline-sprite`, when rendered, then
   `image/@width` = 3 and `image/@height` = 2 (no longer pinned diffs).
2. Given the authored `<img>`-atom fixture, when compared to its fresh jar
   golden, then the emitted `image/@width`/`@height` match the jar's
   (whichever rounding shape the jar exhibits).
3. Given a latex atom, when emitted, then output is byte-identical to
   pre-change.
4. Given `npm test` + size-deltas, when run settled, then exit 0 and
   `widened 0` — description-engine sprite goldens may legitimately change
   ONLY where the jar golden agrees; any golden that moves AWAY from its
   jar golden is a failure.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint` exit 0.

## Boundaries

**Always:** jar-verify before implementing; round at the emission site
only. **Ask first:** touching any file outside the write-set; adding the
fixture to tracked corpus locations not listed above. **Never:** git
mutations; rounding in resolvers or measurement paths; scratch tests in
`tests/`.

## Observability

N/A.

## Rollback

Reversible — revert the commit.

## Commit

`fix(T3): round raster-backed <image> emission in the shared svg driver`
(body records the `<img>` jar-verification outcome; `Closes #26` goes on
this commit ONLY if T1's commit did not already carry it — the orchestrator
decides at commit time; exactly one commit in the mission closes the issue).
