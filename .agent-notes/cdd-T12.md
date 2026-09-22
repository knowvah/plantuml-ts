# T12 — USymbol container shape, url wrap and package paint

## The cluster-margin delta per USymbol is TWO integers, not a table

The spec framed step 5 as "cluster margins now differ per symbol". Read the
Java: the margin is not a per-symbol constant at all — it is
`ClusterHeader`'s title-table supplement,
`~/git/plantuml/.../svek/ClusterHeader.java:87-94`:

```java
final USymbol uSymbol = g.getUSymbol();
final int suppHeightBecauseOfShape = uSymbol == null ? 0 : uSymbol.suppHeightBecauseOfShape();
final int suppWidthBecauseOfShape  = uSymbol == null ? 0 : uSymbol.suppWidthBecauseOfShape();
this.titleAndAttributeWidth  = (int) Math.max(dimLabel.getWidth(), attributeWidth) + suppWidthBecauseOfShape;
this.titleAndAttributeHeight = (int) (dimLabel.getHeight() + attributeHeight + marginForFields + suppHeightBecauseOfShape);
```

and `USymbol.java:88-93` returns **0/0** for every symbol. Only two
subclasses override it: `USymbolNode.java:191-199` (width +60, height +5)
and `USymbolDatabase.java:172-175` (height +15). Everything else — cloud,
rectangle, card, frame, folder, artifact — adds nothing. So the port reads
`symbol.suppWidthBecauseOfShape()`/`suppHeightBecauseOfShape()` off the
already-ported `USymbol` object rather than re-tabulating the two overrides
locally (`class-namespace-title-table.ts#titleSupp`).

Jar-verified against the cached DOT, `dativu-93-pona469/svek-1.dot`:
`WIDTH="79"` = `floor(19.425)+60`, `HEIGHT="14"` = `14+5-5`; `foo1`
`WIDTH="87"` = `floor(27.213)+60`.

Note the `(int)` cast lands on the max BEFORE the supplement upstream, while
this port defers its floor to `graph-layout-build.ts:366`. Equivalent here
because every supplement is an integer (`floor(w+60) == floor(w)+60`); it
would NOT be if a future override were fractional.

## The real per-symbol margin is INK, and it comes from `UEmpty`

The observable canvas delta on `dativu-93-pona469` (jar `381x133`, this port
`361x123` after the shape landed) is `LimitFinder`, not the title table:

- `LimitFinder.java:169-177` — `drawUPolygon` pads x by
  `HACK_X_FOR_POLYGON = 10` on BOTH sides, y not at all. `USymbolNode
  #drawNode` (`USymbolNode.java:71-92`) draws a `UPolygon`, so a `<<Node>>`
  cluster gets the same rule the port already had for `strictuml` folders.
- `LimitFinder.java:159-162` — `drawEmpty` records `(x,y)`/`(x+w,y+h)` for a
  `UEmpty`. `USymbolNode#drawNode:90` ends with
  `ug.apply(new UTranslate(0, height)).draw(new UEmpty(10, 10))`, so the
  node's ink reaches **10px below its own box**; `USymbolDatabase
  #drawDatabase` does the same at `(width, height)`, reaching 10px right AND
  below.

A `UEmpty` appears in no SVG output — it is exactly the kind of mechanism a
diff can never show. With both rules wired
(`class-ink-shapes.ts#addNamespaceNodeInk`/`addNamespaceDatabaseInk`),
`dativu-93-pona469` went to a byte-exact `conformant` (350 diffs -> 0).

## `<style> package {}` reaches the empty-package leaf, `skinparam` cannot (yet)

Upstream has TWO style signatures for a package:
`svek/Cluster.java:285-296` gives the CLUSTER
`{root, element, <diagram>, package_, group}`, and
`svek/image/EntityImageEmptyPackage.java:87-88` gives the collapsed-empty
LEAF `{root, element, <diagram>, package_, title}`. `plantuml.skin:102-114`
puts `BackGroundColor transparent` + `package { LineThickness 1.5; LineColor
black }` under `group {}` only, which is exactly why the two draw with
different unstyled defaults (cluster: `none`/`#000000`/1.5; leaf:
`#F1F1F1`/`#181818`/0.5 — `gatula-10-bifu561`).

A `<style> package { ... }` block is a subset of BOTH, so it reaches both.
This port routes it to the leaf through the per-element bucket
`theme.colors.elements.package`, which a `<style>`/`skinparam package { }`
block populates and the diagram-wide `skinparam packageBorderColor` key does
NOT (measured both ways). That is what keeps the change's movers inside the
declared reach.

**Open, jar-verified, deliberately not fixed:** `skinparam packageBorderColor
blue` DOES recolor the empty-package leaf upstream — `cocube-46-tusu692`'s
leaf draws `stroke:#00F;stroke-width:0.5` — contradicting the pre-T12 doc
comment on `renderEmptyPackageIcon`, which asserted the opposite. It cannot
be routed without making `ThemeGraphColors.packageBackground`/`packageBorder`
optional (`string | undefined`), because their present non-optional defaults
ARE the cluster's (`none`/`#000000`) and applying them to the leaf would
repaint every unstyled empty package. That widening is D8-sized and belongs
in its own task.

## Movers, full corpus (`t11.json` -> `t12.json`)

18 movers, 16 falls / 2 rises, 0 conformant losses, conformant 460 -> 467.
Every mover grep-proven against its `in.puml` to carry a symbol-naming
container stereotype, an inline/`<style>` package colour, or a package
`[[url]]`.

The two rises are both the known comparator regime, not a regression:

- `diroxo-41-zezo954` (`<<cloud>>`) 4+97 -> **0**+181, verdict
  `diverged -> structural-match`. The cluster now draws
  `USymbolCloud#getSpecificFrontierForCloud`'s ~100-coordinate bezier where
  it drew a 12-coordinate folder path; `compareSvg` previously short-
  circuited the `@d` mismatch at cost 1 and never compared the rest. The
  residual is a uniform ~0.208px offset plus an 8px canvas width delta —
  a cluster-box/ink question for the cloud shape, not this mechanism.
- `daxeno-00-kasu166` (`<<Database>>`) 12+104 -> 12+135, same cause (two
  `UPath`s' worth of newly comparable coordinates). Its 12 structural diffs
  are unrelated: a `<style>` per-symbol colour override, creole
  (`<size:18>`) in the package display, and the collapsed-empty
  `<<Database>>` leaf still drawing the folder icon.

See `memory: weightedScore is anti-monotone under growth` — a correct port
that ADDS elements raises the gated count.

## Not modeled (named remainders)

- A per-symbol `<style> node { LineColor ... }` override on a USymbol
  CLUSTER. `renderer.ts#renderNamespace` passes `theme.colors.border` /
  stroke-width 1 (the `plantuml.skin:102` `group` defaults) unconditionally.
  No corpus fixture styles a USymbol container, so there is nothing to
  verify a cascade against.
- The collapsed-EMPTY USymbol container leaf (`package p <<Database>> {}` in
  `daxeno-00-kasu166`) still draws `EntityImageEmptyPackage`'s folder icon.
  T11 stamps `Classifier.usymbol` for that path, but the leaf's own shape
  dispatch is a different consumer than this task's cluster path.
