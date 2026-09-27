# T10 — gujigi + ririlu: svek two-pass draw state (D8)

T12 (ririlu) is collapsed into this task: one upstream mechanism, and the same
frame quantities `m`, `S` and `D`.

**Context.** Diagnoses: `../diagnosis/gujigi-63-roki030.md` and
`../diagnosis/ririlu-13-zipi740.md` (both HIGH).
- `SvekResult#drawU` runs twice:
  - pass 0: the LimitFinder in `calculateDimension`, at `dx=dy=0`
    (`svek/SvekResult.java:130-134`, `klimt/shape/TextBlockUtils.java:138-141`);
  - pass 1: the SVG, at `dx,dy = D = 6 − inkMin`.
- State that pass 0 mutates carries into pass 1:
  - **Constraint (gujigi):** `svek/SvekEdge.java:994-1012` picks a corner of
    `getSquare(x + labelXY…)` (`:1080-1091`) against the UN-shifted
    `todraw.sample()`. `todraw` is `dotPath.copy()` plus the magnetic moves
    (`:908`, `:922-942`). The shared `LinkConstraint` (`cucadiagram/LinkConstraint.java:70-104`)
    keeps link1's pass-0 point, so in pass 1 link2 draws from a stale point.
    `link1` = the later link (`atmp/CucaDiagram.java:682-695`,
    `command/note/CommandConstraintOnLinks.java:102-107`). `labelXY` is the
    label TABLE polygon's min, and the table width is `(int)`-truncated
    (`SvekEdge.java:741-747`, `:808-815`, `:504-507`).
  - **Kal (ririlu):** `SvekResult.java:95,104-109` runs `computeKal` +
    `fixOverlap` on every pass. `Kal#moveX` → `SvekEdge#moveStartPoint` moves
    `dotPathInit` too (`svek/SvekEdge.java:1346-1349`, `svek/Kal.java:204-211`),
    and `SvekEdge#computeKal` re-seeds from it (`:1069-1073`). So pass 1 re-solves
    from pass 0's result (`svek/LineOfSegments.java:89-126`).
- TS: `class-edge-geo.ts:196-242` (spot, one unbiased pick on the untrimmed
  spline, fresh pair on both links), `:388-393` (order), `class-edge-constraint.ts:103-118`,
  and `class-kal-overlap.ts:10-14,173-180` (runs once). `graph-layout.ts:244-270`
  `shiftToOrigin` hides `m`. D = S − m, where S =
  `layout-ink-extent.ts#computeClassInkShift`.
- Probes: `../diagnosis/scratch/gujigi-two-pass-probe.diff` (D hardcoded (7,−1))
  → gujigi 0/0. `../diagnosis/scratch/ririlu-kal-2pass-probe.diff` → ririlu 0/0,
  with 1 class survey mover.

**Task.** TDD. Quote the Java in each commit.
1. Make `layoutGraph` report `m` (the `shiftToOrigin` offset) on
   `DotLayoutResult`, as a read-only field.
2. Build a pass-0 edge state in a new `class-svek-pass0.ts`:
   - Kal: solve in the svek frame (inputs + m). Box and start moves persist.
   - Constraint: pick each link's corner in pass-0 order on `drawnEdgePoints`,
     after the Kal and magnetic moves, from the truncated-table spot. Only link1's
     line and label are pass-0 ink.
3. Feed the pass-0 state to the ink extent (`layout-ink-extent.ts`). Do not edit
   `class-ink-box.ts` (T8's). Then derive D = S − m.
4. Pass 1:
   - Kal: re-solve in the final frame (inputs + S), from the pass-0 result.
   - Constraint: pick with the square offset by D. link2 is stamped
     `(stale link1 pass-0 point − D) → own pass-1 point`, and link1 is stamped
     `(fresh → link2's pass-1 point)`.
5. Correct the `class-kal-overlap.ts:10-14` "runs once" doc.
6. Survey every engine against `../measurements/b0-eng/`. Journal every mover
   with its mechanism.

**Write-set:** `src/diagrams/class/class-edge-geo.ts`,
`src/diagrams/class/class-edge-constraint.ts`,
`src/diagrams/class/class-kal-overlap.ts`,
`src/diagrams/class/class-svek-pass0.ts` (new),
`src/diagrams/class/layout.ts` (call only, at its 500-line cap),
`src/diagrams/class/layout-ink-extent.ts`, `src/core/graph-layout.ts`,
`src/core/graph-layout-result.types.ts`, tests.
**Depends on:** T5, T11 (owns `src/core/graph-layout*.ts` and touches
`class-edge-geo.ts` in batch 1).

**Acceptance.**
- Given gujigi, when surveyed, then conformant (all 4 dashed lines and labels).
- Given ririlu, when surveyed, then conformant (boxX 440.54/501.965/541.602).
- Given a unit test of the constraint replay on gujigi's inputs, then link2's
  line starts at link1's pass-0 point − D.
- Given a unit test where pass 0 stalls, then the Kal pass 1 re-solves from the
  pass-0 result.
- Given every engine, then 0 conformant losses, and every mover is journaled
  with a mechanism.

**Observability** N/A. **Rollback** Reversible.
