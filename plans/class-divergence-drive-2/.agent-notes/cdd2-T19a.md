# cdd2-T19a — note connector magnetic border

## Observation: reusing T12's helper by passing `group.target` to BOTH
## ends of `applyClusterMagneticBorders` moves the WRONG end too
- **Context**: porting `SvekEdge#drawU`'s cluster-magnetic-force arm
  (`SvekEdge.java:927-941`) onto a note connector's group end
  (`note-layout-tip.ts#groupConnectorPoints`), reusing T12's
  `applyClusterMagneticBorders` (`class-shield-helpers.ts`) the SAME way
  `clipClusterEdgeEnds` is already called there (T13): `group.target`
  passed as both `startId` and `endId`, because "the note-first/host-first
  order is not known at this seam" (T13's own doc comment).
- **Finding**: that trick is safe for `clipClusterEdgeEnds` ONLY because
  `clipSplineStart`/`clipSplineEnd` each carry their own
  `RectangleArea#contains` guard internally — an end outside the rect is a
  guaranteed no-op. `MagneticBorder#getForceAt` has NO such guard: it is a
  pure function of position, and `USymbolFolder.java:242-266`'s ramp is
  nonzero for ANY point with `y <= 0` relative to the cluster box, however
  far above it, as long as x is in range. Passing `group.target` to both
  ends made `applyClusterMagneticBorders` push BOTH ends whenever the note
  happens to share the cluster's x-band — jar-verified `pecabi-95-demu756`:
  the note's own connector start (129, 29.42) sits directly above the
  package at the SAME x=129, so it satisfied the identical ramp as the
  true cluster end and moved by the same ~4.89, turning a 0/2 numeric diff
  into a 2/2 diff on the OPPOSITE end of the path (`d[1]`/`d[3]` instead of
  `d[29]`/`d[31]`).
- **Fix**: gate `startId`/`endId` by RAW (pre-clip) containment of
  `rawPoints[0]`/`rawPoints.at(-1)` in the cluster rect (`clusterEndId`,
  `note-layout-tip.ts`) — the same reason the clip finds a boundary
  crossing at all (`dot` only routes a cluster-anchored edge end to a
  point strictly inside the cluster box, `Cluster#getSpecialPointId`), so
  it is an order-independent proxy for "this end's entity is the
  cluster", unlike the id-based trick that only clip's own internal guard
  makes safe.
- **Impact**: pecabi-95-demu756/sanixi-31-nofa193 now render-diff exactly
  (structural=0, numeric=0). Any future write-set touching a note
  connector's cluster end via `applyClusterMagneticBorders` should reuse
  `clusterEndId`, not repeat the same-id-both-ends trick.
- **Confidence**: High (jar-verified fixture value reproduced exactly;
  regression proven both by hand-computed force values and a unit test
  asserting the note-side point stays untouched even though it
  geometrically satisfies the same ramp force).

## Observation: `class-edge-geo.test.ts`'s M1/pecabi test was stale
- **Context**: after the fix, `tests/unit/class/class-edge-geo.test.ts`'s
  `M1 — a "note top of <package>" connector clips the same way` test
  failed: it asserted the connector's last point stayed just ABOVE the
  package's top border (the old, force-less clip-only behaviour landed at
  y≈52.04, 0.96px above `pkg.y=52.999997`).
- **Finding**: that assertion predates T12/this task's magnetic-force
  port (T13, cdd-T13) and encoded the T13-era (force-less) clip result,
  not the jar's actual value. With the force applied the clipped point is
  pulled DOWN into the tab band (`[pkg.y, pkg.y + pkg.htitle)`), landing
  at y≈57.509 — exactly the jar's own value.
- **Impact**: updated the test's assertions and doc comment to describe
  clip-then-force instead of clip-only, pinned to the jar value
  (`toBeCloseTo(57.509, 2)`). This is a direct, mechanism-driven
  consequence of this task's own fix, not drive-by cleanup — folded into
  the same commit.
- **Confidence**: High (verified via a scratch probe reproducing
  `layoutFixtureClass` on pecabi-95-demu756 and reading the exact
  computed connector points before writing the new assertions).
