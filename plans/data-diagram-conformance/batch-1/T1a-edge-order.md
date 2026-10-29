# T1a — edge emission order (D2): diagnose, then fix

Agent: `debugger` (opus, effort high), worktree `ddc-T1a`. Commit:
`fix(json): emit edges in SmetanaForJson's post-order (T1a)`.
Read [../task-contract.md](../task-contract.md) first. Diagnosis mode
(`~/.claude/rules/diagnosis.md`): no edit before the artifact is written.

## Symptom (planning probe, 2026-10-28)
16 json/yaml corpus rows are `diverged` with ONLY `svg/g[]/path[]/@d`
structural diffs (json bogiku-88, civofu-04, devime-19, gejena-99,
gibego-39, kidoki-70, mudumo-73, nofuvo-36, nopoku-31, tivuru-65,
zasitu-09, zevaka-35; yaml bafemu-96, jozapu-14, poxedu-72, xubife-72).
tivuru: ours `path[9]` `M 230.813 118 L 243.813 118` ≈ jar `path[7]`
`M231,118 L244,118` — the same edge, a different index.
`npx tsx $T/diff-one.mts json tivuru-65-vezu313 --structural`.

## Hypothesis to confirm or refute (stop 12 if refuted)
`SmetanaForJson.java:128-145`: `nodes.add` precedes the child loop; inside
it `manageOneNode(child)` (`:139`) returns before `edges.add(edge)` (`:141`)
— post-order edges. `drawMe` `:172-176` draws nodes, then edges in that
order. Ours: `json-layout-prep.ts:73` `walkTree` is pre-order and
`layout.ts:319` `buildJsonDotEdges(flatNodes, measured)` emits parent → child
edges in that walk; `renderer.ts:443` draws `geo.edges` in `buildJsonEdgeGeometries`
order (`layout.ts:380-440`, engine order).

## Diagnosis artifact → `diagnosis/edge-order.md`
Instrument: print our edge list (tail, head, port index) and the jar's
expected post-order for tivuru and poxedu; map each of our `path[k]` to the
jar's index. State mechanism, origin `file:line`, causal chain, ruled out
(at minimum: dot-engine reordering edges — check whether `dotEdges` come
back in input order; `JsonCurve`/spot geometry — the `d` strings match once
re-indexed). If any row has a diff that is NOT explained by re-indexing,
name it as a separate family (do not fix it here).

## Fix (only after the artifact)
Build `dotInput.edges` by a recursion that mirrors `manageOneNode`: for a
node, for each child in key order, recurse first, then push the edge
(`@see SmetanaForJson.java:128-145`). Keep nodes in pre-order (`:133` is
before the loop). Keep `buildJsonEdgeGeometries` emitting in the input
order; if dot-engine returns edges reordered, map back by (tail, head) ids
with a comment. No render-time sort. Expected values in
`tests/unit/json/layout.test.ts` are the post-order sequence for a
3-level tree, cited to `:139-141`.

## Write-set
`src/diagrams/json/layout.ts`, `src/diagrams/json/json-layout-prep.ts`,
`tests/unit/json/layout.test.ts`, `plans/data-diagram-conformance/diagnosis/edge-order.md`.

## Read-set
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/SmetanaForJson.java:80-200`,
`src/diagrams/json/layout.ts:300-440`, `src/diagrams/json/json-layout-prep.ts`,
`src/diagrams/json/renderer.ts:430-460`, `tests/oracle/svg-conformance/json-family-structural.ts:60-130`.

## Acceptance
- Given tivuru, when instrumented, then `diagnosis/edge-order.md` states the mechanism with `SmetanaForJson.java:139-141` and the origin line in `layout.ts` BEFORE any source edit (commit order proves it: the artifact may be its own earlier commit in the worktree).
- Given the fix, when `diff-one.mts --structural` runs on the 16 rows, then each reports 0 diffs; given json/bidire-98 and yaml/coxima-79 (pinned byte-exact), then their goldens still match byte for byte.
- Given `oracle/goldens/json-family-structural.json`, when the gate runs, then every `clean` row is clean and no `divergent` ceiling is exceeded (manifest unchanged).
- `npx vitest run tests/unit/json tests/oracle/svg-conformance/json-family-structural.test.ts tests/oracle/svg-conformance/{json,yaml,hcl}.golden.ratchet.test.ts --maxWorkers=2 --coverage.enabled=false` green.

Observability: N/A. Rollback: Reversible.
