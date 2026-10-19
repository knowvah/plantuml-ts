# T6f report: inline-link-colour-dropped

Commit 74c2c168c (unsigned). Files: src/diagrams/description/{link-colors (new),link-grammar,link-grammar-regex,ast,layout-helpers-types,layout-geo-post,renderer-edge}.ts, docs/catalog.md (regenerated), tests/unit/description/gtc-t6f-link-trailing-colour.test.ts (new). Description-only; no core file touched.
Write-set extensions: link-colors.ts (new), link-grammar-regex.ts (`color?` on LinkGroups), ast/layout-helpers-types/layout-geo-post/renderer-edge (plumbing for the text colour).

## Render-diff unknown/deroxu-29-gude369
Before 56 structural / 43 numeric. After 38 / 43 (18 cleared, as the census said).

## Diagnosis
- Mechanism: `CommandLinkElement.java:118,124-126` captures `color()` = `ColorParser.simpleColor(ColorType.LINE)`; `:329` stores it (`link.setColors(...)`); `:330` `applyStyle` runs AFTER, and its colour tokens call `WithLinkType.setSpecificColor` = `colors.add(LINE, c)` (WithLinkType.java:68-74), so a bracket `[#c]` replaces the trailing LINE colour. SvekEdge draws line AND arrowhead with `getColors().getColor(ARROW, LINE)` (SvekEdge.java:884-893), mutes the label font with `Colors` (TEXT, :260-262) and uses `Colors.getLineStyle()` as specific stroke (:903-904).
- Origin (port): `LINK_LINE_RE` captures `color`, `parseLinkLine` (link-grammar.ts:~428) read colour only from the bracket style, and LinkGroups had no `color` field.
- Fix: `parseLinkColors` (Colors.java:95-124 token parse: bare token -> LINE; `line:`/`arrow:`/`text:`; `line.dashed|dotted|bold`). `colorOverride = arrow ?? bracket ?? line`; `textColor` to the label font; `line.<style>` sets the link style and drops a bracket thickness (the specific stroke replaces the whole stroke).
- Reduced jar oracles (/private/tmp/claude-501/gtc-T6f/{l,m}): `#aaa` alone -> line and arrowhead #AAA; `[#red]` + `#aaa` -> #F00 (bracket wins); with `<<st>>` -> #AAA; with a label -> #AAA, label stays #000; `#line:blue;text:green : lbl` -> line #00F, label #008000; `#text:red` -> label #F00 only; `#line.dashed:red` -> dasharray 7,7, #F00; `#line.bold` -> width 2; `#0000ff` on `..>` -> #00F with dash. Ours matches all on colours, link comments, path style and label fill.
- Ruled out: `#arrow:x` is rejected by the jar's grammar (syntax error, COLOR_KEY_ALT has no `arrow`), so `arrow` is parsed per Colors.java but unreachable from this regex; `back:`/`header:` have no consumer on links.

## Tests
gtc-t6f-link-trailing-colour.test.ts, 5 tests (bare, bracket precedence, stereotype/label, keyed forms and line styles, parseLinkColors unit). Full `vitest run tests/unit tests/architecture tests/oracle/svg-conformance`: 1282 files collected, 26274 passed, 0 failed (ratchets green). typecheck, eslint, prettier clean.

## Surveys (before -> after; conformant/structural-match/diverged)
- component 212/12/42 -> 213/12/41: rekisu-47-pesa949 diverged -> conformant
- usecase 66/7/20 (+1 oracle-error): unchanged
- unknown 504/16/305: unchanged
- Losses: none. class/object not run (no core change). One row to pin.

## Residuals
deroxu 38 structural / 43 numeric. Next family T6g cluster-stereo-shadowing (and canvas-shadow-extent cascade); first paths:
- svg/defs[1][childCount] exp=1 act=0
- svg/g[1]/g[3..17]/rect[1]/@filter exp=url(#f2dozbb6s8uep) act=(none) (clusters with `Shadowing<<package>> true`)
Others left (T6h/T6j): g[106]/rect[1..4]/@fill exp=#8FF act=#FF0 (two stereotypes; T6j); g[109]/text[1..2], g[110]/ellipse[1]/@stroke, g[110..111]/text/@fill exp=#A00/#0A0 act=#000/#181818 (T6h). Nothing traces into dot-engine.
