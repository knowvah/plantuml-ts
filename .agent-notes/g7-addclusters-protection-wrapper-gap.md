# G7: addClusters protection-wrapper nesting gap (attempt-4 root cause)

## Observation: child clusters never nest inside protection wrappers
- **Context**: G7 attempt 4 at border-point (entrypoint/exitpoint)
  cluster sizing. graphviz-ts was exonerated first (7-cell isolation
  matrix, byte-exact three-way on every context variable). Attempt 4
  then hit bitaxo exact but missed pesita/kotagu identically to
  attempt 3, and was fully reverted.
- **Finding**: two related pre-existing gaps, both outside the
  border-point code itself:
  1. `src/core/graph-layout-build.ts:154-159` — `addClusters`
     parent-resolution always attaches a child cluster to the
     parent's OUTER subgraph handle, never inside the parent's
     active protection wrapper (`i`/`p1`). pesita: `AA` becomes a
     SIBLING of `nasreq_auth`'s i/p1 wrapper instead of nesting
     inside it.
  2. Jar's "a"/"p0" ancestor-wrapper mechanism
     (`ClusterDotString.java`, `protection0` /
     `thereALinkFromOrToGroup1`) is unimplemented repo-wide. kotagu:
     jar emits `cluster12a{cluster12p0{cluster12{...}}}` around
     `SubComposite` (each layer +8pt margin; verified via
     `dot -Txdot` on cached `svek-1.dot`: 191×277 → 207×293 →
     223×309); the port emits none of it, so the parent's raw
     `initial` bbox is wrong before FrontierCalculator ever runs.
- **Impact**: blocks the ~20-fixture entrypoint/exitpoint family.
  Any attempt 5 (requires human sign-off) must port a/p0 and fix
  parent-resolution FIRST. Process lesson: a paper gate that derives
  `initial` from the JAR's cached DOT validates only the correction
  math — the jar DOT already contains the wrappers. Gate against the
  PORT's emitted DOT instead.
- **Confidence**: High (T5 ruled out frontier math, D4, issue-08
  naming, and the border-point cluster's own internal shape via
  jar-DOT-exact synthetic repros; full trail in
  `plans/g7-borderpoint-rank/decision-journal.md` T5 row).

## Update 2026-07-22 (attempt 5): a/p0 FIXED; two new gaps isolated
- a/p0 + parent-resolution landed (commit 647e43e); border-point
  wiring verified structurally correct vs jar DOT in T9's replay.
- Remaining blockers (attempt-5 miss, both pre-existing, general):
  1. `resolveClusterComposite` feeds `titleTableWidth: title.width`
     (title only); jar = max(title/stereo, attribute-text) per
     `ClusterHeader.java` titleAndAttributeWidth. Recurring
     55x293.61 pesita miss across attempts 3-5.
  2. `state-composite-pass.ts#addLevelEdges` ignores
     `Transition.direction`; jar reverses `-up->` edges before
     graphviz (kotagu svek-1.dot:24). Corpus-wide, not
     border-point-specific.
- Confidence: High (G7 journal T9 row has the full trail).
