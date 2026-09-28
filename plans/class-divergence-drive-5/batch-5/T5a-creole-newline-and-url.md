# T5a: creole-newline-and-url (4 rows)

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

### creole-e1-newline-split
Mechanism: `%newline()` returns `Jaws.BLOCK_E1_NEWLINE` (U+E100, `tim/builtin/Newline.java`, `JawsFlags.USE_BLOCK_E1_IN_NEWLINE_FUNCTION = true`). Upstream's simple-stripe parser splits a display line on U+E100 into separate stripes. The port builds one stripe, so the sentinel reaches `UText`, which renders it as "↵" (`core/klimt/shape/UText.ts:168`).
Upstream: `klimt/creole/legacy/CreoleStripeSimpleParser.java:164`: "for (String singleLine : line.split(\"\" + Jaws.BLOCK_E1_NEWLINE)) { final StripeSimple stripe = ...; result.add(stripe); }". It is reached from `CreoleParser.java:113-114`.
Port: `src/core/klimt/creole/legacy/CreoleParser.ts:408`: "const build = buildLineAtoms(line, fontConfiguration);" … `:419` "return [createSimpleStripe(build.atoms, ...)]". That is ONE stripe per display line.
(Diagnosed in `diagnosis/S1-text.md`, example row `unknown/buitin-newline-chr-0`, confidence HIGH (instrumented via output: the "↵" glyph in ours is `UText`'s E100 replacement, which proves the unsplit sentinel reached the draw).)

### creole-url-hyperlink-color-hardcoded
Mechanism: The creole url colour is a constant in the port, so `root`- or stereotype-scoped `HyperlinkColor` never reaches any link (title, member, class name).
Upstream: `klimt/creole/legacy/StripeSimple.java:224-225`: "atoms.add(AtomTextUtils.createUrl(url, fontConfiguration, skinParam));". The url atom takes the `FontConfiguration`'s hyperlink colour, which is built from the merged style (`FontConfiguration.java:57-60`). `SkinParam.java:305-308` falls back to BLUE only when nothing is set.
Port: `src/core/klimt/creole/command/CommandCreoleUrl.ts:60`: "const HYPERLINK_COLOR = '#0000FF';", applied unconditionally at `:94`.
(Diagnosed in `diagnosis/S1-text.md`, example row `unknown/jixipo-21-mefu703`, confidence MEDIUM for the primary (read). The secondaries are HIGH (AST: id `TRES AS ""`; uno's members lack the url row)..)

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
- `unknown/buitin-newline-chr-0`
- `unknown/jixipo-21-mefu703`
- `unknown/zeraje-11-semu839`
- `unknown/zivenu-37-nace681`

## Write-set
- `src/core/klimt/creole/command/CommandCreoleUrl.ts`
- `src/core/klimt/creole/legacy/CreoleParser.ts`
- their unit tests under `tests/`
A pure type or file-cap move that extends this set is push-forward (journal it in
your report). Anything else is stop 1: report instead of editing.

## Read-set
Java: `klimt/creole/legacy/CreoleStripeSimpleParser.java:164`; `CreoleParser.java:113-114`; `klimt/creole/legacy/StripeSimple.java:224-226`; `klimt/font/FontConfiguration.java:57-60`; `skin/SkinParam.java:305-311`
Port: `src/core/klimt/creole/legacy/CreoleParser.ts:408-419`; `src/core/klimt/creole/command/CommandCreoleUrl.ts:60,94`
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
