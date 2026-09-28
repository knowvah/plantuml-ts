# T3d: json-node-shield (5 rows)

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

### json-node-emitted-as-shield
Mechanism: A json leaf is plaintext with no `portRows`, so the port treats it as a shielded node and anchors all 3 magma (packing) edges at `:h`. Upstream's RECTANGLE_HTML_FOR_PORTS json nodes take plain endpoints. The different anchoring moves b/c/d (b x 119 vs 108.575, c y 191 vs 183), which narrows the graph below the title width and re-centres it.
Upstream: `svek/image/EntityImageJson.java:240-242`: "return ShapeType.RECTANGLE_HTML_FOR_PORTS;". `svek/SvekNode.java:133-137` emits the special-for-link table, and the jar's `svek-1.dot` references `sh0006->sh0007` with no port.
Port: `src/diagrams/class/class-port-rows.ts:221-230` sets `portRows` for `map` only. `src/core/svek-dot-emit.ts:122` then gives every other `plaintext` node "return `${rec.sh}:h`;".
(Diagnosed in `diagnosis/S1-text.md`, example row `unknown/negupo-97-loro420`, confidence HIGH (instrumented: `compareStructural` shows only `portOk:false`, with candidate edges `fromPort/toPort:"h"` and oracle edges none).)

### json-duplicate-no-execution-error
Mechanism: upstream turns the second `json J {` into an execution error, and the jar's error page (`PSystemError extends UgDiagram`) then crashes in `TileText` while measuring. The port swallows the duplicate and renders the first J. After the port raises the error, the remaining gap is error page vs jar crash page, an `accept-candidate:upstream-crash` like zuduxu (cdd4 D6). Whether that crash is specific to the oracle's width-table bounder is not yet ruled out; next step: jar-render without `-DPLANTUML_DETERMINISTIC_TEXT`.
Upstream: `objectdiagram/command/CommandCreateJson.java:141-142` — "if (entity1 == null) return CommandExecutionResult.error(\"JSON already exists: \" + line0.getLazzy(\"CODE\", 0));" (entity1 is null per `:202-203` "if (quark.getData() != null) return null;")
Port: `src/diagrams/class/class-json-commands.ts:58` — "if (state.classifierIndex.has(id)) return undefined; // \"JSON already exists\"" (the duplicate is silently consumed; no `executionRefusal`)
(Diagnosed in `diagnosis/S3-structure.md`, example row `unknown/kokofa-47-deni140`, confidence HIGH (port side read and render-confirmed; jar stack trace read from `in.svg`).)

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
- `unknown/bizasu-70-vaxa243`
- `unknown/kokofa-47-deni140`
- `unknown/meramo-02-vasu175`
- `unknown/momada-03-zeka599`
- `unknown/negupo-97-loro420`

## Write-set
- `src/core/svek-dot-emit-clusters.ts`
- `src/core/svek-dot-emit.ts`
- `src/diagrams/class/class-json-commands.ts`
- `src/diagrams/class/class-port-rows.ts`
- their unit tests under `tests/`
A pure type or file-cap move that extends this set is push-forward (journal it in
your report). Anything else is stop 1: report instead of editing.

## Read-set
Java: `net/sourceforge/plantuml/svek/image/EntityImageJson.java:240-242`; `svek/SvekNode.java:132-136`; `svek/Bibliotekon.java:129-130`; `objectdiagram/command/CommandCreateJson.java:141-142,202-203`
Port: `src/diagrams/class/class-port-rows.ts:220-230`; `src/core/svek-dot-emit-clusters.ts:72`; `src/core/svek-dot-emit.ts:122`; `src/diagrams/class/class-json-commands.ts:58`
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
