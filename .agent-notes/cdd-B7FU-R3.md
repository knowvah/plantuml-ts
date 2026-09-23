# cdd-B7FU-R3 — batch 7 residual round, item R3 (4 fixtures)

## Before -> after (`npx jiti plans/class-divergence-drive/tools/render-diff.mts <slug>`)

| Fixture | Before (7c5b695b) | After | Verdict |
|---|---|---|---|
| `daxeno-00-kasu166` | structural=10, numeric=77 | structural=0, numeric=92 | **structural-match** (fixed the color/thickness/creole/alignment mechanisms; residual is a uniform ~1px dot-engine-class shift, same signature as item 4) |
| `ropera-76-jico895` | structural=7, numeric=55 | structural=0, numeric=0 | **conformant** (write-set extended by coordinator, journal row 157; ported in full, see "Item 2 — resolved" below) |
| `juxora-90-fisu720` | structural=0, numeric=16 | unchanged | diagnosed, fix site outside write-set (stop 1) |
| `focaci-80-suzu938` | structural=0, numeric=95 | unchanged (92 after re-measure; note the brief's own `render-diff` count moves 95->92 between runs purely from `compareSvg`'s non-monotonic diff counting once OTHER fixtures' code changed nothing here — daxeno's fix touches shared files but focaci's own numbers are stable at 0/95 in isolation) | **stop 8**, filed `docs/graphviz-issues/20-taillabel-headlabel-no-canvas-reservation.md` |

## Item 1 — daxeno-00-kasu166: `<<Database>>` USymbol leaf + cluster dispatch

Four compounding mechanisms, all fixed:

1. **Empty-leaf label** (`package "..." <<Database>> {}`): the class engine's
   `tryRenderUSymbol`/`core/usymbol-shapes.ts#renderDatabaseIcon` hand-rolls
   a single middle-anchored `<text>` with no creole/multi-line support.
   Fix: added `database` to `usesClassUSymbolEntity`
   (`renderer-usymbol-entity.ts`), routing the leaf through the ALREADY
   ported, faithful `EntityImageDescription`/`USymbolDatabase#asSmall` path
   (`core/decoration/symbol/USymbolDatabase.ts:178-203`, itself already a
   complete port — the gap was purely in the class engine's DISPATCH, not
   in the port). Same mechanism SI14 T4 already used for actor/usecase/
   component; `database` was the one keyword T4 left on the old path.
2. **Title/desc alignment**: `EntityImageDescription.java:175` reads
   `defaultAlign = styleTitle.getHorizontalAlignment()`, title-scoped
   signature `{root,element,<diagram>,symbol.getSNames(),title}`.
   `plantuml.skin:452-454`'s bare `usecase { HorizontalAlignment center }`
   selector matches (upstream's subsequence-cascade) for `usecase` ONLY;
   `root { HorizontalAlignment left }` (`plantuml.skin:12`) is the default
   for actor/component/circle/database. `renderer-usymbol-entity.ts`'s
   `buildUSymbolEntityParams` hardcoded `HorizontalAlignment.CENTER` for
   every symbol reaching this dispatch — invisible for single-line displays
   (CENTER and LEFT coincide when the block is exactly as wide as its one
   line), exposed by daxeno's two-DIFFERENTLY-sized-line desc. New
   `titleAlignmentFor(symbolKeyword)`: CENTER for `usecase` only, LEFT
   otherwise. Blast radius: `actor`/`component`/`circle` shift from CENTER
   to LEFT too (more faithful per the SAME upstream default), invariant for
   every single-line fixture in the corpus — confirmed by the full `npm
   test` run (see Gates below).
3. **Cluster (non-empty `<<Database>>` package) paint**: `Cluster.java
   :358-364`'s `getStyle()` appends the USymbol's `SName` to the signature
   (`{root,element,<diagram>,group,database}`), so a `skinparam database
   {...}` element-bucket override outranks the generic `plantuml.skin
   :102-104` `group { BackGroundColor transparent; LineThickness 1.0 }`
   default. `renderer.ts#renderNamespace` (unedited, out of write-set but
   only a CALLER) passes the generic default into
   `class-namespace-usymbol-shape.ts#renderNamespaceUSymbol`; new
   `resolveClusterUSymbolPaint` there checks `theme.colors.elements
   [keyword]` for an explicit override FIRST (background only when
   `geo.color` — the inline `#COLOR` override — is unset, matching
   `Cluster#drawU`'s own inline-first cascade; border/font unconditionally,
   since no inline carry exists for those roles on `NamespaceGeo`).
   `dativu-93-pona469`'s unstyled `<<Node>>` cluster (T12's own regression
   guard) is unaffected — no `theme.colors.elements.node` bucket exists for
   it, so it keeps falling through to the generic default exactly as
   before.
4. **Cluster title alignment**: `ClusterHeader.java:125`'s
   `style.getHorizontalAlignment()` (title-scoped signature
   `{root,element,<diagram>,uSymbol.getSNames(),composite,title}`) resolves
   CENTER via `plantuml.skin:94-98`'s `element { composite,package { title
   { HorizontalAlignment center } } }` (a subsequence match, diagram/
   uSymbol-agnostic). `class-namespace-usymbol-shape.ts#buildDecoration`
   hardcoded `HorizontalAlignment.LEFT` — again invisible until daxeno's
   two-differently-sized-line cluster title exposed it (jar-verified: the
   narrower line's `@x` sits exactly `(widerWidth-narrowerWidth)/2` right
   of the wider line's `@x`, not equal to it). Fixed to CENTER; every
   other USymbol-cluster fixture in the corpus has a single-line title
   (alignment-invariant), confirmed by `npm test`.

**New skinparam mechanism** (needed for #1's stroke-width, jar-verified via
the SAME fixture's `skinparam database { border { thickness 1 } } }`):
`<sname>BorderThickness` (`FromSkinparamToStyle.java:274`'s generic
`addMagic` registration) was completely unwired for the NESTED
`skinparam <name> { border { thickness N } } }` block form (only `<style>
<sname> { LineThickness N }` reached `theme.colors.elements[sname]
.lineThickness`, a DIFFERENT source, per `style-map-element.ts:170`).
`skinparam-element-buckets.ts#matchElementLineThicknessKey` +
`skinparam-key-handlers.ts#tryElementLineThicknessBucket` close it, mirroring
`matchElementShadowingKey`'s existing shape exactly.

**Named, not chased**: daxeno's residual 92 numeric diffs (0 structural) are
a uniform ~1.7-2.3px shift + 2px-wider canvas — the SAME signature as item
4's dot-engine finding (`docs/graphviz-issues/20-...`). Not re-diagnosed
separately; the DOT input for daxeno was not re-verified byte-equal (out of
this task's remaining time budget), so it is recorded as "same class",
not "same filed issue".

**Write-set correction**: the brief listed `skinparam-key-handlers*.ts` and
`renderer-classifier-colors.ts` under "the skinparam/style handler files
under `src/diagrams/class/`" — both filenames are correct but
`skinparam-key-handlers*.ts` lives under `src/core/`, not
`src/diagrams/class/`. Grepped for a same-named file under
`src/diagrams/class/` first (none exists); edited the `src/core/` one since
the filename is unambiguous and the mechanism (a class-diagram fixture's
skinparam) has no other home. Flagging per the brief's own "note it" clause
rather than treating the path prefix as a hard boundary.

## Item 2 — ropera-76-jico895: stop 1 (diagnosed, not fixed)

`<style> class { FontStyle italic; FontSize 18; header { FontStyle bold;
FontSize 14 } } }` needs TWO cascades this port's `style-cascade-class.ts`
does not compute:

- The PLAIN (non-header) `CLASS_SNAMES` scope's `fontsize`/`fontstyle` —
  `EntityImageClass.java:92-93` (`entity.getBodier().getBody(...,
  getStyle(), null)`) feeds the member-row body font from the SAME plain
  `{root,element,classDiagram,class}` signature (`:163`) already used for
  RoundCorner/MinimumWidth/BackgroundColor/LineColor in this cascade file
  — every one of THOSE properties is already wired
  (`computeClassStyleCascadeOverrides`), only `fontsize`/`fontstyle` never
  were.
- The `HEADER_SNAMES` scope's `fontstyle` (bold/italic) — `size` is already
  wired (`classCascadeHeaderFontSize`, `applyMaximumWidthOverrides`'s
  existing `HEADER_SNAMES`+`'fontsize'` lookup); `fontstyle` never was.

`renderer-classifier-rows.ts` (in this task's write-set) is a pure
CONSUMER of the already-decided `row.bold`/`row.italic` flags — verified by
reading it (lines ~289,293: `row.italic`/`row.bold` read directly, no
independent font resolution) — so the fix cannot land there; it must land
in `class-layout-fonts.ts#resolveAttributeFont`/`resolveHeaderFont` (which
already has the exact-precedent `classCascadeHeaderFontSize` field to
mirror for the four missing ones), fed by new
`style-cascade-class.ts`/`theme-graph-colors-a.ts` fields. NONE of those
three files are in this task's write-set or any sibling batch-7 task's
(checked against the brief's own file list). Needed fix, precisely scoped
for a future task:

1. `theme-graph-colors-a.ts`: `classCascadeFontSize?: number`,
   `classCascadeFontBold?: boolean`, `classCascadeFontItalic?: boolean`,
   `classCascadeHeaderFontBold?: boolean`,
   `classCascadeHeaderFontItalic?: boolean` (5 new optional fields).
2. `style-cascade-class.ts`: `resolveStyleCascade(styleMap, CLASS_SNAMES,
   'fontsize'|'fontstyle')` and `resolveStyleCascade(styleMap,
   HEADER_SNAMES, 'fontstyle')`, parsing `'fontstyle'` the same way
   `classTagCascadeEntry` already does (`lower.includes('bold')`/
   `'italic'`) — likely a new sibling function to `applyMaximumWidthOverrides`
   for the CCN budget.
3. `class-layout-fonts.ts#resolveAttributeFont`/`resolveHeaderFont`: read
   the new fields ahead of the existing `theme.colors.graph
   .classAttributeFontSize`/`classFontSize`/`*Bold`/`*Italic` tiers (cascade
   wins over flat skinparam, matching every other property's existing
   precedence in this same file).

Ruled out: a `<style> class {}` PARSE failure (the same styleMap+
`CLASS_SNAMES` pairing already resolves `roundcorner`/`maximumwidth`/
`backgroundcolor` correctly — proven working in the SAME cascade file for
other properties); a flat-skinparam gap (`classAttributeFontSize`/
`classFontStyle` skinparam LINES already work, just not `<style>` BLOCKS).

## Item 2 — RESOLVED (coordinator-extended write-set, journal rows 158-159)

The stop-1 diagnosis above was accurate; the coordinator extended the
write-set to the exact three files it named and this round ported it in
full. `ropera-76-jico895`: 7+55 -> **0+0 (conformant)**.

Implementation (all three files, per the diagnosis's own precise shape):

1. `src/core/theme-graph-colors-b.ts` (NOT `-a`, already at the 500-line
   cap when this task started; `classCascadeRoundCorner`'s own precedent
   already splits class-cascade fields across both halves) — 5 new fields:
   `classCascadeFontSize`/`FontBold`/`FontItalic` (plain `CLASS_SNAMES`) and
   `classCascadeHeaderFontBold`/`FontItalic` (the `HEADER_SNAMES` FontStyle
   half `classCascadeHeaderFontSize` never covered).
2. `src/core/style-cascade-class-font.ts` (NEW, a 500-line-cap split of
   `style-cascade-class.ts` — that file was ALSO already at the cap after
   adding the field-list entries + wiring call) — `applyFontCascadeOverrides`,
   `resolveStyleCascade(styleMap, CLASS_SNAMES, 'fontsize'|'fontstyle')` +
   `resolveStyleCascade(styleMap, HEADER_SNAMES, 'fontstyle')`, reusing the
   PRE-EXISTING `parseFontStyleFlags` (`skinparam-key-handlers-shared.ts`)
   rather than re-deriving `classTagCascadeEntry`'s inline bold/italic
   substring test a third time. The header field is left `undefined` when
   the two `resolveStyleCascade` calls return the IDENTICAL raw string (no
   header-specific declaration to report — `resolveStyleCascade`'s own
   subset-match already inherited the plain value for the header query,
   since `HEADER_SNAMES` is a strict superset of `CLASS_SNAMES`); duplicate
   values are semantically inert either way, this is about not claiming a
   MORE SPECIFIC declaration exists when none does.
3. `src/diagrams/class/class-layout-fonts.ts` — `resolveAttributeFont`
   threads `classCascadeFontSize`/`FontBold`/`FontItalic` ahead of the flat
   `classAttributeFontSize`/`*Bold`/`*Italic` skinparam tier;
   `resolveHeaderFont` threads `classCascadeHeaderFontBold`/`FontItalic`
   the same way, with its EXISTING `?? attributeFont.bold/italic` fallback
   now the thing that surfaces the plain cascade's inherited value (no new
   inheritance code needed — the architecture already had the right shape,
   confirmed by `resolveStyleCascade`'s own subset-match doing the real
   inheritance work). `resolveCascadedFontFlag` widened 3->4 params (tag
   cascade, class cascade, flat skinparam, fallback); `resolveHeaderFont`'s
   SIZE computation extracted to `resolveHeaderFontSize` to stay under the
   per-function CCN cap the widening pushed it over.

**Bonus fix** (found closing ropera's residual 2 numeric diffs after the
structural fix landed, `Δ1.111px` on both visibility icons —
`renderer-classifier-rows.ts#attributeFontSize`, a KNOWN near-zero-harvest
fix site per its own doc comment for the IDENTICAL `classAttributeFontSize`
flat-skinparam gap): had no tier for the new `classCascadeFontSize` cascade
either. One-line fix, same priority order. `ropera-76-jico895` render-diff:
`pass=true structural=0 numeric=0`.

Cross-engine check (the two core files are shared with description/state/
object cascades, per the coordinator's own instruction): full `npm test`
green, ZERO non-class fixtures moved — every new field is additive and
`undefined` by default, so nothing changes for a diagram that never sets
these `<style>` properties.

Tests: `tests/unit/core/style-cascade-class.test.ts` (+8, mirroring the
existing `classCascadeHeaderMaximumWidth` test block's exact shape),
`tests/unit/class/class-layout-fonts.test.ts` (new — `resolveAttributeFont`/
`resolveHeaderFont` had no prior direct unit coverage).

## Item 3 — juxora-90-fisu720: stop 1 (diagnosed, not fixed)

`FlatWorks::prop3 -r-> FlatBar::prop` attaches at the wrong y (~y=97 vs
jar's y=73, `FlatBar`'s "prop" row) despite `FlatBar`'s own rendered box
being BYTE-IDENTICAL to the jar (every `<text>`/`<line>` coordinate
verified equal) — so the classifier's OWN geometry is not the defect; the
edge's PORT ATTACHMENT is.

Instrumented via `setLayoutInputObserver`: `FlatBar`'s `DotInputNode
.portRows` is `[]` (present but empty) while `FlatWorks`'s correctly has
one entry. Traced to `class-layout-generic-classifier.ts#measureGeneric
Classifier:310-312`: `if (enhancedBody !== undefined) return
buildEnhancedBodyResult(...)` — `FlatBar`'s body has a trailing `--`
divider (empty methods compartment), which `class-body-enhanced.ts
#isEnhancedBody:95-98` (`isBlockSeparatorLine` match) routes through the
"enhanced body" (creole/tree) measurement path. `buildEnhancedBodyResult`
(`class-layout-generic-classifier.ts`, exact line not located — not this
task's write-set) never sets `MeasuredClassifier.portMemberSections` at
all, so `class-port-rows.ts#classFamilyPortRows` (this task's own file,
verified CORRECT: `classPortRows`'s election loop faithfully mirrors
`MethodsOrFieldsArea#getPorts`, and `Ports#add`'s score-gated overwrite
correctly prefers a 100-score exact-word match over a 50-score substring
match — confirmed by hand-tracing `getScore("prop2","prop")=50` vs
`getScore("prop","prop")=100`, `Ports.add` keeps the higher) receives ZERO
compartments and returns `[]`.

`FlatWorks` (no `--`/tree line, NOT enhanced-body) DOES populate
`portMemberSections`, but through a DIFFERENT bug: `isMethodMember`-style
member classification (source of `class-member-rows.ts`, NOT this task's
write-set) sorts `"**Foo (Model)**"` and `"prop4 :("` into the METHODS
compartment purely because they contain a `(` — misclassifying the
"model" header comment and the sad-face-suffixed field as methods,
splitting the flat declaration order into a WRONG fields-then-methods
compartment order that does not match the rendered row order. This did
NOT move `FlatWorks`'s own OUTGOING port ("prop3", which happens to land
correctly by coincidence — not verified whether it does so for the right
reason or a lucky cancellation) but is a second, related, unfixed defect
in the same family (same root idea as T24's row-83 `sejuzo-42-fini523`
finding, different exact repro).

Considered and REJECTED: reading `ClassifierGeo.rows[]` (the flat,
always-populated, RENDER-time row list, proven byte-exact against jar) as
a fallback source for election when `portMemberSections` is `undefined`,
entirely within `class-port-rows.ts` (this task's write-set). Rejected
because `class-port-rows.ts`'s OWN doc comment (ADR-5) explicitly warns
against this: `rows[i].text` carries the visibility character whenever
`member.visibilityExplicit` is true, which is NOT upstream's election
input (`Member.getDisplay(false)`) — using it would silently elect a
DIFFERENT row for any member with an explicit `+`/`-`/`#` prefix. FlatBar's
own members have no explicit visibility (so this fixture alone would not
reveal the bug), but the fix would be systematically wrong for the general
case — not a faithful mirror, a special case the file's own architecture
already rejects.

Needed fix, precisely scoped for a future task: give the enhanced-body
measurement path (`class-body-enhanced.ts`/`class-layout-generic-
classifier.ts#buildEnhancedBodyResult`) its own `portMemberSections`
publication — either a real per-member offset/height list surfaced from
`measureEnhancedBody`'s own row-building (mirrors `buildNormalClassifier
Result`'s "publish, don't remeasure" T2 precedent, `class-port-rows.ts`'s
own header doc comment), or an explicit, named decision that enhanced-body
classifiers simply cannot carry row ports (in which case FlatBar's box
should shield the WHOLE node, not silently pick a wrong point) — a product
decision outside this task's authority to make unilaterally.

## Item 4 — focaci-80-suzu938: stop 8 (filed)

DOT input byte-equal (node widths 105.15/93.5125, tail/head label boxes
55x13/53x13 — all match the cached oracle `svek-1.dot` exactly). Real
graphviz 16.1.0 and `@knowvah/dot-engine` 1.6.0 disagree ONLY on node
centring/canvas width, and ONLY when `taillabel`/`headlabel` are present
(controlled A/B: deleting just those two attributes from the SAME DOT text
collapses real graphviz's centring to dot-engine's OWN, label-independent
value). Filed `docs/graphviz-issues/20-taillabel-headlabel-no-canvas-
reservation.md` + `TRACKER.md` line. No code change.

## Gates

`npm test` (785 files/22138 tests green, `docs/catalog.md` regenerated for
the new `matchElementLineThicknessKey` export), `npm run typecheck`,
`npm run lint`, `npm run build` all pass. `npx jiti scripts/dot-sync-
report.ts class` = 711/712 (unchanged — items 1's fixes are render/theme-
only, no DOT-emission change; items 2-4 made no code change at all).

### Round 2 (item 2, write-set extended by coordinator)

`npm test`: 789 files pass / 1 fails (`docs/catalog.md` drift, expected —
new exports), 22205/22213 tests, coverage unaffected; regenerated the
catalog and re-ran clean. `npm run typecheck`/`lint`/`build` all pass.
No DOT-emission file touched, so the dot-sync gate is unaffected by
construction (not re-run a second time this round).

## Hazard hit (memory-worthy)

`mcp__serena__replace_symbol_body` on `renderer-usymbol-entity.ts` (the
FIRST call, before switching to `Edit`) silently wrote to the MAIN
checkout (`/Users/scottseely/git/knowvah/plantuml-ts`) instead of this
worktree (`.claude/worktrees/cdd-b7fu3`) — the worktree file was left
completely unchanged (confirmed by re-reading it immediately after,
`git diff` on the worktree showed nothing, while `git -C <main> status`
showed the modification). Caught before any commit by the mission brief's
own "git status --short on the main checkout must show nothing of yours"
gate; reverted with `git -C <main> checkout -- <file>` before proceeding.
Matches the existing memory ("batch-parallelism-needs-worktrees" /
"Serena's edit tools resolve against the main checkout") exactly — this is
a second, independent confirmation of the same hazard, on a DIFFERENT
Serena tool (`replace_symbol_body`, not just generic edit tools). All
subsequent edits in this task used the `Edit`/`Write` Bash-adjacent tools
with absolute worktree paths only, per the brief's own instruction; no
further leaks observed (re-checked `git -C <main> status --short` clean
before every commit).
