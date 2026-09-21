# T6 — edge geometry (direction, visibility icon, note box, constraint, quantifier)

## A5/M5's trigger is a DESYNCHRONISED id, not `nodeCenter`'s namespace lookup

The report's hypothesis (`diagnosis/A5-geometry.md` M5, MEDIUM-LOW) was
"`nodeCenter(posMap, anchors, idEntityNFullId)` misses for
namespace-qualified ids". **Instrumentation disproves it.** Logging
`(dotSwap, c1===undefined, c2===undefined, normal, inversed)` on
`delano-03-xino845`'s two inheritance edges printed:

```
{"i":0,"from":"issues.Rabbit","to":"f1.function.Fox","dotSwap":true,
 "id1":"f1.function.Fox","id2":"Rabbit",
 "c1undef":false,"c2undef":true,
 "posKeys":["f1.AbstractSet","f1.function.Fox","issues.Rabbit","issues.Dog"],
 "anchorKeys":[]}
{"i":1,"from":"issues.Dog","to":"f1.AbstractSet","dotSwap":true,
 "id1":"f1.AbstractSet","id2":"Dog","c1undef":false,"c2undef":true, ...}
```

`c1` — the THREE-segment namespace-qualified `f1.function.Fox` — resolves
fine. `c2` misses because `idEntity2FullId` is the **bare, unqualified**
`Rabbit` while `posMap` is keyed by `issues.Rabbit`. `anchors` is empty, so
anchor substitution is not involved either.

The parser stamps `idEntity1FullId`/`idEntity2FullId` from the RAW
arrow-token ids (`class-relationship-field-builder.ts:45`,
`pickDirectional(info.upOrLeft, left.id, right.id)`) BEFORE
`class-command-relationships.ts:107-113` rewrites the endpoints through
`resolveRelationshipEndpoint`. Inside a `namespace`/`package`, or with an
`as "alias"` declaration, the two disagree permanently.

**This is the same defect class B6 hit and T1/B33 already solved once** —
`class-dot-edge-order.ts#dotEdgeRunsReversed`'s own doc comment records it
verbatim ("28 of the 32 fixtures in `direction-backlog.json` were that
bug"). Anything that needs upstream's `cl1`/`cl2` pair must read
`Relationship.dotEdgeReversed` against `from`/`to`, never compare the
FullId pair. `normalizeEdgePoints` was the one remaining site that did not.

### Consequence for later tasks

- `idEntity1FullId`/`idEntity2FullId` are safe ONLY as opaque
  `<path id=...>` inputs and for `class-dot-graph.ts`'s own
  pre-resolution bookkeeping. Never look a laid-out node up by them.
- `nodeCenter` itself is fine; it needs no namespace logic.

## `EdgeGeo`'s new fields must be added to `shiftEdgeGeo`

`layout.ts#shiftEdgeGeo` translates every absolute coordinate on an edge by
the ink shift. A new positional field that is not listed there silently
stays at the pre-shift origin. Measured, not assumed: `visibilityIcon` sat
9px left and 7px high of its jar position until `shiftEdgeExtras` existed,
while `label` (already listed) was exact. Add every new coordinate-bearing
`EdgeGeo`/`NoteGeo`/`ClassifierGeo` field to its shift function in the same
commit that introduces it.

## A2a/M9 is blocked behind a DOT label-placement gap, not behind its own math

`constraint on links` geometry is implemented per `SvekEdge.java:994-1012`
+ `LinkConstraint.java:82-103` (`class-edge-constraint.ts`), but it cannot
fire on `gujigi-63-roki030`, the corpus's only constrained fixture.

`class-layout-edge-labels.ts:370-375` reserves the 10x10 `CONSTRAINT_SPOT`
as `{ label: '', labelWidth: 10, labelHeight: 10 }`. Only `label` reaches
the layout engine (`graph-layout-build-edges.ts:124-128`; `labelWidth`/
`labelHeight` are the Svek-DOT *emitter*'s fields), and an EMPTY label
string gets no placement — measured on gujigi's own layout result:

```
edge-1 (label "underarkiv") labelX=132.574988
edge-0 (label "")           labelX=undefined
edge-2 (label "")           labelX=undefined
```

`SvekEdge.java:995-996` anchors the constraint square at
`labelXY.getPosition()`, so with no position there is no square, no sampled
point, and the pair never completes. Upstream does not hit this: it passes
an HTML `TABLE` of the 10x10 dimension as the label, so graphviz reserves
real space for it.

Fixing it means feeding a SIZED label (the `labelBoxWidth`/`labelBoxHeight`
FIXEDSIZE seam the state composite pipeline already uses) for a
constraint-spot edge — which MOVES the DOT input, forbidden for this
render-only batch by `decisions.md` D2. Filed as a follow-on; the geometry
is in place and will populate the moment the spot has a position.

Related: the jar emits a dashed `<line>` in BOTH links of a constrained
pair (`gujigi` `lnk10`/`lnk11`, `lnk12`/`lnk13`), each starting at its own
link's sampled corner. A literal reading of `LinkConstraint#drawMe`'s
`x2 == 0 && y2 == 0` early return predicts exactly one. `attachConstraints`
ports the OBSERVED behaviour (both ends stamped, own point first); the
mechanism behind the second emission is not yet isolated.

## Measured facts worth not re-deriving

- `dashed` reaches NO DOT attribute in this port: 0 of 723 emitted layout
  graphs contain the token, and 0 of the jar's captured `svek-*.dot` files
  contain `style=dashed`. A2a/M4's "MEDIUM risk, can move layout" caveat
  does not apply here; the change is render-only.
- Threading `theme.cardinalityFontFamily`/`cardinalityFontSize` to the
  tail/head INK is still an open follow-on. T6 uses it for
  `quantifierLines` only, so nothing currently rendered moved.

## Two more 500-line splits the four new fields forced

`class-geo-types.ts` (was exactly at the cap) shed `NamespaceGeo` and
`JsonBodyItem`; `layout.ts` (also at the cap) shed the five ink-shift
helpers. Both are pure moves with re-exports, but note the ordering trap:
`layout.ts` only went over AFTER `shiftEdgeExtras` was added, which is the
function the new fields *require* — budget for it when adding the next
`EdgeGeo` field.
