# T2g: `UPixel` driver + `dimToUse` nullability (DRAFT — needs maintainer approval, journal row 22)

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

Resolves the second stop-10 report (journal row 21, T2a) and the batch-1 contract defect
(row 20, T2d R1). Same shape as T2f: klimt pieces go INTO THEIR UPSTREAM HOME (D4), never into
salt. Runs after the batch-2 close; T3a (`ElementFactoryImage`) and T4a depend on it for the four
`<<sprite>>` rows (`kaziri-68-fofu065`, `terujo-11-dizo291`, `xutoni-07-pike306`, `zocule-51-bave879`).

## Task (TDD, one failing test first per piece, jar/Java values)

1. **`UPixel`** (`klimt/shape/UPixel.java`: an empty `UShape` marker) →
   `src/core/klimt/shape/UPixel.ts`.
2. **`DriverPixelSvg`** (`klimt/drawing/svg/DriverPixelSvg.java:44-58`) → replace the throwing
   stub in `src/core/klimt/drawing/svg/driver-svg-stubs.ts` with a real
   `src/core/klimt/drawing/svg/driver-pixel-svg.ts` (file naming as the sibling
   `driver-rectangle-svg.ts`), and register it in `u-graphic-svg.ts` beside the other
   `registerDriver` calls (`:167-179`), mirroring `UGraphicSvg.java:122`. Behaviour to mirror
   exactly: stroke colour = `param.getColor()` (gradient ⇒ `getColor1()`), `setStrokeWidth(0.5,
   null)`, then `svgRectangle(x, y, 0.5, 0.5, 0, 0, 0)` — read the port's `svgRectangle` signature
   (`svg-graphics-core.ts`) and `driver-rectangle-svg.ts:93` for the call shape. Jar fact from
   T2a's probe (`.agent-notes/sep-T2a.md`): the pixel rect's `fill` is whatever the SVG writer's
   PREVIOUS fill was (`#000` in `kaziri`, `black` in `widget-image.jar.svg`) — the driver sets no
   fill, so the port's `SvgGraphics` must carry its fill state the same way; pin one pixel from
   `kaziri-68-fofu065/in.svg` attribute-for-attribute. Update the doc comments in
   `driver-svg-stubs.ts` and `u-graphic-svg.ts` (the "deferred D3′ drivers" list) and
   `LimitFinder.ts:80` only if its `UPixel` branch is now reachable (read
   `LimitFinder.java`'s `UPixel` branch first; port it if so).
3. **Unstub `ElementImage.ts`**: replace the `unported: UPixel` throw with
   `ug.apply(new UTranslate(i, j)).draw(new UPixel())` (`ElementImage.java:66-71`); the existing
   T2a tests for the empty image and z=1 stay; add the `X`-pixel case against the jar probe.
4. **`dimToUse: XDimension2D | null`** on `Element#drawU` (`Element.java:46` takes a nullable
   reference; `ElementTreeEntry.java:90,96` passes `null`). Change the interface in
   `src/diagrams/salt/element/Element.ts:17` and EVERY implementer's signature under
   `src/diagrams/salt/element/` (list them in the report); where a body reads `dimToUse`, keep the
   read unguarded with a non-null assertion and a one-line comment citing the Java NPE site
   (`ElementLine.java:62`, `ElementMenuBar.java:108`, `ElementBorder.java:80`) — mirror, do not
   guard. Delete `NULL_DIM_TO_USE` in `ElementTreeEntry.ts` and pass `null`. This is a pure type
   change (push-forward category); journal the consumer list.
5. Leave `HColors.changeBack` alone (row 21 flag; the `new Back(ug.getParam().getColor())` idiom
   is the port's existing convention, `ExtremityTriangle.ts:80`).

## Write-set
`src/core/klimt/shape/UPixel.ts` (new), `src/core/klimt/drawing/svg/driver-pixel-svg.ts` (new),
`src/core/klimt/drawing/svg/{driver-svg-stubs,u-graphic-svg}.ts`, `src/core/klimt/drawing/LimitFinder.ts`
(only per step 2), `src/diagrams/salt/element/*.ts` (signatures + `ElementImage.ts` + `ElementTreeEntry.ts`),
their tests (`tests/unit/core/klimt/**`, `tests/unit/salt/element/**`), `docs/catalog.md`.
Any OTHER file is a stop: report, do not edit.

## Acceptance
- Given `kaziri-68-fofu065`'s sprite, then every `X` emits the jar's `<rect … width="0.5" height="0.5">`
  with its stroke and fill attributes identical, in the jar's order.
- Given `ElementTreeEntry` drawing cells with `null`, then `typecheck` passes with no cast.
- Given `tests/architecture` + the klimt SVG driver suites, then nothing else changes.

**Observability:** N/A. **Rollback:** Reversible (revert).
