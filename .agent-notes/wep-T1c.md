## Observation: HColor is applied via Fore in this port
- **Context**: porting WBSLink.drawU (`ug.apply(color)`)
- **Finding**: AbstractCommonUGraphic.apply handles only `Fore`/`Back`/`UTranslate`/`UStroke`; a bare colour is not a UChange, so WBSLink wraps it as `new Fore(color)`. WBSLink takes `HColorOrPaint`; `HColor` (abel/Colors.ts) is `object`.
- **Impact**: later wbs tasks passing colours to ug.apply must wrap in Fore.
- **Confidence**: High

## Observation: XRectangle2D.intersect may return undefined
- **Context**: WBSLink with coincident rectangles (zero-length centre line)
- **Finding**: intersect returns undefined (Java null -> NPE in XLine2D.line); WBSLink throws Error to mirror.
- **Impact**: none for normal layouts.
- **Confidence**: High
