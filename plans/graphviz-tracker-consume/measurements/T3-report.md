# T3 report (xenusu stereotyped arrows)
Commit 1416e5dcf `fix(core): stereotyped description arrows from skinparam and style tags` (unsigned).
Status: PARTIAL. Strokes and widths fixed; svg width 354 vs 353 remains (stop: needs src/core/svek/SvekEdge.ts, outside the write-set; verified fix below).

## Files
src/core/{skinparam-arrow-stereo.ts (new), skinparam-stereo-keys.ts, skinparam-accumulator.ts, skinparam-theme-builder.ts, style-cascade-class.ts (export arrowTagCascadeEntry + snames param), style-cascade-description.ts, theme-graph-colors-c.ts}, src/diagrams/description/renderer-edge.ts, tests/unit/description/gtc-t3-stereotyped-arrow.test.ts (3 tests), docs/catalog.md.
Core seam files (journal): all of the above in src/core are skinparam/style/theme seam.

## Mechanism 1: skinparam arrow<<tag>> { Color X;line.Bold() }
- Java: FromSkinparamToStyle.java:292-302 (ctor strips <<tag>>), :317-352 convertNow (first ';' token = value, a leading ';' becomes a blank token that is skipped at :349; isComplexValue :378), :357-376 readValue (`read.toLowerCase().contains("bold")` -> LineThickness 2), :396-410 addStyle (stereotype re-sign, +priority). Lookup: SvekEdge.java:816-821 getDefaultStyleDefinition(stereotype) = root,element,<diagram>,arrow.withTOBECHANGED(stereotype).
- Port: resolveSkinparam sent every `<<`-key to applyStereoOverride, which had no `arrowcolor<<tag>>` matcher -> acc.unknown; the key never reached a link. New skinparam-arrow-stereo.ts parses it into graph.descriptionArrowTagCascade[cleanedTag] = {color?, thickness?}.
- `<<bold>>` (value `;line.Bold()`): thickness 2, colour falls through to the base arrow colour (green), matching jar `stroke:#008000;stroke-width:2`. `<<bluebold>>`: `#00F` width 2.
- Ruled out: the plain (untagged) `arrow { Color green }` block (already works); inline `[#blue,bold]` link (already worked).

## Mechanism 2: <style> arrow { .tag {...} } for description
- Port had arrowTagCascade only for the class signature (classdiagram). style-cascade-description.ts now computes the same entries over DESCRIPTION_ARROW_SNAMES (componentdiagram), into the same new field; renderer-edge.ts reads it by `cleanStereotypeToken(edge.stereotype)`: colour `styleColor ?? tag.color ?? descriptionCascadeArrowColor ?? colors.arrow`, thickness `styleThickness ?? tag.thickness ?? arrowThickness`.
- Limits: the link carries ONE stereotype string (link-grammar.ts takes the first `<<..>>`); the field is last-writer when both skinparam and `<style>` spellings appear in one source; `text:`/`line.dashed`/`line.dotted` tokens and tag FontColor/LineStyle are not carried (see residuals).

## svg width 354 vs 353: NOT the bold stroke, NOT the stereotype
- Evidence (jar via scripts/oracle-render.sh vs renderSync+DeterministicMeasurer, dirs /private/tmp/claude-501/gtc-T3/{var,sw}): the +1 reproduces with no bold and no stereotype: `[a] [b] a --> b : "line plain"` jar 99 vs ours 98; labels of 8..30 chars all +1 (23 cases); `a -[#blue]-> b : "line bluebold"` +1; font sizes 8/13/24 +1; horizontal `a -left-> b` and a short label that fits inside the nodes: equal. After the stroke fix xenusu ink coordinates already equal the jar element-for-element, only the document width differs.
- Mechanism: the jar's edge label block is `TextBlockUtils.withMargin(block, marginLabel, marginLabel)` (SvekEdge.java:372-373), a TextBlockMarged whose drawU first does `ug.draw(UEmpty.create(dim))` with dim = text + 2*margin (klimt/shape/TextBlockMarged.java:81-87). LimitFinder#drawEmpty (LimitFinder.java:~133-136) adds (x,y) and (x+w, y+h), so the label contributes a right edge of labelX + textW + 2*margin (margin 1) instead of text x + textW = +1. SvekResult#calculateDimension therefore sees a document 1 wider. The port's SvekEdge.ts#drawLabelBlock (src/core/svek/SvekEdge.ts:330-336) adds the margin to the text origin but draws no UEmpty.
- Verified fix (applied temporarily, then reverted: file is outside the write-set): in drawLabelBlock, before block.drawU, `ug.apply(new UTranslate(x - margin, y - margin)).draw(UEmpty.create(new XDimension2D(dim.getWidth() + 2*margin, dim.getHeight() + 2*margin)))` with `dim = block.calculateDimension(ug.getStringBounder())` (imports UEmpty, XDimension2D). Result: xenusu render-diff 0/0 (pass), and s14, s20, f8, fm, w13 variants all equal the jar. Patch kept at /private/tmp/claude-501/gtc-T3/svekedge-uempty.patch. SvekEdge.ts is imported only by description renderer-edge.ts. Needs a ruling to extend the write-set; likely moves many description rows with vertical links and wide labels (not measured).

## Render-diff
xenusu-76-sabi405: structural 7 / numeric 2 -> 0 / 2 (only svg/@width and @viewBox[2]: 354 vs 353).

## Surveys (before -> after; /private/tmp/claude-501/gtc-T3/*)
- component: 193/14/59 -> 194/15/57. Gains: style-stereotype-on-arrow-1 diverged->conformant; xenusu-76-sabi405 diverged->structural-match (width only). Still diverged, first diff moved later: gekage-52-dato745, xekale-36-tiri787 (stroke fixed; next path stroke on g[5]), kokodo-61-dano461, koxeca-82-mese950 (stroke fixed; remaining arrow-tag FontColor text fill), pemifo-35-kute324 (stroke fixed; remaining LineStyle dasharray from the tag).
- usecase: 62/4/27 -> 63/4/26. Gain: style-stereotype-on-arrow-0 diverged->conformant.
- unknown: 495/16/314 -> unchanged.
- class: 723/0/0 -> unchanged. object: 63/8/9 -> unchanged. (The class/object "before" runs overlapped my first core edits; both equal the T2b after-surveys, taken on the clean tree.)
- Conformant losses: 0. Load was 150-210; no timeout rows in any survey.

## Tests
`vitest run --maxWorkers=4 --testTimeout=60000 tests/unit tests/architecture tests/oracle/svg-conformance`: 1271 files collected, 26201 passed, 0 failed (includes the class/object/state/description golden ratchets). typecheck, eslint, prettier clean; catalog regenerated. No out-of-write-set test pins a closed residual.

## Residuals
1. Document width +1 (above): needs src/core/svek/SvekEdge.ts.
2. Description tag cascade lacks FontColor, FontSize and LineStyle (and `text:`, `line.dashed`, `line.dotted` skinparam tokens): pemifo (dasharray), kokodo/koxeca (text fill), minulo-12-bare186, vaseda-71-suje167.
3. Multiple stereotypes on a link (`<<a>><<b>>`): only the first reaches the lookup.
