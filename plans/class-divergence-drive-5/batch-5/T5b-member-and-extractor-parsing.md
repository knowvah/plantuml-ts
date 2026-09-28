# T5b: member-and-extractor-parsing (3 rows)

Return only the structured report: commit sha, rows moved, and residuals with
mechanisms. No preamble, no trailing summary.

## Prior observations
none beyond the per-row sections in the shard diagnosis files.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at
`~/git/plantuml` (branch `dot-output`, upstream `97a5992`) is the specification.
Read the project `CLAUDE.md` first ("READ THE JAVA FIRST", "Never fit a value",
"Do not refactor while porting", "Preserve upstream names"). The oracle is the
1.2026.8beta1 jar. The cache is at `test-results/dot-cache/<tree>/<slug>/in.svg`.
Families in this task (from `diagnosis/families.md`; each row's own section in its
shard file has the first diff and any row-specific note):

### member-method-params-reformatted
Mechanism: The port decomposes a method into name and params, then re-serialises it, which normalises the whitespace inside the parentheses. Upstream draws the raw member text. The preprocessor output keeps `( FOORepositoryInterface )` (instrumented).
Upstream: `cucadiagram/Member.java:133-137`: "this.display = StringUtils.trin(Guillemet.GUILLEMET.manageGuillemet(displayClean.substring(1)));". The display is the verbatim source text.
Port: `src/diagrams/class/class-member-parser.ts:175-185`: "const rawParams = methodMatch[2]!.trim(); ... rawParams.split(',').map((p) => p.trim())". `class-layout-helpers.ts:128` then rebuilds it: "return `${member.name}(${member.params.join(', ')})${typeSuffix}`;".
(Diagnosed in `diagnosis/S1-text.md`, example row `unknown/potase-97-japa248`, confidence HIGH (instrumented: preprocessed line and parsed member dumped).)

### member-double-bracket-url-stripped (secondary on `unknown/jixipo-21-mefu703`, `unknown/zivenu-37-nace681`)
Mechanism: see the secondary rows (sections) in their shard files
Upstream: `cucadiagram/Member.java:93`
Port: `src/diagrams/class/class-member-parser.ts:29`
(Diagnosed in `diagnosis/S1-text.md`.)

### class-decl-as-case-sensitive (secondary on `unknown/jixipo-21-mefu703`, `unknown/zivenu-37-nace681`)
Mechanism: see the secondary rows (sections) in their shard files
Upstream: `regex/Pattern2.java:114`
Port: `src/diagrams/class/class-declaration-extractors.ts:362,379,390`
(Diagnosed in `diagnosis/S1-text.md`.)

### generic-space-before-angle
Mechanism: the port's id/generic split requires the `<` to touch the id. Instrumented: `class Person <Eloquent>` gives id `Person <Eloquent>` with no typeParams, while `class Person<Eloquent>` splits correctly. `PersonRich extends Person` then creates a second, phantom `Person`, which adds a DOT node (dotEqual false) and reorders every uid.
Upstream: `classdiagram/command/CommandCreateClassMultilines.java:106-107` — "new RegexOptional(new RegexConcat(RegexLeaf.spaceZeroOrMore(), new RegexLeaf(1, \"GENERIC\", \"\\\\<(\" + GenericRegexProducer.PATTERN + \")\\\\>\"))),"
Port: `src/diagrams/class/class-declaration-extractors.ts:398` — "const idThenGeneric = /^([^\\s<>]+)(<.*>)$/.exec(rest.trim());"
(Diagnosed in `diagnosis/S3-structure.md`, example row `unknown/nepevi-24-dune081`, confidence HIGH (instrumented).)

## Task (TDD)
1. Write a failing unit test that pins the upstream behaviour at the lowest layer
   that shows it (parser, layout, or render helper). Assert specific values.
2. Port the upstream behaviour at the mechanism's origin (`rules/diagnosis.md`
   scope). Add a JSDoc `@see` to the Java `file:line` on every ported symbol, and an
   upstream citation on every constant.
3. Run `npx jiti plans/class-divergence-drive/tools/render-diff.mts <tree/slug...>`
   on this task's rows. Report each row's structural/numeric counts before and
   after.
4. Gates in the worktree: targeted `npx vitest run <your test files>` (check the
   collected count), `npm run typecheck`, `npx eslint <changed files>`. The
   orchestrator runs the full suite after merge.

## Rows
- `unknown/nepevi-24-dune081`
- `unknown/potase-97-japa248`
- `unknown/zaxavo-08-rake498`

## Write-set
- `src/diagrams/class/class-declaration-extractors.ts`
- `src/diagrams/class/class-layout-helpers.ts`
- `src/diagrams/class/class-member-parser.ts`
- their unit tests under `tests/`
A pure type or file-cap move that extends this set is push-forward (journal it in
your report). Anything else is stop 1: report instead of editing.

## Read-set
Java: `cucadiagram/Member.java:133-137`; `cucadiagram/Member.java:93`; `regex/Pattern2.java:114`; `classdiagram/command/CommandCreateClassMultilines.java:106-107`
Port: `src/diagrams/class/class-member-parser.ts:175-185`; `class-layout-helpers.ts:127-128`; `src/diagrams/class/class-member-parser.ts:29`; `src/diagrams/class/class-declaration-extractors.ts:362,379,390`; `src/diagrams/class/class-declaration-extractors.ts:398`
`plans/class-divergence-drive-5/decisions.md#D5`; the shard sections for every row above.

## Architecture decisions (locked)
`plans/class-divergence-drive-5/decisions.md` D1–D9. dot-engine is off limits
(stop 11). Never sign an acceptance (D7).

## Interface contracts
none

## Acceptance
- Given each row above, when rendered via `renderSync`, then the element named in
  its first diff equals the jar's.
- Given the task's rows, then each is conformant, OR its residual is stated with a
  mechanism (Java and port `file:line`).
- Given the full suite (orchestrator), then all four gates are green and no ratchet
  pin is lost.

## Quality bar
90/90/90 coverage on changed files. Hook complexity limits (30 NLOC functions,
CCN 10, 500-line files).

## Boundaries
- Always: quote the Java before claiming parity.
- Ask first (halt): the write-set is insufficient, or the Java contradicts the
  diagnosis.
- Never: fit a value, edit `~/git/knowvah/dot-engine`, touch the oracle, or push.

## Commit
`fix(class): <what, lowercase, ≤72 chars>` (non-class paths: pick the scope that
fits, e.g. `fix(creole): …`). The body gives the mechanism, the upstream citation,
and the rows moved. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
