# Fix-task template (T10 fills one copy per task: `batch-N/T<N><x>-<family>.md`)

Also generate `batch-N/overview.md` with the table
`| ID | Description | Agent | Writes | Depends On | Done |`, plus a line saying each
task runs in its own worktree and the batch closes via `../close-procedure.md`.

---

# T<N><x>: <family> (<rows> rows)

Return only the structured report: commit sha, rows moved, and residuals with
mechanisms. No preamble, no trailing summary.

## Prior observations
<the matching `.agent-notes/` entries, if any; else "none">

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at
`~/git/plantuml` (branch `dot-output`, upstream `97a5992a`) is the specification.
Read the project `CLAUDE.md` first ("READ THE JAVA FIRST", "Never fit a value",
"Do not refactor while porting", "Preserve upstream names"). The oracle is the
1.2026.8beta1 jar. The cache is at `test-results/dot-cache/<tree>/<slug>/in.svg`.

Mechanism (from `diagnosis/families.md`): <1–2 sentences>
Upstream: `<Java file:line>` — "<quote>"
Port: `<file:line>` — "<quote>"

## Task (TDD)
1. Write a failing unit test that pins the upstream behaviour at the lowest layer
   that shows it (parser, layout, or render helper). Assert specific values.
2. Port the upstream behaviour at the mechanism's origin (`rules/diagnosis.md`
   scope). Add a JSDoc `@see` to the Java `file:line` on every ported symbol, and an
   upstream citation on every constant.
3. Run `npx jiti plans/class-divergence-drive/tools/render-diff.mts <tree/slug...>`
   on this family's rows. Report each row's structural/numeric counts before and
   after.
4. Four gates.

## Rows
<tree/slug list>

## Write-set
<port files, plus their test files>. A pure type or file-cap move that extends
this set is push-forward (journal it). Anything else is stop 1.

## Read-set
<Java files with line ranges; port files with line ranges; `decisions.md#D5`>

## Architecture decisions (locked)
`plans/class-divergence-drive-5/decisions.md` D1–D9. dot-engine is off limits
(stop 11). Never sign an acceptance (D7).

## Interface contracts
<exports another task in a later batch consumes, or "none">

## Acceptance
- Given <row>, when rendered via `renderSync`, then <the specific element> equals
  the jar's.
- Given the family's rows, then each is conformant, OR its residual is stated with a
  mechanism.
- Given the full suite, then all four gates are green and no ratchet pin is lost.

## Quality bar
90/90/90 coverage on changed files. Hook complexity limits (30 NLOC functions,
CCN 10, 500-line files).

## Boundaries
- Always: quote the Java before claiming parity.
- Ask first (halt): the write-set is insufficient, or the Java contradicts the
  diagnosis.
- Never: fit a value, edit `~/git/knowvah/dot-engine`, touch the oracle, or push.

## Commit
`fix(class): <what, lowercase, ≤72 chars>`. The body gives the mechanism, the
upstream citation, and the rows moved. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
