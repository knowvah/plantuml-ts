# T2a: class-style-consumers

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

## Task (TDD) — family A, class half (D2)
Consume T1a's `ElementColors` fields in the cluster/group/package renderers:
`Cluster.java:286-296,316-320,402-407` (border, LineStyle, gradient),
`ClusterHeader.java:199-215` (stereotype/title font colours),
`EntityImageEmptyPackage.java:126-137` (collapsed-group leaf `<<x>>` line and
stroke; cdd5 `collapsed-group-leaf-stereo-dropped`), and the empty-package legend
(bijufi). cdd5 T5c ported the border half already (`fc31640d4`); build on it.

## Rows
- `unknown/catana-32-licu332` (cluster-style-signature-unmerged)
- `unknown/cevoti-40-jeco305` (cluster-style-signature-unmerged)
- `unknown/fepiko-26-vobi566` (cluster-style-signature-unmerged)
- `unknown/gigoru-88-naze087` (cluster-style-signature-unmerged)
- `unknown/guxico-27-bofu708` (cluster-style-signature-unmerged)
- `unknown/juzica-68-kava475` (cluster-style-signature-unmerged)
- `unknown/noxebo-98-foga433` (cluster-style-signature-unmerged)
- `unknown/tobevo-04-mata128` (cluster-style-signature-unmerged)
- `unknown/palida-11-pexu992` (group-linestyle-dropped)
- `unknown/zivilu-35-leja732` (group-linestyle-dropped)
- `unknown/fokudi-24-limo685` (package-borderstyle-unported)
- `unknown/bisefo-56-dumu120` (skinparam-gradient-flattened)
- `unknown/kacecu-90-pudi895` (skinparam-gradient-flattened)
- `unknown/bijufi-98-xafa015` (empty-package-leaf-legend)

## Write-set
- `src/diagrams/class/class-cluster-header.ts`
- `src/diagrams/class/class-package-style.ts`
- `src/diagrams/class/class-namespace-usymbol-shape.ts`
- `src/diagrams/class/class-empty-package.ts`
- `src/diagrams/class/renderer.ts`
- `src/diagrams/class/renderer-usymbol-entity.ts`
- `src/diagrams/class/renderer-empty-package-leaf.ts`
- their unit tests under `tests/`

## Read-set
T1a's report (field list); `.agent-notes/cdd5-T5c.md`; the Java above.

## Interface contracts
Input: T1a's `ElementColors` fields (see T1a's commit).

## Acceptance
- Given each row, when rendered, then it is conformant or its residual is stated with a mechanism.
- Given the class ratchet, then no pin is lost.
## Architecture decisions (locked)
`decisions.md` D1–D12; this task leans on D2. dot-engine is off limits.

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
