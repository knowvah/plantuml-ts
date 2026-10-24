# Extension audit (lad T3a, user ruling 2026-10-23, D10)

Method: for each engine and directive, one probe diagram rendered twice with
the `DeterministicMeasurer` -- extended (`renderSync(src)`, the library
default) and jar-compatible (`withJarCompatibleStyleInput`, src/core/
internal-render-options.ts) -- plus the directive-free render of the same
body. Evidence is the first differing SVG attributes, jar-compatible -> extended.
Bodies: json `{ "a": 1, "b": "x" }`; yaml `a: 1` / `b: x`; hcl
`resource "aws_instance" "web" { ami = "ami-123" }`; files `/Alpha/` +
`/Alpha/Bravo`. Probe values: backgroundColor `#FFEEEE`, defaultFontName
`Courier`, defaultFontSize `20`, defaultFontColor/lineColor `red`, roundCorner
`20`, shadowing `true`, style `BackGroundColor #FFEEEE` (document) and
`#EEFFEE` / `LineColor red` (node).

Verdicts:
- `works (extension)` -- extended differs from jar-compatible. A pinned example
  exists in `tests/fixtures/extensions/`.
- `honoured by the jar too` -- both modes identical and different from the
  directive-free render; the jar itself reads it (StyleExtractor.java:88-96
  `handwritten`, `applyStyles` StyleExtractor.java:114-138), so not an extension.
- `ignored` -- extended == jar-compatible == directive-free (byte-identical).

Notes:
- hcl `<style>` node styling takes effect only through the `jsonDiagram`
  selector; `hclDiagram { node {...} }` and `filesDiagram`/`node`/`rectangle`
  selectors render identically to no style (hclDiagram is no `SName`,
  Context.java:87-91). Selector sweep: hcl jsonDiagram/document differ, others
  not; files only `document` differs (and that is honoured by the jar).
- files `!theme aws-orange`: the visible change is that the theme's
  transparent background removes `background:#FFFFFF;` from the root style.

