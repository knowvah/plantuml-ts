# T3d: portin-and-package-title-table

Return only the structured report: commit sha(s), files changed, per-row
render-diff structural/numeric before → after, residuals with mechanisms (Java +
port `file:line`), write-set extensions, test counts. No preamble.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at `~/git/plantuml`
(branch `dot-output`, upstream `97a5992`) is the specification. Read `CLAUDE.md`
first ("READ THE JAVA FIRST", "Never fit a value", "Do not refactor while porting",
"Preserve upstream names"). The oracle is the 1.2026.8beta1 jar; caches at
`test-results/dot-cache/<tree>/<slug>/in.svg`. Row mechanisms: `fixtures.md`
(cdd5 + T0d columns) and `diagnosis/verify.md`.

## Task (TDD)
1. portin/portout leaves (bonaco): the class engine never emits them
   (`EntityImagePort`, `svek/Cluster.java` port handling; cdd5 S2 `class-portin-unported`, L).
2. package visibility icon (topave): the jar's DOT title table is `WIDTH="30"
   HEIGHT="10"`, the `ClusterHeader.java:130-139` mergeLR of the icon block feeding the
   dims at `:78-90`; the port computes them from the label alone
   (`class-namespace-title-table.ts#namespaceTitleTableDims`, `class-dot-clusters.ts:100`),
   and the package command drops the visibility char (`CommandPackage.java:189-192`).
   Reuse `class-visibility-icon.ts` / `class-header-visibility-geo.ts`.
3. zasuxe (added at T0e; T0d amended, re-slotted from T3a, `diagnosis/verify.md`
   "node order inside cluster abc"): upstream prints a group's own leaves first and
   its muted empty child packages after (`GraphvizImageBuilder.java:431-433`
   `printEntities(g.leafs()); printGroups(g)`, `:416-418`); the port pushes a
   collapsed package onto the parent's `classifiers` in source order
   (`class-namespace.ts:117`) and `class-dot-clusters.ts:81` copies that into
   `nodeIds`, so `def`/`ghj` precede `abc-service` in the subgraph and both engines
   put the component rightmost. Order `nodeIds` as non-collapsed leaves, then
   `collapsedGroup` leaves in child-group order. Do not touch the draw-side
   `collapsedGroup` order (`class-leaf-order.ts`, xitobu/daxeno).

## Rows
- `unknown/bonaco-71-xefu608` (class-portin-unported)
- `unknown/topave-65-ceso890` (package-visibility-icon)
- `unknown/zasuxe-15-lugo662` (cluster-node-order; re-slotted from T3a at T0e)

## Write-set
- `src/diagrams/class/class-dot-clusters.ts`
- `src/diagrams/class/class-dot-graph.ts`
- `src/diagrams/class/class-port-rows.ts`
- `src/diagrams/class/class-namespace-title-table.ts`
- `src/diagrams/class/class-command-containers.ts`
- `src/diagrams/class/class-namespace-shape.ts`
- `src/diagrams/class/class-namespace.ts` (added at T0e: only if zasuxe is fixed at the push site)
- their unit tests under `tests/`

## Read-set
cdd5 journal rows 75, 80; cdd5 S2 diagnosis `class-portin-unported`.

## Interface contracts
none.

## Acceptance
- Given bonaco and topave, then each is conformant or its residual is stated.
- Given class DOT parity, then it stays green.
## Architecture decisions (locked)
`decisions.md` D1–D12; this task leans on —. dot-engine is off limits.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over the tests
covering changed modules plus: `tests/unit/class/`, `tests/oracle/svg-conformance/class.golden.ratchet.test.ts`, `tests/oracle/class-dot-parity.test.ts` (report the collected file count). `npm run
typecheck`; `npx eslint <changed files>`. No full `npm test`. New src module ⇒
`npm run catalog` and commit `docs/catalog.md`. Complexity hook: ≤30 NLOC per
function, CCN ≤10, ≤5 params, ≤500-line files. Worktree rules: README "Execution
rules" (absolute worktree paths; no Serena edit tools; no `git stash`).

## Boundaries
- Always: quote the Java before claiming parity; cite `file:line` on every ported
  symbol (`@see`) and constant.
- Stop and report (do not edit): a needed file outside the write-set (beyond a pure
  type/file-cap move), or Java that contradicts the stated mechanism.
- Never: fit a value, touch the oracle or dot-engine, push.

## Commit
`fix(<scope>): <what, lowercase, ≤72 chars>`, one per family; body with mechanism,
upstream citation, rows moved. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
