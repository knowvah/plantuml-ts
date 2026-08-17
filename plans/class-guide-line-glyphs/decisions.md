# Architecture decisions — class-guide-line-glyphs

Java paths under `~/git/plantuml/src/main/java/net/sourceforge/plantuml/`.

## D1 — Per-line glyphs live on the line: `EdgeGeo.labelLines[i].glyph?`

`labelLines?: Array<{ text; x; y; width; glyph?: { points: Array<{x;y}> } }>`
(`class-geo-types.ts:302`). Co-located with its line, so `class-ink-box.ts:
323-331`, `layout.ts:170-174` (translate) and `renderer-edge.ts:333` iterate
one array. Rejected: parallel `arrowGlyphs?[]` (index-coupled); reusing the
single `arrowGlyph` (cannot express four). `arrowGlyph` stays the whole-label
(single-line) glyph, mutually exclusive with `labelLines` as today.

## D2 — The geo/anchor layer takes the resolved arrow `FontSpec`

`buildEdgeGeos` (`class-edge-geo.ts:303`), `attachEdgeLabel`, `attachMagicArrow`
(`:141`, `CARDINALITY_FONT_SIZE` at `:151`) and `multiLineLabelAnchor`
(`class-edge-label-anchor.ts:50-57`, same constant) take `labelFont: FontSpec`
= `resolveArrowLabelFont(theme)` passed from `layout.ts:288`, replacing
`fontFamily: string` + the constant on the **main-label** paths only. Tail/head
(cardinality) labels keep their own font — do not touch `portLabelAnchor`'s
callers for `tailLabel`/`headLabel`. The resolver stays the only reader of
`theme.colors.graph.arrowFont*` (SI24 D3). Rejected: passing `theme` into
class-edge-geo (wider seam); leaving 13 (box/ink drift on `camuna`/`ticuxa`).

## D3 — One per-line walk feeds both the DOT box and the ink

`class-magic-arrow.ts` exports `splitGuideLines(lines, font, measurer):
GuideLine[]` (`{ text, direction?, textWidth, blockWidth, blockHeight }`, one
per line: `blockWidth = font.size + textWidth` iff the line has a token, else
`textWidth`; `blockHeight = max(font.size, textHeight)` iff token, else
`textHeight`). `computeGuideLinesBox` (`:90-108`) becomes `max(blockWidth) ×
sum(blockHeight)` over that walk — byte-identical output. The geo layer
consumes the same walk. Rejected: a second parse+measure in the geo layer
(SI23's lesson: the same string measured and drawn must share one path).

## D4 — Placement mirrors `StringWithArrow#addSeveralMagicArrows`

`descdiagram/command/StringWithArrow.java:115-127`: per line `create9`, then
`mergeLR(TextBlockArrow2(size×size), line, VerticalAlignment.CENTER)` iff the
line has a token (`addMagicArrow2`, `:110-113`), then `mergeTB(result, block,
alignment)` — each line block centred (or left/right per the label's
alignment) inside the merged block width; the jar's `gobuco` text x values
79.68/80.05/81.51/79.68 confirm centring. Glyph: `magicArrowGlyphPoints
(lineBlockLeft, lineTop, magicArrowAngle(fromToPoints, dir), font.size)`
(`class-magic-arrow.ts:153,183`), text `<text>` at `lineBlockLeft + font.size`
+ its own centring; `y` per `multiLineLabelAnchor`'s existing per-line
formula. `TextBlockArrow2#calculateDimension` is `(size, size)`
(`klimt/shape/TextBlockArrow2.java:87-89`); `.80` is draw-only (`:64-65`) and
already lives inside `magicArrowGlyphPoints`. Direction per line from
`parseMagicArrowLabel(line).direction`, muted by the edge guide exactly as the
whole-label path (`attachMagicArrow` → `magicArrowAngle`) — read `abel/
LinkArrow.java:55` (`mute`) and journal the reading.

## D5 — `class-geo-types.ts` (501/500 lines) is trimmed, not split

Trim doc-comment prose (never a `file:line` citation) to make room for the
`glyph?` field. Rejected: `class-geo-types-edge.ts` split (touches ~10
importers for one optional field).

## D6 — Movement policy

`gobuco`/`lapoma` move (glyphs appear; ink-box grows toward jar's doc size).
`camuna`/`ticuxa`/`nafiki` may move under D2, toward jar only. Everything
else byte-identical in DOT and SVG. Glyph **shape** byte-exact (proven on
`lojepe-37-liri985`); absolute **position** carries the accepted N25/N62 gvts
placement residual and is not chased. Reversible — one commit per task.
