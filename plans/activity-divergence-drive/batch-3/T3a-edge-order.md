# T3a — edge emission order and bars

Agent: typescript-pro, worktree `add1-T3a`. Commit per mechanism: `fix(activity): <mechanism>`.

## Context
Journal row 29(a): `Worm.java:134-171` `drawInternalOneColor` draws, per segment, the emphasize decoration BEFORE that segment's `ULine` (first segment matching `emphasizeDirection` only), and the start/end decorations after the whole loop; `renderer.ts#renderEdge` emits segments, terminal arrow, emphasize, mid arrow. Port the Java order 1:1 for every edge. Bar stroke: `FtileBlackBlock.java:97-104` strokes AND fills the bar in the resolved bar colour (`garuga`).

## Rows (b2)
- **Worm emphasize arrowhead before its segment, terminal decoration last (Worm.java:134-171)**: `cufega-65-beji958`, `foludi-80-gilo247`, `fonabu-93-xama593`, `gakelo-29-neno787`, `livigo-47-negi605`, `nusajo-97-bemo713`, `ribapo-84-xudu593`, `vozane-63-kepe177`, `zukori-83-fiso705`
- **fork/join bar stroked + filled in ActivityBarColor (FtileBlackBlock.java:97-104)**: `garuga-34-debe901`

## Write-set
`src/diagrams/activity/{renderer,activity-renderer-bars}.ts`, `src/diagrams/activity/layout/edge-draw-order.ts`, the tests exercising them, new tests (names unique to T3a).

## Acceptance
- Each mechanism quoted from the Java (file:line), ported at its origin, applied to every fixture it governs, pinned by a test.
- Assigned rows' diffs from it go to 0, or the row is re-slotted with mechanism + owning file.
- 0 unexplained risers (shown from the diff); 55 pinned goldens byte-equal.

Rules: see `overview.md`.
