# cdd-T25 — header/edge-label creole (plain, size, xamule)

## Round 2 (2026-09-22) — the `<plain>` stop-1 item, unblocked

T26 merged; `src/core/klimt/creole/` (specifically `legacy/CommandCreoleBuilder.ts`)
is no longer T26's write-set, so the stop-1 halt from round 1 (below) is
resolved: `FontStyle.PLAIN` is now registered
(`src/core/klimt/creole/legacy/CommandCreoleBuilder.ts#registerPlain`,
`CommandCreoleStyle.ts`'s `ACTIVATION_SOURCE`/`DEACTIVATION_SOURCE`/
`LEGACY_STARTERS[FontStyle.PLAIN]`, `AddStyle.ts#addFontStyle`'s
clear-all-styles branch) per `CommandCreoleBuilder.java:83-84`/
`FontStyle.java:47-48,89-90,114-115,142-143`/`FontConfiguration.java:301-309`.
diseka went from 2/7 → **1/0**: text content, `x`, `y`, `font-size`,
`fill="#888"`, `textLength="79.363"` all now byte-exact against jar. The
ONE remaining structural diff (`font-weight`: jar `700`, this port none) is
a TRACED, not guessed, residual — see decision-journal row 120 for the
full mechanism (`DriverTextSvg.java:93-103`'s two-tier styles-vs-base-face
weight fallback, which this port's flat `FontConfiguration` cannot
reproduce without a model change in `src/core/klimt/shape/UText.ts`,
outside this task's unlock and with a project-wide blast radius). **NOT
force-fitted** — reported honestly rather than silently claiming 0
structural. Gekope (unaffected, no `<plain>` in its source): unchanged
12/65 → 12/65. Full `npm test`: 0 failures, JSON-reporter count (781)
matches on-disk `.test.ts` count, no non-class golden/ratchet moved —
zero movers to journal beyond the diseka/gekope pair. Commit
`fix(cdd-T25): register the creole <plain> style command`.

## Round 1 (original task) — before/after (`npx jiti plans/class-divergence-drive/tools/render-diff.mts`)

| Fixture | Before (structural/numeric) | After (structural/numeric) | Disposition |
|---|---|---|---|
| `diseka-11-gozu390` | 3 / 7 | 2 / 7 (round 2: **1 / 0**, see above) | Partial fix (color); `<plain>` tag-strip UNBLOCKED in round 2 |
| `daxeno-00-kasu166` | 12 / 135 | 12 / 135 (unchanged) | Diagnosed; genuinely-large fix deferred (see below) |
| `xamule-03-jeda376` | 5 / 976 | 2 / 975 | Fixed (the 3 removed structural diffs are exactly the target mechanism; remaining 2 structural / 975 numeric are a pre-existing, unrelated multi-edge coordinate divergence in this fixture) |
| `lecelo-92-loma110` | 7 / 8 | 6 / 7 | Diagnosed (LOW confidence confirmed); real fix is T26 territory, left open |
| `gekope-01-ricu859` (bonus, found during blast-radius audit) | 14 / 65 | 12 / 65 | Fixed (same mechanism as diseka's color half, minus the PLAIN block) |

## Observation: `<plain>` is unregistered in the creole command map — T26 territory, stop-1
- **Context**: diagnosing diseka's `<color:#888888><plain>Enumeration</plain></color>` header text, which
  rendered the tags literally with the default `#000` fill instead of `#888`.
- **Finding**: `src/core/klimt/creole/legacy/CommandCreoleBuilder.ts:23-27`'s own doc comment already
  says `FontStyle.PLAIN` is unported ("not in L1's ... set"). Upstream registers it unconditionally in
  BOTH the `FULL` and `OTHER` maps (`~/git/plantuml/.../klimt/creole/legacy/CommandCreoleBuilder.java:83-84`,
  `CommandCreoleStyle.createLegacy(FontStyle.PLAIN)` / `createLegacyEol(FontStyle.PLAIN)`; starters `<p`/`<P`,
  `FontStyle.java:47-48`). Since it is unregistered, `buildLineAtoms` (`StripeSimple.ts`, called from
  `class-layout-header-creole.ts#buildHeaderLine`) treats the whole `<plain>Enumeration</plain>` run as
  ONE literal-text atom — the outer `<color:#888888>` command IS registered and DOES set the atom's
  color correctly (confirmed: after this task's atom-wiring fix, diseka's line renders
  `fill="#888"` — correct — with the literal tag text still attached).
- **Java mechanism for WHY jar keeps line 1 bold despite `<plain>` (traced but not portable here)**:
  `FontConfiguration.add(FontStyle.PLAIN)` (`FontConfiguration.java:301-309`) clears the tracked
  `styles` EnumSet, but the CURRENT font object (`currentFont`, carrying the skinparam-derived
  bold/italic FACE) is never mutated by `add()` — only `getFont()`'s transient `mutateFont` loop
  would reset it, and that value is used for MEASUREMENT only. The render-time weight decision
  (`DriverTextSvg.java:93-103`) is a TWO-TIER fallback: `containsStyle(BOLD) ? 700-ish :
  (face.getCssWeight() != 400 ? that weight : nothing)` — i.e. a header's OWN skinparam-bold FACE
  weight survives `<plain>` through the SECOND branch, even though the tracked style flag was
  cleared. This port's `FontConfiguration` (`src/core/klimt/shape/UText.ts:24-59`) deliberately
  collapsed this two-tier model into one flat `styles` set (see that file's own doc comment,
  lines 33-39: "DRIVER-side concerns... will be ported alongside `DriverTextSvg` itself") — porting
  `<plain>`'s true fidelity therefore needs BOTH the command registration (`src/core/klimt/creole/`,
  T26) AND this two-tier weight model (`src/core/klimt/shape/UText.ts` + its SVG driver equivalent),
  a strictly larger, separable item.
- **Impact**: stop condition 1 (`src/core/` outside T25's write-set) halts the PLAIN-registration
  half of diseka's fix. Filed as a T26 follow-on below. The M8b atom-wiring fix in this task's
  write-set (see next observation) still lands the COLOR half correctly, and — as an accidental
  consequence of never clearing the seeded base-font `styles` (because PLAIN never runs) — this
  port's diseka output happens to ALSO keep font-weight="700" on line 1, matching jar's real
  output, though for a structurally different reason than jar's own two-tier fallback.
- **Confidence**: High (jar file:line + TS file:line both traced; verified against the actual
  rendered SVG, not merely read).
- **UPDATE (round 2, 2026-09-22)**: PLAIN is now registered (T26 merged, `src/core/klimt/creole/`
  unblocked). This prediction held exactly: once PLAIN correctly clears `styles` (matching
  `FontConfiguration.add`), the ACCIDENTAL bold-retention described above disappears — and the
  TRUE two-tier-fallback gap (predicted here) becomes a real, measured 1-structural-diff residual
  on diseka (`font-weight` missing). Not fixed this round either: still needs the
  `src/core/klimt/shape/UText.ts` model change this note already named, which remains outside
  what's been authorized (only `src/core/klimt/creole/` was unblocked) and has a project-wide
  blast radius. See decision-journal row 120 for the full, re-verified mechanism.

## Observation: classifier header rows never carried per-atom creole atoms (M8b, now fixed)
- **Context**: `.agent-notes/cdd-T19.md` §M8b flagged this as unfiled — `class-layout-header-creole.ts
  #buildHeaderLineMetrics` built real per-atom creole atoms (color, size, bold, monospace, ...) but
  discarded them, returning only a flattened `displayText`; `class-stereotype-layout.ts#buildHeaderRows`
  then built `ClassifierGeo['rows']` entries with NO `atoms` field, so `renderer-classifier-rows.ts
  #renderRowText`'s plain-text branch (ONE font/color for the whole row) always drew the header,
  matching upstream's real per-run TextBlock (`EntityImageClassHeader.java:107-108`'s
  `display.create8(...)`) only when the header carried no markup at all.
- **Finding**: fixed within this task's write-set (`class-layout-header-creole.ts`,
  `class-layout-header-geo.ts`, `class-stereotype-layout.ts` — the last two are NOT in T25's named
  4-file list but are the direct consumer chain of `buildHeaderLineMetrics`/`buildHeaderRows`,
  inside `src/diagrams/class/`, not owned by T24/T26/T28's carve-outs). `buildHeaderLine` now reports
  `hasMarkup` (true iff the line's resolved atoms differ from ONE untouched-text atom — the SAME
  "measurement-identity" invariant `class-member-creole.ts`'s own module doc comment already proves);
  `buildHeaderLineMetrics` seeds the atoms' BASE font styles from `memberBaseFont` (`class-member-
  creole.ts`, already exported, T24-owned but a pure import — no edit to that file), mirroring
  upstream's `FontConfiguration.create`→`getStyles(font)` bake-in of the header's OWN
  `classFontStyle`/kind-derived italic; `buildHeaderRows` sets `row.atoms` ONLY for a markup-bearing,
  non-blank line, so a markup-free header (the overwhelming majority of the corpus) renders through
  the byte-identical pre-T25 plain-text path.
- **Blast-radius audit**: grepped every `class`/`enum`/`interface`/`abstract class`/`entity`/
  `annotation` declaration in the corpus for a quoted display carrying a real creole starter
  (`<color`, `<size`, `<b`, `<i`, `<u`, `<back`, `<font`, `<plain`, `<U+`, `<:name:>`) — 3 real hits
  beyond diseka/lecelo (`gekope-01-ricu859`'s `<b> Some dict </b>`/`<b> Some entity </b>`;
  `nesuti-69-giza389`/`zaxate-23-xifa551`'s `Foo<int>`/`Foo<double>` are FALSE POSITIVES — `<int`/
  `<double` don't match the anchored `<[iI]>` BOLD/ITALIC activation pattern, generic-tag names,
  unaffected). `gekope-01-ricu859` was ALREADY non-conformant on this exact mechanism pre-T25
  (`text[1]/@font-weight exp=700 act=` on both classifier headers) — this task's fix resolves it
  (verified: `font-weight="700"` now present, matching jar) with zero new regressions (full
  `npm test`, 22027 passed, only the catalog-drift test needed `npm run catalog`).
- **Confidence**: High (jar-verified on gekope; measurement-identity invariant already proven by R2i).

## Observation: xamule's edge-label `<size:N>` was resolved for the DOT box but not the ink
- **Context**: `xamule-03-jeda376`'s `Book - Foo : <size:30>to Foo >` drew the literal
  `<size:30>to Foo` tag at the base 13pt arrow font instead of "to Foo" at 30pt.
- **Finding**: `class-edge-label-measure.ts#resolveMagicArrowText` (measurement arm, feeding the DOT
  reservation) already called `resolveLineFont` (`core/edge-label-box.ts:76-80`) to strip the tag and
  resolve the override size — already correct per a prior fix ("verified correct since 2026-09-08").
  `class-edge-label-attach.ts#attachMagicArrow` (the RENDER arm, building `edgeGeo.label`/
  `edgeGeo.arrowGlyph`) used the RAW `magic.text` and the BASE `ctx.labelFont` unconditionally — the
  measurement/render split upstream never has (`SvekEdge.java:304`'s `addMagicArrow` builds the
  drawn TextBlock and the reserved dimension from the SAME resolved font in one call).
- **Fix**: exported `resolveMagicArrowText` from `class-edge-label-measure.ts` and reused it (one
  resolver, two call sites — matches the module's own new doc comment) in `attachMagicArrow`; the
  arrow GLYPH itself stays at the base font size (`TextBlockArrow2.calculateDimension`,
  `klimt/shape/TextBlockArrow2.java:57,87` — the glyph slot is ALWAYS the base arrow font, only the
  text run's font changes, matching the pre-existing doc comment's own citation). Added
  `EdgeGeo['label'].fontSize?: number` (`class-geo-types.ts`) and threaded it through
  `renderer-edge.ts#renderEdgeSingleLabel` (extracted from `renderEdgeMainLabel` to stay under the
  30-NLOC hook after the added field — pure split, no behavior change to the multi-line arm).
- **Verified**: `plans/.../measurements/out/xamule-03-jeda376.ours.svg` now draws
  `<text ... font-size="30" textLength="76.688">to Foo</text>`, byte-identical to jar's own
  `to Foo` text (only the `x` position differs, from a PRE-EXISTING, unrelated multi-edge routing
  divergence in this same fixture — confirmed via `git stash`-style before/after: that divergence
  was already present in the FIRST render-diff reading taken at mission start).
- **Confidence**: High (jar-verified byte-exact on the target text/font-size/content).

## Observation: lecelo's `<:name:>` icon shorthand is real Twemoji-style artwork, not a Unicode glyph — confirmed LOW-confidence mechanism, T26 territory
- **Context**: `lecelo-92-loma110`'s third class uses `<:label:>`/`<:wrench:>`/`<:hammer_and_wrench:>`
  — LOW confidence per the brief, distinct from `<U+1F3F7>`/`&#127991;` (the first two classes, which
  already render correctly as plain-text Unicode glyphs).
- **Finding**: `~/git/plantuml/.../test-results/dot-cache/class/lecelo-92-loma110/in.svg` draws the
  THIRD class's icons as real multi-`<path>`, multi-fill-color vector artwork (a label tag, a
  wrench, a hammer-and-wrench glyph) — NOT a plain-text emoji character, unlike jar's own rendering
  of the FIRST class's `<U+1F3F7>` (`<text>🏷 U+1F3F7</text>`, a plain glyph). `src/core/klimt/creole/
  Emoji.ts:76,122,166` already maps `label`/`wrench`/`hammer_and_wrench` to the SAME codepoints
  (1f3f7/1f527/1f6e0) `<U+XXXX>` uses, so `CommandCreoleEmoji` (`src/core/klimt/creole/command/
  CommandCreoleEmoji.ts`, T26-owned) was ALREADY resolving `<:label:>` to an emoji atom BEFORE this
  task (confirmed: the very first, pre-T25 render-diff reading already showed "🏷 label" — the
  platform Unicode glyph — as the header's flattened plain text). This task's M8b atom-wiring fix
  changed the RENDER only (per-atom instead of flattened), so the SAME already-resolved emoji atom
  now draws at its own emoji font-size (21, matching `.agent-notes/r2i-creole-class-wiring.md`'s
  documented `AtomEmoji` sizing) as its own `<text>` element instead of being folded into the row's
  flat string — `childCount` moved from 4 to 7 of the expected 11, a directionally-correct exposure
  of a PRE-EXISTING, already-documented gap (`.agent-notes/r2i-creole-class-wiring.md`'s own
  "Twemoji artwork not ported" finding: this port renders the PLATFORM Unicode glyph, never the
  real bundled vector icon jar draws), not a new defect T25 introduced.
- **Disposition**: instrumented per the brief; mechanism IS confident (Twemoji/OpenMoji vector
  artwork not ported), but the FIX (real icon artwork, `renderer-openiconic.ts`-adjacent) is
  explicitly T26's `src/core/klimt/creole/` + rendering territory, not T25's. Left named-but-open,
  per the brief's own instruction not to force a fix on this family.
- **Confidence**: High mechanism, but the underlying artwork gap is a pre-existing, cross-mission
  item — not resolvable inside T25's write-set.

## Observation: daxeno's package title needs a genuinely larger, separable fix — deferred
- **Context**: `daxeno-00-kasu166`'s two packages carry `<size:18>styled</size>\nshould be styled`
  display text. A PACKAGE title never reaches `class-layout-header-creole.ts` at all (confirmed by
  reading, not assuming) — it is a DOT CLUSTER label, built by TWO separate, un-creole-aware call
  sites: `class-namespace-title-table.ts#namespaceTitleTableDims` (feeds the DOT cluster's
  `labelWidth`/`labelHeight`/`titleTableWidth`/`titleTableHeight` reservation via
  `class-dot-clusters.ts:74-90`) and `class-namespace-shape.ts#getWTitle`/`getHTitle`/
  `renderNamespaceFolder` (the folder-tab RENDER, one flat `<text>` at one font size). Both treat
  `ns.display` as a single unsplit, un-parsed string — no `splitDisplayLines`, no `buildLineAtoms`.
  Upstream builds this title via `ClusterHeader#getTitleBlock` (`svek/ClusterHeader.java:115-142`,
  `label.create(fontConfiguration, alignment, skinParam)` — the SAME `Display`/creole machinery, full
  multi-line + per-run creole, feeding BOTH the drawn TextBlock and (`Cluster.java:367-368`) the
  cluster's own dimension).
- **Why deferred, not fixed here**: a faithful port needs (a) multi-line + per-run-font-size support
  in `namespaceTitleTableDims` (this DIRECTLY changes the DOT cluster reservation, i.e. graphviz
  layout inputs — a stop-condition-6-adjacent risk), (b) the matching render-side rewrite in
  `class-namespace-shape.ts` (currently draws exactly ONE `<text>` per package title), and (c) a new
  `NamespaceGeo` field to carry the resolved per-line atoms through to render. This is three files
  outside T25's write-set, a DIFFERENT title-block family (namespace/package, not classifier header
  or edge label) than what T25 is chartered for, and touches DOT-cluster sizing directly. Corpus
  blast-radius audit: only 2 fixtures in the entire corpus (`daxeno-00-kasu166`,
  `jabama-09-kago823`) have a `\n`/creole-bearing package or namespace display name, so the fix is
  narrow in reach but NOT narrow in mechanism (still a real multi-line-creole title-block port).
  Filed as a follow-on (`plans/class-divergence-drive/next-missions.md` candidate: "namespace/
  package title creole" — `ClusterHeader.java:115-142`, `class-namespace-title-table.ts`,
  `class-namespace-shape.ts`, `class-dot-clusters.ts`).
