# Batch 1a: openiconic, colors, emoji list, archimate list

All tasks run in parallel worktrees (disjoint write-sets); 1a and 1b may run together. None registers its plugin — T2a does, in upstream order. Close with the standard procedure (`../close-procedure.md`); with no plugin registered the survey cannot move, so the close is gates + journal + an all-engine survey proving 0 movers.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1a](T1a-openiconic.md) | `PSystemOpenIconic` + `PSystemListOpenIconic` | typescript-pro (opus) | `src/diagrams/openiconic/{PSystemOpenIconic,PSystemOpenIconicFactory,PSystemListOpenIconic,PSystemListOpenIconicFactory}.ts` | batch 0 | [x] |
| [T1b](T1b-colors.md) | `PSystemColors` (full grid + hexagon palette) | typescript-pro (opus) | `src/diagrams/eggs/{PSystemColors,PSystemColorsFactory}.ts` | batch 0 | [x] |
| [T1c](T1c-emoji.md) | `PSystemListEmoji` | typescript-pro (sonnet) | `src/diagrams/emoji/{PSystemListEmoji,PSystemListEmojiFactory}.ts` | batch 0 | [x] |
| [T1d](T1d-archimate-list.md) | `PSystemListArchimateSprites` | typescript-pro (sonnet) | `src/core/klimt/sprite/{PSystemListArchimateSprites,PSystemListArchimateSpritesFactory}.ts` | batch 0 | [x] |

## As landed (T0c/T0d/T0e — filled at the batch-0 close)

Merged on `feat/utility-factories-port` at the b0 close; the authoritative shapes are the files.

- **Plugin helper** `src/core/command/PSystemSingleLineFactory.ts`:
  `singleLinePlugin<D>(spec: SingleLineSpec<D>): SyncPlugin<D, SingleLineGeometry<D>>` with
  `SingleLineSpec<D> = { type: 'sequence'; executeLine(source: UmlSource, line: string,
  preprocessing: PreprocessingArtifact, options?: ParseOptions): D | undefined; render(diagram: D,
  ctx: RenderContext): AssembledSvg }`. `executeLine` receives the line **untrimmed**
  (`PSystemSingleLineFactory.java:95` `s.getString()`; jar probes: `   license` / `\tcharlie` /
  `charlie  ` are syntax-error pages) — each factory applies its own upstream pattern to the raw
  line. `options.assetStore` is the ADR-2 asset channel (`ParseOptions`, `src/core/dispatcher.ts`),
  forwarded at the b0 close for the emoji/sprite/dedication stores
  (`internalEmojiStoreFrom`/`internalSpriteStoreFrom` precedent: `src/diagrams/activity/parser.ts:96-97`).
  `render` returns `{ completeSvg }` — typically `{ completeSvg: diagram.exportDiagram(0, ctx.measurer) }`;
  a `RenderFragment` would get the wrong (`svgRoot`) root. A 2/4-line source refuses with score
  `-Infinity` (upstream's skipped `null`). Registration order decides among `'sequence'` candidates.
- **Bases** `src/core/UgDiagram.ts` (`abstract getTextBlock(num, stringBounder)`, `exportDiagram(index,
  measurer): string`, `getDefaultMargins()` = same(0), `calculateBackColor()`), `src/core/UgSimpleDiagram.ts`
  (`abstract calculateDimension(sb)` + `drawU(ug)`, it IS the TextBlock), `src/core/PlainStringsDiagram.ts`
  (`protected strings: string[]`, `image: RasterImage | undefined`, `imagePosition: GraphicPosition |
  undefined`; `getTextBlock` = `GraphicStrings.createBlackOnWhite(strings, image, imagePosition)`).
- **Core pieces added by the T0c push-forward** (journal rows 8, 12): `src/core/klimt/shape/GraphicStrings.ts`
  (all factories; `createForError` NO_CREOLE throws — TextBlockRaw unported), `src/core/klimt/sprite/SpriteContainerEmpty.ts`
  (optional internal sprite store ctor arg; GraphicStrings builds it WITHOUT one, so `<$archimate/...>` in
  GraphicStrings lines does not resolve — T1d: draw through a skin that carries the store, or report),
  `src/core/klimt/geom/GraphicPosition.ts`. Validated: Welcome page through PlainStringsDiagram is
  byte-identical to the jar's (metadata aside); `license` lines match x/y/textLength (qrcode line excepted — T1f).
- **`getCols(lines, nbCol, reserved): string[][]`** in `src/diagrams/donors/PSystemDonors.ts` (raw columns;
  upstream wraps each in `GraphicStrings.createBlackOnWhite`). T1g completes the file.
- **Colour** (T0d): `HColorSet.names(): string[]` (TreeSet order, 154), `ColorUtils.distance(c1, c2)`,
  `HColorSimple#distanceTo(other)` — use `names()`, never `ColorTrieNode` `NAMES` (insertion order).
- **Data** (T0e): `OPENICONIC_ALL` (`src/diagrams/openiconic/openiconic-all.ts`, 223, all.txt order),
  `ARCHIMATE_SPRITE_NAMES` (`src/core/klimt/sprite/archimate-sprite-names.ts`, 139 `{folder,name,format}`),
  `SKINPARAMETER_NAMES` (478) + `DONORS` (262) in `src/diagrams/donors/`, `STDLIB_CATALOG`
  (`src/diagrams/version/stdlib-catalog.ts`, 34 `{name,version,source}`), `CHARLIE_PNG`
  (`src/diagrams/eggs/charlie-image.ts`, inline base64 250x66), `DEDICATION_IMAGES`
  (`src/diagrams/dedication/dedication-images.ts`, 10 `{resource, assetKey, width, height, sha256}`;
  bytes at `assets/dedication/*.png`, keys `dedication:<resource>.png`, NOT yet packaged or read by any store — T1h).
- **Testing before T2a registers anything:** build a local `DiagramRegistry` with your plugin (T0c precedent:
  `tests/unit/core/command/PSystemSingleLineFactory.test.ts`) or call `exportDiagram` directly, and compare with
  `compareSvg` (`tests/oracle/svg-conformance/compare.ts`) against `test-results/dot-cache/unknown/<slug>/in.svg`
  under `DeterministicMeasurer`.