| directive | engine | extended differs from jar-compatible | verdict | evidence (jar-compatible -> extended) |
|---|---|---|---|---|
| `skinparam backgroundColor` | json | yes | works (extension) | <svg> style "width:57px;height:58px;background:#FFFFFF;"->"width:57px;height:58px;background:#FFEEEE;" / added <rect x="0" y="0" width="57" height="58" fill="#FEE" stroke="none"/> |
| `skinparam defaultFontName` | json | yes | works (extension) | <text> font-family (absent)->"Courier" / <text> x "15"->"32.787"; font-family (absent)->"Courier"; font-weight "700"->(absent) |
| `skinparam defaultFontSize` | json | yes | works (extension) | <svg> style "width:57px;height:58px;background:#FFFFFF;"->"width:64px;height:70px;background:#FFFFFF;"; width "57px"->"64px"; height "58px"->"70px" / <rect> width "35.575"->"42.25"; height "36"->"48" |
| `skinparam defaultFontColor` | json | no | ignored | extended == jar-compatible == directive-free render (byte-identical) |
| `skinparam roundCorner` | json | no | ignored | extended == jar-compatible == directive-free render (byte-identical) |
| `skinparam shadowing` | json | no | ignored | extended == jar-compatible == directive-free render (byte-identical) |
| `skinparam lineColor` | json | no | ignored | extended == jar-compatible == directive-free render (byte-identical) |
| `skinparam lengthAdjust none` | json | yes | works (extension) | <g> lengthAdjust "spacing"->(absent) |
| `skinparam lengthAdjust spacingAndGlyphs` | json | yes | works (extension) | <g> lengthAdjust "spacing"->"spacingAndGlyphs" |
| `<style> document` | json | no | honoured by the jar too (not an extension) | identical in both modes; differs from directive-free render: <svg> style "width:57px;height:58px;background:#FFFFFF;"->"width:57px;height:58px;background:#FFEEEE;" / added <rect x="0" y="0" width="57" height="58" fill="#FEE" stroke="none"/> |
| `<style> <engine>Diagram { node {...} }` | json | no | honoured by the jar too (not an extension) | identical in both modes; differs from directive-free render: <rect> fill "#F1F1F1"->"#EFE"; stroke "#F1F1F1"->"#EFE" / <line> stroke "#000"->"#F00" |
| `skin rose` | json | no | ignored | extended == jar-compatible == directive-free render (byte-identical) |
| `!theme aws-orange` | json | yes | works (extension) | <svg> style "width:57px;height:58px;background:#FFFFFF;"->"width:55px;height:54px;"; width "57px"->"55px"; height "58px"->"54px" / <rect> width "35.575"->"33.35"; height "36"->"32" |
| `!theme amiga` | json | no | honoured by the jar too (not an extension) | identical in both modes; differs from directive-free render: <svg> style "width:57px;height:58px;background:#FFFFFF;"->"width:47px;height:48px;background:#0B58A8;"; width "57px"->"47px"; height "58px"->"48px" / <rect> x "10"->"0"; y "10"->"0"; width "35.575"->"47" |
| `skinparam handwritten true` | json | no | honoured by the jar too (not an extension) | identical in both modes; differs from directive-free render: <svg> style "width:57px;height:58px;background:#FFFFFF;"->"width:76px;height:57px;background:#FFFFFF;"; width "57px"->"76px"; height "58px"->"57px" / added <polygon points="15,10,15,10.07,20.115,9.862,25.23,10.064,30.345,10.133,35.46,9.762,40.575,10,40.565 |
| `skinparam backgroundColor` | yaml | yes | works (extension) | <svg> style "width:57px;height:58px;background:#FFFFFF;"->"width:57px;height:58px;background:#FFEEEE;" / added <rect x="0" y="0" width="57" height="58" fill="#FEE" stroke="none"/> |
| `skinparam defaultFontName` | yaml | yes | works (extension) | <text> font-family (absent)->"Courier" / <text> x "15"->"32.787"; font-family (absent)->"Courier"; font-weight "700"->(absent) |
| `skinparam defaultFontSize` | yaml | yes | works (extension) | <svg> style "width:57px;height:58px;background:#FFFFFF;"->"width:64px;height:70px;background:#FFFFFF;"; width "57px"->"64px"; height "58px"->"70px" / <rect> width "35.575"->"42.25"; height "36"->"48" |
| `skinparam defaultFontColor` | yaml | no | ignored | extended == jar-compatible == directive-free render (byte-identical) |
| `skinparam roundCorner` | yaml | no | ignored | extended == jar-compatible == directive-free render (byte-identical) |
| `skinparam shadowing` | yaml | no | ignored | extended == jar-compatible == directive-free render (byte-identical) |
| `skinparam lineColor` | yaml | no | ignored | extended == jar-compatible == directive-free render (byte-identical) |
| `skinparam lengthAdjust none` | yaml | yes | works (extension) | <g> lengthAdjust "spacing"->(absent) |
| `skinparam lengthAdjust spacingAndGlyphs` | yaml | yes | works (extension) | <g> lengthAdjust "spacing"->"spacingAndGlyphs" |
| `<style> document` | yaml | no | honoured by the jar too (not an extension) | identical in both modes; differs from directive-free render: <svg> style "width:57px;height:58px;background:#FFFFFF;"->"width:57px;height:58px;background:#FFEEEE;" / added <rect x="0" y="0" width="57" height="58" fill="#FEE" stroke="none"/> |
| `<style> <engine>Diagram { node {...} }` | yaml | no | honoured by the jar too (not an extension) | identical in both modes; differs from directive-free render: <rect> fill "#F1F1F1"->"#EFE"; stroke "#F1F1F1"->"#EFE" / <line> stroke "#000"->"#F00" |
| `skin rose` | yaml | no | ignored | extended == jar-compatible == directive-free render (byte-identical) |
| `!theme aws-orange` | yaml | yes | works (extension) | <svg> style "width:57px;height:58px;background:#FFFFFF;"->"width:55px;height:54px;"; width "57px"->"55px"; height "58px"->"54px" / <rect> width "35.575"->"33.35"; height "36"->"32" |
| `!theme amiga` | yaml | no | honoured by the jar too (not an extension) | identical in both modes; differs from directive-free render: <svg> style "width:57px;height:58px;background:#FFFFFF;"->"width:47px;height:48px;background:#0B58A8;"; width "57px"->"47px"; height "58px"->"48px" / <rect> x "10"->"0"; y "10"->"0"; width "35.575"->"47" |
| `skinparam handwritten true` | yaml | no | honoured by the jar too (not an extension) | identical in both modes; differs from directive-free render: <svg> style "width:57px;height:58px;background:#FFFFFF;"->"width:76px;height:57px;background:#FFFFFF;"; width "57px"->"76px"; height "58px"->"57px" / added <polygon points="15,10,15,10.07,20.115,9.862,25.23,10.064,30.345,10.133,35.46,9.762,40.575,10,40.565 |
| `skinparam backgroundColor` | hcl | yes | works (extension) | <svg> style "width:115px;height:40px;background:#FFFFFF;"->"width:115px;height:40px;background:#FFEEEE;" / added <rect x="0" y="0" width="115" height="40" fill="#FEE" stroke="none"/> |
| `skinparam defaultFontName` | hcl | yes | works (extension) | <text> font-family (absent)->"Courier" / <text> x "15"->"47.575"; font-family (absent)->"Courier"; textLength "22.575"->"50.575" |
| `skinparam defaultFontSize` | hcl | yes | works (extension) | <svg> style "width:115px;height:40px;background:#FFFFFF;"->"width:146px;height:46px;background:#FFFFFF;"; width "115px"->"146px"; height "40px"->"46px" / <rect> width "93.15"->"124.5"; height "18"->"24" |
| `skinparam defaultFontColor` | hcl | no | ignored | extended == jar-compatible == directive-free render (byte-identical) |
| `skinparam roundCorner` | hcl | no | ignored | extended == jar-compatible == directive-free render (byte-identical) |
| `skinparam shadowing` | hcl | no | ignored | extended == jar-compatible == directive-free render (byte-identical) |
| `skinparam lineColor` | hcl | no | ignored | extended == jar-compatible == directive-free render (byte-identical) |
| `skinparam lengthAdjust none` | hcl | yes | works (extension) | <g> lengthAdjust "spacing"->(absent) / <text> textLength "22.575"->(absent) / textLength count 2->0 |
| `skinparam lengthAdjust spacingAndGlyphs` | hcl | yes | works (extension) | <g> lengthAdjust "spacing"->"spacingAndGlyphs" |
| `<style> document` | hcl | yes | works (extension) | <svg> style "width:115px;height:40px;background:#FFFFFF;"->"width:115px;height:40px;background:#FFEEEE;" / added <rect x="0" y="0" width="115" height="40" fill="#FEE" stroke="none"/> |
| `<style> jsonDiagram { node {...} }` | hcl | yes | works (extension) | <rect> fill "#F1F1F1"->"#EFE"; stroke "#F1F1F1"->"#EFE" / <line> stroke "#000"->"#F00" |
| `skin rose` | hcl | no | ignored | extended == jar-compatible == directive-free render (byte-identical) |
| `!theme aws-orange` | hcl | yes | works (extension) | <svg> style "width:115px;height:40px;background:#FFFFFF;"->"width:104px;height:38px;"; width "115px"->"104px"; height "40px"->"38px" / <rect> width "93.15"->"82.7"; height "18"->"16" |
| `!theme amiga` | hcl | yes | works (extension) | <svg> style "width:115px;height:40px;background:#FFFFFF;"->"width:105px;height:30px;background:#0B58A8;"; width "115px"->"105px"; height "40px"->"30px" / <rect> x "10"->"0"; y "10"->"0"; width "93.15"->"105" |
| `skinparam handwritten true` | hcl | no | honoured by the jar too (not an extension) | identical in both modes; differs from directive-free render: <svg> style "width:115px;height:40px;background:#FFFFFF;"->"width:134px;height:40px;background:#FFFFFF;"; width "115px"->"134px"; viewBox "0 0 115 40"->"0 0 134 40" / added <polygon points="15,10,15,10.21,25.394,9.586,35.788,10.193,46.181,10.4,56.575,9.287,66.969,9.922,77. |
| `skinparam backgroundColor` | files | yes | works (extension) | <svg> style "width:200px;height:44px;background:#FFFFFF;"->"width:200px;height:44px;background:#FFEEEE;" |
| `skinparam defaultFontName` | files | no | ignored | extended == jar-compatible == directive-free render (byte-identical) |
| `skinparam defaultFontSize` | files | no | ignored | extended == jar-compatible == directive-free render (byte-identical) |
| `skinparam defaultFontColor` | files | no | ignored | extended == jar-compatible == directive-free render (byte-identical) |
| `skinparam roundCorner` | files | no | ignored | extended == jar-compatible == directive-free render (byte-identical) |
| `skinparam shadowing` | files | no | ignored | extended == jar-compatible == directive-free render (byte-identical) |
| `skinparam lineColor` | files | no | ignored | extended == jar-compatible == directive-free render (byte-identical) |
| `skinparam lengthAdjust none` | files | yes | works (extension) | <g> lengthAdjust "spacing"->(absent) |
| `skinparam lengthAdjust spacingAndGlyphs` | files | yes | works (extension) | <g> lengthAdjust "spacing"->"spacingAndGlyphs" |
| `<style> document` | files | no | honoured by the jar too (not an extension) | identical in both modes; differs from directive-free render: <svg> style "width:200px;height:44px;background:#FFFFFF;"->"width:200px;height:44px;background:#FFEEEE;" |
| `<style> <engine>Diagram { node {...} }` | files | no | ignored | extended == jar-compatible == directive-free render (byte-identical) |
| `skin rose` | files | no | honoured by the jar too (not an extension) | identical in both modes; differs from directive-free render: <svg> style "width:200px;height:44px;background:#FFFFFF;"->"width:200px;height:44px;background:white;" |
| `!theme aws-orange` | files | yes | works (extension) | <svg> style "width:200px;height:44px;background:#FFFFFF;"->"width:200px;height:44px;" |
| `!theme amiga` | files | no | honoured by the jar too (not an extension) | identical in both modes; differs from directive-free render: <svg> style "width:200px;height:44px;background:#FFFFFF;"->"width:200px;height:44px;background:#0B58A8;" |
| `skinparam handwritten true` | files | no | ignored | extended == jar-compatible == directive-free render (byte-identical) |
