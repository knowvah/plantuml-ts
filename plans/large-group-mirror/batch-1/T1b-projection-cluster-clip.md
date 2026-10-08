# T1b — A3: the projection cluster's rect, mutated in the jar's order, before the clip

**Agent:** typescript-pro (sonnet, high). Prompt = `common-rules.md` + this file.
**Worktree:** `measurements/mkwt.sh T1b`.

## Why
`DIVERGENCES.md` "Composite-anchor transitions: clip-rect family unported for
border-point children". Upstream clips a cluster-anchored edge against
`lhead`/`ltail.getRectangleArea()` via `dotPath.simulateCompound` (`SvekEdge.java:671-672`). When the line has
a projection cluster (`ClusterDotString.java:101-105`: a composite whose
`entityPositionsExceptNormal()` is non-empty), `SvekEdge.java:660-663` first
calls `manageEntryExitPoint`, and `Cluster.java:410-430` REASSIGNS
`rectangleArea = frontierCalculator.getSuggestedPosition()` (with
`ensureMinWidth(getTitleAndAttributeWidth() + 10)` when titled). This mutates
shared state inside the per-line loop, so a later line through the same cluster
clips against the already-adjusted rect. The port clips against the raw box
(`state-transition-clip.ts`, SI32 T2). `src/core/svek/FrontierCalculator.ts` is
already a shared port (shared-seam-extraction T5); the mutation and its order
are not.

## Do
1. **Read upstream** — `SvekEdge.java:600-700`, `Cluster.java:400-440`,
   `ClusterDotString.java:95-110`, `FrontierCalculator.java` — and the order in
   which lines are processed (`DotStringFactory`/`GeneralImageBuilder` loop over
   `bibliotekon.allLines()`), quoting each. Confirm whether the description
   family (component/usecase/deployment ports, `portin`/`portout`) reaches the
   same path, and find our description clip site.
2. **Measure.** On `pesita-10-dene726` (`AA`) and `viroxo-69-fito663` (`comp1`):
   the raw rect, the jar's adjusted rect (derive from the jar SVG's clipped
   endpoints), and our clipped endpoints vs the jar's, per line.
3. **Author** state fixtures (titled/untitled composite with entry/exit points;
   2+ lines through the same cluster in both directions; nested composites) and
   a description fixture with ports and cluster edges; render the jar.
4. **Port** the mutation once (core), applied per line in the jar's order, used
   by state and description. No per-engine copy.
5. Survey all engines before/after (rule 11); DOT parity must not move (the
   mutation is post-layout).

## Exit
Clipped endpoints equal the jar's on both corpus fixtures and every authored
fixture; any remaining pesita/viroxo diffs carry a separate mechanism. Exact
DIVERGENCES.md text to retire the entry.
