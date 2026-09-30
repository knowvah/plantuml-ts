# mindmap-engine-port jar probes (T0c)

Two dev-only tools that compile against the pinned oracle jar
(`oracle/dist/plantuml-oracle.jar`, 1.2026.8beta1) and print real,
jar-computed values -- style merges and mindmap layout geometry -- so
every constant and test fixture the port needs has a jar-probe citation
instead of a guessed or fitted value (decision D8). Never bundled, never
run in CI; source only, compiled on demand by `run-probe.sh`. Does not
modify the jar.

- `StyleProbe` -- prints the `Style` `StyleBuilder.getMergedStyle` /
  `getMergedStyleSpecial` compute for a given signature, one
  `PName=value` line per property the merge actually set.
- `LayoutProbe` -- prints, per mindmap node, its label, level, branch,
  direction, phalanx dimensions, `getX12`, its own `SymetricalTee`, its
  children's positioned `SymetricalTee` ("Tetris element") `y`, and its
  absolute translation from the diagram root.
- `ProbeReflect` -- shared reflection helpers both probes use to read
  private mindmap-package state that has no public accessor (see its
  class javadoc for exactly which fields, and why reflection rather than
  a jar edit or a same-package trick).

## Why these exist

`net.sourceforge.plantuml.mindmap` keeps most of its state private
(`FingerImpl.idea/nail/tetris/direction`, `MindMap.regular/reverse`,
`Branch.finger`, `MindMapDiagram.mindmaps`) and two of its classes
package-private (`Idea`, `Branch`). There is no public API that returns
"the merged style for this signature" or "this node's absolute pixel
position" directly. Both probes run the real pipeline first -- the same
`SourceStringReader` entry point `scripts/oracle-render.sh` drives for
SVG, with `-DPLANTUML_DETERMINISTIC_TEXT=true` set (matching every other
harness in this repo, per `scripts/oracle-render.sh`'s own header) --
then read the resulting object graph via a mix of public accessors
(`FingerImpl.getPhalanxThickness`, `Tetris.getElements`, `MindMap
.calculateDimension`, `TitledDiagram.getCurrentStyleBuilder`) and
reflection where a value truly has no public accessor. Nothing is
re-measured against a probe-only graphics context, and nothing is
re-derived except the absolute-translation sum, which is the documented
`FingerImpl.drawU` / `MindMap.drawU` formula applied to real,
jar-computed inputs (see `LayoutProbe`'s class javadoc for the exact
citations).

## Setup

Java 21 (`javac`/`java` on `PATH`). No build step beyond
`run-probe.sh`, which compiles into `out/` (gitignored) on every
invocation.

## Usage

```sh
plans/mindmap-engine-port/tools/probe/run-probe.sh <ProbeClassName> [args...]
```

### StyleProbe

```
run-probe.sh StyleProbe <snippet-file> <merged|special> <snames-csv> \
    [--skin name] [--stereotype s]... [--level n] [--star] [--delta n]
```

- `snippet-file` is the diagram body placed between `@startmindmap`/
  `@endmindmap` -- `skin`/`skinparam`/`<style>` lines plus at least one
  root idea line (e.g. `* root`) so the source parses.
- `--skin name` prepends a `skin name` line (loads `name.skin` from the
  jar's classpath resources, replacing the whole stylesheet --
  `TitledDiagram.loadSkin`, `TitledDiagram.java:160-182`) ahead of the
  snippet body, so it still applies in source order before any
  skinparam/style lines the snippet itself declares (decision D2).
- `snames-csv` is a comma-separated `SName` list, e.g.
  `root,element,mindmapDiagram,node,rootNode` -- the same signature
  shape `Idea.getDefaultStyleDefinitionNode` builds
  (`mindmap/Idea.java:65-90`).
- `--level` defaults to `0`. `--star` marks the signature starred
  (`StyleSignatureBasic.addStar()`, used for every ancestor query in
  `Idea.getStyle()`). `--delta` is required for `special` (the
  `deltaPriority` argument to `getMergedStyleSpecial`).

### LayoutProbe

```
run-probe.sh LayoutProbe <file.puml>
```

Prints every mindmap node in both the `regular` and `reverse` branches,
depth-first, in the same order `Tetris` positions them.

## Worked examples (outputs pasted from real runs against 1.2026.8beta1)

### 1. StyleProbe, `special` -- a `:depth(2) *` rule

Snippet (`snippet-depth.txt`):

```
<style>
:depth(2) * {
  FontColor red
  BackGroundColor blue
}
</style>
* r0
** a
*** a1
**** a11
```

This is the exact `<style>` block from corpus fixture
`cejije-94-xibi793`. The query signature below is node `a1`'s own,
non-starred signature from `Idea.getDefaultStyleDefinitionNode`
(level 2, shape `BOX`, has children -> `SName.node` only, no
`leafNode`/`boxless`) and `Idea.getStyle()`'s own-node
`deltaPriority`. NOTE (corrected by T2a): `WElement.STEP_BY_PARENT * 1000` is
`10001000 * 1000` in Java `int` arithmetic, which overflows to **1411065408**
(`WElement.java:110`, `Idea.java:97`; the jar stores a level-2 value at 326 and
reads it back at 1411065734). The `--delta 3000` below was a T0c stand-in that
happens to give the same match set for this snippet; use `--delta 1411065408`
for jar-exact priorities. The port must use `Math.imul(10001000, 1000)`.

```
$ run-probe.sh StyleProbe snippet-depth.txt special \
    root,element,mindmapDiagram,node --level 2 --delta 3000
Shadowing=0.0
FontName=SansSerif
FontColor=red
FontSize=14
FontStyle=plain
BackGroundColor=blue
RoundCorner=25
LineThickness=1.5
DiagonalCorner=0
HyperLinkColor=blue
HyperlinkUnderlineThickness=1
LineColor=#181818
Padding=10
Margin=10
HorizontalAlignment=left
```

`FontColor=red`/`BackGroundColor=blue` confirms the depth-2 rule
matched (`StyleSignatureBasic.matchAll` -- a starred declaration at
level 2 matches any element at level >= 2, `StyleSignatureBasic
.java` `matchAllImpl`); every other property is the base
`plantuml.skin` default, merged in because `getMergedStyleSpecial`
merges *every* stored style whose declaration matches, not just the
most specific one (`StyleBuilder.java:145-160`).

### 2. StyleProbe, `merged` -- skin swap changes the arrow style

`getStyleArrow()` (`mindmap/Idea.java:100-105`) calls plain
`getMergedStyle`, no `deltaPriority`:

```
$ echo '* root' > snippet-root.txt
$ run-probe.sh StyleProbe snippet-root.txt merged \
    root,element,mindmapDiagram,node,rootNode --level 0 --skin rose
Shadowing=2.0
FontName=SansSerif
FontColor=black
FontSize=14
FontStyle=plain
BackGroundColor=#FEFECE
RoundCorner=25
LineThickness=1.5
DiagonalCorner=0
HyperLinkColor=blue
HyperlinkUnderlineThickness=1
LineColor=#A80036
Padding=10
Margin=10
HorizontalAlignment=left
```

Compare `BackGroundColor`/`LineColor` here (rose skin: `#FEFECE`/
`#A80036`) against the same signature with no `--skin` (plantuml.skin
default: `BackGroundColor=#F1F1F1`, `LineColor=#181818`, as seen
implicitly in example 3's root-box geometry, whose fill in
`bepinu-34-tiji715/in.svg` is `#F1F1F1`) -- confirms `--skin` really
replaces the stylesheet via `TitledDiagram.loadSkin`, not just a
cosmetic flag.

### 3. LayoutProbe -- `left side`/`right side` and `doNotDrawFirstPhalanx`

Fixture `dezuza-88-gige110` (`left side` / `right side` mindmap, 6
nodes):

```
$ run-probe.sh LayoutProbe test-results/dot-cache/mindmap/dezuza-88-gige110/in.puml
mindmap[0]
0 branch=regular label=[count] level=0 direction=1 phalanxThickness=54.000000 phalanxElongation=54.212500 getX12=50.000000 originX=186.725000 originY=67.500000
  symetricalTee t1=54.0 e1=64.21249999999999 t2=135.0 e2=158.08749999999998
  tetris[0] y=-13.500000 minY=-67.500000 maxY=40.500000 maxX=118.087500
  0/0 branch=regular label=[A] level=1 direction=1 phalanxThickness=54.000000 phalanxElongation=29.362500 getX12=50.000000 originX=290.937500 originY=54.000000
    symetricalTee t1=54.0 e1=39.3625 t2=108.0 e2=78.725
    tetris[0] y=-27.000000 minY=-54.000000 maxY=0.000000 maxX=38.725000
    0/0/0 branch=regular label=[AA] level=2 direction=1 phalanxThickness=54.000000 phalanxElongation=38.725000 getX12=50.000000 originX=370.300000 originY=27.000000
    tetris[1] y=27.000000 minY=0.000000 maxY=54.000000 maxX=38.725000
    0/0/1 branch=regular label=[AB] level=2 direction=1 phalanxThickness=54.000000 phalanxElongation=38.725000 getX12=50.000000 originX=370.300000 originY=81.000000
  tetris[1] y=40.500000 minY=13.500000 maxY=67.500000 maxX=29.362500
  0/1 branch=regular label=[B] level=1 direction=1 phalanxThickness=54.000000 phalanxElongation=29.362500 getX12=50.000000 originX=290.937500 originY=108.000000
0 branch=reverse label=[count] level=0 direction=-1 phalanxThickness=0.000000 phalanxElongation=0.000000 getX12=50.000000 originX=186.725000 originY=67.500000
  symetricalTee t1=0.0 e1=10.0 t2=135.0 e2=176.72500000000002
  tetris[0] y=-13.500000 minY=-67.500000 maxY=40.500000 maxX=136.725000
  0/0 branch=reverse label=[100] level=1 direction=-1 phalanxThickness=54.000000 phalanxElongation=43.362500 getX12=50.000000 originX=136.725000 originY=54.000000
    symetricalTee t1=54.0 e1=53.362500000000004 t2=108.0 e2=83.36250000000001
    tetris[0] y=-27.000000 minY=-54.000000 maxY=0.000000 maxX=43.362500
    0/0/0 branch=reverse label=[101] level=2 direction=-1 phalanxThickness=54.000000 phalanxElongation=43.362500 getX12=50.000000 originX=43.362500 originY=27.000000
    tetris[1] y=27.000000 minY=0.000000 maxY=54.000000 maxX=43.362500
    0/0/1 branch=reverse label=[102] level=2 direction=-1 phalanxThickness=54.000000 phalanxElongation=43.362500 getX12=50.000000 originX=43.362500 originY=81.000000
  tetris[1] y=40.500000 minY=13.500000 maxY=67.500000 maxX=43.362500
  0/1 branch=reverse label=[200] level=1 direction=-1 phalanxThickness=54.000000 phalanxElongation=43.362500 getX12=50.000000 originX=136.725000 originY=108.000000
```

Two things worth noting, both read off the real object graph rather
than assumed:

- The `reverse` branch's root node (`count`) prints
  `phalanxThickness=0.000000 phalanxElongation=0.000000` --
  `MindMap.computeFinger()` calls `reverse.doNotDrawFirstPhalanx()`
  whenever both branches have a finger (`mindmap/MindMap.java:63-73`),
  which makes `FingerImpl.getPhalanx()` return an empty `TextBlock`
  for that one node (`mindmap/FingerImpl.java`, `getPhalanx`) so the
  shared root box is drawn once, by the `regular` branch, not twice.
  Both branches' roots still share the same `originX`/`originY`
  (`186.725000`/`67.500000`) -- `MindMap.drawU` applies one top-level
  translate and passes the *same* `ug` to both branches
  (`mindmap/MindMap.java:99-107`).
- `direction=1` (regular, grows right/down) vs. `direction=-1`
  (reverse, grows left/up) changes the sign in every child's `p2.x`/
  `p2.y` (`FingerImpl.drawU`'s `direction * (elongation + getX12())`
  term) -- visible as the regular branch's descendants having
  increasing `originX` (186.7 -> 290.9 -> 370.3) while the reverse
  branch's descendants have decreasing `originX` (186.7 -> 136.7 ->
  43.4).

