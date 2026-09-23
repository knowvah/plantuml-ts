# cdd-T22 — USymbol leaves in class (circle interface eye + allow_mixing component)

## Dispatch points touched

- **Sizing**: `class-layout-helpers.ts#tryMeasureNonGenericClassifier` is
  the file the mission's read-set names as "layout.ts's leaf-kind dispatch
  section" — verified against the code, that's wrong: the actual dispatch
  table lives in `class-layout-helpers.ts`, a file OUTSIDE this task's
  write-set, and `class-layout-leaf-shapes.ts` already imports FROM it
  (`class-layout-helpers.js` -> `class-layout-leaf-shapes.js` for
  `measureUsecaseOrActor`/`measureLollipop`/`measureAssociationDiamond`),
  so importing `measureClassifier` back would be a circular import. Fix:
  added a new, small dispatch wrapper `measureLeaf` in `layout.ts` itself,
  at the ONE call site (`preMeasureClassifiers`) that invokes
  `measureClassifier` — `if (classifier.kind === 'circle') return
  measureCircleInterface(...); return measureClassifier(...);`. Zero
  change to `class-layout-helpers.ts`.
- **Render**: `renderer-usymbol-entity.ts#renderUsecaseOrActorEntity` (SI14
  T4) was ALREADY reachable infrastructure for usecase/actor, but its own
  `symbolKeyword` derivation (`classifier.kind === 'usecase' ? 'usecase' :
  'actor'`) hardcoded the two-case assumption. Generalized to
  `resolveSymbolKeyword`, function renamed `renderClassUSymbolEntity`
  (clarity — it now draws 4 kinds, not 2), and a new exported gate
  `usesClassUSymbolEntity` replaces the inline `isUsecaseOrActor` boolean
  that used to live in `renderer.ts`. `renderer.ts`'s dispatch site
  (flagged write-set extension, one-line: `if (usesClassUSymbolEntity(classifier)
  && geo.measurer !== undefined)`) needed no new branch, just a widened gate.

## Circle (E8) needed a NEW sizing function; component did not

`measureLeafNode`'s `'circle'`/`'interface'` case ALREADY existed
(`leaf-sizing.ts:124-135`, fixed `INTERFACE_CIRCLE_SIZE=18` regardless of
content) — E8 was purely a ROUTING gap, not a missing primitive. `component`
sizing ALSO already worked (`tryMeasureDescriptionLeaf` routes every
`kind:'descriptive'` usymbol except `actor` through `measureLeafNode`
generically) — cacoma's 9 structural diffs were 100% a DRAW-side gap
(`renderComponentIcon`, the hand-rolled string renderer in
`core/usymbol-shapes.ts`, never replaced for `component` the way SI14 T4
replaced it for usecase/actor). Fixing the render dispatch alone closed
cacoma to structural=0 — no sizing change needed for component at all.

## Ink extent: duplicated, not imported (precedent-following)

