# T1a: style-map-buckets

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

## Task (TDD) — family A, core half (D2)
The class renderer receives only the `Theme`; these style values never reach it
(cdd5 T5c, journal 80): `LineStyle`, the `.label` FontColor, `<sname>.stereotype`
beyond FontSize, `<sname>.title`, skinparam `<x>BorderStyle`, and skinparam gradient
colours (`#A/B`, `#A|B`, `#A-B`, `#A\B`). Extend `collectElementStyleBuckets`
(`src/core/style-map-element.ts`), `ElementColors` (`src/core/theme-graph-colors.ts`)
and the skinparam handlers so each value lands in the bucket keyed by the upstream
selector: `svek/Cluster.java:286-296,316-320,402-407` (`StyleSignatureBasic.of(root,
element, diagram, group, symbol.getSNames())`), `svek/ClusterHeader.java:199-215`
(`forStereotypeItself`), `style/FromSkinparamToStyle.java:128`,
`style/Style.java:299-320` (LineStyle), `klimt/color/HColorSet` gradient parsing
(read it). `skinparam-stereo-keys.ts:179` (`PACKAGE_BY_STEREO_RE`) must cover every
group USymbol, not only `package`. This task adds data only; T2a consumes it.

## Rows
none (no corpus row; oracle-rendered unit tests)

## Write-set
- `src/core/style-map-element.ts`
- `src/core/theme-graph-colors.ts`
- `src/core/theme-graph-colors-a.ts`
- `src/core/skinparam-stereo-keys.ts`
- `src/core/skinparam-key-handlers-table-a.ts`
- `src/core/skinparam-key-handlers-table-b.ts`
- `src/core/skinparam-accumulator.ts`
- their unit tests under `tests/`

## Read-set
`fixtures.md` rows of T2a; `.agent-notes/cdd5-T5c.md`; the Java above; `src/core/style-cascade-class-*.ts` (how buckets are consumed).

## Interface contracts
Output (consumed by T2a): optional `ElementColors` fields, each with a JSDoc
`@see` to its Java: `lineStyle?: {thickness?: number; dash?: number[]}` (or the
port's existing stroke type — reuse it), `labelFont?: Paint`, `stereotypeFont?:
Paint`, `titleFont?: Paint`, `borderStyle?: 'solid'|'dashed'|'dotted'|'bold'`,
`backgroundGradient?` (reuse the port's gradient Paint if it exists). Report the
final field list exactly; T2a is written against it.

## Acceptance
- Given `<style> group { LineStyle 2 }`, when the theme is built, then `elements.group` carries the thickness.
- Given `<style> package { stereotype { FontColor red } }` and `.label`/`title` forms, then the bucket carries each colour.
- Given `skinparam rectangleBorderStyle dashed` and `skinparam packageBackgroundColor #FFF/#000`, then the bucket carries the style and the gradient.
- Given `skinparam frame<<x>>BackgroundColor red`, then the stereotype-keyed bucket exists (not only for package).
## Architecture decisions (locked)
`decisions.md` D1–D12; this task leans on D2, D7. dot-engine is off limits.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over the tests
covering changed modules plus: `tests/unit/class/`, `tests/oracle/svg-conformance/class.golden.ratchet.test.ts`, `tests/oracle/class-dot-parity.test.ts`, `description.golden.ratchet.test.ts`, `state.golden.ratchet.test.ts`, `object.golden.ratchet.test.ts`, `sequence.diff-baseline.ratchet.test.ts`, `activity.diff-baseline.ratchet.test.ts`, `activity.style-baseline.test.ts`, `activity.text-baseline.test.ts` (non-class movement: report it with the mechanism, never re-pin) (report the collected file count). `npm run
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
