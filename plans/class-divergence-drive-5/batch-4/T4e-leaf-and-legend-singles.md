# T4e: leaf-and-legend-singles (8 rows)

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

### legend-document-background-cascade
Mechanism: `skinparam BackgroundColor transparent` is a `document`-level style that upstream merges into the legend's signature. The port applies only legend-prefixed skinparams, so the legend keeps the skin's #DDD.
Upstream: `style/FromSkinparamToStyle.java:180`: "addConvert(\"BackgroundColor\", PName.BackGroundColor, SName.document);". `EntityImageLegend.java:49-51` merges `{root, root, document, <diagram>, legend}`. `StyleStorage.java:102-116` merges every matching style with `OVERWRITE_EXISTING_VALUE`, and the precedence is the value's `AutomaticCounter` priority (`FromSkinparamToStyle.java:357`), so the later skinparam `document` value outranks the skin's `document { legend { BackGroundColor #D } }`.
Port: `src/core/annotations/annotation-skinparam.ts:120-123`: "for (const [rawKey, value] of skinparam) { const key = normaliseAnnotationKey(rawKey); if (!key.startsWith(prefix)) continue;". Only `legend*` keys reach the legend.
(Diagnosed in `diagnosis/S1-text.md`, example row `unknown/tonake-05-zibo183`, confidence MEDIUM (read; the priority rule is inferred from the jar's `none`).)

### legend-style-maximumwidth-ignored
Mechanism: The legend's line-break strategy is hard-wired to NONE, so a `<style>` `MaximumWidth` never wraps the legend.
Upstream: `activitydiagram3/ftile/EntityImageLegend.java:53-54`: "return style.createTextBlockBordered(note, ..., Style.ID_LEGEND, style.wrapWidth());". `Style.wrapWidth()` reads `PName.MaximumWidth`, which `<style> legend { MaximumWidth 100 }` sets directly.
Port: `src/core/annotations/blocks-creole.ts:477`: "const block = buildChromeCreoleBlock(lines, style, LineBreakStrategy.NONE, paint.sprites);". The doc comment at `:426-436` assumes that only a skinparam could set it.
(Diagnosed in `diagnosis/S1-text.md`, example row `unknown/terede-92-fuka839`, confidence MEDIUM (read).)

### descriptive-leaf-ink-fallthrough
Mechanism: (1) The ink walk uses the class-box rule for a leaf that `renderer-usymbol-entity.ts:236-252` really draws through `EntityImageDescription`. The UPath's exact min corner is replaced by x−1/y−1, which shifts the whole diagram +1,+1. The allowlist's own doc comment says rectangle/package render elsewhere, which is now false. (2) The folder label block height ignores creole heading sizes. foo2 is laid out 51 tall instead of the jar's DOT 55 (`svek-1.dot`: 0.763889in), which moves foo1's rank centring by 2.
Upstream: `klimt/drawing/LimitFinder.java:164-166` — "addPoint(x + shape.getMinX(), y + shape.getMinY()); addPoint(x + shape.getMaxX(), y + shape.getMaxY());" (the `package X [..]` leaf is `EntityImageDescription`+`USymbolFolder`, GeneralImageBuilder.java:160-167, and draws a `UPath`). Also `klimt/creole/legacy/StripeSimple.java:199-202` — "case 0: return fontConfiguration.bigger(4).bold();"
Port: `src/diagrams/class/class-layout-description-leaf-ink.ts:30-34` — the `DESCRIPTION_LEAF_INK_SYMBOLS` allowlist is `'component','database','node'` only, so a descriptive `package`/`rectangle` leaf reaches `class-ink-box.ts:273` "addClassifierBoxInk(box, c);" (the EntityImageClass rect+UEmpty rule, x−1/y−1). Also `src/core/svek/image/leaf-sizing-folder.ts:108` — "textBlockHeight(text, lineH) + atomHeightBonus(...)", where every line is billed at the base 14px, so the `= Creole heading` line (18px) is under-measured by 4.
(Diagnosed in `diagnosis/S4-style.md`, example row `unknown/cepedu-19-namu934`, confidence HIGH (instrumented: addPlainInk for descriptive package → 18 numeric left; +4 heading height → pass=true).)

### enhanced-body-icon-block-height
Mechanism: The enhanced-body (`__`-separated) row builder omits the member block height and top that the classic builder sets (class-member-rows.ts:233-238). The icon is centred on the 14px font instead of the 30px row: (30−14)/2 = 8.
Upstream: `klimt/geom/PlacementStrategyVisibility.java:67` — "result.put(ent1.getKey(), new XPoint2D(0, 2 + y + (maxHeight12 - height1) / 2));"
Port: `src/diagrams/class/class-body-enhanced-layout.ts:270` — "...(m.visibilityExplicit === true ? { visibilityIcon: m.visibility, visibilityIsField: !isMethodMember(m) } : {})," (no `visibilityBlockHeight`/`visibilityBlockTopDy`), so `renderer-classifier-rows.ts:116` "const blockHeight = row.visibilityBlockHeight ?? fontSize;" centres on 14
(Diagnosed in `diagnosis/S4-style.md`, example row `unknown/rinidi-95-neko205`, confidence HIGH (instrumented: logged rows lack the fields; adding them → pass=true).)

### separator-none-namespace-parent
Mechanism: with `set separator none`, `splitOnSeparator` returns null. The non-chain branch then pushes the new namespace without `parentId: enclosing`. Instrumented AST: `{id:'f1.f2'}` has no `parentId`, while the `useNewPackage`-only control gets `parentId:'f1'`. So `f1` looks empty and collapses to a leaf, and `f2` is emitted as a root cluster (our DOT differs from `svek-1.dot`). Upstream nests every unresolved name under the current group's quark when the separator is null.
Upstream: `net/atmp/CucaDiagram.java:252-256` — "if (sep == null) { final Quark<Entity> result = this.firstWithName(full); if (result != null) return Failable.ok(result); return Failable.ok(getCurrentGroup().getQuark().child(full));"
Port: `src/diagrams/class/class-container.ts:136-145` — "state.activeNamespace = effectiveId; if (ns.find((n) => n.id === effectiveId) === undefined) { … ns.push({ id: effectiveId, display, classifiers: [], creationIndex });"
(Diagnosed in `diagnosis/S3-structure.md`, example row `unknown/cilibi-66-tasa181`, confidence HIGH (instrumented AST + DOT).)

### empty-package-leaf-url-dropped
Mechanism: the collapsed empty package leaf's geo does carry `url` (instrumented: `org.jgrapes.core` leaf has `url`). The empty-package renderer ignores it and never emits the `<a>` wrapper that EntityImageEmptyPackage draws.
Upstream: `svek/image/EntityImageEmptyPackage.java:148-149` — "if (url != null) ug.startUrl(url);" … `:168-169` "if (url != null) ug.closeUrl();" (`:102` "this.url = entity.getUrl99();")
Port: `src/diagrams/class/renderer-empty-package-leaf.ts:25-51` (builds `nsGeo` from `geo`; never reads `geo.url`)
(Diagnosed in `diagnosis/S3-structure.md`, example row `unknown/rukate-37-jabu394`, confidence HIGH (instrumented).)

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
- `desc-usymbol-ink-missing` (new family, 8 rows): `unknown/beboke-62-zofu377`, `unknown/febuli-89-dusi249`, `unknown/felixe-38-dilu011`, `unknown/fezaro-08-nopo877`, `unknown/fipezo-93-zimi512`, `unknown/gogisu-39-bepa573`, `unknown/jimizu-14-zole306`, `unknown/juzuno-58-gesi397`. All are structural 0 after T3b; the residual is the canvas (1–7px). Mechanism: `class-ink-box.ts:210-274#addClassifierInk` gives these descriptive usymbols the class-box `(x-1, y-1)` border ink; upstream measures the drawn `EntityImageDescription` shape through `LimitFinder` (`klimt/drawing/LimitFinder.java`), which has no such border. Mirror how the existing actor/usecase `symbolInk` branches do it. If the fix needs `class-layout-leaf-shapes.ts` (T4b's file) stop and report.

## Rows
- `unknown/cepedu-19-namu934`
- `unknown/cilibi-66-tasa181`
- `unknown/gasevo-58-ciso782`
- `unknown/pavozu-43-tone454`
- `unknown/rinidi-95-neko205`
- `unknown/rukate-37-jabu394`
- `unknown/terede-92-fuka839`
- `unknown/tonake-05-zibo183`

## Write-set
- `src/core/annotations/annotation-skinparam.ts`
- `src/core/annotations/annotation-style-overrides.ts`
- `src/core/annotations/blocks-creole.ts`
- `src/diagrams/class/class-body-enhanced-layout.ts`
- `src/diagrams/class/class-container.ts`
- `src/diagrams/class/class-ink-box.ts`
- `src/diagrams/class/class-layout-description-leaf-ink.ts`
- `src/diagrams/class/renderer-empty-package-leaf.ts`
- their unit tests under `tests/`
A pure type or file-cap move that extends this set is push-forward (journal it in
your report). Anything else is stop 1: report instead of editing.

## Read-set
Java: `style/FromSkinparamToStyle.java:180`; `activitydiagram3/ftile/EntityImageLegend.java:49-51`; `style/StyleStorage.java:102-116`; `activitydiagram3/ftile/EntityImageLegend.java:53-54`; `klimt/drawing/LimitFinder.java:164-166,184-188`; `svek/GeneralImageBuilder.java:160-167`; `klimt/geom/PlacementStrategyVisibility.java:62-67`; `net/atmp/CucaDiagram.java:252-256`; `svek/image/EntityImageEmptyPackage.java:102,148-149,168-169`
Port: `src/core/annotations/annotation-skinparam.ts:120-129`; `src/core/annotations/blocks-creole.ts:477`; `src/diagrams/class/class-layout-description-leaf-ink.ts:30-34` → `class-ink-box.ts:273`; `src/diagrams/class/class-body-enhanced-layout.ts:270`; `src/diagrams/class/class-container.ts:136-150`; `src/diagrams/class/renderer-empty-package-leaf.ts:25-51`
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
