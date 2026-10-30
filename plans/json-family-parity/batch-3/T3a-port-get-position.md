# T3a — port `SmetanaForJson#getPosition` and the edge `Mirror` (M1 + M2)

Agent: `typescript-pro` (opus, effort high), worktree `jfp-T3a`. Commit:
`fix(json): place nodes and edges with the jar's mirror arithmetic (T3a)`.
Read [../task-contract.md](../task-contract.md), [../decisions.md](../decisions.md)
and `../diagnosis/ledger.md` (the M1/M2 rows and the probe residues) first.
Scope discipline: implement exactly the jar's arithmetic below; no other change.

## The Java (quote it in the JSDoc)
- `InternalNode#getMaxX` = `coord.y + data.height*72/2` (`SmetanaForJson.java:97-102`).
- `drawMe`: `max` over nodes of `getMaxX()`; `xMirror = new Mirror(max)` (`:158-164`) — edges do NOT enter `max`.
- `getPosition` = `new UTranslate(coord.x - w/2, xMirror.inv(coord.y + h/2)).sym()`, `w = data.width*72`, `h = data.height*72` (`:203-210`).
- `getCurve` = `new JsonCurve(data, xMirror, 13)` (`:212-215`); `JsonCurve.java` mirrors every spline point with the same `xMirror` (`Mirror#invAndXYSwitch`, ported at `src/diagrams/json/Mirror.ts:49-53`).

## Task
1. New `src/diagrams/json/json-node-position.ts`: a pure function from
   `engineNodes` to `Map<id, {x, y, width, height}>` porting `getMaxX`,
   `drawMe`'s `max`, `getPosition` (with `.sym()`), using `Mirror` from
   `Mirror.ts`. Node box size for drawing stays our measured `TextBlockJson`
   size (the jar draws `node.block`, not the engine box); only the ORIGIN comes
   from the engine. Export the `Mirror` instance (or `max`) for the edges.
2. `layout.ts`: call `layoutGraph(…, { read: 'exact' })` as today, read
   `engineNodes`/`engineEdges`, replace `mirrorToDiagramSpace` +
   `buildJsonEdgeGeometries`' transposition with the jar's: nodes from step 1,
   edge points and `ep` through `Mirror#invAndXYSwitch`. Remove the comment at
   `layout.ts:168-206` that justified skipping `Mirror` (it described the
   y-down frame you no longer read) and replace it with the Java quote.
   Margins are added exactly where they are today.
3. `JsonCurve.ts` / `document-dimensions.ts`: change only what the new frame
   forces (e.g. a consumer that assumed min-shifted coordinates ≥ 0). Note the
   jar's `Mirror#inv` warns "BAD VALUE IN Mirror" but still returns
   `max - v` for out-of-range values (`Mirror.java:inv`): mirror that, never clamp.
4. Tests first: `json-node-position.test.ts` from a hand-built `engineNodes`
   set whose expected positions you compute from the Java formula in the test
   comment; re-point `layout.test.ts` / `layout-mirrored-graph.test.ts`
   assertions that encoded the old echo/shift arithmetic (reason in the commit body).
5. `layout.ts` is 496 lines: step 1's new file is the split; keep `layout.ts` ≤ 500.

## Write-set
`src/diagrams/json/{layout.ts,json-node-position.ts,JsonCurve.ts,document-dimensions.ts}`,
`tests/unit/json/{json-node-position.test.ts,layout.test.ts,layout-mirrored-graph.test.ts}`.
Never `src/core/` (stop 7): a needed core change is a halt.

## Read-set
`SmetanaForJson.java:87-215`; `JsonCurve.java`; `Mirror.java`;
`src/diagrams/json/{layout.ts,Mirror.ts,JsonCurve.ts,document-dimensions.ts}`;
`src/core/graph-layout-result.types.ts` (`engineNodes`/`engineEdges`);
`../diagnosis/ledger.md`.

## Acceptance
- Given a hand-built `engineNodes` set, then each node's origin equals `(max − (cy + h/2), cx − w/2)` + margins, with `max` over nodes only (`SmetanaForJson.java:97-102,164,203-210`).
- Given json/bavize-88-jumu158, then every node rect's x/y equals the jar's `in.svg` rect (root leftmost, not reversed — the trap at old `layout.ts:179-186`; second rank at the jar's integral x, where main draws 135.775).
- Given every ledger row predicted closed by the M1+M2 probe, then `diff-one.mts <type> <slug> --survey` reports conformant (list misses in the hand-back).
- Given the 22 rows conformant at main and the 14/7/1 pins, then byte-identical; `json-family-positional.test.ts` green (no row rose).
- Given `extended-baseline.mts --check`, then every mover is a json/yaml/hcl example attributable to M1+M2 (list them).

Observability: N/A. Rollback: Reversible (revert; T2a's field stays unused).
