# cdd3-T9 — namespace identity (S-1, S-1b, S-12)

## Observation: useIntermediatePackages never changes resolution upstream
- **Context**: S-1 (sugifi, sumule).
- **Finding**: The pragma is read in exactly one class-diagram place,
  `ClassDiagram#checkFinalError` (`ClassDiagram.java:84-85`) ->
  `AbstractEntityDiagram#packSomePackage` (`:85-106`). Quark registration,
  group materialisation and uid ticks are identical with the pragma on or
  off; packing only sets `Entity.packed` and prepends the group's first
  display line to its child's. The port's old resolve-time qualifier join
  was removed (and the dead `ResolveInput.intermediatePackages` field with
  it); packing lives in `class-namespace-pack.ts`, called from
  `parser.ts#finalizeParse`/`startNewPage` before the closing sweep.
- **Impact**: Packing applies to EXPLICIT nested packages too:
  `xadudi-62-pupa491` (`package foo1 { package foo2 { class foo3 } }`,
  surveyed under `unknown`) went diverged -> conformant. A packed group is
  absent from DOT (`nonEmptyNamespaceIds` skips it; a child re-parents to
  the nearest unpacked ancestor) and from geometry; its burned tick reaches
  the uid plan as `ClassGeometry.packedGroupRanks` (phantom ranks).
- **Confidence**: High (jar-rendered xadudi; sugifi/sumule dot-cache).

## Observation: DescriptionDiagram has its own packSomePackage call
- **Context**: grepping the pragma.
- **Finding**: `DescriptionDiagram.java:93` also packs;
  `component/gerebe-26-neli152` is the component twin of xadudi. Not
  touched here (description engine, separate code).
- **Impact**: candidate follow-on for the description engine.
- **Confidence**: High that the call exists; port state not checked.

## Observation: countByName counts data-less quarks
- **Context**: S-1b two-phase link endpoints (xumofu).
- **Finding**: `Plasma#countByName` (`Plasma.java:104-108`) counts every
  registered quark, data or not. With resolve-both-then-create
  (`CommandLinkClass.java:320-333`), the second endpoint's bare-name reuse
  check must see the first endpoint's not-yet-created leaf:
  `A.Foo <|-- Foo` is ONE leaf in the jar (oracle-rendered). The port passes
  an unregistered stub (`registerPendingLeaf`) into the second resolution,
  and registers the pending leaf in its namespace's member list early so an
  intervening sweep counts it.
- **Impact**: also closed unknown-bucket `gemepu-46-dido441` and
  `kupofu-67-cupo145` (same `X --|> A.B.C.Y` shape).
- **Confidence**: High.

## Observation: two tests re-derived production logic
- **Context**: `class-cluster-levels.test.ts` failed on sugifi/sumule.
- **Finding**: its `keptNamespaceIds` was a local copy of
  `nonEmptyNamespaceIds`; now imports the production function.
- **Impact**: none further.
- **Confidence**: High.
