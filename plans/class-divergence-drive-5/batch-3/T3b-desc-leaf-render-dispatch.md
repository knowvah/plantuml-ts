# T3b: desc-leaf-render-dispatch (25 rows)

Return only the structured report: commit sha, rows moved, and residuals with
mechanisms. No preamble, no trailing summary.

## Prior observations
S3 note: `desc-label-embed-unported` rows (T4d) sit behind this dispatch; after widening the allow-list, jixibu/jefidu/sprite-SVG-Fill-Stroke-Combinatory-1 keep residuals (embedded json child count; SVG-sprite stroke-width 1 vs 0.5) — report them, do not chase them here. S2 note: beboke/febuli/fipezo keep +1 px and fezaro 0.5 px after the scratch fix; those also carry degenerate-check-after-group-mute (T4a) as a secondary.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at
`~/git/plantuml` (branch `dot-output`, upstream `97a5992`) is the specification.
Read the project `CLAUDE.md` first ("READ THE JAVA FIRST", "Never fit a value",
"Do not refactor while porting", "Preserve upstream names"). The oracle is the
1.2026.8beta1 jar. The cache is at `test-results/dot-cache/<tree>/<slug>/in.svg`.
Families in this task (from `diagnosis/families.md`; each row's own section in its
shard file has the first diff and any row-specific note):

### desc-leaf-classbox-fallback
Mechanism: Upstream sends every DESCRIPTION leaf to `EntityImageDescription`. The port's render dispatch allowlists only 6 usymbols. A `circle`/`entity`/`file`/`card`/`actor/` leaf parses correctly (AST: `kind: 'descriptive', usymbol: 'circle'`) and is sized as a description leaf (`tryMeasureDescriptionLeaf`), but it is drawn as a generic class box.
Upstream: `svek/GeneralImageBuilder.java:160-167`: "if (leaf.getLeafType() == LeafType.DESCRIPTION) { ... return new EntityImageDescription(leaf, portionShower, links, bibliotekon);". `CommandCreateElementMultilines.java:182-187` makes every non-usecase TYPE0/TYPE1 leaf `LeafType.DESCRIPTION` with its `USymbol`.
Port: `src/diagrams/class/renderer-usymbol-entity.ts:235-252`: "classifier.kind === 'descriptive' && (classifier.usymbol === 'actor' || ... 'component' || 'database' || 'node' || 'rectangle' || 'package')". Any other usymbol falls to `renderClassifierBox` (`renderer.ts:69-73`).
(Diagnosed in `diagnosis/S1-text.md`, example row `unknown/felixe-38-dilu011`, confidence HIGH (instrumented. With the allowlist widened to every descriptive usymbol in the scratch copy, felixe drops to 0 structural and 2 numeric diffs, and its ellipse and texts are byte-identical to the jar.).)

### usymbol-leaf-entity-color-dropped
Mechanism: `buildUSymbolEntityParams` builds the paint from theme-level element colours only, so the entity's own `#White` BACK colour, which is parsed and present on the classifier, never reaches `EntityImageDescription`.
Upstream: `svek/image/EntityImageDescription.java:164-166`: "HColor backcolor = colors.getColor(ColorType.BACK); if (backcolor == null) backcolor = styleTitle.value(PName.BackGroundColor)...".
Port: `src/diagrams/class/renderer-usymbol-entity.ts:170`: "backcolor: resolveElementPaint(theme, symbolKeyword, 'background'),". The classifier carries `color: '#White'` (AST dump).
(Diagnosed in `diagnosis/S1-text.md`, example row `unknown/jimizu-14-zole306`, confidence MEDIUM (AST instrumented, draw path read).)

### collapsed-group-leaf-stereo-dropped (secondary on `unknown/catana-32-licu332`, `unknown/cevoti-40-jeco305`, `unknown/fepiko-26-vobi566`, `unknown/gigoru-88-naze087`, `unknown/guxico-27-bofu708`, `unknown/juzica-68-kava475`, `unknown/noxebo-98-foga433`, `unknown/tobevo-04-mata128`)
Mechanism: see the secondary rows (sections) in their shard files
Upstream: `svek/image/EntityImageDescription.java:194-202`
Port: `src/diagrams/class/renderer-usymbol-entity.ts:167`
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
- `unknown/beboke-62-zofu377`
- `unknown/deployment-last-name-multi-line-0`
- `unknown/febuli-89-dusi249`
- `unknown/felixe-38-dilu011`
- `unknown/fepudo-00-ziro735`
- `unknown/fepulu-27-soci473`
- `unknown/fezaro-08-nopo877`
- `unknown/fipezo-93-zimi512`
- `unknown/gogisu-39-bepa573`
- `unknown/gubeca-19-lemu434`
- `unknown/jefidu-98-gisu131`
- `unknown/jimizu-14-zole306`
- `unknown/jixibu-01-xave465`
- `unknown/josebu-55-seje426`
- `unknown/juzuno-58-gesi397`
- `unknown/kefuna-77-kago547`
- `unknown/lezema-07-vogu604`
- `unknown/maxure-10-temu215`
- `unknown/petuju-02-zino378`
- `unknown/pugesu-08-cove285`
- `unknown/sprite-SVG-Fill-Stroke-Combinatory-1`
- `unknown/tefeco-12-rato895`
- `unknown/vugime-87-zabe159`
- `unknown/xagomi-49-caki729`
- `unknown/zivebo-26-nagu813`

## Write-set
- `src/diagrams/class/class-geo-types.ts`
- `src/diagrams/class/class-namespace.ts`
- `src/diagrams/class/renderer-usymbol-entity.ts`
- their unit tests under `tests/`
A pure type or file-cap move that extends this set is push-forward (journal it in
your report). Anything else is stop 1: report instead of editing.

## Read-set
Java: `svek/GeneralImageBuilder.java:160-167`; `svek/image/EntityImageDescription.java:164-166`; `svek/image/EntityImageDescription.java:194-202`; `svek/image/EntityImageEmptyPackage.java:126-137`
Port: `src/diagrams/class/renderer-usymbol-entity.ts:235-252` (allowlist), `:99-103` (keyword cast); `src/diagrams/class/renderer-usymbol-entity.ts:235-249`; `src/diagrams/class/renderer-usymbol-entity.ts:170`; `src/diagrams/class/renderer-usymbol-entity.ts:167`; not yet located (render side; layout carries it: `class-namespace.ts:106`)
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
