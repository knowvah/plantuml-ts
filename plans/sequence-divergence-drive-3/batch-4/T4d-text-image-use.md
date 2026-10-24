# T4d — SAX text, image and `<use>`

Agent: `typescript-pro` (sonnet), worktree `sdd3-T4d`. Commit:
`feat(sprite): port SvgSaxParser text, image and use handlers`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism
`SvgSaxParser.java:628-920`. `handleText` `:628-679`: font family default
`:645`, fill through `colorResolver`, `text-anchor` middle/end shifts
`:667-675`, size/face/decoration via T4e's `parseFontSize`/`parseFontFace`/
`applyTextDecoration`. `handleImage` `:680-725`: `getHref` `:726-731` (`href`
or `xlink:href`), `decodeDataImage` `:754-787` with `getDataImagePrefix`
`:788-800` (PNG/JPEG data URIs only; `data:image/svg+xml;base64,` is decoded
at `:756-760`), `resolveImageScale` `:733-752`, and the `matchesProperty("SVG")`
branch `:710-716` that emits an `UImageSvg` built by `buildSvgImage`
`:801-808` with `formatNumber` `:809-815`; the non-SVG branch draws a bilinear
`UImage` (`:718-723`). `handleUse` `:816-850` resolves `#id` against
`ctx.definitions`, applies `x`/`y` translate `:840`, then
`renderUseReference` `:851-865`, `applySymbolViewport` `:866-893` (viewBox
min/size, zero size skipped `:882`), `wrapSvgFragment` `:894-896`,
`parseSvgFragment` `:898-912` (provided as `ctx.renderFragment`). Fragment
parse errors are swallowed (`:909`). Open question to settle from the Java and
our fixtures: raster decoding without a DOM — reuse `png-ihdr.ts`/
`sprite-raster.ts`; if a fixture needs JPEG dimensions, port the minimal SOF
scan and cite the Java `SImageIO` read.

## Targets
Visible at T4f: rows with `<text>`, `<image>` or `<use>` in the sprite (e.g.
bucebo-91-xavo442, the largest at ws 59).

## Write-set
`src/core/klimt/sprite/sax/sax-text-image-use.ts` (replaces T4b's stub),
`tests/unit/core/klimt/sprite/sax/sax-text-image-use.test.ts`.

## Read-set
`SvgSaxParser.java:628-920`; `sax-context.ts`, `sax-style.ts` stub signatures;
`png-ihdr.ts`, `sprite-raster.ts`, `svg-nanoparser-shapes.ts` (text/fonts as
nano builds them), `UGraphicWithScale.ts`.

## Interface contracts
Exports exactly: `handleText(ctx: RenderContext, attrs: SaxAttributes,
content: string): void`, `handleImage(ctx, attrs): void`, `handleUse(ctx,
attrs): void`. Uses `ctx.renderFragment(xml, ugs)` for `<use>`; never imports
`sax-render-handler.ts` (no cycle). Style helpers via `./sax-style.js`,
mocked in tests.

## Acceptance
- Given `<text x="1" y="9" text-anchor="middle">Hi</text>`, then the text is
  shifted per `:667-675` (expected value from the Java).
- Given `<use href="#a" x="3"/>` with `a` buffered, then `renderFragment`
  receives `<svg xmlns="http://www.w3.org/2000/svg">…</svg>` and a `ugs`
  translated by (3, 0); a missing id draws nothing.
- Given a `data:image/png;base64,…` image under the SVG driver, then one
  `UImageSvg` with `formatNumber`-formatted width/height (`:801-815`).
- Given the 1042 pins, then all stay byte-equal; no conformant loss in any
  engine.

## Observability
N/A.

## Rollback
Reversible.
