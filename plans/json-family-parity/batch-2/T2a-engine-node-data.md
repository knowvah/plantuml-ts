# T2a — engine node and edge data under `read: 'exact'` (D1)

Agent: `typescript-pro` (sonnet, effort high), worktree `jfp-T2a`. Commit:
`feat(core): raw engine node/edge data for the exact read (T2a)`. Read
[../task-contract.md](../task-contract.md) and [../decisions.md](../decisions.md)
("The two known structural divergences", D1).

## Why
The jar places json nodes from graphviz's post-layout `ND_coord` and
`ND_width/ND_height` (`SmetanaForJson.java:97-102,203-210`) and mirrors edges
with the same `Mirror` (`:212-215`). Our `layoutGraph` echoes our declared size
(`graph-layout.ts:109-128`) and min-shifts nodes + edges (`:275-304`) on a
`yAxis: 'down'` read, so json cannot reproduce the jar's arithmetic from the
current result. json is the only `read: 'exact'` caller (grep `src/`).

## Task
Under `read: 'exact'` only, additionally read the engine's native frame
(`getLayout(b.graph, { yAxis: 'up' })`, or whatever dot-engine call yields
`ND_coord` — verify, do not assume: compare against `render(b.graph, 'dot')`'s
`pos`/`width`/`height`) and return `engineNodes` / `engineEdges` per the
interface in [overview.md](overview.md). No echo, no shift, no flip. Every
existing field is computed exactly as today. Do not change `read: 'svek'` in any
way. JSDoc `@see` the two Java sites. If `graph-layout.ts` would pass 500 lines,
put the reader in a new `src/core/graph-layout-engine-frame.ts` (journal it in
the hand-back; it is in your write-set).

## Write-set
`src/core/graph-layout.ts`, `src/core/graph-layout-result.types.ts`,
`src/core/graph-layout-engine-frame.ts` (only if needed),
`tests/unit/core/graph-layout-engine-nodes.test.ts`.

## Read-set
`src/core/graph-layout.ts:90-130,270-390`; `src/core/graph-layout-result.types.ts`;
`tests/oracle/layout-parity.ts:115-140` (`render(g, 'dot')` pattern);
`node_modules/@knowvah/dot-engine/dist/api/*.d.ts` (`getLayout` options);
`SmetanaForJson.java:97-102,203-215`.

## Acceptance
- Given a 2-node `shape=record` graph with a ported edge, when laid out with `read: 'exact'`, then each `engineNodes` entry equals the `pos` and `width·72`/`height·72` that `render(g, 'dot')` reports, to 1e-3, and each `engineEdges` `points` equals that edge's `pos` control points.
- Given a node whose declared size the engine rounds or grows, then `engineNodes` carries the ENGINE's size while `nodes[]` is unchanged from before (echo kept there).
- Given `read: 'svek'` (default), then the result has no `engineNodes`/`engineEdges` and is deep-equal to the pre-change result on the same graph (snapshot of `nodes`, `edges`, `width`, `height`, `originShift`).
- Given the full suite, then every existing graph-layout test passes unchanged.

Observability: N/A. Rollback: Reversible (revert; the field is additive).
