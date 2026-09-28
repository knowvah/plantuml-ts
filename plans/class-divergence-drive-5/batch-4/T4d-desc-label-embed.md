# T4d: desc-label-embed (4 rows)

Return only the structured report: commit sha, rows moved, and residuals with
mechanisms. No preamble, no trailing summary.

## Prior observations
S3 finding: the jar SIZES a description-label embed at the 42x42 catch fallback (`EmbeddedDiagram.java:137-150` takes the SVG branch only when the StringBounder is the SVG one) but DRAWS the real image. Wire the draw path; keep the 42x42 sizing, or the box geometry that already matches will diverge.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at
`~/git/plantuml` (branch `dot-output`, upstream `97a5992`) is the specification.
Read the project `CLAUDE.md` first ("READ THE JAVA FIRST", "Never fit a value",
"Do not refactor while porting", "Preserve upstream names"). The oracle is the
1.2026.8beta1 jar. The cache is at `test-results/dot-cache/<tree>/<slug>/in.svg`.
Families in this task (from `diagnosis/families.md`; each row's own section in its
shard file has the first diff and any row-specific note):

### desc-label-embed-unported
Mechanism: the description-text ISkinSimple hands EmbeddedDiagram a renderer that always throws. `drawU` catches it and draws nothing (instrumented: 3× "EmbeddedDiagram.drawU: renderer failed"). The registered nested renderer (`nested-diagram-registry.ts#getNestedDiagramRenderer`, already used by `annotations/blocks-creole.ts:404`) is never consulted. Box sizes still match because the jar's own `calculateDimensionSlow` also lands on its `new XDimension2D(42, 42)` catch fallback in the oracle env (`EmbeddedDiagram.java:137-150`: the SVG branch is gated on `stringBounder.matchesProperty("SVG")`; jar image y-steps are 42px while the drawn images are 51×54). The fix must wire only the draw path and keep the 42×42 sizing.
Upstream: `EmbeddedDiagram.java:169-175` — "if (isSvg) { final String imageSvg = getImageSvg(…); final UImageSvg svg = new UImageSvg(imageSvg, 1); ug.draw(svg); return; }"
Port: `src/core/svek/image/EntityImageDescriptionDelegates.ts:121-128` — "throw new Error('EntityImageDescriptionDelegates: embedded diagrams ({{ ... }}) inside a description label are not supported -- …')" (installed at `:299` "const renderer = blockedEmbeddedRenderer();")
(Diagnosed in `diagnosis/S3-structure.md`, example row `unknown/kelefe-72-cefi192`, confidence HIGH (instrumented).)

### desc-atom-text-tab-draw
Mechanism: The description-leaf text atom is sized with the tab rule, so the rect width 154.488 equals the jar's (56 = `fontSize*4` per tab, `AtomText.ts:19-33`). The draw emits the whole run at the atom origin, so tab-indented lines are not shifted.
Upstream: `klimt/creole/legacy/AtomText.java:210-231`: "final StringTokenizer tokenizer = new StringTokenizer(text, \"\\t\" + Jaws.BLOCK_E1_REAL_TABULATION, true); ... if (s.equals(\"\\t\") ...) { final double remainder = x % tabSize; x += tabSize - remainder; } else { ... ug.apply(new UTranslate(x, ypos)).draw(utext); x += dim.getWidth(); }".
Port: `src/core/svek/image/EntityImageDescriptionDelegates.ts:213-215`: "if (atom.kind === 'text') { const m = measureLine(...); ug.apply(new UTranslate(0, m.height - m.descent)).draw(UText.build(atom.text, atom.font));". The atom is drawn at x=0 with no tab tokenizer.
(Diagnosed in `diagnosis/S1-text.md`, example row `unknown/rizisu-50-liza998`, confidence MEDIUM (the size match is measured; the draw path is read).)

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
- `desc-label-embed-unported` rows revealed by T3b's dispatch: `unknown/gubeca-19-lemu434`, `unknown/jixibu-01-xave465`, `unknown/josebu-55-seje426`, `unknown/tefeco-12-rato895`. tefeco is a `label` leaf whose whole content is the embed: once the embed draws, `USymbolLabel#asSmall` (no border) should show it; its diff ROSE 1/2 -> 8/12 at close-b3 because the failed embed now leaves it empty.

## Rows
- `unknown/kelefe-72-cefi192`
- `unknown/komuvi-52-vave599`
- `unknown/rizisu-50-liza998`
- `unknown/rojida-14-fuli428`

## Write-set
- `src/core/svek/image/EntityImageDescriptionDelegates.ts`
- `src/core/svek/image/EntityImageDescriptionName.ts`
- their unit tests under `tests/`
A pure type or file-cap move that extends this set is push-forward (journal it in
your report). Anything else is stop 1: report instead of editing.

## Read-set
Java: `cucadiagram/BodyEnhanced2.java:91-94`; `EmbeddedDiagram.java:125-151,169-175`; `cucadiagram/BodyEnhanced2.java:91-94` + `EmbeddedDiagram`; `klimt/creole/legacy/AtomText.java:210-233`
Port: `src/core/svek/image/EntityImageDescriptionDelegates.ts:124`; `src/core/svek/image/EntityImageDescriptionDelegates.ts:121-131,299`; `src/core/svek/image/EntityImageDescriptionDelegates.ts:213-216`
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
