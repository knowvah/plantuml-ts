# T4a: degenerate-layout (8 rows)

Return only the structured report: commit sha, rows moved, and residuals with
mechanisms. No preamble, no trailing summary.

## Prior observations
Secondary rows elsewhere (beboke, fezaro, febuli, fokudi) carry `degenerate-check-after-group-mute` via the parse-time collapse arm `class-namespace.ts:74-120`; if the fix needs that file, it is a write-set extension to journal (T3b owns it in batch 3 only).

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at
`~/git/plantuml` (branch `dot-output`, upstream `97a5992`) is the specification.
Read the project `CLAUDE.md` first ("READ THE JAVA FIRST", "Never fit a value",
"Do not refactor while porting", "Preserve upstream names"). The oracle is the
1.2026.8beta1 jar. The cache is at `test-results/dot-cache/<tree>/<slug>/in.svg`.
Families in this task (from `diagnosis/families.md`; each row's own section in its
shard file has the first diff and any row-specific note):

### degenerate-check-after-group-mute
Mechanism: the port mutes the empty package into a leaf before the degenerate check, so a lone empty package takes `EntityImageDegenerated` (margin 7, no graphviz) where upstream still counts the group and runs graphviz (margin 6). Observer: jar 1 svek DOT, ours 0 layout inputs.
Upstream: `net/sourceforge/plantuml/dot/DotData.java:69-70` — "return entityFactory.groups().size() == 0 && getLinks().size() == 0 && getLeafs().size() == nb;"; the empty package is muted only later, inside graphviz export: `svek/GraphvizImageBuilder.java:416-418` — "if (dotData.isEmpty(g) && g.getGroupType() == GroupType.PACKAGE) { g.muteToType(LeafType.EMPTY_PACKAGE);"
Port: `src/diagrams/class/layout.ts:220` — "const collapsedAst = collapseEmptyNamespacesFinal(ast);" runs BEFORE `:244` "const degenerate = degenerateSingleClassifier(pageAst, measuredMap);", whose `class-geo-builders.ts:346` "if (ast.namespaces.length !== 0) return undefined;" then sees 0 groups.
(Diagnosed in `diagnosis/S2-edge.md`, example row `unknown/baleco-37-lili752`, confidence HIGH (instrumented: gating the degenerate path on the pre-collapse group count made the row conformant).)

### degenerate-excludes-notes
Mechanism: a lone note is a single leaf upstream and takes the degenerate path (no graphviz, margin 7); the port counts only classifiers, so it runs graphviz (margin 6). Observer: jar 0 svek DOT, ours 1 layout input.
Upstream: `dot/DotData.java:69-70` counts `getLeafs()`, which includes the NOTE leaf; `svek/GraphvizImageBuilder.java:214-222` — "if (dotData.isDegeneratedWithFewEntities(1) && … ) { … return new EntityImageDegenerated(tmp, getBackcolor());"
Port: `src/diagrams/class/class-geo-builders.ts:348` — "if (ast.classifiers.length !== 1 || ast.notes.length !== 0) return undefined;"
(Diagnosed in `diagnosis/S2-edge.md`, example row `unknown/fetajo-61-sesi146`, confidence HIGH (observer-instrumented DOT count; offset direction matches the two margins).)

### degenerate-text-ensurevisible
Mechanism: The degenerate single-leaf canvas folds in only drawn embeds' extents. It misses SvgGraphics' ensureVisible on the circle's label, which is drawn BELOW the 18x18 box at baseline 43.889 → `(int)(43.889+1)` = 44.
Upstream: `klimt/drawing/svg/SvgGraphics.java:757-758` — "ensureVisible(x, y); ensureVisible(x + textLength, y);" with `:129-133` "if (y > maxY) maxY = (int) (y + 1);"
Port: `src/diagrams/class/class-geo-builders.ts:442-443` — "totalWidth: Math.max(totalDims.width, Math.floor(embedRight) + 1), totalHeight: Math.max(totalDims.height, Math.floor(embedBottom) + 1),"
(Diagnosed in `diagnosis/S4-style.md`, example row `unknown/rupigu-89-xabo757`, confidence HIGH (arithmetic reproduces 44 exactly from the drawn `<text>`).)

### degenerate-single-note-leaf (secondary on `unknown/fukegu-14-zona532`, `unknown/logavi-03-mita108`)
Mechanism: see the secondary rows (sections) in their shard files
Upstream: `svek/GraphvizImageBuilder.java:214-221`; `svek/EntityImageDegenerated.java:53,88`
Port: `src/diagrams/class/class-geo-builders.ts:348`
(Diagnosed in `diagnosis/S1-text.md`.)

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
- `unknown/baleco-37-lili752`
- `unknown/catigu-77-keje426`
- `unknown/daroli-95-remo515`
- `unknown/fetajo-61-sesi146`
- `unknown/galata-74-luka487`
- `unknown/latilu-49-jebu021`
- `unknown/rupigu-89-xabo757`
- `unknown/vabobu-24-temi990`

## Write-set
- `src/diagrams/class/class-geo-builders.ts`
- `src/diagrams/class/layout.ts`
- their unit tests under `tests/`
A pure type or file-cap move that extends this set is push-forward (journal it in
your report). Anything else is stop 1: report instead of editing.

## Read-set
Java: `net/sourceforge/plantuml/dot/DotData.java:69-70`; `svek/GraphvizImageBuilder.java:214`, `:416-418`; `net/atmp/CucaDiagram.java:871-882`; `net/sourceforge/plantuml/dot/DotData.java:69-70`; `svek/GraphvizImageBuilder.java:214-222`; `klimt/drawing/svg/SvgGraphics.java:757-758`, `:128-135`; `svek/GraphvizImageBuilder.java:214-221`; `svek/EntityImageDegenerated.java:53,88`
Port: `src/diagrams/class/layout.ts:220,244`; `class-geo-builders.ts:346`; `src/diagrams/class/class-geo-builders.ts:348`; `src/diagrams/class/class-geo-builders.ts:418-445`
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
