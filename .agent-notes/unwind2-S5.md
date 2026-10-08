# unwind2-S5: `!theme` residue retired; root colours by declaration counter

## Observation: upstream ranks style values by declaration counter, not selector depth
- **Context**: `!theme amiga` followed / preceded by `<style> root {}` or
  `skinparam defaultFontColor` (tests/fixtures/unwind2-S5).
- **Finding**: every style value carries `StyleBuilder#getNextInt`
  (`ValueImpl.java:51-55`); `Style#mergeWith` -> `DarkString#mergeWith`
  (`Style.java:121-134`, `DarkString.java:50-66`) keeps the HIGHER counter.
  So a later `root { FontColor }` beats an earlier `skinparam Activity {
  FontColor }` for activity text (jar-verified, activity-style-after), and a
  later `skinparam ArrowColor` beats an earlier `root { LineColor }` on the
  class edge. Stereotype selectors add `DELTA_PRIORITY_FOR_STEREOTYPE`.
- **Impact**: the port's flat `Theme` (element field > `colors.text`) cannot
  express this; `style-root-shadowing.ts#dropRootShadowed` drops earlier
  narrower FontColor/LineColor declarations a later root redeclares. Other
  properties (BackgroundColor, FontName, LineThickness, Margin) still rank by
  specificity in the port.
- **Confidence**: High

## Observation: the theme residue was masking unrouted sequence skinparams
- **Context**: removing MANUAL fontFamily/fg from `compile-themes.py`.
- **Finding**: the sequence renderer reads neither `participantFontColor/Name/
  Size` nor `<style> participant { FontColor }` nor `arrowFontColor` (probe:
  seq-pskin / seq-pstyle, all text #181818 vs jar #F00). The reddress residue
  (`fontFamily: 'Verdana'`, `text: '#ffffff'`) happened to match jar output
  for participant names; removing it exposes the gap on `!theme reddress-*`
  sequence diagrams.
- **Impact**: a sequence participant/arrow font routing mission would close
  those fixtures; it is not a theme mechanism.
- **Confidence**: High

## Observation: `<style> root { Margin }` is not consumed by class/usecase/mindmap
- **Context**: `!theme amiga` (root Margin 5) fixtures, and a theme-free
  `<style> root { Margin 5 }` probe.
- **Finding**: `buildTheme` sets `theme.diagramMargin` = 5, but class/usecase
  draw at the default offset (jar +5) and mindmap keeps 10 (jar 5); sequence
  ignores `root { LineThickness }` / `RoundCorner` (rx/ry, stroke-width).
  Theme-independent: the same diffs appear with no `!theme`.
- **Impact**: the bulk of the remaining unwind2-S5 fixture diffs are these
  general root-style gaps, not theme ordering.
- **Confidence**: High
