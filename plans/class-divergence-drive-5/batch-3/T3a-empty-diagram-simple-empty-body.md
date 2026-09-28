# T3a: empty-diagram-simple-empty-body (26 rows)

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

### empty-diagram-simple-empty-body
Mechanism: A class diagram with no entities (only title/footer/legend) gets a 0x0 body in the port. Upstream uses a 10x10 `EntityImageSimpleEmpty`. Chrome stacks below a 10px-tall body, and the document margin plus the ensureVisible +1 apply.
Upstream: `svek/GraphvizImageBuilder.java:211-212` — "if (dotData.isDegeneratedWithFewEntities(0)) return new EntityImageSimpleEmpty(dotData.getSkinParam().getBackgroundColor());"
Port: `src/diagrams/class/layout.ts:214` — "return { totalWidth: 0, totalHeight: 0, leaves: [], edges: [], namespaces: [] };"
(Diagnosed in `diagnosis/S4-style.md`, example row `unknown/basoto-36-resu245`, confidence HIGH (instrumented: 0/0 after the 10x10 body).)

### chrome-atomtext-min-height (secondary on `unknown/cimono-94-ximu187`)
Mechanism: see the secondary rows (sections) in their shard files
Upstream: `klimt/creole/legacy/AtomText.java:179-181`
Port: `src/core/annotations/blocks-creole.ts:165`
(Diagnosed in `diagnosis/S4-style.md`.)

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
- `unknown/basoto-36-resu245`
- `unknown/bikavu-22-rago633`
- `unknown/bogide-54-buco992`
- `unknown/cenucu-07-mepi600`
- `unknown/cimono-94-ximu187`
- `unknown/gemigi-37-safi979`
- `unknown/jadamo-76-xabi141`
- `unknown/kumuti-42-tace851`
- `unknown/lavoke-68-lezi492`
- `unknown/liboma-63-gamu743`
- `unknown/lijota-92-sove350`
- `unknown/lirumo-81-jega996`
- `unknown/locoge-06-luki835`
- `unknown/nilimi-64-xeco438`
- `unknown/nulevu-49-bovi390`
- `unknown/pefigi-94-raxa740`
- `unknown/ragudu-37-poxi589`
- `unknown/rirelu-80-tagi213`
- `unknown/rufala-47-nosa835`
- `unknown/sofobo-48-meme531`
- `unknown/sprite-SVG-fill-management-0`
- `unknown/sprite-SVG-fill-management-1`
- `unknown/sprite-SVG-fill-management-4`
- `unknown/sufura-56-muke185`
- `unknown/tenava-30-cele768`
- `unknown/zovojo-65-gocu245`

## Write-set
- `src/core/annotations/blocks-creole.ts`
- `src/diagrams/class/layout.ts`
- their unit tests under `tests/`
A pure type or file-cap move that extends this set is push-forward (journal it in
your report). Anything else is stop 1: report instead of editing.

## Read-set
Java: `svek/GraphvizImageBuilder.java:211-212`, `:169-171`; `klimt/creole/legacy/AtomText.java:179-181`
Port: `src/diagrams/class/layout.ts:214`; `src/core/annotations/blocks-creole.ts:165`
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
