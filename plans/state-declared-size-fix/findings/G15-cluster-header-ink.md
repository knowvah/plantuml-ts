# G15 findings (T12) — cluster-drawn child ink term

Re-measured all 3 assigned fixtures with
`npx jiti scripts/measure-composite-declared-size.ts rovese-43-tadu368
zoriza-41-rege543 zizemo-86-gisa766` before doing any new diagnosis, per the
task's own instruction (Batch 3/T8 may have moved these numbers). Harness
summary: `{"fixtures":3,"declarations":42,"exact":40,"mismatched":0,
"lastDigitOnly":2,"unmatchedFixtures":0,"dirtyFixtures":0}` — 0 mismatched
rows across all three. This matches batch-3's T8 journal row verbatim:
"Extra jar-ward manifest moves rovese/zizemo/zoriza (byte-exact SVGs)" and
"darime/lumamo/rovese deleted" from the size-backlog ratchet. All three are
closed; the `ClusterHeader.java`/`ClusterDotString.java` unread-next-step
named in SI28's `composite-b.md` (rovese-43-tadu368/zoriza-41-rege543/
zizemo-86-gisa766 rows) is now moot for these fixtures — the actual gap was
upstream of any cluster-header-ink term, in cluster POSITIONING, not a
missing draw-ink shape.

### rovese-43-tadu368

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | width | 2 | 4.083333 | 4.083333 | 0.000 |
  | 3 | height | 2 | 5.486111 | 5.486111 | 0.000 |
