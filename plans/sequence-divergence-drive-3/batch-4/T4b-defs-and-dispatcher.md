# T4b — pass 1, the dispatcher and the handler contract

Agent: `typescript-pro` (sonnet), worktree `sdd3-T4b`. Commit:
`feat(sprite): port SvgSaxParser defs pass and render dispatcher`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism
`SvgSaxParser` (`SvgSaxParser.java:101-185`): `drawU` builds a `ColorResolver`
and `UGraphicWithScale` (`:112-114`), then `parseSvg` runs two passes
(`:169-174`). **Pass 1** `DefsCollector` (`:186-303`): inside `<defs>` or a
`<symbol>`, an element with an `id` is buffered as raw XML
(`BufferedElement`, `:304-320`; attributes re-serialised, text through
`escapeXml` `:282`); `linearGradient`/`radialGradient` collect `<stop>`
children incl. `style` `stop-color` (`:224-240`, `GradientStop` `:321-343`);
depth tracking `:270`. **Pass 2** `RenderHandler` (`:344-486`): skips
everything while `defsDepth > 0` (`:366-372`); `startElement` switch
`:374-436` (`g` -> `handleGroupStart`; `rect|circle|ellipse|line|polyline|
polygon|path|image|use` -> handlers; `text` starts buffering `:411-415`;
everything else ignored); `endElement` `:438-457` (`g` pops; `text` calls
`handleText(textAttrs, content)`); `characters` `:458-465`; group
push/pop of `ugs` `:466-486`; `GroupState` `:1337-1348`. A parse failure
throws out of `drawU`.

## Targets
Infrastructure; first visible at T4f. Unit tests only.

## Write-set
In `src/core/klimt/sprite/sax/`: `SvgSaxParser.ts` (class, `drawU`,
`asTextBlock`, `getMinGrayLevel`=0/`getMaxGrayLevel`=255, `parseSvg`, `:101-185`),
`sax-defs.ts` (`DefsCollector`, `BufferedElement`, `GradientStop`),
`sax-context.ts` (types below), `sax-render-handler.ts` (`RenderHandler`
dispatcher, group stack, `GroupState`), and three **throwing stubs**
`sax-shapes.ts`, `sax-text-image-use.ts`, `sax-style.ts` (each exports the
signatures below, bodies `throw new Error('unported: T4c|T4d|T4e')`), plus
`tests/unit/core/klimt/sprite/sax/{sax-defs,sax-render-handler}.test.ts`.

## Read-set
`SvgSaxParser.java:101-486,1337-1348`; T4a's `sax-events.ts`;
`src/core/klimt/sprite/ColorResolver.ts`, `src/core/klimt/UGraphicWithScale.ts`
(public methods only), `SvgNanoParser.ts:1-80` (existing `drawU` shape).

## Interface contracts
`sax-context.ts`: `interface RenderContext { ugs: UGraphicWithScale;
readonly colorResolver: ColorResolver; readonly definitions: ReadonlyMap<string,
BufferedElement>; renderFragment(xml: string, ugs: UGraphicWithScale): void }`
(`renderFragment` = `parseSvgFragment` `:898-912`: new handler over the same
definitions, errors swallowed as `LOG.warning` does, `:909-911`, never thrown).
Stub signatures other tasks implement exactly:
- `sax-shapes.ts` (T4c): `handleRect|handleCircle|handleEllipse|handleLine|
  handlePolyline|handlePolygon|handlePath(ctx: RenderContext, attrs:
  SaxAttributes): void`.
- `sax-text-image-use.ts` (T4d): `handleText(ctx, attrs: SaxAttributes,
  content: string): void`, `handleImage(ctx, attrs): void`, `handleUse(ctx,
  attrs): void`.
- `sax-style.ts` (T4e): `applyStyleAndTransform(ctx, attrs, ugs):
  UGraphicWithScale`, `applyTransform(ugs, transform: string):
  UGraphicWithScale`, `extractGradientColor(ctx, gradientId: string):
  HColor | undefined`, `getAttrOrStyle(attrs, attrName, styleKey): string |
  undefined`, `getDoubleAttr(attrs, name, def): number`, `parseFontSize(s:
  string | undefined, def: number): number`, `parseFontFace(weight, style):
  UFontFace`, `applyTextDecoration(fc, decoration): FontConfiguration`.
`SvgSaxParser implements Sprite` (`drawU(ug, scale, fontColor, forcedColor)`;
`asTextBlock` as `:125-145`).

## Acceptance
- Given `<svg><defs><linearGradient id="g"><stop offset="0" stop-color="#f00"/>
  <stop offset="1" style="stop-color:#00f"/></linearGradient></defs></svg>`,
  then `definitions` holds `g` with two stops, `#f00` and `#00f`.
- Given `<g transform="translate(5,7)"><rect/></g><rect/>`, with handlers
  mocked, then the first rect sees the translated `ugs` and the second the
  original (stack popped at `</g>`).
- Given elements inside `<defs>` or an unknown tag, then no handler is called.
- Given malformed XML, then `drawU` throws. The 1042 pins stay byte-equal; no
  conformant loss in any engine (nothing is wired yet).

## Observability
N/A.

## Rollback
Reversible.
