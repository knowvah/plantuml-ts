# cdd3-T31 — ink box: namespace title, USymbol container walk, drawn quantifiers, database/node UEmpty

## Observation: a USymbol group's ink is now a LimitFinder walk of its own decoration
- **Context**: E1-5 (`diroxo-41-zezo954`, `<<cloud>>`). The brief's fix shape
  was a new analytic `cloud` rule.
- **Finding**: `class-namespace-usymbol-shape.ts#namespaceUSymbolInk` walks the
  SAME `ClusterDecoration` the renderer draws through `LimitFinder` at layout
  time (`NamespaceGeo.symbolInk`, local to the group). That covers the cloud
  control points (`UPath.java:84-92`), the title `UText`, the `UEmpty` of
  node/database, and every other USymbol (`frame`, `component`, `card`, ...)
  in one rule; it supersedes `inkShape` for those groups. `frame`
  (`kiluja-96-pado371`) and `component` (`xadado-92-lazo250`, 185 -> 2 N)
  containers moved too — they were on the plain-UPath fallback, but
  `USymbolFrame`/`USymbolComponent2` draw `URectangle`s (inset rule).
- **Impact**: the `inkShape` `node`/`database`/`rect` rules now only serve
  hand-built geometry (no `symbolInk`). Any future USymbol-container ink
  question: look at the walk, not a per-shape rule.
- **Confidence**: High (diroxo 0/0, liciru/mileba -> conformant).

## Observation: a USymbol group's title ignores packageFontSize upstream; ours does not
- **Context**: authored probe `package "Big title" <<Node>> {}` with
  `skinparam packageFontSize 40`.
- **Finding**: jar draws the title at 14 pt (`font-size="14"`) and a 159x133
  canvas;
  ours uses 40 pt (`class-namespace-usymbol-shape.ts#clusterTitleFont` reads
  `theme.colors.elements.package.fontSize`), 237x159 — unchanged by this
  task. Same shape as cdd3-T21's `packageFontColor` finding: the USymbol
  title style is `{..., <usymbol>, composite, title}` with no `package_`.
- **Impact**: open, not an ink term. Touches DOT sizing
  (`class-namespace-title-table.ts`) as well as the draw — a separate task.
- **Confidence**: Medium (jar output read; Java style chain not traced here).

## Observation: class `node` leaves drew a class box
- **Context**: C-8 node half (MEDIUM in the diagnosis).
- **Finding**: `renderer-usymbol-entity.ts#usesClassUSymbolEntity` had no
  `node` arm, so an allow_mixing `node` leaf fell to `renderClassifierBox`
  (a `<rect>`; jar a `<polygon>` + 3 lines). Sizing already matched (93.638 x
  44). Adding `node` to that gate and to `DESCRIPTION_LEAF_INK_SYMBOLS`
  gives both the drawn shape and the polygon+`UEmpty` ink; authored probes
  `node dummy2` (jar 246x85) and `dummy1 -- dummy2` (jar 134x198) now match.
- **Impact**: no corpus class fixture has a node leaf (0 class movers from it).
- **Confidence**: High on the canvas; the drawn polygon was not diffed
  element-by-element against the jar.

## Observation: residual — group/leaf STEREOTYPE text ink is still unmodeled
- **Context**: E1-2 fix shape named "title (and stereotype)".
- **Finding**: the stereotype block is a pre-built SVG string (folder/rect)
  or a `UComment` marker (USymbol walk), so neither contributes `drawText`
  ink. It sits at `2 + htitle` below the frame top and is centred in a frame
  at least as wide as it, so it escapes the frame only when its descent
  exceeds `htitle + 3.5` (a stereo font far larger than the title font). No
  corpus fixture or probe exercises that.
- **Impact**: named remainder, not measured.
- **Confidence**: Medium (bound derived, not jar-verified).

## Observation: base commit fails `npm run typecheck`
- **Context**: gates.
- **Finding**: `tests/unit/class/class-parser-asset-store.test.ts` (added by
  f45288701, cdd3-T23) has 10 TS errors (`{ lines }` passed as `UmlSource`,
  possibly-undefined `sprites`). Not touched here; `tsconfig.node.json`
  passes.
- **Impact**: the int branch must fix it before main.
- **Confidence**: High.

## Final report (cdd3-T31)