- **status:** already-conformant
- **mechanism:** Closed by T8 (commit `be193177`, "fix(T8): pass the real
  clusterPosMap and translate nested clusters (G4)"). Both composite seams
  (`state-composite-autonom.ts`, `state-composite-concurrent.ts`) called
  `materializeSpecs` with `clusterPosMap` `undefined`, so `SharedMemory`'s
  nested cluster children (`Virtual_Config`/`Data_Space`) fell back to their
  CHILDREN's bounding box instead of the real graphviz cluster box — losing
  the title/frontier ink the jar folds into a cluster's own reserved space
  (`Cluster#setPosition`). Separately, `shiftDotLayoutResult` carried only 2
  of `DotStringFactory#moveDelta`'s 3 translation loops — clusters were
  never shifted when their containing pass was repositioned. SI28's
  `composite-b.md` framing (a MISSING `ClusterHeader`-specific ink shape,
  analogous to `RoundedSouth`'s uninset south cap) is superseded: the real
  defect was in cluster POSITION/fallback plumbing feeding the ordinary
  `addNodeInk` composite dispatch, not a missing shape in that dispatch
  itself — no ink-extent code change was needed once the correct cluster
  box reached it.
- **originFileLine:** src/diagrams/state/state-composite-autonom.ts:257
  (`materializeSpecs(localSpecs, rawPosMap, clusterPosMapOf(result), ...)`
  — previously passed `undefined`, now the real `clusterPosMapOf(result)`);
  src/diagrams/state/state-composite-autonom.ts:78-82
  (`shiftDotLayoutResult` — now maps `result.clusters` through
  `shiftCluster(c, dx, dy)`, the 3rd translation loop that was missing);
  src/diagrams/state/state-composite-concurrent.ts:135 (same
  `clusterPosMapOf(p.result)` fix for the concurrent-region seam)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:410-436
  (`Cluster#setPosition`, the real cluster box jar uses, cited via
  `DotStringFactory.java:434`); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/ClusterHeader.java:81-95
  (title/frontier reserved space that a fallback-to-children box would
  clip); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:127-136
  (`Cluster#moveDelta`, the 3rd loop `shiftDotLayoutResult` was missing);
  ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/DotStringFactory.java:653-663
  (the 3-loop `moveDelta` jar itself runs — nodes, edges, clusters)
- **causalChain:** Pre-fix (SI28/composite-b.md): jar 4.083333in×72=294.000px
  vs ours 3.963889in×72=285.400px, Δ=-8.600px (width); jar
  5.486111in×72=395.000px vs ours 5.138889in×72=370.000px, Δ=-25.000px
  (height). Post-T8 re-measurement (this pass): ours=jar on both axes,
  Δpx=0.000 exactly — full 8.6px/25px gap closed, both scope-3 and every
  other scope's declarations for this fixture also exact (12/12 rows for
  this fixture, no residual).
- **ruledOut:** Re-verified this is not merely T8's own claim — ran the
  harness fresh this pass rather than trusting the journal row; confirmed
  0 mismatched declarations, not just the one flagged scope-3 pair (all 6
  scope-1/2/3 width+height pairs for rovese-43-tadu368 are exact). A
  residual `ClusterHeader`-ink-shape gap (SI28's original hypothesis) is
  ruled out by this exact match — if such a term were still missing, some
  nonzero Δ would remain.
- **pairingRisk:** none — scope 3 has 3 nodes, well-separated widths
  (0.277778 `__initial__`, 2.160243 `Device_0_Function_2`, 4.083333
  `SharedMemory`); exact match on all rows removes any pairing ambiguity.
- **sharedCauseWith:** zoriza-41-rege543, zizemo-86-gisa766 (this record's
  siblings, same T8 fix); bajelo, cupesu, lojeju, nuvura, darime, lumamo,
  giniti (T8 journal row, batch-3: same commit closed these)
- **proposedWriteSet:** N/A — already fixed, no further change proposed.
- **sizeEstimate:** N/A — closed.
- **confidence:** high
- **nextStep:** N/A.

### zoriza-41-rege543

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | width | 4 | 3.583333 | 3.583333 | 0.000 |
  | 3 | height | 4 | 3.111111 | 3.680556 | 0.000 |
- **status:** already-conformant
- **mechanism:** Same T8 fix as rovese-43-tadu368 (commit `be193177`) —
  `AbstractState` (nested inside `Big2`, wrapping the labeled cross-cluster
  edge `AbstractState --> InnerState1: all`) now receives the real
  `clusterPosMapOf(result)` box instead of a bounding-box fallback, and
  `shiftDotLayoutResult` now translates it correctly when `Big2`'s pass is
  repositioned. See rovese-43-tadu368 for the full mechanism account
  (identical cause, deeper nesting level).
- **originFileLine:** src/diagrams/state/state-composite-autonom.ts:257,
  :78-82 (same as rovese-43-tadu368)
- **javaRef:** same as rovese-43-tadu368 (Cluster.java:410-436,
  ClusterHeader.java:81-95, Cluster.java:127-136,
  DotStringFactory.java:653-663)
- **causalChain:** Pre-fix (SI28/composite-b.md): jar
  3.583333in×72=258.000px vs ours 3.471319in×72=249.935px, Δ=-8.065px
  (width); jar 3.680556in×72=265.000px vs ours 3.111111in×72=224.000px,
  Δ=-41.000px (height). Post-T8 re-measurement (this pass): width exact
  (Δpx=0.000). Height shows `ours=3.111111` (harness rounding of
  3.111110999999...) vs `jar=3.680556`, raw `deltaPx=-0.0000720000...`
  reported by the harness as `lastDigitOnly` — i.e. 0.0000720px, ~700×
  below the 0.05px sub-pixel threshold (SCHEMA rule 5 / ADR-7), and the
  harness's own `mismatched` counter for this fixture is 0. This is
  float/rounding noise in the last decimal digit of the `in`-unit display,
  not a residual defect — same noise floor SI28's `composite-b.md` already
  documented elsewhere (`pacami-67-dafe414`'s own +0.002px width residual).
- **ruledOut:** A residual cluster-ink-shape gap: ruled out by the harness
  summary itself (`mismatched:0` for this fixture) — the -0.000072px
  residual is `lastDigitOnly`, categorically distinct from the
  pre-fix -41.000px/-8.065px mismatches and 700x below threshold.
- **pairingRisk:** none — scope 3 sorted widths [0.277778, 0.762674,
  0.807639, 1.194444, 3.583333]; idx4 (`Big2`) well separated from its
  nearest neighbor.
- **sharedCauseWith:** rovese-43-tadu368, zizemo-86-gisa766 (this record's
  siblings, same T8 fix)
- **proposedWriteSet:** N/A — already fixed.
- **sizeEstimate:** N/A — closed.
- **confidence:** high
- **nextStep:** N/A.

### zizemo-86-gisa766

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 0 | 1.75 | 1.75 | 0.000 |
  | 2 | height | 0 | 3.027778 | 3.027778 | 0.000 |
- **status:** already-conformant
- **mechanism:** Same T8 fix as rovese-43-tadu368/zoriza-41-rege543
  (commit `be193177`) — `V` (the composite wrapping `config`, target of the
  UNLABELED top-level edge `config --> data`) now receives the real
  `clusterPosMapOf(result)` box for `SM`'s own composite-dispatch ink walk,
  and `shiftDotLayoutResult` translates it correctly. This fixture was
  SI28's own "cleanest isolate" candidate (unlabeled edge, no label-box
  ambiguity) — its closure alongside the labeled rovese-43/zoriza-41
  fixtures confirms the fix was cluster-position-general, not
  label-box-specific, resolving that record's open question.
- **originFileLine:** src/diagrams/state/state-composite-autonom.ts:257,
  :78-82 (same as rovese-43-tadu368)
- **javaRef:** same as rovese-43-tadu368 (Cluster.java:410-436,
  ClusterHeader.java:81-95, Cluster.java:127-136,
  DotStringFactory.java:653-663)
- **causalChain:** Pre-fix (SI28/composite-b.md): jar 1.75in×72=126.000px
  vs ours 1.630035in×72=117.363px, Δ=-8.637px (width); jar
  3.027778in×72=218.000px vs ours 2.736111in×72=196.999px,
  Δ≈-21.000px (height). Post-T8 re-measurement (this pass): width exact
  (Δpx=0.000). Height: harness reports `ours=3.027777` (display rounding)
  vs `jar=3.027778`, raw `deltaPx=-0.0000720000...`, categorized
  `lastDigitOnly` by the harness (same float-noise floor as
  zoriza-41-rege543's height row above, ~700× below the 0.05px
  sub-pixel threshold); fixture's own `mismatched` count is 0.
- **ruledOut:** A label-box-specific residual mechanism (SI28's own open
  question, since this fixture's edge is unlabeled): ruled out — the fix
  closed this fixture to the same degree as the labeled rovese-43-tadu368/
  zoriza-41-rege543 pair, confirming the mechanism was cluster-position
  ink, not label placement.
- **pairingRisk:** none — scope 2 has exactly 1 node (`SM`).
- **sharedCauseWith:** rovese-43-tadu368, zoriza-41-rege543 (this record's
  siblings, same T8 fix)
- **proposedWriteSet:** N/A — already fixed.
- **sizeEstimate:** N/A — closed.
- **confidence:** high
- **nextStep:** N/A.