- **Confidence**: High (both file:line sides traced; the render/measurement gap is unambiguous from
  reading the code, not inferred).

## Follow-ons filed
- **RESOLVED round 2**: `FontStyle.PLAIN` registration (`CommandCreoleBuilder.ts`'s FULL/OTHER
  maps) — done, see the round-2 section above.
- Still open, a dedicated task (a `FontConfiguration`/`UText.ts` model change, outside
  `src/core/klimt/creole/`): the two-tier `styles`-vs-base-face weight fallback
  (`DriverTextSvg.java:93-103`) — needed to close diseka's LAST structural diff (`font-weight`)
  and any future header/member row wrapping a creole style tag around already-bold/italic text.
  Blast radius: every `FontConfiguration` consumer project-wide (class headers/members, notes,
  descriptions), not just class — needs its own measured close, not a T25-scale patch.
- T26 (or a dedicated icon-artwork mission): port real Twemoji/OpenMoji-style vector icon artwork
  for `CommandCreoleEmoji`'s `<:name:>` shorthand (currently renders the platform Unicode glyph) —
  needed for lecelo's full conformance; NOT conflated with T26's OpenIconic (`<&glyph>`) atoms, a
  separate family.
- A new task: "namespace/package title creole" — multi-line + per-run `<size:>`/`<color:>` support
  for `ClusterHeader`-equivalent package/namespace titles (`class-namespace-title-table.ts`,
  `class-namespace-shape.ts`, `class-dot-clusters.ts`), 2-fixture corpus reach
  (`daxeno-00-kasu166`, `jabama-09-kago823`) but real DOT-cluster-sizing blast radius — needs its own
  measured close, not a T25-scale patch.
