# T4c: multiline-element-body (5 rows)

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

### multiline-element-blank-line-dropped
Mechanism: The port discards blank body lines of a multiline element. Upstream keeps each one as a `" "` display row, so the leaf is one 14 px row short. The second 14 px is `%newline()`: U+E100 stays inside one stripe and is drawn as "↵" (see buitin).
Upstream: `descdiagram/command/CommandCreateElementMultilines.java:192-193`: "lines = lines.subExtract(1, 1); Display display = lines.toDisplay();". Every body line is kept, blank ones included (`MultilinesStrategy.REMOVE_STARTING_QUOTE` only drops `'` lines).
Port: `src/diagrams/class/class-multiline-element.ts:122`: "if (raw.trim() !== '') pending.lines.push(raw);" (TYPE0; TYPE1 has the same at `:114`).
(Diagnosed in `diagnosis/S1-text.md`, example row `unknown/boguko-42-zuda981`, confidence HIGH (instrumented: keeping blank lines fixes the blank row and the rect gap narrows to the E100 line only).)

### multiline-usecase-kind
Mechanism: The multiline opener always creates a `descriptive` leaf, never the usecase(-business) kind. It then misses both the usecase render path and the usymbol allowlist, and draws as a class box (the same family as S4 pupoko).
Upstream: `descdiagram/command/CommandCreateElementMultilines.java:178-180`: "} else if (symbol.equalsIgnoreCase(\"usecase/\")) { type = LeafType.USECASE_BUSINESS; usymbol = USymbols.USECASE_BUSINESS;".
Port: `src/diagrams/class/class-multiline-element.ts:212-213`: "const classifier = ensureClassifier(state, code, 'descriptive', code); classifier.usymbol = usymbol;". The AST is `{kind:'descriptive', usymbol:'usecase/'}`.
(Diagnosed in `diagnosis/S1-text.md`, example row `unknown/gejuvu-17-vufu851`, confidence HIGH (instrumented: widened dispatch → 1 structural, the colour only).)

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

## Added at close-b3 (journal row 66)
- `unknown/pupoko-23-xubo613` is ALREADY conformant (fixed collaterally by T3b); drop it from this task.
- `svg-sprite-stroke-scale` (new family): `unknown/jefidu-98-gisu131`, `unknown/sprite-SVG-Fill-Stroke-Combinatory-1`. Mechanism: `src/core/klimt/sprite/svg-nanoparser-shapes.ts` scales an SVG sprite `<path stroke-width>` to 1 where the jar emits 0.5 (S1 diagnosis note on jefidu). Read the upstream SVG sprite path (`klimt/sprite/SvgNanoParser.java` and its shape classes) and port the stroke scaling at its origin.

## Rows
- `unknown/boguko-42-zuda981`
- `unknown/fidaru-93-zumu093`
- `unknown/gejuvu-17-vufu851`
- `unknown/pupoko-23-xubo613`
- `unknown/toxore-88-ruso838`

## Write-set
- `src/diagrams/class/class-multiline-element.ts`
- `src/core/klimt/sprite/svg-nanoparser-shapes.ts`
- their unit tests under `tests/`
A pure type or file-cap move that extends this set is push-forward (journal it in
your report). Anything else is stop 1: report instead of editing.

## Read-set
Java: `descdiagram/command/CommandCreateElementMultilines.java:192-193`; `descdiagram/command/CommandCreateElementMultilines.java:175-180`
Port: `src/diagrams/class/class-multiline-element.ts:114,122`; `src/diagrams/class/class-multiline-element.ts:182-183,212-213`
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