### Fixtures (render-diff S/N, before -> after)
- cocube-46-tusu692: 0/177 -> 0/0 (closed, E1-2 title ink).
- pixexi-81-sete111: 0/58 -> 0/0 (closed, E2-8 title ink).
- diroxo-41-zezo954: 0/181 -> 0/0 (closed, E1-5 USymbol container walk).
- focaci-80-suzu938: 0/95 -> 0/0 (closed, B-3 drawn quantifier lines).
- givofi-11-xumu978: 0/2 -> 0/0 (closed, C-8 database UEmpty).
- popesa-39-sobe866: 0/2 -> 0/0 (closed, C-8 database UEmpty).

### Ported (Java)
- `LimitFinder.java:217-224` drawText for group titles (folder
  `USymbolFolder.java:228`, rect `USymbolRectangle.java:103-131`, empty-package
  leaf) -- `class-namespace-title-ink.ts` (new).
- USymbol group = LimitFinder walk of its `ClusterDecoration`
  (`UPath.java:84-92`, `LimitFinder.java:164-167`) --
  `class-namespace-usymbol-shape.ts#namespaceUSymbolInk`.
- `SvekEdge.java:330-340,956-980`: quantifier ink = `quantifierLines` --
  `class-ink-box.ts#addQuantifierInk`.
- `USymbolDatabase.java:77`, `USymbolNode.java:90` `UEmpty(10, 10)` --
  `core/decoration/symbol/USymbolDatabase.ts#drawDatabase`,
  `USymbolNode.ts#drawNode` (whole methods); class `node` leaf routed through
  `EntityImageDescription` (`renderer-usymbol-entity.ts`,
  `class-layout-description-leaf-ink.ts`).

### Movers (pre = f4528870 unedited, post = this commit)
- class render-all (723 rows): the six above structural-match -> conformant;
  xadado-92-lazo250 0/185 -> 0/2 (component container now walked as
  `USymbolComponent2`'s URectangle -- uniform shift closed; residual
  `svg/@width` 487 vs 452 is the `{{ }}` note with no NestedDiagramRenderer,
  pre-existing). No rises, no conformant left.
- object: kiluja-96-pado371 structural-match -> conformant (`frame` container
  walk). 15 pre rows were load timeouts; all 15 post rows equal the b0
  baseline verdict + maxDelta.
- unknown: cozinu-92-cuvi600 (packageFontSize 20 title ink), liciru-76-ruse157
  and mileba-84-rike349 (`<<Cloud>>` walk), navapo-58-soto151 (multi-line
  quantifier, B-3) structural-match -> conformant; maxDelta falls, verdict
  unchanged: barobi-40 118->108, dogizu-51 56->46, lituge-35 74->64,
  mebeva-33 30->23.3, xesepu-10 8->2.6, zogizu-64 30->23.9 (C-8 UEmpty on
  node/database), tefeco-12 8->7 (artifact/card container walk).
- component: 15 maxDelta movers, verdicts unchanged (1/14/251 both). 14 falls
  (C-8 UEmpty on node/database leaves/clusters: e.g. tukipe/vajaxu 20->10,
  lesori/ravodu 81->71). One rise = reveal: fasave-91-jaka816 max 20.972
  (rect x) -> 21 (`svg/@width` 566 vs 587): the database's added UEmpty
  exposes the unported `<style> database { FontSize 19 ... }` sizing
  overshoot (rect widths 81.2 vs 102.2) it previously masked.
- usecase: no movers (15 pre timeouts equal b0 post). sequence: no movers.

### Gates
- lint, build: pass. typecheck: `tsconfig.node.json` passes; `tsc --noEmit`
  fails ONLY on pre-existing `tests/unit/class/class-parser-asset-store.test.ts`
  (from f45288701, untouched).
- npm test: all green except the five symlinked-worktree stdlib/sprite files;
  description-parity ratchet, refusal-coverage, routing-conformance timed out
  under load and pass alone; class-dot-parity passes.
  `class-empty-package-no-cluster-box.test.ts` coordinates moved +2.056 (the
  FixedMeasurer(8, 16) title ink -- comment in the test).

### Open artifacts
- USymbol group title ignores `packageFontSize` upstream (see above).
- Stereotype text ink unmodeled (bound above).
- xadado width (embedded-diagram note), fasave style-block sizing.
- Base typecheck failure in class-parser-asset-store.test.ts.
