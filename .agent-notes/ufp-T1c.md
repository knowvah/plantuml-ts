## Observation: emoji list needs two core fixes outside the T1c write-set
- **Context**: porting PSystemListEmoji; 7 corpus rows compared with compareSvg.
- **Finding**: with only the write-set, every row diverges on fills (monochrome `<#0:code:>` drawn in colour, because `drawEmojiAtom` passes `undefined, undefined` as fontColor/forcedColor to `SvgNanoParser.drawU`; Emoji.java drawU passes `colorForMonochrome` twice). tomodo-34-bimi231 additionally emits `<path d="M x,y">` for artwork 1f5c2 (`d="M11 14zm0 0z"`) because `SvgNanoParser#drawPath` lacks SvgPath.drawMe's `if (path.isInvisible() == false)` (SvgPath.java:246). Applying both: 7/7 zero diffs.
- **Impact**: any emoji `<#color:...>` in class/description/chrome is mis-tinted too.
- **Confidence**: High (patch applied temporarily, then reverted).

## Observation: base class already owns getTextBlock
- **Context**: porting Java's private getTextBlock() into a UgSimpleDiagram subclass.
- **Finding**: UgSimpleDiagram.getTextBlock(num, sb) is public (returns this); the Java private no-arg method is renamed buildTextBlock in the port.
- **Impact**: same clash will hit any other UgSimpleDiagram subclass with a private getTextBlock.
- **Confidence**: High
