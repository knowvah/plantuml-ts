### dapunu-39-kava045

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | width | 2 | 2.960888 | 2.960870 | +0.0013 |

  (was `2.932639 vs 2.96087`, Δ = -2.033 px at SI28 time; re-measured live via
  `npx jiti scripts/measure-composite-declared-size.ts dapunu-39-kava045` on
  the current `fix/state-declared-size` tree — the only mismatched row of 14
  declarations, `lastDigit:false` per the harness's own 1.5e-6in band, i.e.
  not literally "last-digit" by that narrow test, but 0.0013 px is 26x under
  SCHEMA rule 5 / ADR-7's 0.05 px sub-pixel floor.)

- **status:** already-conformant
- **mechanism:** T9 landed the self-loop-scoped arrowhead-ink fold
  (`addTransitionInk`'s `arrowheadInk==='self-loop'` gate) inside
  `computeSvekResultGeometry`'s composite ink walk. dapunu-39 has exactly one
  self-loop, `Main_Connected_First --> Main_Connected_First`
  (`svek-2.dot:sh0006->sh0006`), which sizes the wrapping `Main_Connected`
  composite node (scope-3 idx2, `svek-3.dot:sh0007`). Folding that self-loop's
  routed-spline + arrowhead ink into the scope-2 box closed 2.0337 of the
  2.0350 px gap; the 0.0013 px left over is the SAME "float-noise floor" T2's
  own `composite-b.md` documented for this identical mechanism on
  pebepi-32-cati486/taxile-56-goca422/tigibi-80-zidi137 (`~0.002px`, landed by
  the same T9 commit at 1.34→0.0025px) — an independently re-derived
  self-loop-spline + arrowhead-angle geometry (multiple `Math.atan2`/`cos`/
  `sin` terms feeding a bounding-box union) landing a few millionths of an
  inch off a value jar only ever exposes 6-decimal-rounded. No PlantUML
  layout constant this pass touches (`INK_DELTA=15px`, `JAR_INK_MARGIN=6px`,
  `HACK_X_FOR_POLYGON=10px`, any arrowhead-length constant) is smaller than
  ~4 orders of magnitude above 0.0013 px, so a missing/extra TERM would
  produce a far larger, not smaller, jump — ruling that shape out.
- **originFileLine:** src/diagrams/state/layout-ink-extent.ts:401-402
  (`addTransitionInk`'s `arrowheadInk === 'self-loop'` early-return gate,
  consumed by `computeSvekResultGeometry` at :527 `buildInkBox(states,
  transitions, true, 'self-loop')`) — the fix that moved this row from
  -2.033 to +0.0013 px.
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/
  SvekResult.java:130-135 (`calculateDimension`'s ink-extent recipe, arrowhead
  ink included via jar's own `LimitFinder` walk — same citation `composite-
  b.md`'s pebepi-32-cati486 record used for the identical mechanism).
- **causalChain:** SI28: ours 2.932639in vs jar 2.96087in → Δ = (2.932639 -
  2.96087) × 72 = -2.033px. Post-T9 (re-measured): ours 2.960888in vs jar
  2.96087in → Δ = (2.960888 - 2.96087) × 72 = +0.0013px. 2.033 - 0.0013 =
  2.0317 px closed by the self-loop-arrowhead fold, matching the journal's
  "-2.03→+0.0013" entry for this fixture verbatim.
- **ruledOut:** (carried from SI28, still valid — none of T9's write-set
  touches these paths) **1. Cluster mechanism:** no `__zaent_*` anchor in
  this fixture. **3. Pseudostate ink formula:** `__init_Main_Connected`'s
  `stateKind` fix closed an unrelated 1px gap in the SI28 reconstruction, not
  this row. **4. URL-space reservation:** `calculateDimensionSlow` never
  reads `url`; `getSpaceYforURL` only offsets DRAW position, not SIZE.
  **2. Self-loop arrowhead ink — SI28 reported "changed nothing" when
  unioned manually; T9's landed fix shows it IS the mechanism (2.03 of
  2.035 px).** Reconciled: SI28's probe unioned the self-loop's ink into
  *a* pass's box without pinning which of the composite's three nested ink
  walks it targeted; T9 threads the fold specifically through
  `computeSvekResultGeometry`'s scope-2 box (the one sizing the PARENT
  `Main_Connected` wrapper, not `Main_Connected_First`'s own scope-1 box,
  which stayed exact throughout) — the two probes were measuring different
  ink walks, not different mechanisms. Not independently re-verified beyond
  what T9's own journal entry and this re-measurement establish; no new
  probe was written for this task (re-measurement only, per instructions).
- **pairingRisk:** none — scope-3's 3 nodes (0.278/1.521/2.961 in) are
  widely separated; sorted pairing cannot mis-attribute this row.
- **sharedCauseWith:** pebepi-32-cati486, taxile-56-goca422,
  tigibi-80-zidi137 (same self-loop-arrowhead-ink mechanism, same T9 commit,
  same order-of-magnitude post-fix residual per `composite-b.md`).
- **proposedWriteSet:** none — no fix proposed; residual is sub-ADR-7-
  threshold and matches an established precedent for this mechanism.
- **sizeEstimate:** n/a (closed).
- **confidence:** medium. The 2.033px closure and its attribution to T9's
  self-loop-arrowhead fold is high confidence (direct re-measurement +
  journal + module-doc corroboration). The "float noise vs a real term" call
  on the remaining 0.0013px is medium: jar exposes only a 6-decimal-rounded
  DOT value, so its raw unrounded internal number is not observable — this
  is a magnitude/precedent argument (matches the ~0.002px floor T2
  jar-verified for the same mechanism on 3 sibling fixtures; no candidate
  constant fits), not a byte-level proof.
- **nextStep:** N/A — already-conformant; no further instrumentation
  proposed. If ever revisited, the only additional lever would be capturing
  jar's self-loop spline control points directly (not just its final
  6-decimal width) via a modified oracle build, which is outside this
  mission's tooling.
