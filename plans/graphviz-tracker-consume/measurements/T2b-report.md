# T2b report (zosuje core style)
Commit d5d41688c `fix(core): reach description from component fontstyle and arrow linecolor` (unsigned).
Files: src/core/{style-cascade-description.ts (new), style-cascade-class-snames.ts, style-map-element.ts, style-map-theme.ts, theme-graph-colors-c.ts, build-theme.ts, decoration/symbol/usymbol-resolve.ts}, src/diagrams/description/renderer-edge.ts, tests/unit/core/gtc-t2b-description-style-cascade.test.ts (new, 8 tests), docs/catalog.md (regenerated).
Extensions inside the style/theme seam (journal): style-cascade-description.ts (new, class file was at 466 lines), style-map-theme.ts (merge point), build-theme.ts (supersede on skinparam ArrowColor), theme-graph-colors-c.ts (new Theme field), style-cascade-class-snames.ts (DESCRIPTION_ARROW_SNAMES).

## Render-diff
zosuje 13/0 -> 0/0 (pass). rufopi 0/0 kept.

## Mechanism A: bucket FontStyle
- Mechanism: collectObjectKindFont returned before storing FontStyle for any non-object bucket, so `component { FontStyle italic }` never reached ElementColors.fontStyle; fontConfigurationFor ignored it anyway.
- Java: EntityImageDescription.java:142-172 (styleTitle = root,element,<diagram>,<uSymbol SNames>,title; fcTitle), Style.java:241-253 getUFont, StyleStorage.java:102-116 (user declaration overwrites skin). Port: style-map-element.ts collectObjectKindFont; usymbol-resolve.ts fontConfigurationFor.
- Fix: FontStyle stored for every bucket (FontName stays object-kind; header twin unchanged); fontConfigurationFor replaces the caller's default styles with the bucket's flags (new styleOverride). Replace, not union, mirrors the overwrite.
- Ruled out: layout (numeric 0); leaf sizing (width equal).

## Mechanism B: description arrow cascade
- Mechanism: description links drew edge.styleColor ?? theme.colors.arrow; `<style> arrow {LineColor}` was parsed only into the class-signature field classCascadeArrowColor.
- Java: SvekEdge.java:816-821 (root,element,<diagramType().getStyleName()>,arrow), :874-876 (Rainbow.build(styleLine)); DiagramType.java:250-251 (DESCRIPTION -> SName.componentDiagram; usecase/deployment included). Port: new style-cascade-description.ts, DESCRIPTION_ARROW_SNAMES = root,element,componentdiagram,arrow; Theme field graph.descriptionCascadeArrowColor; renderer-edge.ts:129 reads `styleColor ?? descriptionCascadeArrowColor ?? colors.arrow`.
- The class cascade is NOT reused: tests pin that `classDiagram { arrow }` does not colour a component link and `componentDiagram { arrow }` does.
- Order: a later skinparam ArrowColor drops the field (build-theme.ts withoutSupersededArrowCascade, same rule as the class field). A later `<style>` over an earlier skinparam wins.
- Arrow head fill/stroke follow (Rainbow head colour = line colour).

## banatu-09-koce254 root FontColor
NOT the same mechanism as A: A is a bucket FontStyle reaching the theme; banatu needs the root/element FontColor TIER in textFontColor (usymbol-resolve.ts:140, `elements[symbol].font` else JAR_DEFAULT_TEXT_COLOR, root never consulted; theme.styleOverrides.root.fontcolor="red" is available). Not fixed. Still diverged (4 text @fill + 14 numeric 0.125 width deltas, predate). Same applies to xusuxe-62-guba767.

## Surveys (before -> after; /private/tmp/claude-501/gtc-T2b/*)
- component: 192/13/61 -> 193/14/59. zosuje diverged->conformant. revusu-28-pexi248 diverged->structural-match (italic now drawn; width 76 vs 77 numeric left). Movers still diverged: minulo-12-bare186 (stroke fixed; remaining: `.tag`-scoped arrow LineColor/FontColor, red expected), vaseda-71-suje167 (stroke fixed; remaining: arrow LineStyle 10-5 dasharray and `.tag` colours). Both residuals are arrow tag sub-selectors / LineStyle for the description signature (not built here).
- unknown: 494/16/315 -> 495/16/314. keceji-97-nuza070 diverged->conformant (`Fontstyle plain` bucket). The first run at load ~75 gave 13 timeouts; re-run (load still 148) gave 0 timeouts: numbers above.
- usecase: 62/4/27 (+1 oracle-error) -> unchanged (first run 1 timeout on bootstrap-0 at load; re-run clean).
- class: 723/0/0 -> 723/0/0, no mover. object: 63/8/9 -> 63/8/9, no mover.
- Conformant losses: 0.

## Tests
- Golden ratchets class/object/state/description with --testTimeout=60000: 4 files, 1527 passed.
- Wider `vitest run --maxWorkers=4 tests/unit tests/architecture tests/oracle/svg-conformance`: 1270 files collected, 26195 passed, 1 failed: tests/unit/scripts/parity-dashboard.test.ts (D9 drift gate). Cause is NOT this change: the committed docs/parity-report.md lags the orchestrator's pins (regenerating shows component ratchet 187->191, state ratchet 60->95, state date 2026-08-17->2026-10-16); I did not commit a regeneration (orchestrator-owned, D6). Reverted my local regeneration.
- Earlier loaded run (load 40-130) showed no "timed out in 5000ms" this time in the ratchets; surveys were the only load casualties (noted above).
- typecheck, eslint, prettier clean; style-map-element.ts is exactly 500 lines (cap).
- Out-of-write-set tests pinning a closed residual: none found.
