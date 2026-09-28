# T5c: cluster-style-and-title (14 rows)

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

### cluster-style-signature-unmerged
Mechanism: Upstream merges the cluster header's style signature with the group's stereotype, so `rectangle { .boundary { FontColor red } }` colours both the title and the stereo. The port reads a fixed default (title) or the flat per-element font (stereo) and never merges a stereotype- or sub-selector-scoped style. This is the same unmerged-signature root S4 found for cluster borders.
Upstream: `svek/ClusterHeader.java:144-150`: "return signature.withTOBECHANGED(g.getStereotype()).with(g.getStereostyles()).getMergedStyle(...)" (title), and `:209-215`: "Cluster.getDefaultStyleDefinition(...).forStereotypeItself(g.getStereotype()).getMergedStyle(...)" (stereo block).
Port: `src/diagrams/class/renderer.ts:109`: "fontColor: DEFAULT_GROUP_FONT_COLOR," (title); `class-cluster-header.ts:123-127`: "const own = theme.colors.elements?.[ns.usymbol]?.font; return typeof own === 'string' ? own : DEFAULT_GROUP_FONT_COLOR;" (stereo).
(Diagnosed in `diagnosis/S1-text.md`, example row `unknown/catana-32-licu332`, confidence MEDIUM (read). The secondary is HIGH (instrumented)..)

### group-linestyle-dropped
Mechanism: `<style> rectangle { LineStyle 7-7 }` is part of the merged cluster and leaf style upstream. The port builds a thickness-only stroke for USymbol clusters. The descriptive leaf's stroke reads only per-declaration `#line.dashed` (`renderer-classifier-colors.ts:436-438`), so the dash never appears.
Upstream: `svek/Cluster.java:402-407` — "if (colors.getSpecificLineStroke() != null) return colors.getSpecificLineStroke(); return style.getStroke();" and `style/Style.java:299-300` — "return getStroke(PName.LineThickness, PName.LineStyle);"
Port: `src/diagrams/class/class-namespace-usymbol-shape.ts:202` — "UStroke.withThickness(GROUP_STROKE_WIDTH * scaleK),"
(Diagnosed in `diagnosis/S4-style.md`, example row `unknown/palida-11-pexu992`, confidence MEDIUM (read, not instrumented).)

### cluster-header-sprite-stereotype
Mechanism: the cluster stereo block never tries the stereotype's sprite, so a `<<$sprite>>` group stereotype yields no block at all. Instrumented: `package P <<$java>> { class Y }` renders no image and no stereo text. The header is sized and drawn as if unstereotyped.
Upstream: `svek/ClusterHeader.java:199-201` — "final TextBlock tmp = stereotype.getSprite(skinParam); if (tmp != null) return tmp;"
Port: `src/diagrams/class/class-cluster-header.ts:30-31` — "Not modelled: a sprite stereotype (`stereotype.getSprite(skinParam)`, `ClusterHeader.java:199-201`)"
(Diagnosed in `diagnosis/S3-structure.md`, example row `unknown/dilese-24-neku812`, confidence HIGH (instrumented).)

### namespace-title-bypasses-creole
Mechanism: Namespace/package titles are lexed directly by `buildLineAtoms` instead of going through the full creole sheet. `CreoleParser`'s per-line `manageGuillemet` never runs, so `<<…>>` in a title is neither converted nor measured as `«…»`.
Upstream: `svek/ClusterHeader.java:128`: "TextBlock result = label.create(fontConfiguration, alignment, g.getSkinParam());" goes through `klimt/creole/legacy/CreoleParser.java:175`: "stripes = createStripes(skinParam.guillemet().manageGuillemet(cs.toString()), ...".
Port: `src/diagrams/class/class-namespace-title-runs.ts:159`: "for (const atom of buildLineAtoms(label, font).atoms) {". This is the raw StripeSimple lexer, with no `CreoleParser` guillemet step.
(Diagnosed in `diagnosis/S1-text.md`, example row `unknown/pijugo-91-jilo150`, confidence MEDIUM (read).)

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

## Added at close-b4 (journal row 78)
- `package-visibility-icon` — `unknown/topave-65-ceso890` (T4b fixed its class headers; the package half remains): `ClusterHeader.java:130-139` merges `VisibilityModifier#getUBlock` left of the cluster title (drawn at the cluster stroke 1.5), set only when present by `CommandPackage.java:189-192`. Port: the package pattern in `class-command-containers.ts` discards the char; the title width is `class-geo-builders.ts:218` (`getWTitle`), the drawing `class-namespace-shape.ts`. Reuse `class-visibility-icon.ts` / `class-header-visibility-geo.ts` (T4b) for the icon block.
- `usecase-business-alignment` — `unknown/gejuvu-17-vufu851`: `EntityImageDescription.java:143-149`'s style signature `{…, usecase, business, title}` matches `plantuml.skin:452-454` `usecase { HorizontalAlignment center }` by subsequence; `renderer-usymbol-entity.ts#titleAlignmentFor` checks the literal `usecase`. (Its tiny sizing residual lives in `class-layout-helpers.ts:344`, T5b's file: report, do not edit.)

## Rows
- `unknown/catana-32-licu332`
- `unknown/cevoti-40-jeco305`
- `unknown/dilese-24-neku812`
- `unknown/fepiko-26-vobi566`
- `unknown/gigoru-88-naze087`
- `unknown/guxico-27-bofu708`
- `unknown/juzica-68-kava475`
- `unknown/noxebo-98-foga433`
- `unknown/palida-11-pexu992`
- `unknown/pijugo-91-jilo150`
- `unknown/tobevo-04-mata128`
- `unknown/xukono-55-nezi535`
- `unknown/zasuxe-15-lugo662`
- `unknown/zivilu-35-leja732`

## Write-set
- `src/diagrams/class/class-cluster-header.ts`
- `src/diagrams/class/class-namespace-shape.ts`
- `src/diagrams/class/class-namespace-title-runs.ts`
- `src/diagrams/class/class-namespace-usymbol-shape.ts`
- `src/diagrams/class/class-package-style.ts`
- `src/diagrams/class/renderer-usymbol-entity.ts`
- `src/diagrams/class/renderer.ts`
- `src/diagrams/class/class-command-containers.ts`
- `src/diagrams/class/class-geo-builders.ts`
- their unit tests under `tests/`
A pure type or file-cap move that extends this set is push-forward (journal it in
your report). Anything else is stop 1: report instead of editing.

## Read-set
Java: `svek/ClusterHeader.java:144-150,209-215`; `svek/Cluster.java:286-296,316-320`; `style/FromSkinparamToStyle.java:128`; `svek/Cluster.java:402-407`; `style/Style.java:299-320`; `svek/ClusterHeader.java:199-201`; `svek/ClusterHeader.java:115-128`; `klimt/creole/legacy/CreoleParser.java:175`
Port: `src/diagrams/class/renderer.ts:109`; `class-cluster-header.ts:123-127`; `class-namespace-title-runs.ts:52-57`; `src/diagrams/class/renderer.ts:101`; `src/diagrams/class/class-package-style.ts:114-115`; `src/diagrams/class/class-namespace-usymbol-shape.ts:202`; `src/diagrams/class/class-cluster-header.ts:30-34` (documented "Not modelled"); `src/diagrams/class/class-namespace-title-runs.ts:159,169`
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
