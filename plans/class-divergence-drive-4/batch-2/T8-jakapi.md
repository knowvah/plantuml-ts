# T8 — jakapi: magic-arrow glyph ink pad + trimmed-path angle (D8)

**Context.** Diagnosis: `../diagnosis/jakapi-64-tine258.md` (HIGH).
- Ink: `LimitFinder` pads every `UPolygon` by `HACK_X_FOR_POLYGON = 10` on both
  x sides (`klimt/drawing/LimitFinder.java:169-177`). The magic-arrow glyph is a
  `UPolygon` (`klimt/shape/TextBlockArrow2.java:62-77`, via
  `descdiagram/command/StringWithArrow.java:105-108` and
  `svek/SvekEdge.java:303-304`). `src/diagrams/class/class-ink-box.ts:444-451`
  adds the glyph's vertices raw, so jakapi's frame is Δ3.759 off
  (`SvekResult.java:130-134`, `moveDelta(6 - minX, …)`).
- Angle: `SvekEdge#getArrowDirectionInRadianInternal` (`svek/SvekEdge.java:208-216`)
  reads `dotPath`, which `solveLine` has already trimmed by the decoration
  (`:558-562`). `class-edge-label-attach.ts:229,233,349` pass the untrimmed spline
  to `magicArrowAngle`.
- Probe (`../diagnosis/scratch/jakapi-glyph-probe.diff`): jakapi 0/352 → 0/0. The
  class survey shows exactly 1 verdict mover.

**Task.** TDD. Quote the Java in each commit.
1. Pad the glyph ink (`arrowGlyph` and every `labelLines[i].glyph`) by
   `HACK_X_FOR_POLYGON` on both x sides, exactly as `drawUPolygon` does.
2. Compute the magic-arrow angle from the jar's trimmed `dotPath` (the
   renderer's `drawnEdgePoints`, in `dotPathOf` order) in both the single-line
   and the multi-line arm. For the autolink arm (`SvekEdge.java:209-211`,
   `getStartAngle`), read what `DotPath#moveStartPoint` does to the first control
   point before changing anything, and quote it.
3. Correct the `class-magic-arrow.ts:199-201` doc claim that the points are
   post-`solveLine`.
4. Survey every engine against `../measurements/b0-eng/`. Journal every mover
   with its mechanism.

**Write-set:** `src/diagrams/class/class-ink-box.ts`,
`src/diagrams/class/class-edge-label-attach.ts`,
`src/diagrams/class/class-magic-arrow.ts`, tests.
**Depends on:** T5.

**Acceptance.**
- Given jakapi, when surveyed, then conformant.
- Given a unit test with a glyph at ink min x, then the ink min is the glyph's
  min x − 10.
- Given a decorated edge with a magic-arrow label, then the glyph angle uses
  the trimmed start.
- Given every engine, then 0 conformant losses, and every mover is journaled
  with a mechanism.

**Observability** N/A. **Rollback** Reversible.
