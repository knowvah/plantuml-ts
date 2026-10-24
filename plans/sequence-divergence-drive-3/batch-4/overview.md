# Batch 4 — SAX sprite parser (D2)

Port `svg/parser/SvgSaxParser.java` (1429 lines: two passes, `DefsCollector`
then `RenderHandler`) and `SvgSpriteParserFactory.java` so `!pragma svgparser
sax` draws SVG sprites as the jar does. Today the port drops the pragma
(`sequence/command-common.ts:46-53`) and only has the nano parser. Targets:
the 30 sequence rows with family `svgparser-sax-unported`
(`../measurements/planning-open-rows.tsv`) plus one unknown-engine row
(`cenucu-07-mepi600`, the only `test-results/dot-cache/unknown/*/in.puml`
with the pragma). All new code lives in `src/core/klimt/sprite/sax/`, one
file per upstream section, so T4c/T4d/T4e write disjoint files. T4b owns the
dispatcher and creates the three handler files as throwing stubs; T4c, T4d
and T4e each replace exactly one stub (the interface contract is in
[T4b](T4b-defs-and-dispatcher.md)). Their unit tests `vi.mock` the sibling
modules; the integrated check is T4f. Core batch: the close runs the
all-engine survey (stop 4); non-sequence movers expected only at T4f
(stop 13), and only rows that use `svgparser sax`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T4a](T4a-xml-event-adapter.md) | xmldom event adapter; `@xmldom/xmldom` to dependencies | typescript-pro (sonnet) | `sax/sax-events.ts`, `package.json`, `package-lock.json` + tests | B3 | [x] |
| [T4b](T4b-defs-and-dispatcher.md) | pass 1 `DefsCollector`, `RenderHandler` dispatcher, `SvgSaxParser` class, handler stubs | typescript-pro (sonnet) | `sax/sax-defs.ts`, `sax/sax-render-handler.ts`, `sax/SvgSaxParser.ts`, `sax/sax-context.ts`, stubs of `sax-shapes.ts`, `sax-text-image-use.ts`, `sax-style.ts` + tests | T4a | [x] |
| [T4c](T4c-shapes.md) | rect/circle/ellipse/line/polyline/polygon/path | typescript-pro (sonnet) | `sax/sax-shapes.ts` + tests | T4b | [x] |
| [T4d](T4d-text-image-use.md) | text, image, `<use>` | typescript-pro (sonnet) | `sax/sax-text-image-use.ts` + tests | T4b | [x] |
| [T4e](T4e-gradients-style-transform.md) | gradients, style, transforms, fonts | typescript-pro (sonnet) | `sax/sax-style.ts` + tests | T4b | [x] |
| [T4f](T4f-wiring.md) | factory, keep the pragma, select the parser at sprite draw | typescript-pro (sonnet) | `sax/svg-sprite-parser-factory.ts`, `sprite-commands.ts`, `SpriteSvg.ts`, `creole-atoms-image-resolver.ts`, `command-common.ts` + tests | T4c, T4d, T4e | [x] |
| T4g | multi-stop `<linearGradient>` emitter in the root defs + `withContentGradientIds` lifting on the sequence atom path (push-forward from T4e/T4f artifacts, journal rows 63/65/66) | typescript-pro (sonnet) | `paint.ts`, `svg-defs.ts`, `sequence-text.ts`, `sax-gradient.ts`, `klimt/drawing/svg/{svg-graphics-core.ts, svg-linear-gradient.ts (new), driver-rectangle-svg.ts}` + tests | T4f | [x] |
| close | standard close as `b4`; pin the rows that reach zero | orchestrator | per close-procedure | T4a–T4g | [x] |

Paths under `src/core/klimt/sprite/` unless stated. T4b/T4f are not
parallel with the others; T4c, T4d, T4e run in parallel worktrees.
