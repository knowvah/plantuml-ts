# T2 report (zosuje)
Commit: see `git log -1` (fix(description): colour containers from group and symbol styles).
Files: src/diagrams/description/renderer-cluster.ts; tests/unit/description/gtc-t2-cluster-style-colours.test.ts (new); tests/unit/description/renderer.test.ts (the "container does NOT yet honor a per-element bucket background" test, a documented gap this closes, now asserts fill="#ABCDEF").

## Result: PARTIAL. zosuje 17 structural -> 13. Group colours fixed (4 cleared). Font style and link colour are stop 1 (src/core).
zosuje remaining: 1 `g[5]/text[1]/@font-style`, 12 link path/polygon colours. rufopi still 0/0. banatu 14 struct+14 num (4 struct + 14 num; strokes fixed).

## Mechanism 1: group colours (FIXED)
- Mechanism: a container's BackGroundColor/LineColor are read off the merged style root,element,<diagram>,group,<uSymbol SNames>; the port ignored theme.colors.elements.{group,<symbol>} and root LineColor.
- Origin Java: Cluster.java:285-296, :312-319, :385-391, :701-710; StyleStorage.java:102-116 (later declaration wins). Port: renderer-cluster.ts buildStyleDefaults (backGroundColorDefault, lineColorDefault).
- Chain: theme held elements.group {background bisque, border Red}; cluster used packageBackground ?? root ?? 'none' and a hardcoded #181818/#000 border -> fill paleGreen / stroke #181818.
- Ruled out: layout (numeric 0); inline colour path (unchanged); title font colour (jar draws no group FontColor on the file title: no diff).
- Fix tiers (most specific first): elements[symbol] > elements.group > package/root; border same, then root/element LineColor from theme.styleOverrides (last-wins), then skin default. Order-blind caveat: the theme keeps no declaration order, so source order is approximated by specificity.

## Mechanism 2: component FontStyle italic (STOP 1, not fixed)
- Mechanism: `<style> component { FontStyle italic }` never reaches the theme: style-map-element.ts:30-38 (collectObjectKindFont) stores FontName/FontStyle only for object/map/json buckets; theme dump for zosuje has elements.component = {background,border,font,roundCorner,fontSize}, no fontStyle, and styleOverrides holds only root/document.
- Origin Java: EntityImageDescription.java:142-172 (styleTitle signature root,element,<diagram>,<uSymbol SNames>,title; fcTitle = styleTitle.getFontConfiguration). Port: src/core/style-map-element.ts:30-38 (needs the bucket to carry fontStyle), consumer would be usymbol-resolve.ts fontConfigurationFor (src/core/decoration/symbol/usymbol-resolve.ts:222) / entityTitleStyles.
- Both are outside the write-set. Next step: extend collectObjectKindFont to any bucket, then fontConfigurationFor reads elements[symbol].fontStyle.

## Mechanism 3: link colour (STOP 1, not fixed)
- Mechanism: description links draw edge.styleColor ?? theme.colors.arrow (renderer-edge.ts:129); `<style> arrow { LineColor }` is not in theme.colors.arrow. The only parsed value is graph.classCascadeArrowColor (dump: #00BFFF for zosuje), whose snames are the class signature root,element,classdiagram,arrow (style-cascade-class-snames.ts:13), and whose doc (theme-graph-colors-b.ts:55-66) forbids reuse by description to avoid bleeding classDiagram selectors.
- Origin Java: SvekEdge.java:816-821 (root,element,<diagram>,arrow), :874-876 (Rainbow.build(styleLine)). Port: renderer-edge.ts:129; a description arrow cascade (componentDiagram snames) must be added in src/core/style-cascade-class*.ts + Theme graph field.
- Cheap-but-impure alternative (NOT done): renderer-edge.ts reading classCascadeArrowColor would clear the 12 diffs for zosuje but would wrongly honour `classDiagram { arrow {...} }` in component diagrams.

## banatu-09-koce254 residual
Root `Linecolor blue` is the SAME mechanism and is fixed (all polygon/line strokes cleared). `FontColor red` (4 text @fill) is a different one: root FontColor never reaches textFontColor (usymbol-resolve.ts:140, JAR_DEFAULT_TEXT_COLOR when no elements[symbol].font) -> src/core, stop 1. 14 numeric 0.125 deltas remain (width, unrelated; predate). xusuxe-62-guba767 moves the same way (stroke fixed, text fill remains).

## Surveys (before -> after; /private/tmp/claude-501/gtc-T2/*)
- component: 188/13/65 -> 192/13/61. Conformant gains: foboxa-33-menu312, nibige-54-voki590, zaraze-24-vixi421, zeteze-09-kuno793 (container fill/stroke from group/root/symbol styles). Diverged movers (firstDiff only, still diverged): banatu, xusuxe (stroke fixed, root FontColor left), zosuje (17->13), ruciga-77 (gradient container defs now match; remaining sprite text), saveja-25 (container fill fixed; rect on g[2] remains).
- unknown: 487/16/322 -> 494/16/315. Gains: dogizu-51-sora488, fomopo-28-fabe385, fupari-69-zite171, necele-02-femi691, vapelu-42-maba761, vasogu-32-getu521, zogizu-64-febi743 (same container-colour mechanism). Diverged movers: fexeci-32-japu912, kekeli-82-vagi037 (rect fill cleared; font-family next).
- usecase: 62/4/27 (+1 oracle-error) -> unchanged.
- Losses: 0. (A first survey run at load ~120 produced timeouts; component and usecase were re-run at low load and are the numbers above; unknown's first run had no timeouts.)

## Tests
`vitest run --maxWorkers=4 tests/unit/description tests/architecture tests/oracle/svg-conformance`: 138 files collected, 8099 passed, 1 skipped, 0 failed (an earlier run at load ~120 failed 4 ratchets on 5-6s timeouts; green when rerun at load ~40). typecheck, eslint, prettier clean. New test file 4 tests. Catalog not run (no export change).

## Tick implication
zosuje is NOT tickable (13 diffs left, both in src/core). No write-set extensions made.
