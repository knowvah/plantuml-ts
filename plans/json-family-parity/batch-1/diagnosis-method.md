# Diagnosis method (T1a, T1b, T1c)

`~/.claude/rules/diagnosis.md` governs: the deliverable per row is the
diagnosis artifact (mechanism, origin `file:line`, causal chain, ruled out).
A diff says WHICH attribute moved, never why — open the Java before stating why.

## Row format (one table per ledger, one line per row)
| row | n | p | dims | class | mechanism (one sentence) | origin (ours `file:line` ↔ jar `file:line`) | evidence | M1+M2 probe residue | ruled out |

`class` ∈ `M1` · `M2` · `M1+M2` · `Mn:<short-name>` (a NEW port-controlled
mechanism) · `dot-engine` · `Smetana`. Rows may carry two classes when the
probe closes part of the residue (e.g. `M1+M2, then Smetana`). "unknown" is not
a class (stop 10). Below the table: one section per `Mn`, with the Java quote
and our code quote side by side.

## Steps
1. **Read first** (quote what you use): `SmetanaForJson.java` whole
   (`getMaxX` :97-102, `drawMe` :158-176, `getPosition` :203-210, `getCurve`
   :212-215, `createNode` :233-260, `getDotLabelArray`/`getDotLabelMap`
   :265-295); `JsonCurve.java`; `Mirror.java`; `TextBlockJson#calculateDimension`;
   `JsonDiagram#drawU` (document size). Ours: `src/core/graph-layout.ts`
   (`ROUND_TRIP_EPSILON` :109, `mapNodes` :111-128, `shiftToOrigin` :275-304,
   `layoutGraph` :337-380), `src/diagrams/json/layout.ts` (`mirrorToDiagramSpace`
   :168-206 and its comment, `placeJsonNodes`, edge transpose),
   `src/diagrams/json/{JsonCurve,document-dimensions,record-label}.ts`.
   For record sizing in the engine: `~/git/graphviz/lib/common/shapes.c`
   (`record_init`, `size_reclbl`, `resize_reclbl`) and `macros.h:27-29`.
2. **Instrument, per row**: (a) our `DotInputGraph` (`setLayoutInputObserver`,
   `src/core/graph-layout.ts:70`); (b) dot-engine's raw snapshot — `getLayout`
   node `x,y,width,height` in both `yAxis` frames, and edge points; (c) the jar's
   node rects and path tokens from `in.svg`; (d) ours from `renderFixtureJson`.
   Tabulate per node: ours vs jar x, y, w, h. Put scratch scripts in the
   worktree's `plans/json-family-parity/diagnosis/scratch/` (NOT committed).
3. **M1+M2 probe (uncommitted)**: in the worktree only, make `mapNodes` return
   the engine's size (no echo) and replace json's placement with the jar's
   formula (`x = max − (cy + h/2)`, `y = cx − w/2` on the y-UP frame, `max` over
   nodes only, edges through the same mirror). Beware the recorded trap: on the
   `yAxis: 'down'` frame applying `inv` again reverses the diagram
   (`json/layout.ts:179-186`, bavize). Measure every row with
   `npx tsx plans/json-family-parity/tools/residue.mts`; record the residue in
   the "M1+M2 probe residue" column. `git checkout -- src` afterwards.
4. **Rows still off after the probe**: find the next mechanism — spline input
   (`JsonCurve`, the `veryFirstLine` 13, `data.spl`), canvas dims
   (`document-dimensions.ts` vs `JsonDiagram#drawU` / `LimitFinder`), rounding
   (`POINTS`/`PS2INCH`, graphviz `ROUND`), margins. Port-controlled ⇒ `Mn`.
5. **D3 experiment** for any row you would call Smetana or dot-engine
   ([../decisions.md#d3](../decisions.md)):
   - (1) effective input: node sizes AND record field sizes the engine solves
     with (dot-engine's `-Tdot` `rects`/`width`/`height`) vs the jar's, recovered
     from the oracle rects through `createNode`/`getDotLabel*`. Compare
     geometry, not label strings (the XPAD compensation is deliberate).
   - (2) engine: our input as DOT text (`render(g, 'dot')` from the builder,
     pattern in `tests/oracle/layout-parity.ts:115-140`) through real
     `dot -Tdot` (16.1.0) vs dot-engine: node `pos`/`width`/`height`, edge `pos`.
   Both equal ⇒ `Smetana`, with the measured residue. (2) unequal ⇒
   `dot-engine`, plus a draft issue (input DOT, both outputs, the differing
   attribute) under a `## dot-engine draft` heading in your ledger.
   (1) unequal ⇒ it is a port-controlled `Mn`, not Smetana.
6. **Conformant rows are evidence**: for at least two conformant rows of your
   family, show why M1/M2 do not move them (or predict that they will — then it
   is a stop-4 risk the orchestrator must see before B3).

## Hand-back additions
Per class: row count. Rows whose probe residue is 0 (predicted closed by
M1+M2). Every `Mn` with its rows. Every dot-engine draft. Scratch scripts not committed.
