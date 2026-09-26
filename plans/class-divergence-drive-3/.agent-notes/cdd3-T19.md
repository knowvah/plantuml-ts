# cdd3-T19 — DOT attribute fidelity: weight, searchsize, label-first lines0

Implementation by the T19 agent (typescript-pro, sonnet); its stream stalled
twice during measurement, so the orchestrator finished measurement, gates
and the commit (journal row 44).

## Mechanisms ported

- **B-1** (majuva): `@N` link weight was forwarded as `weight=N` into the
  layout DOT. Upstream parses it (`CommandLinkClass.java:381-385`) but
  `Link#getWeight()` (`abel/Link.java:320-322`) has no caller; no cached
  class `svek-*.dot` carries `weight=`. Dropped from
  `class-dot-edges.ts#buildDotEdgeAttrs`.
- **E3-11** (delasa, partial): `DotStringFactory.java:154` emits
  `searchsize=500;` unconditionally. The DOT text already carried it, but the
  programmatic builder that drives @knowvah/dot-engine never set it.
  `graph-layout-build.ts#applyGraphAttrs` now sets `searchsize` only
  (`remincross` absent = true, `mincross.c:379`; E3-D2 did not reproduce,
  journal row 18).
- **E3-18** (cobumi, partial): `Bibliotekon#addLine` (`Bibliotekon.java:87-106`)
  splices a note-labelled `lines0` edge before the first unlabelled `lines0`
  edge with the same connections (`Link#sameConnections`,
  `abel/Link.java:462-469`). New `src/core/svek-dot-lines0.ts#orderLines0Edges`,
  shared by the layout builder, the text emitter and node encounter order.
  Verified line-for-line against the Java by the orchestrator.

## Measurements

- Class render-all pre (`/tmp/cdd3-T19-pre.json`) vs post
  (`/tmp/cdd3-T19.json`): 2 transitions — majuva diverged -> conformant;
  cobumi diverged -> structural-match. 0 rises, no conformant loss.
- All 27 engines surveyed pre (detached worktree at `d9aecb79`) and post.
  The first run was taken at load ~120 and timed out widely; the timed-out
  engines were re-run at low load and any row still timing out on one side
  was compared against `/tmp/cdd3-b1-eng`. Only non-class mover: state
  fajegu-17-joba577 maxDelta 725.92 -> 718.16 (fall, verdict unchanged).
- Remaining for delasa: E3-12 (unplaced label, gvi 25, T32). Remaining for
  cobumi: E3-D1 self-loop in cluster (gvi 26).

## Observation: measurement under load

- **Context**: T19 pre/post surveys run while two other agents' surveys and
  an orphaned survey ran.
- **Finding**: at load ~120 the first ~5 fixtures of each engine time out
  (cold jiti transform), and a whole engine can time out.
- **Impact**: never read a survey diff taken under load; re-run the engine
  alone. Orphaned agents leave surveys running — check `ps` before measuring.
- **Confidence**: High