`measureCircleInterfaceInk` in `class-layout-leaf-shapes.ts` mirrors
`leaf-sizing-entity.ts#measureUsecaseOrActorLeafInk`'s exact "real
LimitFinder walk over a REAL EntityImageDescription instance" shape
(construct params with placeholder paint, `LimitFinder.create(bounder,
false)`, `new EntityImageDescription(params).drawU(finder)`, read
`getMinX/MinY/MaxX/MaxY`). Could not import that function directly (its
own symbol union is `'usecase' | 'actor'`, and its host file
`leaf-sizing-entity.ts` is outside this task's write-set) — duplicated the
~50-line pattern locally, citing the precedent
`renderer-usymbol-entity.ts#ENTITY_STROKE_WIDTH`'s own doc comment already
established ("Duplicated (not imported) — module-private in a file outside
this task's write-set").

## COMPONENT_ROUND_CORNER — a real, non-zero shape parameter

Unlike usecase/actor/circle (whose drawn shapes ALL ignore
`SymbolContext#getRoundCorner()`), `USymbolComponent2#drawComponent2` DOES
read it for the outer box. Reused `description/renderer-entity.ts
#ENTITY_ROUND_CORNER`'s value (5.0, halves to the jar's `rx="2.5"` at
serialization) by duplication (same "module-private, outside write-set"
reason), gated `roundCorner = symbolKeyword === 'component' ?
COMPONENT_ROUND_CORNER : 0`.

## Named, diagnosed remainder: the SvekNode "shield" DOT margin (NOT fixed this task)

After the routing fix, all 3 fixtures are `structural=0` (every child
element/attribute SET matches the jar exactly) but conija/niduni still
carry a small NUMERIC residual (conija Δ18 on the circle's own y/height;
niduni a uniform ~(4.85,3) document-wide shift from the SAME mechanism
cascading through a `left to right` graph's rank spacing). Root cause,
verified (not guessed):

- **Mechanism**: `EntityImageDescription.getShield()` (java:369-374, ported
  faithfully in `EntityImageDescription.ts:369-374`) returns a NON-ZERO
  `Margins` for a `hideText` shape (`circle`), sized off the label's own
  height (`y = max(1, dimDesc.height, dimStereo.height)`, ~14px for
  conija's "Does work now"). Upstream's `SvekNode.shield()`
  (`svek/SvekNode.java:220-227`) reads that value and
  `appendLabelHtml`/`appendTd` (`svek/SvekNode.java:243-267`) build the
  3-row/3-col DOT table with those margins as the TOP/BOTTOM (and
  LEFT/RIGHT) padding cells — confirmed byte-for-byte against
  `conija-14-nuta580/svek-1.dot`'s cached oracle: `HEIGHT="14.0"` top/bottom
  padding rows around the `WIDTH="18.0" HEIGHT="18.0"` icon cell.
- **Why this port doesn't reproduce it**: `measureCircleInterface` (this
  task) declares the DOT node as a plain `fixedsize:true` 18x18 box
  (`graph-layout-build.ts#addOneNode`'s default branch) since
  `resolveNodeShape`/`applyShapeAndPorts` (`class-port-rows.ts`) only ever
  set `node.isPort`/`node.shieldMargins` for the UNRELATED Kal-qualifier
  and member-port mechanisms — a `circle` classifier is neither, so it
  gets NO reserved margin at all. Jar's graphviz ranks around a
  ~46px-tall node (14+18+14); this port ranks around 18px, so everything
  downstream of the circle in the graph packs 18-28px too close, matching
  the observed deltas exactly.
- **Why not fixed here**: `graph-layout.ts` ALREADY has a fully-general
  reconciliation for exactly this "declared-vs-laid-out size differ"
  shape family — `portNodeSize`/`shieldCorner`
  (`graph-layout.ts:118-148`), keyed on `DotInputNode.shieldMargins`. The
  MECHANISM is generic (built for `class-kal.ts`'s qualifier margins), but
  WIRING a circle's `EntityImageDescription.getShield()` result into
  `node.shieldMargins` requires editing `class-dot-graph.ts
  #buildOneDotNode` (`class-port-rows.ts`/`class-kal.ts` also candidates) —
  ALL outside this task's write-set (`class-layout-leaf-shapes.ts`,
  `renderer-usymbol-entity.ts`, `layout.ts` only). Flagged as a follow-on:
  compute `EntityImageDescription.getShield()` at DOT-node-build time for
  any `hideText`-eligible leaf (`circle`, and potentially any future
  `descriptive` usymbol whose SName resolves to `USymbols.INTERFACE`) and
  set `node.shieldMargins` from it, reusing the EXISTING generic
  reconciliation rather than adding a new one.
- **cacoma's own tiny residual** (1px `svg/@width`, no Y at all — cacoma
  has no `circle`) is UNRELATED to the above (different mechanism, since
  cacoma's structural=0 achieved with ZERO sizing change) — not diagnosed
  further this task; likely a pre-existing minor rounding difference
  somewhere in the usecase/actor/component width composition, out of
  scope for a fixture this task only needed to reach structural=0 on.

## Write-set extensions (flagged)

- `renderer.ts`: one-line dispatch-condition widen (line ~403), replacing
  the old 2-line `isUsecaseOrActor` inline boolean with a call to the new
  exported `usesClassUSymbolEntity`. Net effect: renderer.ts SHRANK by 1
  line (523 vs baseline 524) — no line-cap growth.
- `docs/catalog.md`: regenerated (`npm run catalog`) — new exports
  `measureCircleInterface`, `usesClassUSymbolEntity`,
  `renderClassUSymbolEntity` (renamed from `renderUsecaseOrActorEntity`).
- New test file `tests/unit/class/class-circle-usymbol-routing.test.ts`
  (not an edit to the pre-existing SI10-scoped
  `class-usecase-actor-routing.test.ts`, which stays untouched) — mirrors
  that file's own "hand-built literal + real-run pinned numbers" pattern.

## layout.ts / renderer.ts line-cap notes

`layout.ts` baseline was 486 (under the 500 cap, so growth was bounded by
the ABSOLUTE cap, not the directional "already over, don't grow" rule).
The new dispatch function is named `measureLeaf` (not `measureOneClassifier`)
specifically because the longer name pushed its ONE call site over
Prettier's 120-char `printWidth`, exploding a 1-line call into 7 lines —
naming discipline here is load-bearing for the line-cap, not just style.
Final: exactly 500 lines.
