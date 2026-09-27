# cdd3-T33 — crow's-foot closest side (C-11)

## Mechanism

`SvekEdge#getExtremitySimplier` (`SvekEdge.java:544-546`) resolves the
crow's-foot `side` from the contact node's rect
(`nodeContact.getRectangleArea().getClosestSide(center)`); this port always
passed `side = null`, so `ExtremityCrowfoot#drawU`'s NORTH/SOUTH/EAST/WEST
wing-endpoint clamp never fired.

## What was ported

- `RectangleArea#getClosestSide` (`klimt/geom/RectangleArea.java:209-227`)
  as `getClosestSide` in new `src/core/svek/extremity/closest-side.ts`
  (rect shape adapted to this port's `{x,y,width,height}` convention
  instead of Java's `minX/minY/maxX/maxY` fields — same four edges).
- `place()` (`src/core/svek/svek-edge-extremity.ts`) now takes an optional
  `side: Side | null = null` param, forwarded unchanged to
  `factory.createUDrawable`. Default preserves the pre-existing `null`
  behavior for every OTHER call site (`SvekEdge.ts`'s
  `placeTailExtremity`/`placeHeadExtremity`, `state/renderer-arrowhead.ts`)
  — confirmed `state` never reaches `CROWFOOT` at all (grep), so this is a
  zero-risk default, not a scope call.
- `EdgeGeo` gained two OPTIONAL fields, `sourceContactId`/`targetContactId`
  (`class-geo-types.ts`), set in `class-edge-geo.ts#buildEdgeGeos` from the
  SAME `startId`/`endId` locals `normalizeEdgePoints`'s `matchesFromTo`
  already computes for `sourceDecor`/`targetDecor` pairing — no new
  direction-tracking logic, just carrying an existing value one field
  further. Made optional (not required, unlike `from`/`to`) specifically so
  no OTHER file that builds an `EdgeGeo` literal (~20+ across src/tests,
  several owned by concurrently-running T16 — `class-assoc-couple.ts`,
  `class-dot-edges.ts`) needed touching; verified those files build
  decor-record types, not full `EdgeGeo` literals, so this was a false
  alarm on first grep but the optional design was the right call regardless
  (D4 discipline: never force an edit into a concurrent task's file).
- `renderer-arrowhead-contact.ts` (new): `resolveContactSide` — the
  `nodeContact != null` branch, i.e. rect lookup + `getClosestSide`, or
  `null` when the contact id has no resolvable rect (a namespace/cluster
  endpoint or `Class::member` port — same degenerate case upstream's
  `bibliotekon.getNode(...)` returning non-`SvekNode` produces).
- `renderer.ts` builds `contactRects` (`classifierId -> ClassifierGeo`)
  once per diagram from `classifiers` (already `scaleClassGeometry`-scaled,
  same pass as `geo.edges`, so no unit mismatch with `EdgeGeo.points`) and
  threads it through `RenderEdgeContext` -> `renderer-edge.ts#renderEdge`
  -> `buildEdgeArrowheads`'s new `EdgeArrowheadOptions.contactRects`.
- Side is resolved from the PRE-Kal contact point (`edge.points[0]`/
  `.at(-1)`), matching `SvekEdge.java:544-546` running BEFORE `:548-554`'s
  Kal translate — verified this distinction matters in principle (Kal
  boxes exist on other fixtures) even though medosa itself carries none.

## Scope decision — `edgeExtremityInk`/`class-ink-dot-path.ts` NOT touched

Two other `place()` call sites in the class engine were left at the
default `side=null`:

- `class-ink-dot-path.ts#drawnEdgePoints` — only reads `PlacedExtremity
  .trim`, which is `decorTrim(angle, getDecorationLength())`, independent
  of `side` (crowfoot's `getDecorationLength()` is the fixed `8`). Side
  cannot affect this call site's output at all — not a scope gap.
- `renderer-arrowhead-ink.ts#edgeExtremityInk` — DOES draw the extremity
  shape (ink/canvas-sizing walk) and so COULD be affected by the wing
  clamp. Left unfixed: medosa's own canvas dims (`222x178`) already
  matched the jar BEFORE this fix (the pre-fix diff was 4 numeric-only
  line diffs, no `viewBox`/width/height divergence), so there is no
  OBSERVED ink-extent defect to fix (diagnosis.md: fix observed defects,
  don't invent unrequested ones). Flagged as a residual gap below.

## Measurement

- `render-diff.mts medosa-71-ligu412`: `pass=true structural=0 numeric=0`
  (was `numeric=4`).
- Isolated before/after `render-all.mts` (captured on THIS branch tip,
  12cf39ed + prior batch work, NOT the stale `b1.json` mission snapshot
  which predates several already-merged tasks and would have
  over-attributed their fixes to this one): exactly ONE class-engine
  mover, `medosa-71-ligu412 structural-match -> conformant`. Zero other
  movers, zero regressions, zero rises.
- Cross-engine surveys (`svek/extremity` is shared code) — isolated
  before/after on THIS branch, object/component/usecase/state: 0 movers
  each. `unknown` bucket: 1 mover, `venofe-94-vopu657 structural-match ->
  conformant` — confirmed via its `.puml` source (`foo1 --{ bar1` etc,
  same crowfoot mechanism, routed through the generic/unknown engine
  rather than `class`). A real, expected second close from the same fix,
  not a regression.
- The `/tmp/cdd3-b0-eng/parity-*.json` (T0 mission baseline) comparison
  additionally showed `lecali-51-funo316` (object) and `kokebo-27-vafi688`
  (component) as movers — verified BOTH were already `conformant` in my
  OWN pre-task snapshot (i.e., closed by unrelated work merged onto this
  branch between T0 and my start), not by this fix. Excluded from the
  reported movers for that reason — the isolated before/after pair is the
  correct measurement for what THIS task changed.

## Complexity-hook splits (pre-authorised, pure moves, all re-exported)

Adding `side`/`contactRects` threading pushed two already-large files over
the 500-line hook cap:

- `renderer-arrowhead.ts` (502 -> would grow further): moved the whole
  mid-link-decoration block (`MiddleDecorCtx`/`drawMiddleDecorShape`/
  `buildMiddleDecorMarkup`) to new `renderer-arrowhead-middle.ts`,
  re-exported `buildMiddleDecorMarkup` — no consumer import path changed.
- `renderer-edge.ts` (524, ALREADY over cap before this task touched it):
  moved `arrowLabelTextAttrs`/`magicArrowPolygon`/`renderEdgeMainLabel`/
  `renderEdgeSingleLabel` to new `renderer-edge-label.ts`, re-imported the
  three still used locally. Also extracted `resolveStrokeAndArrowheads`
  (new, in `renderer-edge.ts`) to keep `renderEdge` itself under the
  30-NLOC function cap after adding the `contactRects` line.
- `docs/catalog.md` regenerated (`npm run catalog`) for the 3 new/renamed
  files this split set introduced.

## Gates

`npm run typecheck` / `npm run lint` / `npm run build` — all clean.
`npm test` — 827 passed / 5 failed (the five pre-documented
symlinked-worktree stdlib/sprite failures: stdlib-packages,
stdlib-all-exports, stdlib-package-files, sprite-package-files,
stdlib-remote-e2e); `tests/architecture/catalog.test.ts` green after
`npm run catalog`. `tests/oracle/class-dot-parity.test.ts`: 721/721.

## Residual / follow-on (not fixed here, out of this task's evidenced scope)

`renderer-arrowhead-ink.ts#edgeExtremityInk` (layout-time canvas-sizing
ink walk) still calls `place()` with no `side` — a crow's-foot decor's ink
footprint at LAYOUT time (before `renderer.ts`'s `contactRects` map
exists) could, in principle, differ from its RENDER-time footprint for a
fixture where the side clamp changes the wing bounding box asymmetrically
enough to move canvas dims. No corpus fixture currently evidences this (see
Scope decision above); flagging for a future pass if a canvas-size diff
with a crowfoot edge surfaces.

## Report (fix-task.md §Report)

**Fixtures closed:** `medosa-71-ligu412` S0/N4 -> S0/N0 (target).
**Fixtures improved (incidental, same mechanism):**
`venofe-94-vopu657` structural-match -> conformant (unknown-engine bucket).
**Fixtures unmoved:** none observed in the isolated before/after sweep
(object/component/usecase/state: 0 movers; class-engine render-all: 1
mover, medosa only).
**Movers with mechanisms:** both movers above are C-11 (crow's-foot
`getClosestSide` wiring) — no other mechanism involved.
**Open artifacts:** the `edgeExtremityInk` residual noted above (no
tracked issue filed — unevidenced, informational only).
**Commit:** see `git log -1` on `wt/cdd3-T33` (this note is committed in
the same commit).
