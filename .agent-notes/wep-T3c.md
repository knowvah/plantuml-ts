## Observation: jar crash rows throw at render, not parse
- **Context**: porting WBSDiagramFactory; pinning the 204 wbs parse outcomes.
- **Finding**: `ledama-83-xoko366` and `link-URL-tooltip-0` parse fine; the jar's `IllegalArgumentException: character to be escaped is missing` is `Matcher.appendReplacement` in `SvgGraphics$LinkData.getXlinkTitle` (SvgGraphics.java:1156), reached from `AtomText.drawU` -> `UGraphicSvg.startUrl`, on a tooltip ending in a backslash (`\` + `<U+005C>`).
- **Impact**: the throw belongs to the SVG renderer/link tooltip path (T4a/render), not the factory.
- **Confidence**: High (stack trace in the cached in.svg).

## Observation: WBS root never registers its (code)
- **Context**: writing link tests.
- **Finding**: `WBSDiagram.addIdeaDisplay` level 0 does not `codes.set`; only children do, so `* "x" as c` on the root cannot be linked.
- **Impact**: link tests must put codes on child nodes.
- **Confidence**: High.
