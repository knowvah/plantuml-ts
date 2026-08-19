# Batch 1 — dot-engine 1.6 + G20b xlabel consumption (serial)

Under `skinparam linetype ortho`/`polyline` we move a transition label to the
`xlabel` attribute, mirroring `SvekEdge.java:433-437`. Until now the engine's
public `EdgeGeometry` had no `xlabel` field, so the position it computed and
drew was never published, and every such label fell through to
`perpendicularOffsetLabel` — a spline-midpoint heuristic unrelated to
graphviz's force-search. `pavuzo-79-zodu430` declares **−2.460 px** narrow
because of it.

Filed as `docs/graphviz-issues/16-*` (`1fd425e0`) and **released in
`@knowvah/dot-engine@1.6.0`**, implemented as requested including the
`placedLabelPos` (`lp->set`) gate.

**The bump is provably inert.** The complete `dist/index.js` diff from 1.5.0
is two added lines inside `snapshotEdge`; the only `src/` change is
`api/geometry.ts` (the type and its doc). No layout code changed, and nothing
reads the new field until this batch wires it. Prove it anyway — Step 1 must
move zero fixtures.

**Deliberately first.** Both this batch and Batch 3 (G21) move label
positions; running them in separate adjacent batches keeps every manifest move
attributable to one cause.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | Bump to `^1.6.0`, prove the bump inert, forward `xlabel`, map `ge.xlabel` | typescript-pro (sonnet) | `package.json`, `package-lock.json`, `src/core/graph-layout-build-edges.ts`, `src/core/graph-layout.ts`, `src/core/graph-layout.types.ts` (doc only), their unit tests, `docs/graphviz-issues/TRACKER.md` | T0 | [ ] |