## Acceptance check: text sizes match the cached golden

Fixture `bepinu-34-tiji715` (`* first node`, no style/skin overrides)
golden (`test-results/dot-cache/mindmap/bepinu-34-tiji715/in.svg`):

```
<rect x="10" y="20" width="73.637" height="34" ... rx="12.5" ry="12.5"/>
```

`LayoutProbe` on the same fixture:

```
$ run-probe.sh LayoutProbe test-results/dot-cache/mindmap/bepinu-34-tiji715/in.puml
mindmap[0]
0 branch=regular label=[first node] level=0 direction=1 phalanxThickness=54.000000 phalanxElongation=73.637500 getX12=50.000000 originX=0.000000 originY=27.000000
```

`phalanxElongation=73.6375` matches the golden's `width="73.637"`
exactly (this diagram is `LEFT_TO_RIGHT`, the default -- `MindMapDiagram`'s
constructor sets `Rankdir.LEFT_TO_RIGHT`, `mindmap/MindMapDiagram
.java:74`, so elongation is the phalanx's *width*). `phalanxThickness
=54` is the box's own height (`34`, matching the golden's
`height="34"`) plus its top+bottom style `Margin` (`10` each,
`FtileBoxOld`/`TextBlockUtils.withMargin`, `mindmap/FingerImpl.java`
`getPhalanx`, the `!isTopToBottom` branch) -- `34 + 10 + 10 = 54`,
confirming `phalanxThickness` is margin-inclusive by design (it is the
spacing budget the `Tetris` packer reserves, not the box's own render
size).

## Known limitations (probe scope, not a mindmap-engine-port gap)

- `StyleProbe` builds its source from a snippet body, not a full
  `.puml` fixture -- it will not reproduce `!theme` expansion or
  multi-block sources. Use a full fixture and read `StyleBuilder`
  state manually (or extend the probe) if that is ever needed.
- `LayoutProbe` does not print link-arrow color/stroke
  (`Idea.getStyleArrow()`'s consumer, `FingerImpl.getLinkColor`/
  `getUStroke`) -- use `StyleProbe` with signature
  `root,element,mindmapDiagram,arrow` for that (see worked example 2).

## DumpProbe (T2a)

`run-probe.sh DumpProbe <mode> <puml>` with mode `dump` (the StyleBuilder's storage with
priorities after the source's skin + `<style>` blocks), `ideas` (every `Idea.getStyle()`
result) or `getters`. Its `dump`/`ideas` output is what
`tests/unit/core/style/fixtures/{plantuml-skin-storage,mindmap-idea-styles}.json` pin.
