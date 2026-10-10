# aepp-T1d — tidoda: group frame style keyed on the USymbol (PARTIAL, stop 8)

## Verified mechanism
add4's "rectangle group style not keyed on the USymbol" is true but incomplete.
- `CommandPartition3.java:150,161-165`: `getUSymbol(type)` (:89-103) -> `FtileGroup.getStyleSignature(symbol).getMergedStyle(...)`.
- `FtileGroup.java:89-92`: signature `of(root, element, activityDiagram, symbol.getSNames(), composite)`.
- `FtileGroup.java:99-103`: backColor/LineColor/RoundCorner read from that style.
- `FromSkinparamToStyle.java:212,223,129`: `addMagic(card|rectangle|package_)` -> `<sname>BackgroundColor/BorderColor/BorderThickness/RoundCorner`.
  `:127-128`: `packageBackgroundColor/BorderColor` also -> `SName.group`. `:131-132`: `Partition*` -> `composite`.
- Jar probes (oracle-render): `PartitionBackgroundColor lime` beats `skinparam rectangle {BackgroundColor red}`;
  `skinparam group {}` has NO effect; `packageBackgroundColor` colours a `group` frame; `partition` takes `Partition*`.

## Done (commit on aepp/T1d)
`activity-renderer-composite.ts` `symbolInk`/`compositeInk`: fill/stroke/thickness cascade
Partition* > symbol block > composite default; `-symbols.ts` accepts `roundCorner` (card/rectangle rx=ry=rc/2).

## Blocked (stop 8, src/core)
`skinparam <sname>RoundCorner N` (flat or block) is never stored per element:
`skinparam-key-handlers-table-a.ts:393` handles only bare `roundcorner`; per-element
`roundCorner` is set only by `style-map-element.ts:350` (`<style>` path). Probe:
`resolveSkinparam({rectangleroundcorner:25,...})` -> `elements.rectangle` has background/border/lineThickness, no roundCorner.
tidoda's remaining firstDiff is `@rx` (rx=ry=12.5). Owner: a src/core task adding an
`<sname>roundcorner` handler for ADD_MAGIC_CLEAN_NAMES (needs all-engine survey, rule 10).
The renderer already consumes `elements[usymbol].roundCorner`, so that handler lands tidoda with no further activity change.

## Not done
- package RoundCorner: jar draws a rounded folder path and shifts the box (x=15 vs ours 25);
  needs a USymbolFolder rounded-branch port + canvas-origin-fudge change; not in write-set.
- tidoda stays diverged (firstDiff @fill -> @rx).

## Movers
Activity survey vs b0-eng: 451 rows, only tidoda moved (@fill -> @rx). 0 conformant losses. src/core untouched (no all-engine survey).
