# T3a (F1): draw internal PNG sprites — `SpriteImage` (D15)

Prepend [../task-preamble.md](../task-preamble.md). Agent: typescript-pro (opus). Pre-approved core (D15).

## Mechanism (journal rows 16, 20)
`SpriteContainerEmpty.getSprite` → `SpriteImage.fromInternal` (SpriteContainerEmpty.java:58-61,
SpriteImage.java:100-128) returns a `SpriteImage` for a `/sprites/**.png`; its `asTextBlock`
draws a `UImage` of the pixels — muted to the font/forced colour unless `usedColor == null` or the
mapper is MONOCHROME (SpriteImage.java:60-100). The port's internal store keeps PNGs as dims-only
objects (`src/core/internal-sprite-store.ts:84-91,104` `pngDimensions`), so creole `<$...>` of a
PNG sprite draws nothing (`getSpriteMonochrome` declines it since `274fb981b`). Row: `xucoma-93-jeko861`
(listsprite) — 24 of 139 archimate entries are PNG; every row after the first PNG (`access`)
mis-sizes (7001 diffs). Read `UImage.muteColor` / `PixelImage` in the Java for the tint; check
how the jar's xucoma `<image>` hrefs look (tinted or raw) before choosing.

## Task (TDD)
Port `klimt/sprite/SpriteImage.java` (the drawing half; `fromInternal`'s probe already lives in
`internal-sprite-store.ts`) so the internal store returns a drawable PNG sprite carrying its bytes,
and the creole atom path draws it (`creole-atoms-image-resolver.ts`) and sizes it (the existing
dims lookup). Mirror `muteColor` exactly if the jar tints. Then xucoma-93 must reach 0 diffs
(render through the utility harness store) — or each residual is named with Java + port file:line.
Class/description stereotypes also resolve internal PNG sprites: run their survey slices
(`npm run svg:survey -- class --out <wt>/…`, `component`, `usecase`) before/after and report
every mover with its mechanism (an improvement is expected, a loss is stop 4).

## Write-set
`src/core/klimt/sprite/SpriteImage.ts` (new), `src/core/internal-sprite-store.ts`,
`src/core/sprite-registry.ts`, `src/core/creole-atoms-image-resolver.ts`,
`src/core/klimt/sprite/sprite-raster.ts`, their tests, `docs/catalog.md`, `.agent-notes/ufp-T3a.md`.
Any other file is a stop (report it). Never `src/core/klimt/creole/**` command/stripe files (T3b).

**Observability:** N/A. **Rollback:** Reversible.
