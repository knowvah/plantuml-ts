# T4e — SAX gradients, style, transforms, fonts

Agent: `typescript-pro` (sonnet), worktree `sdd3-T4e`. Commit:
`feat(sprite): port SvgSaxParser gradient, style and transform helpers`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism
`SvgSaxParser.java:921-1335`. Gradients: `extractGradientColor` `:921-962`
(linear with >= 2 stops -> `HColorLinearGradient`, radial/other -> first stop),
`buildGradientStops` `:963-976`, `getStopColor` `:977-986`, `parseOffset`
`:987-999`, `parseOpacity` `:1000-1010`, `clamp01` `:1011-1018`,
`parseSpreadMethod` `:1019-1035`, `determineGradientPolicy` `:1036-1078`
(deltaY/deltaX thresholds 0.1/0.5/0.3 — cite each as a Java literal, never a
fitted value), `parsePercentOrNumber` `:1079-1093`. Style:
`applyStyleAndTransform` `:1094-1155` (`transform`, `stroke-width`, `stroke`,
`fill`: `none`, `url(#id)` gradient, plain colour; fill defaults when stroke
is absent), `getAttrOrStyle` `:1156-1163`, `getStyleValue` `:1164-1189`
(`style="a:b;c:d"` split). Transforms: `applyTransform` `:1190-1226` and
`parseNumberList` `:1227-1253` (matrix/translate/scale/rotate). Fonts:
`parseFontSize` `:1254-1284`, `parseFontFace` `:1285-1302`,
`applyTextDecoration` `:1303-1320`. `getDoubleAttr` `:1321-1335`. Compare
with `svg-nanoparser-transform.ts` (nano's regex transform): the SAX version
is a different algorithm; port it, do not reuse.

## Targets
Visible at T4f: rows whose sprites use gradients, `style=`, groups with
transforms or text fonts.

## Write-set
`src/core/klimt/sprite/sax/sax-style.ts` (replaces T4b's stub; may split
`sax-gradient.ts` at the 500-line hook, journal it),
`tests/unit/core/klimt/sprite/sax/sax-style.test.ts`.

## Read-set
`SvgSaxParser.java:921-1335`; `sax-context.ts`/`sax-defs.ts` (`BufferedElement`,
`GradientStop`); `ColorResolver.ts`; `UGraphicWithScale.ts` (`apply*`);
`src/core/klimt/color/` gradient classes (find the `HColorLinearGradient`
port; if missing, report — stop 1).

## Interface contracts
Exports exactly the T4b stub list: `applyStyleAndTransform`, `applyTransform`,
`extractGradientColor`, `getAttrOrStyle`, `getDoubleAttr`, `parseFontSize`,
`parseFontFace`, `applyTextDecoration` (signatures in
[T4b](T4b-defs-and-dispatcher.md)). Pure over `SaxAttributes` + `RenderContext`;
no import of `sax-shapes.ts`, `sax-text-image-use.ts` or the render handler.

## Acceptance
- Given `style="fill:#f00;stroke:#00f"` and no attributes, then fill `#f00`,
  stroke `#00f` (`:1156-1189`); an attribute wins over `style` where
  `:1156-1163` says so.
- Given a two-stop horizontal linear gradient, then the policy is the Java's
  (`:1053-1058`) and the stops carry offset/opacity (`:963-1010`).
- Given `transform="matrix(1 0 0 1 4 5)"` and `translate(3)`, then the
  `ugs` offsets equal the Java's results (hand-computed from `:1190-1253`).
- Given the 1042 pins, then all stay byte-equal; no conformant loss in any
  engine.

## Observability
N/A.

## Rollback
Reversible.
