# Module catalog

**Generated — do not edit by hand.** Regenerate with `npm run catalog`;
`tests/architecture/catalog.test.ts` fails if this file drifts from `src/`.

This is the index `CLAUDE.md` means by "**Check before implementing
anything**; agents routinely rebuild what exists". It answers *does a
module for X already exist?* — one row per module, its exported surface
named. For *where is symbol Y defined*, use Serena's `find_symbol` or
`ast-grep`, which are better at it than any document.

1046 modules · 3736 exported names.

## `src/`

| Module | Exports | Purpose |
|---|---|---|
| `index.ts` | `RenderOptions`, `assembleSvg`, `stdlibStore`, `withStdlib`, `BundleData`, `StdlibStore`, `stdlibRegistry`, `StdlibChunkLoadError`, `StdlibRegistry`, `prepareIncludeStore`, `IncludeWarmupOptions`, `remoteStdlib`, `StdlibResourceFetchError`, `StdlibRemoteManifest`, `RemoteBundle`, `spriteSplitStdlib`, `SpriteNotBundledError`, `SpriteSplitManifest`, `combineAssetStores`, `AssetPayload`, `AssetStore`, `renderPagesSync`, `renderSync`, `render`, `renderPages`, `renderAll` |  |

## `src/core/`

| Module | Exports | Purpose |
|---|---|---|
| `arrow-label-font.ts` | `ARROW_LABEL_DEFAULT_COLOR`, `ArrowLabelFont`, `resolveArrowLabelFont`, `resolveCardinalityFontColor` | D3: the arrow-label font resolver -- `GraphvizImageBuilder.java:234-235` (`getDefaultStyleDefinitionArrow(stereotype).getMergedStyle(...) .getFontConfiguration(...)`), upstream's `labelFont` argument to `SvekEdge`'s constructor. |
| `assemble-svg.ts` | `assembleSvg` | The single central document-assembly choke point — extracted from `src/index.ts` (mission A5 / T4), which sits at the repo's 500-line hook cap. |
| `asset-store.ts` | `AssetPayload`, `AssetStore`, `combineAssetStores` | ADR-2's asset store seam (`plans/s1l-tail-fix/decisions.md`) — the synchronous, pre-fillable channel for vendored binary/text asset payloads (the jar-internal `/sprites/**` bundle, F4-a; Twemoji artwork, F4-b). |
| `block-extractor.ts` | `DiagramType`, `UmlSource`, `finalizeBlock`, `upstreamTypeOf`, `extractBlocks` | Block extractor: types a block's PREPROCESSED content, from the @start<type> keyword suffix or -- for plain @startuml -- by probing the first 20 non-empty content lines. |
| `BlockUmlBuilder.ts` | `BlockUmlOk`, `BlockUmlErr`, `BlockUml`, `buildBlockUmls`, `isBlockEmpty` | `BlockUmlBuilder` -- the document -> blocks stage, and the reason it runs BEFORE the preprocessor. |
| `build-theme.ts` | `ResolvedThemeAndStyles`, `buildTheme` | Theme resolution -- extracted out of `src/index.ts` (this repo's `check-complexity.py` 500-line file cap; a MECHANICAL move, no behavior change beyond skin-reddress-variants Fix 2, documented below). |
| `cluster-title-table.ts` | `computeTitleTableHeight` | `ClusterHeader`'s title/stereotype/attribute-text-height formula — moved out of `../diagrams/state/state-composite-header.ts` (namespace-cluster-box mission T3: the class engine needs the same formula for its own cluster title table, and no |
| `color-override.ts` | `resolveBareOrBackColor` | Shared `#color`/`#back:color;...` background-override extraction — split out of `renderer-classifier-box.ts` (G2 N34) so `renderer-note.ts` can reuse the SAME bare/`back:`-component grammar for a note's own `#color` override (`ClassNote.col |
| `creole-atoms-image-resolver.ts` | `resolveSvgSpriteAtom`, `makeAtomImageResolverFor` | creole-atoms-image-resolver.ts — SI5b+E2r T7 (moved from `diagrams/ description/render-atoms.ts` by SI27 T2 — upstream's `AtomSprite`/ `SvgNanoParser` decomposition is ONE shared place both the description engine (`renderer-entity.ts`) and |
| `creole-atoms-measure.ts` | `measureInlineAtom`, `spriteScale`, `spriteAtomScale`, `measureLineWithAtoms`, `lineAtomHeightExcess` | Measurement (D9) for Creole `<img>` / `<$sprite>` / `<&openiconic>` inline atoms — the scaled pixel dims each atom contributes to label measurement, and the per-line width/height composition built on top of them. |
| `creole-atoms-openicon.ts` | `scanOpenIconSpans`, `matchOpenIconAt` | OpenIconic `<&glyph>` span recognizer -- split out of `creole-atoms.ts` purely to keep that file under this project's 500-line cap (G2 N41; mirrors the existing `class-layout-helpers.ts`/`class-member-rows.ts` split precedent). |
| `creole-atoms.ts` | `ImgAtomToken`, `SpriteAtomToken`, `OpenIconicAtomToken`, `InlineAtomToken`, `RenderSegment`, `LineAtomScan`, `DrawablePrimitive`, `AtomImageResolver`, `SpriteDims`, `SpriteDimsLookup`, `SPRITE_NAME_PATTERN_SOURCE`, `SPRITE_PATTERN_SOURCE`, `parseScale`, `parseColorFromBlock`, `AtomSpan`, `scanLineForAtoms`, `AtomMatchAt`, `spanToMatch`, `matchAtomAt` | Creole `<img>` / `<$sprite>` / `<&openiconic>` inline atoms. |
| `creole-lexer.ts` | `CreoleSpan`, `EMPTY_STATE`, `tokenise`, `mergeSpans`, `parseTokens` | Creole markup lexer + inline-style parser. |
| `creole-svg.ts` | `spansToTspan` | Creole span → SVG `<tspan>` serialisation. |
| `creole-table.ts` | `TableCell`, `TableToken`, `parseTableRow`, `isTableLine`, `DEFAULT_LINE_HEIGHT`, `measureTable`, `tableTokenToSvg` | Creole table parsing, measurement, and SVG rendering. |
| `creole.ts` | `CreoleSpan`, `TableCell`, `TableToken`, `measureTable`, `tableTokenToSvg`, `spansToTspan`, `CreoleToken`, `parseCreole`, `parseCreoleTokens`, `creoleToSvg` | Creole markup parser for PlantUML labels. |
| `descriptive-keywords.ts` | `USymbol`, `ALL_TYPES`, `KEYWORD_TO_SYMBOL`, `stripSpriteRegions` | Shared descriptive-keyword table — single source of truth for the descriptive diagram engine (component / use-case / deployment). |
| `diagram-type-set.ts` | `DiagramType`, `findStartTypes` | Faithful port of `net.sourceforge.plantuml.core.DiagramType`'s start-tag candidate set — `findStartTypes` only. |
| `dispatcher.ts` | `ParseOptions`, `RenderFragment`, `CompleteSvg`, `AssembledSvg`, `PaginatedPlugin`, `SyncPlugin`, `AsyncPlugin`, `DiagramPlugin`, `parseRefusalOf`, `Resolution`, `DiagramRegistry`, `registry` | Dispatcher: holds a registry of DiagramPlugin instances and resolves which one owns a given UmlSource **by attempting the parse**, exactly as upstream does (`PSystemBuilder#createPSystem`, `:257-283`). |
| `dot-engine-measurer.ts` | _(none)_ | The single install point for `@knowvah/dot-engine`'s text measurer. |
| `edge-label-box.ts` | `stripCreoleMarkup`, `ReservedLabelBox`, `CLASS_ATTRIBUTE_ICON_SIZE_DEFAULT`, `VisibilityIconAdjustment`, `applyVisibilityIcon`, `applyGuillemet`, `MagicArrowDirection`, `MagicArrowLabel`, `parseMagicArrowLabel`, `computeReservedLabelBox`, `QuantifierBox`, `computeQuantifierBox`, `NoteOnLinkPosition`, `MergedLabelBoxInput`, `computeMergedLabelBox` | The reserved box an edge label occupies in the DOT handed to graphviz. |
| `EmbeddedDiagram.ts` | `Line`, `NestedDiagramRenderer`, `getEmbeddedType`, `EmbeddedDiagram` | EmbeddedDiagram — a creole `{{ ... |
| `graph-layout-build-borderpoint.ts` | `ClusterHandles`, `inheritedEeLabel`, `buildBorderPointClusterHandles` | G7 T14b border-point (`<<entrypoint>>`/`<<exitpoint>>`-child, `portRanksLabelOnEe`) cluster nesting — split out of ./graph-layout-build.ts#addClusters (500-line file-cap compliance; pure extraction, no behavior change). |
| `graph-layout-build-constraint.ts` | `withSameContainerConstraints` | The two graph-level paths to `constraint=false`. |
| `graph-layout-build-edges.ts` | `CARDINALITY_FONT_SIZE`, `EdgeIndex`, `edgeKey`, `addEdges` | `addEdges` — split out of ./graph-layout-build.ts (500-line file-cap compliance, forced by G7 T14b's border-point wiring additions; pure move, no behavior change). |
| `graph-layout-build.ts` | `PX_PER_INCH`, `addEdges`, `edgeKey`, `CARDINALITY_FONT_SIZE`, `EdgeIndex`, `applyGraphAttrs`, `firstEncounterOrder`, `addNodes`, `ClusterIndex`, `addClusters` | @knowvah/dot-engine builder construction for `layoutGraph()` — split from `graph-layout.ts` (500-line file cap). |
| `graph-layout-cluster.types.ts` | `DotInputCluster` | `DotInputCluster` — the cluster half of the layout input contract. |
| `graph-layout-result.types.ts` | `DotLayoutResult` | `DotLayoutResult` — the layout engine's OUTPUT shape. |
| `graph-layout.ts` | `CARDINALITY_FONT_SIZE`, `setLayoutInputObserver`, `layoutGraph`, `DotInputNode`, `DotInputNodeShape`, `DotInputEdge`, `DotInputCluster`, `DotInputGraph`, `DotLayoutResult` |  |
| `graph-layout.types.ts` | `DotInputNodeShape`, `DotInputPortRow`, `DotInputNode`, `DotInputEdge`, `DotInputCluster`, `DotInputGraph`, `DotLayoutResult` |  |
| `include-resolver-node.ts` | `ReadFileFn`, `makeNodeFsFetcher` |  |
| `include-resolver.ts` | `MapIncludeStore`, `IncludeNotFoundError`, `StdlibNotBundledError`, `EMPTY_INCLUDE_STORE`, `IncludeStore`, `IncludeFetcher`, `CspIncludeError`, `CorsIncludeError`, `IncludeResolveError`, `CircularIncludeError`, `fetchInclude`, `prefetchIncludes`, `IncludeWarmupOptions`, `prepareIncludeStore` | The ASYNC half of the include seam. |
| `internal-emoji-store.ts` | `INTERNAL_EMOJI_ASSET_PREFIX`, `internalEmojiAssetKey`, `InternalEmojiStore`, `EmojiArtworkResolver`, `emojiArtworkResolverFor`, `internalEmojiStoreFrom` | The Twemoji artwork half of `<:name:>` emoji rendering. |
| `internal-sprite-store.ts` | `INTERNAL_SPRITE_ASSET_PREFIX`, `internalSpriteAssetKey`, `InternalSpriteStore`, `internalSpriteStoreFrom`, `matchJarSpriteLine` | `SpriteImage.fromInternal` (java `klimt/sprite/SpriteImage.java:100-128`) — the jar-internal `/sprites/**` bundle, ported onto ADR-2's synchronous asset channel (`plans/s1l-tail-fix/decisions.md`). |
| `java-whitespace.ts` | `isJavaWhitespaceAt` | `Character.isWhitespace(char)`, enumerated. |
| `latex.ts` | `measureNodeLabel`, `renderNodeLabel`, `LabelSpan`, `parseLatexLabel`, `measureLatex`, `renderLatexMathML`, `renderLatexAsImage` | LaTeX label parsing, sizing, and rendering utilities. |
| `layout-epsilon.ts` | `absorbLayoutEpsilon` | Round away the sub-thousandth float noise this port's own unit conversion introduces, so it cannot flip a truncating integer cast. |
| `magma.ts` | `computeBranch`, `MagmaGroupInput`, `buildMagmaEdges` | "Magma" standalone chaining — the shared cucadiagram/svek layout feature that arranges link-less ("standalone") leaves into a square grid of INVISIBLE edges so graphviz packs them compactly. |
| `measurer-bounder.ts` | `MeasurerStringBounder` | measurer-bounder.ts — `StringMeasurer` -> `StringBounder` adapter (description-leaf-sizing-audit T6 / ADR-6). |
| `measurer-deterministic.ts` | `DeterministicMeasurer` | Deterministic string measurer (dual-measurer conformance/ratchet seam). |
| `measurer-jar.data.ts` | `JarFontMetrics`, `JAR_SANS_SERIF_METRICS`, `JAR_SANS_SERIF_BOLD_METRICS` | Per-point (font size == 1) jar-measured font metrics, keyed by codepoint. |
| `measurer-jar.ts` | `JarMeasurer`, `jarMeasurer` | Jar-faithful string measurer (architecture decision D12). |
| `measurer-width-table.data.ts` | `SANS_SERIF_BLOCKS` |  |
| `measurer.ts` | `FontSpec`, `StringMeasurer`, `glyphWidth`, `FormulaMeasurer`, `WidthTableMeasurer`, `CanvasMeasurer`, `FixedMeasurer` | String measurement implementations for plantuml-ts. |
| `openiconic-glyphs-data.ts` | `RawGlyph`, `RAW_GLYPHS` | `RAW_GLYPHS` -- the OpenIconic glyph data table, split out of `openiconic-glyphs.ts` purely to keep that file under this project's 500-line cap (F1-c, S1L tail-fix G11; mirrors the existing `svg.ts`->`svg-markers.ts` / `style-map-theme.ts`- |
| `openiconic-glyphs.ts` | `OPENICONIC_NATURAL_SIZE`, `isKnownOpenIconicGlyph`, `OpenIconicOp`, `openIconicFactor`, `openIconicDims`, `openIconicOriginY`, `buildOpenIconicPathD` | OpenIconic `<&glyph>` inline icons (G2 N41, extended to the full upstream set F1-c). |
| `paint.ts` | `Gradient`, `Paint`, `parseColor`, `isTransparentColor`, `paintToSvg` | Paint — the color/gradient value model for the rendering layer. |
| `parse-refusal.ts` | `ParseRefusalKind`, `ParseRefusal`, `refuse`, `refusalScore`, `mergeRefusals` | The refusal outcome a plugin returns instead of an AST, and the upstream tie-break for picking a winner when every candidate refuses. |
| `preprocessor.ts` | `PreprocessorResult`, `PreprocessOptions`, `preprocess`, `PreprocessorFailure`, `PreprocessOutcome`, `preprocessOrError`, `preprocessLinesOrError` | Preprocessor -- a thin wrapper over the TIM interpreter (`src/core/tim/`). |
| `render-options.ts` | `RenderOptions`, `getDefaultMeasurer`, `resolveMeasurer` | `RenderOptions` and measurer resolution — extracted from `src/index.ts` (mission A5 / T4). |
| `rose-note-dim.ts` | `RoseNoteDim`, `roseNoteDim` | The note operand `computeMergedLabelBox` (`core/edge-label-box.ts`) merges into an edge label: `EntityImageNoteLink`'s own dimension. |
| `scale-command.ts` | `ScaleSpec`, `matchScaleCommand`, `resolveScaleFactor` | scale-command.ts — shared `scale ...` directive parsing + factor resolution (mission G1 I-scale). |
| `skin-loader.ts` | `applySkinLayer` | `skin <name>` directive resolution — skin-file-loading mission, Batches 1 (decisions D1/D2/D6) and 4 (preprocessor+skinparam skins). |
| `skinparam-accumulator.ts` | `SkinparamAccumulator`, `createSkinparamAccumulator` | Mutable accumulator threaded through the resolveSkinparam key-processing loop (skinparam-key-handlers.ts, skinparam-stereo-keys.ts) and consumed by the theme-partial builder (skinparam-theme-builder.ts). |
| `skinparam-element-buckets.ts` | `ELEMENT_BUCKET_SNAMES`, `ElementColorRole`, `matchElementColorKey`, `matchStereotypeSpotColorKey`, `matchElementFontSizeKey`, `matchElementShadowingKey`, `parseShadowingValue` | Per-element (SName) style-bucket matching for the skinparam pipeline. |
| `skinparam-key-handlers.ts` | `applyNormalKey` | Table-driven dispatch for normalized (non stereotype-qualified) skinparam keys — the body of upstream SkinParam.java's key switch. |
| `skinparam-key-normalize.ts` | `resolveColor`, `normaliseKey` | Skinparam key/value normalisation primitives. |
| `skinparam-stereo-keys.ts` | `applyStereoOverride` | Stereotype-qualified skinparam key handling (`key.includes('<<')` branch). |
| `skinparam-style-block.ts` | `parseStyleBlock` | `<style>` block parsing — parseStyleBlock and its internal helpers. |
| `skinparam-theme-builder.ts` | `buildThemePartial` | Builds a `Partial<Theme>` from a populated {@link SkinparamAccumulator} — only the keys that were actually seen during key processing are set. |
| `skinparam-types.ts` | `SkinparamResult`, `StyleMap` | Shared public types for the skinparam resolution pipeline. |
| `skinparam.ts` | `SkinparamResult`, `StyleMap`, `resolveColor`, `ELEMENT_BUCKET_SNAMES`, `parseStyleBlock`, `resolveSkinparam` | Skinparam resolution pipeline for plantuml-ts. |
| `skins-builtin-rose-1.ts` | `ROSE_SKIN_PART1` | `rose` built-in `<style>`-grammar skin, part 1 of 2 -- skin-file-loading mission Batch 4 split, purely to keep every module under this project's 500-line-per-file limit (`rose.skin` alone is ~550 lines verbatim, by far the largest of the fi |
| `skins-builtin-rose-2.ts` | `ROSE_SKIN_PART2` | `rose` built-in `<style>`-grammar skin, part 2 of 2 -- see {@link ROSE_SKIN_PART1}'s doc comment for why this split exists and how the two halves recombine. |
| `skins-builtin.ts` | `BUILTIN_SKINS` | Built-in PlantUML skin stylesheets (`skin <name>` directive) -- skin-file-loading mission, Batches 1 (D1/D2) and 4. |
| `spline-clip.ts` | `ClipRect`, `subdivide`, `clipSplineStart`, `clipSplineEnd` | spline-clip.ts — faithful port of upstream's compound-edge boundary clipping (`DotPath#simulateCompound`, klimt/shape/DotPath.java), applied when an edge endpoint is a container/group. |
| `sprite-commands.ts` | `addSprite`, `createSpriteRegistry`, `getSprite`, `getSpriteMonochrome`, `getSpriteSvg`, `spriteDimsLookupFor`, `surfaceSpriteWarnings`, `SpriteRegistry`, `isSpriteMultilineOpenLine`, `isSpriteMultilineCloseLine`, `isSvgSpriteOpenLine`, `isSvgSpriteCloseLine`, `matchSpriteCommand` | `matchSpriteCommand` — the shared sprite-DEFINITION matcher parsers call at their own command-dispatch position, mirroring `matchAnnotationCommand` (`core/annotations/commands.ts`) exactly: extraction inside each parser, never a textual pre |
| `sprite-prefetch.ts` | `scanSpriteNames` | Scan a diagram source for the `<$name>` sprite references it contains. |
| `sprite-registry.ts` | `SpriteRegistry`, `createSpriteRegistry`, `addSprite`, `surfaceSpriteWarnings`, `getSprite`, `spriteDimsLookupFor`, `getSpriteMonochrome`, `getSpriteSvg` | `SpriteRegistry` — the per-diagram sprite map and its lookup seams, split out of `sprite-commands.ts` (which owns the sprite-DEFINITION grammar) purely to keep that file under this repo's 500-line module cap; the same split precedent as `op |
| `sprite-split-stdlib.ts` | `SpriteSplitManifest`, `SpriteNotBundledError`, `spriteSplitNamesOf`, `spriteSplitStdlib`, `assembleSpriteSplitContent` | si11b T4 -- per-sprite stdlib bundle registration, and the prefetch-side assembly it enables. |
| `stdlib-content.ts` | `stdlibContentFor` | Resolving a `<bundle/thing>` include target to its CONTENT, for the prefetch walk's third channel (`include-resolver.ts#prefetchInner`). |
| `stereotype-decoration.ts` | `GuillemetPair`, `DEFAULT_GUILLEMET`, `wrapGuillemet`, `splitStereotypeLabels`, `splitStereotypeStyleTags`, `CircledCharDecoration`, `parseCircledCharDecoration`, `CircledSpriteDecoration`, `parseCircledSpriteDecoration`, `DEFAULT_CIRCLED_CHARACTER_FONT_SIZE`, `resolveBadgeRadius` | stereotype-decoration.ts — the port of `StereotypeDecoration#buildComplex` (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/ StereotypeDecoration.java:143-182`): how a `<<...>>` run splits into the label(s) a diagram DISPLAYS |
| `style-cascade-class.ts` | `computeCardinalityFontOverride`, `computeArrowFontOverride`, `computeClassStyleCascadeOverrides`, `resolveClassTagCascadeEntry`, `computeClassTagCascadeGenerations` | Class-diagram `<style>` ancestor cascade (G2 N36) -- computes every `theme.colors.graph.classCascade*`/`spotCascade*` field from a raw StyleMap, pre-resolved to SVG-ready hex via {@link resolveColorToSvgHex} (the inline-`#color`-override pr |
| `style-map-element.ts` | `collectElementStyleBuckets`, `resolveDocumentBackground`, `cleanStereotypeToken`, `collectStyleTagNames`, `resolveStyleCascade`, `computeShowStereotypeByTag`, `computeNoteStyleTagCascade`, `resolveGlobalShadowing`, `resolveGlobalBackground`, `resolveGlobalBorder` | Element-scoped `<style>` block routing — decision D4. |
| `style-map-json-diagram.ts` | `computeJsonFamilyOverride`, `computeYamlFamilyOverride`, `computeHclFamilyOverride`, `computeHighlightClassesOverride` | jsonDiagram / yamlDiagram / hclDiagram `<style>` block → `Theme.colors .graph.json` field mapping, plus the `.tagname` style-class → `#highlight` override table. |
| `style-map-simple-fields.ts` | `computeSimpleSelectorOverrides` | Single-selector → single-or-few `Theme.colors.graph` field mappings (actor / usecase / class / interface / enum / statediagram / activitybar / package). |
| `style-map-theme.ts` | `applyStyleMap` | Selector → Theme field mapping (element-scoped <style> blocks). |
| `svek-dot-emit-clusters.ts` | `inches`, `nodeLine`, `clusterBlock` | Node lines and cluster blocks for the Svek DOT emitter — split out of ./svek-dot-emit.ts for the 500-line file cap (G9/T1; pure move apart from the wrapper emission that motivated the split, see below). |
| `svek-dot-emit-labels.ts` | `hex`, `round`, `trunc`, `labelTable`, `edgeLabelTable`, `shieldTable`, `portTable`, `rowPortTable` | Svek HTML-label table builders — the `label=<...>` values `svek-dot-emit.ts` writes into node, edge and cluster statements. |
| `svek-dot-emit.ts` | `inches`, `wrapperLevels`, `WrapperLevels`, `toSvekDot` |  |
| `svek-dot-order.ts` | `firstEncounterOrder` | The order Svek's DOT text declares nodes in — the single definition of "which node does graphviz's parser meet first", shared by the two consumers of one `DotInputGraph`. |
| `svek-dot-sequence.ts` | `Seq`, `NodeRec`, `ClusterColors`, `EdgeColors`, `ClusterTree`, `buildClusterTree`, `SeqAssignment`, `assignSequence` |  |
| `svek-dot-wrappers.ts` | `WrapperLevels`, `wrapperLevels`, `subgraphNoLabel`, `outerWrapperLines`, `innerWrapperLines`, `closeCount` | ClusterDotString's protection-wrapper nesting, shared by the two consumers of one `DotInputGraph`: the LAYOUT builder (`graph-layout-build.ts` #addClusters, which already built this nesting) and the DOT-TEXT emitter (`svek-dot-emit.ts`, whi |
| `svg-format.ts` | `DEFAULT_SVG_DECIMALS`, `trimZeros`, `formatDecimal`, `fmt`, `shortenColor`, `formatOpacity`, `formatPercent` | Shared SVG formatting rules — decimal precision, color shortening, and opacity/percent formatting. |
| `svg-markers.ts` | `ArrowType`, `ALL_ARROW_TYPES`, `arrowHeadRef`, `arrowHead`, `openArrowHeadDef` | SVG arrow-marker builders — the `<marker>` `<defs>` for every edge arrowhead. |
| `svg-path-builder.ts` | `moveTo`, `lineTo`, `arcTo`, `splinePathD`, `roundedTopRectD`, `roundedBottomRectD`, `cubicTo` | Shared `<path>` `d`-string segment builder — the plain-string counterpart to `UPath` (`core/klimt/shape/UPath.ts`) for this port's several class-diagram renderers that draw markup as plain strings rather than through a `UGraphic`/`SvgGraphi |
| `svg-rect-corners.ts` | `roundedCornerAttrs` | Whether a `<rect>` carries `rx`/`ry` at all. |
| `svg-sanitize.ts` | `SanitizeSvgOptions`, `sanitizeSvg` | SVG sanitizer — strips executable content and external resource references. |
| `svg-shapes.ts` | `emittedTextForm`, `rect`, `line`, `text`, `multilineText`, `tspan`, `image`, `path`, `ellipse`, `circle`, `diamond`, `polygon`, `polyline`, `NoteBoxStyle`, `noteBox` | SVG shape emitters (rect/line/text/image/path/ellipse/diamond/polygon). |
| `svg-text-font.ts` | `textFontFamily`, `emittedTextForm` | Text emission rules that depend on the FONT FAMILY — the SVG-safe family string, PlantUML's `monospaced` -> CSS `monospace` rename, and the two NBSP substitutions. |
| `svg.ts` | `arrowHead`, `arrowHeadRef`, `ALL_ARROW_TYPES`, `ArrowType`, `BoxStyle`, `LineStyle`, `TextStyle`, `SvgAttrs`, `escapeXml`, `escapeXmlText`, `attrs`, `attrsFromRecord`, `SvgAttrsPaint`, `resolvePaint`, `resolvePaintAttrs`, `PAINT_NONE`, `ROOT_FONT_FAMILY`, `ROOT_GROUP_OPEN`, `ROOT_GROUP_CLOSE`, `strokeDecorationOf`, `rect`, `line`, `text`, `multilineText`, `tspan`, `image`, `path`, `ellipse`, `circle`, `diamond`, `polygon`, `polyline`, `noteBox`, `emittedTextForm`, `NoteBoxStyle`, `group`, `linkWrap`, `defs`, `foreignObject`, `extractGradientDefs`, `svgRoot` | SVG primitive builders — pure string functions, no DOM API. |
| `text-escapes.ts` | `resolveTextEscapes` | Shared text-escape resolution — `<U+XXXX>`/`<U+XXXXX>` unicode-codepoint escapes and `&#NNN;` HTML numeric character references, resolved to their literal glyph. |
| `TextBlockExporter.ts` | `DocumentDims`, `applyCucaDocumentMargin` | `TextBlockExporter#calculateFinalDimension` — the diagram's outer margin applied to whatever the inner `TextBlock` measured, plus the truncating `+1` `SvgGraphics` applies when it sizes the canvas. |
| `theme-element-resolve.ts` | `resolveElementPaint`, `resolveElementFontSize`, `resolveElementShadowing`, `resolveElementLineThickness`, `resolveElementMinimumWidth` | Per-element (SName) resolution helpers for {@link Theme} — the color, font-size, and shadowing cascades each element's renderer reads. |
| `theme-graph-colors-a.ts` | `ThemeGraphColorsA` | theme-graph-colors-a.ts — first half of `ThemeGraphColors` (split further out of ./theme-graph-colors.ts to keep every file under the project's 500-line cap; combined back via intersection in that module). |
| `theme-graph-colors-b.ts` | `ThemeGraphColorsB` | theme-graph-colors-b.ts — second half of `ThemeGraphColors` (split further out of ./theme-graph-colors.ts to keep every file under the project's 500-line cap; combined back via intersection in that module). |
| `theme-graph-colors.ts` | `ElementColors`, `ThemeGraphColors` | theme-graph-colors.ts — the `Theme["colors"]["graph"]` sub-object, extracted from ./theme.ts (which re-declares it as `graph: ThemeGraphColors`) purely to keep theme.ts under the project 500-line file-size cap after the mission skin-file-lo |
| `theme.ts` | `ElementColors`, `ThemeGraphColors`, `Theme`, `defaultTheme`, `darkTheme`, `sketchyTheme`, `monochromeTheme`, `ThemeOverride`, `deepMergeTheme`, `resolveTheme`, `resolveElementPaint`, `resolveElementFontSize`, `resolveElementShadowing`, `resolveElementLineThickness`, `resolveElementMinimumWidth` | Theme system for plantuml-ts. |
| `themes-builtin-a-m.ts` | `BUILTIN_THEMES_A_M` | Built-in PlantUML theme definitions (amiga .. |
| `themes-builtin-p-v.ts` | `BUILTIN_THEMES_P_V` | Built-in PlantUML theme definitions (plain .. |
| `themes-builtin.ts` | `BUILTIN_THEMES` | Built-in PlantUML theme definitions. |
| `TitledDiagram.ts` | `DiagramType`, `UmlSource`, `Previous`, `TitledDiagram` |  |
| `usymbol-shapes.ts` | `IconGeo`, `renderDatabaseIcon`, `renderComponentIcon`, `renderActorIcon`, `renderUseCaseIcon`, `renderUSymbolIcon` | Shared per-USymbol leaf-shape renderers — the SVG for a descriptive element's icon (component notch, database cylinder, actor stick-figure, usecase ellipse). |
| `version.ts` | `VERSION`, `COMMIT`, `COMPILE_TIME_STRING`, `versionString`, `fullDescription` | The version banner the error diagram prints above the source listing. |

## `src/core/abel/`

| Module | Exports | Purpose |
|---|---|---|
| `Bag.ts` | `Bag` | Bag — upstream marker interface shared by `Entity` and `Together` (an empty tagging interface; no members — kept genuinely empty so classes can `implements` it without TS's weak-type check rejecting them). |
| `Bibliotekon.ts` | `Bibliotekon` |  |
| `Colors.ts` | `HColor`, `Colors` |  |
| `ColorType.ts` | `ColorType`, `getType` | ColorType — which slot of an element's color set a color applies to (`klimt/color/ColorType.java`). |
| `CucaNote.ts` | `CucaNote` |  |
| `Direction.ts` | `Direction`, `getInv`, `getShortCode`, `fromChar` | Direction — the four-way direction selector (`utils/Direction.java`). |
| `DisplayPositioned.ts` | `DisplayPositioned` |  |
| `Entity.ts` | `Entity` |  |
| `EntityBase.ts` | `EntityBase` |  |
| `EntityFactory.ts` | `EntityFactory` |  |
| `EntityGender.ts` | `EntityGender` |  |
| `EntityGenderUtils.ts` | `byEntityType`, `byEntityAlone`, `byStereotype`, `byPackage`, `and`, `all`, `emptyMethods`, `emptyFields`, `byClassName` |  |
| `EntityImageStateCommon.ts` | `EntityImageStateCommon` |  |
| `EntityPort.ts` | `EntityPort` |  |
| `EntityPortion.ts` | `EntityPortion`, `asSet` | EntityPortion — which slice of an entity a `hide`/`show` directive targets. |
| `EntityPosition.ts` | `EntityPosition`, `RADIUS`, `getInputs`, `getOutputs`, `getNormals`, `isNormal`, `isInput`, `isOutput`, `fromStereotype`, `isPort`, `usePortP` | EntityPosition — where a leaf sits relative to its parent group's frontier: a normal inner node, or one of the border-attached entry/exit points, pins, expansion nodes, and ports. |
| `EntityUtils.ts` | `isPureInnerLink12`, `isPureInnerLink3` |  |
| `FontConfiguration.ts` | `FontConfiguration` |  |
| `GroupType.ts` | `GroupType` | GroupType — the 8-value group-entity kind selector of the abel model: which kind of container a group Entity is (package, state region, activity partition, ...). |
| `Hideable.ts` | `Hideable` | Hideable — implemented by anything a `hide` command can hide. |
| `IEntityImage.ts` | `IEntityImage` | IEntityImage — ADR-2 consumed-interface stub for `svek/IEntityImage.java` (the rendered-block contract every svek leaf image implements). |
| `ISkinParam.ts` | `UFont`, `StyleBuilder`, `Style`, `FontParam`, `ISkinParam` |  |
| `Kal.ts` | `Kal` |  |
| `LeafType.ts` | `LeafType`, `getLeafType`, `isLikeClass`, `toHtml` | LeafType — the 51-value leaf-entity kind selector of the abel model: which kind of leaf a `Quark`'s Entity is (class-family, usecase, activity, state, Chen-ER, ports, ...). |
| `LineConfigurable.ts` | `LineConfigurable` |  |
| `Link.ts` | `Link` |  |
| `LinkArg.ts` | `LinkArg` |  |
| `LinkArrow.ts` | `LinkArrow`, `reverse` | LinkArrow — the sequence-style direction hint on a link label (`-->` label arrows): none/several, along the link, or against it. |
| `LinkBase.ts` | `USE_INTERFACE_EYE1`, `LinkBase` |  |
| `LinkStrategy.ts` | `LinkStrategy` | LinkStrategy — how link extremity decoration is realised: `LEGACY` draws arrow tail/head in the graphviz-generated dot and recovers the decoration angle from the produced SVG (fragile — graphviz sometimes omits them); `SIMPLEST` emits no ta |
| `Neighborhood.ts` | `Neighborhood` | Neighborhood — ADR-2 consumed-interface stub for `dot/Neighborhood.java` (the same-tail link bundle drawn around a leaf). |
| `NoteLinkStrategy.ts` | `NoteLinkStrategy`, `computeDimension` | NoteLinkStrategy — how a note attached to a link contributes to layout sizing: fully, as a half-width placeholder that is still printed, or not at all. |
| `Position.ts` | `Position`, `fromString`, `reverseDirection` |  |
| `Removeable.ts` | `Removeable` | Removeable — implemented by anything a `remove` command can remove. |
| `SingleStrategy.ts` | `SingleStrategy`, `computeBranch` | SingleStrategy — how standalone (unlinked) leaves are arranged (`svek/SingleStrategy.java`). |
| `SpecificBackcolorable.ts` | `SpecificBackcolorable` |  |
| `Stereostyles.ts` | `Stereostyles` | Stereostyles — the `<<<name>>>` triple-guillemet style references an entity can carry (`stereo/Stereostyles.java`). |
| `Stereotag.ts` | `Stereotag` | Stereotag — a `$tag` marker attached to an entity (`stereo/Stereotag.java`). |
| `Together.ts` | `Together` |  |

## `src/core/annotations/`

| Module | Exports | Purpose |
|---|---|---|
| `annotation-clockwise.ts` | `ZERO_SIDES`, `parseClockwise` | Padding / Margin shorthand — ClockwiseTopRightBottomLeft.read. |
| `annotation-color.ts` | `expandGrayShorthand`, `resolveChromeColor` | Chrome color shorthand helpers — gray-shorthand hex expansion and the `transparent` -> `null` mapping shared by skinparam and `<style>` override resolution (`annotation-skinparam.ts`, `annotation-style-overrides.ts`). |
| `annotation-defaults.ts` | `BASE_DEFAULTS`, `cloneBoxStyle` | Base defaults — plantuml.skin document{} / mainframe{} blocks, verbatim. |
| `annotation-skinparam.ts` | `applySkinparamOverrides` | skinparam overrides — FromSkinparamToStyle.java:87-176. |
| `annotation-style-overrides.ts` | `applyStyleOverrides` | `<style>` overrides — parseStyleBlock's already-parsed StyleMap. |
| `annotation-style-types.ts` | `BoxSides`, `AnnotationBoxStyle`, `AnnotationElement`, `ANNOTATION_ELEMENTS` | Shared types for annotation chrome style resolution — see `style.ts`'s module doc comment for the full layering/design rationale these types support. |
| `blocks.ts` | `AnnotationBlock`, `buildAnnotationBlock` | blocks.ts — mission G0b / T4: the drawable half of `Style .createTextBlockBordered` (`style/Style.java:315-332`) + `TextBlockBordered` (`klimt/shape/TextBlockBordered.java`) + `TextBlockMarged` (`klimt/shape/TextBlockMarged.java`, applied v |
| `chrome.ts` | `AnnotationStyles`, `mergeTB`, `getTextX`, `applyChrome` | chrome.ts — mission G0b / T4: `DiagramChromeFactory.create`'s warnings-less, mainframe-less half (legend → title → caption → header/footer, header/footer outermost — decisions.md D1/D9) plus `DecorateEntityImage`'s vertical-stack compositio |
| `commands.ts` | `matchAnnotationCommand` | `matchAnnotationCommand` — the line-oriented matcher parsers call at their own command-dispatch position (decisions.md D3: extraction inside each parser, never a textual pre-pass, so a `title`-shaped line inside a `note ... |
| `coord-shift.ts` | `shiftFragmentBody` | coord-shift.ts — mission G1d: the eager-arithmetic equivalent of upstream's `UGraphic.apply(new UTranslate(dx, dy))` coordinate-context threading (`klimt/UGraphic.java`/`UTranslate.java`, already ported at `src/core/klimt/UTranslate.ts` and |
| `index.ts` | `DisplayPositioned`, `DiagramAnnotations`, `createAnnotations`, `horizontalAlignmentFromString`, `horizontalAlignmentFromStringOrDefault`, `isDisplayPositionedNull`, `isEmpty`, `noneDisplayPositioned`, `setCaption`, `setLegend`, `setMainFrame`, `setTitle`, `singleDisplayPositioned`, `updateFooter`, `updateHeader`, `verticalAlignmentFromString`, `withDisplay`, `withHorizontalAlignment`, `withLocation`, `matchAnnotationCommand`, `AnnotationBlock`, `buildAnnotationBlock`, `AnnotationStyles`, `applyChrome`, `getTextX`, `mergeTB` | Public surface of the annotation model + command matcher (mission G0b). |
| `model.ts` | `DisplayPositioned`, `noneDisplayPositioned`, `singleDisplayPositioned`, `isDisplayPositionedNull`, `withDisplay`, `withHorizontalAlignment`, `withLocation`, `horizontalAlignmentFromString`, `horizontalAlignmentFromStringOrDefault`, `verticalAlignmentFromString`, `DiagramAnnotations`, `createAnnotations`, `isEmpty`, `setTitle`, `setCaption`, `setLegend`, `setMainFrame`, `updateHeader`, `updateFooter` | DisplayPositioned + DiagramAnnotations — the shared chrome model ported from upstream `TitledDiagram`'s title/caption/legend/header/footer/ mainFrame fields. |
| `style.ts` | `BoxSides`, `AnnotationBoxStyle`, `AnnotationElement`, `expandGrayShorthand`, `parseClockwise`, `resolveAnnotationStyles` | Annotation chrome style resolution. |

## `src/core/atmp/`

| Module | Exports | Purpose |
|---|---|---|
| `CucaDiagram.ts` | `CUCA_DOCUMENT_MARGIN_TOP`, `CUCA_DOCUMENT_MARGIN_RIGHT`, `CUCA_DOCUMENT_MARGIN_BOTTOM`, `CUCA_DOCUMENT_MARGIN_LEFT` | `CucaDiagram#getDefaultMargins()` — the document margins every diagram in the cuca family inherits. |

## `src/core/code/deflate/`

| Module | Exports | Purpose |
|---|---|---|
| `BitInputStream.ts` | `BitInputStream` | A stream of bits that can be read. |
| `ByteBitInputStream.ts` | `ByteBitInputStream` |  |
| `ByteHistory.ts` | `ByteHistory` |  |
| `CanonicalCode.ts` | `CanonicalCode` |  |
| `Decompressor.ts` | `Decompressor` |  |
| `decompressPlantumlZ.ts` | `decompressPlantumlZ` |  |
| `DeflateErrors.ts` | `EOFException`, `DataFormatException` | Upstream's `code/deflate` package throws two checked JDK exception types that TS has no built-in equivalent for: `java.io.EOFException` (from {@link BitInputStream.readNoEof} and `Decompressor#decompressUncompressedBlock`) and `java.util.zi |
| `OutputStreamProtected.ts` | `OutputStreamProtected` | A growable byte sink with a hard size cap, guarding against a malformed or hostile DEFLATE stream expanding without bound. |

## `src/core/command/`

| Module | Exports | Purpose |
|---|---|---|
| `Command.ts` | `Command` |  |
| `CommandCreateJson.ts` | `JSON_MULTILINE_DECL_RE`, `JSON_SINGLE_LINE_RE`, `parseJsonNode`, `finalizeJsonBody`, `JsonCommandHost`, `applyJsonMultilineOpen`, `applyJsonSingleLine`, `jsonCommands` | `json` declaration command shared by the class and state diagram parsers (`CommandCreateJson` + `CommandCreateJsonSingleLine` + `BodierJSon`). |
| `CommandExecutionResult.ts` | `AbstractDiagram`, `CommandExecutionResult` | CommandExecutionResult — the ok/error outcome every command returns. |
| `JsonNode.ts` | `JsonNode` | Parsed value of a `json Name { ... |
| `ParserPass.ts` | `ParserPass` | ParserPass — which of the (up to) three parsing passes is running. |

## `src/core/common/`

| Module | Exports | Purpose |
|---|---|---|
| `routespl.ts` | `makePolyline`, `routesplines` |  |
| `shapes.ts` | `ShapeKind`, `nodeboundingbox`, `shapeOf` |  |

## `src/core/cucadiagram/`

| Module | Exports | Purpose |
|---|---|---|
| `Bodier.ts` | `Bodier` |  |
| `BodierAbstract.ts` | `BodierAbstract` |  |
| `BodierJSon.ts` | `JsonValue`, `BodierJSon` |  |
| `BodierLikeClassOrObject.ts` | `BodierLikeClassOrObject` |  |
| `BodierMap.ts` | `BodierMap` |  |
| `BodierSimple.ts` | `BodierSimple` |  |
| `BodyEnhanced1.ts` | `BodyEnhanced1` |  |
| `BodyEnhanced1Config.ts` | `BodyEnhanced1Config`, `BodyEnhanced1StyleValues`, `BodyEnhanced1Style`, `requireBodyEnhanced1SkinParam`, `requireBodyEnhanced1Style` |  |
| `BodyEnhanced2.ts` | `BodyEnhanced2Config`, `BodyEnhanced2StyleValues`, `BodyEnhanced2` |  |
| `BodyEnhancedAbstract.ts` | `BodyEnhancedAbstract` |  |
| `BodyFactory.ts` | `BodyFactory` |  |
| `CucaDiagram.ts` | `DiagramType`, `Previous`, `UmlSource`, `InstallationRequirement`, `CucaDiagram` |  |
| `CucaDiagramBase.ts` | `EntityHideOrShow`, `CucaDiagramBase` |  |
| `CucaDiagramBase2.ts` | `CucaDiagramBase2` |  |
| `Elected.ts` | `Elected` | Elected — a (portShortName, score) pair produced by `MethodsOrFieldsArea#getElected` when a member row's display text matches one of the owning leaf's declared port short names (`entity::portName` edge targets): score 100 for a word-boundar |
| `GroupHierarchy.ts` | `GroupHierarchy` |  |
| `HideOrShow.ts` | `HideOrShow` |  |
| `LinkConstraint.ts` | `LinkConstraint` |  |
| `linkDedup.ts` | `LinkConnection`, `containsSimilarLink`, `dropsAsSingleDuplicate`, `arrowStyleHasSingle` | The shared `-[single]->` add-time dedup — ADR-3 (SI1): the EXACT `CucaDiagram.addLink` / `containsSimilarLink` / `Link.sameConnections` semantics, exposed as a helper over a caller-supplied link list so each engine's own link shape (`Descri |
| `Magma.ts` | `Magma` |  |
| `MagmaList.ts` | `MagmaList` |  |
| `Member.ts` | `Member` |  |
| `MethodsOrFieldsArea.ts` | `MethodsOrFieldsArea` |  |
| `MethodsOrFieldsAreaConfig.ts` | `MethodsOrFieldsAreaSkinParam`, `MethodsOrFieldsAreaConfig`, `MethodsOrFieldsAreaStyleValues`, `VisibilityModifierStyleValues` |  |
| `PortionShower.ts` | `PortionShower` |  |
| `SquareLinker.ts` | `SquareLinker` | SquareLinker — the two link-emitting callbacks `SquareMaker` drives while chaining items into a square grid. |
| `SquareMaker.ts` | `SquareMaker` |  |
| `TextBlockTracer.ts` | `isMember`, `fullInnerPosition`, `TextBlockTracer` |  |

## `src/core/decoration/`

| Module | Exports | Purpose |
|---|---|---|
| `LinkDecor.ts` | `LinkDecor`, `getMargin`, `isFill`, `getArrowSize`, `isExtendsLike`, `lookupDecors1`, `lookupDecors2`, `getRegexDecors1`, `getRegexDecors2`, `getExtremityFactoryComplete`, `getExtremityFactoryLegacy` | LinkDecor — the 25-value link-extremity decoration enum: which arrowhead/diamond/crowfoot/circle a link end carries, its dot-emit data (margin, fill, arrowsize), the raw-token lookup tables the arrow grammar uses, and the extremity-factory |
| `LinkMiddleDecor.ts` | `LinkMiddleDecor`, `getInversed` | LinkMiddleDecor — the mid-link decoration (lollipop circles for provided/required interfaces, subset/superset markers). |
| `LinkStyle.ts` | `javaDoubleToString`, `LinkStyle` | LinkStyle — the line style of a link (normal/dashed/dotted/bold/ invisible) plus an optional thickness override, and its `UStroke` derivation. |
| `LinkType.ts` | `LinkType` | LinkType — the immutable decor1/style/decor2/middle-decor bundle a `Link` carries (via `WithLinkType.type` — T6's write-set), with the copy-on-write mutators the command layer uses and the svek dot attribute emission. |
| `WithLinkType.ts` | `WithLinkType` |  |

## `src/core/decoration/symbol/`

| Module | Exports | Purpose |
|---|---|---|
| `SymbolContext.ts` | `SymbolContext` |  |
| `usymbol-resolve.ts` | `resolveActorStyle`, `JAR_DEFAULT_TEXT_COLOR`, `upstreamKeyword`, `mapComponentStyle`, `resolveSymbol`, `textFontColor`, `textFont` | usymbol-resolve.ts — shared symbol/style/font resolution for `USymbol` draw paths (SI27 T2: moved from `diagrams/description/renderer-symbol.ts` — upstream keeps this ONE place, `Entity#getUSymbol`, for every factory; the class engine's `re |
| `USymbol.ts` | `SName`, `USymbol`, `Margin` |  |
| `USymbolAction.ts` | `USymbolAction` |  |
| `USymbolActor.ts` | `USymbolActor` |  |
| `USymbolActorBusiness.ts` | `USymbolActorBusiness` |  |
| `USymbolArtifact.ts` | `USymbolArtifact` |  |
| `USymbolBoundary.ts` | `USymbolBoundary` |  |
| `USymbolCard.ts` | `USymbolCard` |  |
| `USymbolCloud.ts` | `USymbolCloud` |  |
| `USymbolCollections.ts` | `USymbolCollections` |  |
| `USymbolComponent1.ts` | `USymbolComponent1` |  |
| `USymbolComponent2.ts` | `USymbolComponent2` |  |
| `USymbolControl.ts` | `USymbolControl` |  |
| `USymbolDatabase.ts` | `getClosingPath`, `drawDatabase`, `getMargin`, `USymbolDatabase` |  |
| `USymbolEntityDomain.ts` | `USymbolEntityDomain` |  |
| `USymbolFile.ts` | `USymbolFile` |  |
| `USymbolFolder.ts` | `USymbolFolder` |  |
| `USymbolFrame.ts` | `USymbolFrame` |  |
| `USymbolHexagon.ts` | `drawRect`, `getMargin`, `USymbolHexagon` |  |
| `USymbolInterface.ts` | `USymbolInterface` |  |
| `USymbolLabel.ts` | `USymbolLabel` |  |
| `USymbolNode.ts` | `USymbolNode` |  |
| `USymbolPerson.ts` | `USymbolPerson` |  |
| `USymbolProcess.ts` | `drawProcess`, `getMargin`, `getHTitle`, `USymbolProcess` |  |
| `USymbolQueue.ts` | `getClosingPath`, `drawQueue`, `getMargin`, `USymbolQueue` |  |
| `USymbolRectangle.ts` | `USymbolRectangle` |  |
| `USymbols.ts` | `ComponentStyle`, `PackageStyle`, `SkinParamSymbolStyles`, `ACTION`, `ACTOR_AWESOME`, `ACTOR_HOLLOW`, `ACTOR_STICKMAN`, `ACTOR_STICKMAN_BUSINESS`, `AGENT`, `ARCHIMATE`, `ARTIFACT`, `BOUNDARY`, `CARD`, `CLOUD`, `COLLECTIONS`, `COMPONENT_RECTANGLE`, `COMPONENT1`, `COMPONENT2`, `CONTROL`, `DATABASE`, `ENTITY_DOMAIN`, `FILE`, `FOLDER`, `FRAME`, `GROUP`, `HEXAGON`, `INTERFACE`, `LABEL`, `NODE`, `PACKAGE`, `PARTITION`, `PERSON`, `PROCESS`, `QUEUE`, `RECTANGLE`, `STACK`, `STORAGE`, `USECASE`, `USECASE_BUSINESS`, `actorStyleToUSymbol`, `componentStyleToUSymbol`, `packageStyleToUSymbol`, `fromString`, `USymbols` |  |
| `USymbolSimpleAbstract.ts` | `USymbolSimpleAbstract` |  |
| `USymbolStack.ts` | `USymbolStack` |  |
| `USymbolStorage.ts` | `drawStorage`, `getMargin`, `USymbolStorage` |  |
| `USymbolUsecase.ts` | `USymbolUsecase` |  |

## `src/core/error/`

| Module | Exports | Purpose |
|---|---|---|
| `error-diagrams.ts` | `preprocessorErrorSvg`, `DiagramRefusal`, `errorSvg`, `welcomeSvg`, `emptySvg` | Error diagrams — upstream's `BlockUml#getDiagram`. |
| `error-renderer.ts` | `renderPSystemError`, `renderPSystemUnsupported`, `renderPSystemWelcome` | Draws a `PSystemError` (and the black-on-white Welcome / Unsupported blocks) to SVG. |
| `ErrorUml.ts` | `ErrorUmlType`, `AssumedDiagramType`, `ErrorUml` | One error, as the error diagram prints it: the message, the line it was raised on, a score (used to pick the "best" error when several diagram parsers each fail on the same source), and — when the parser had already committed to a diagram t |
| `index.ts` | `ErrorUml`, `ErrorUmlType`, `PSystemError`, `PSystemErrorEmpty`, `PSystemErrorPreprocessor`, `PSystemErrorV2`, `PSystemUnsupported`, `PSystemWelcome`, `buildV2`, `merge`, `umlSourceOf`, `renderPSystemError`, `renderPSystemUnsupported`, `renderPSystemWelcome` | The error diagram — upstream's `net/sourceforge/plantuml/error/` (plus the Welcome screen it stacks on top, from `eggs/PSystemWelcome`). |
| `PSystemError.ts` | `PSystemError` | The error diagram: PlantUML never throws on a malformed document, it RENDERS one. |
| `PSystemErrorEmpty.ts` | `PSystemErrorEmpty` | The error diagram for a document that parsed but said nothing — the jar's `Empty description`. |
| `PSystemErrorPreprocessor.ts` | `PSystemErrorPreprocessor` | The error diagram for a PREPROCESSOR (TIM) failure — an orphan `!endif`, a call to an unknown function, an include that cannot be resolved. |
| `PSystemErrorUtils.ts` | `buildV2`, `merge` | Factory + merge helpers for the error diagram. |
| `PSystemErrorV2.ts` | `PSystemErrorV2` | The general error diagram: a parser (or any later stage) failed on a line, and the failure is reported against the lines executed so far. |
| `PSystemUnsupported.ts` | `PSystemUnsupported` | The "Diagram not supported by this release" screen: an `@start<something>` this build does not know. |
| `PSystemWelcome.ts` | `PSystemWelcome` | The "Welcome to PlantUML!" block. |
| `UmlSource.ts` | `umlSourceOf` | The diagram's own lines — `@start…` through `@end…` — sliced out of the raw input. |

## `src/core/gantt/`

| Module | Exports | Purpose |
|---|---|---|
| `Failable.ts` | `Failable` | Failable — upstream's ok-or-error result carrier (an ad-hoc `Result<O, string>` living in the gantt package but consumed across the codebase; `CucaDiagram#quarkInContextSafe` returns one). |

## `src/core/klimt/`

| Module | Exports | Purpose |
|---|---|---|
| `AbstractCommonUGraphic.ts` | `ShapeConstructor`, `UDriver`, `AbstractCommonUGraphic` |  |
| `Back.ts` | `Back` |  |
| `CopyForegroundColorToBackgroundColor.ts` | `CopyForegroundColorToBackgroundColor` |  |
| `document-shell.ts` | `DQUOTE`, `VERSION_PLACEHOLDER`, `DIAGRAM_TYPE_ATTR`, `ShellFragment`, `assembleDocumentShell`, `extractViewBoxDims`, `extractDefs`, `extractBody`, `unwrapContentG`, `extractFlatContent`, `RenderDrawableToFragmentOptions`, `DrawableFragment`, `renderDrawableToFragment`, `mergeFragmentDefs` | document-shell.ts — shared klimt-document-shell assembly/disassembly helpers. |
| `Fore.ts` | `Fore` |  |
| `LineBreakStrategy.ts` | `LineBreakStrategy` | LineBreakStrategy — wraps the raw `wrapWidth`/`maxMessageSize` skinparam string value (`"auto"`, a signed-integer pixel width, or unset/`null` meaning "no wrapping") and exposes it as `isAuto()`/`getMaxWidth()`. |
| `UBackground.ts` | `UBackground` |  |
| `UChange.ts` | `UChange` | UChange — marker interface for every state transition `UGraphic#apply` accepts (translate, stroke, foreground/background color, ...). |
| `UForeground.ts` | `UForeground` |  |
| `UGraphic.ts` | `UGraphic` |  |
| `UGraphicWithScale.ts` | `XAffineTransform`, `ColorResolver`, `UGraphicWithScale` |  |
| `UParam.ts` | `UParam` |  |
| `UShape.ts` | `UShape` | UShape — marker interface for every drawable primitive in the klimt rendering model (rectangles, lines, text, paths, ...). |
| `UStroke.ts` | `UStroke` |  |
| `UTranslate.ts` | `Point2D`, `UTranslate` |  |

## `src/core/klimt/color/`

| Module | Exports | Purpose |
|---|---|---|
| `ColorTrieNode.ts` | `RgbTriple`, `getColor`, `NAMES` | ColorTrieNode — the named-color -> RGB table upstream registers into a letter-indexed trie. |
| `HColorSet.ts` | `ResolvedColor`, `parseSimpleColor`, `toSvgHex`, `resolveColorToSvgHex`, `ConditionalColorSpec`, `parseConditionalColor`, `resolveConditionalColor` | HColorSet — resolves a single color token (a `#RRGGBB`/`#RGB`/`#RRGGBBAA` hex form, or a named color from {@link ColorTrieNode}) to a canonical SVG-ready hex string, mirroring `HColorSet#parseSimpleColor` and `XColor#toSvg`. |

## `src/core/klimt/creole/`

| Module | Exports | Purpose |
|---|---|---|
| `CreoleContext.ts` | `CreoleContext` | CreoleContext — per-numbered-list-order running counter, used while parsing a creole block to assign sequential numbers to `#`-style ordered-list lines (`StripeStyle#getHeader`) and reset the count for a deeper/shallower nesting `order` onc |
| `CreoleHorizontalLine.ts` | `CreoleHorizontalLine` | CreoleHorizontalLine — the drawable `Atom` a creole `--...--`/`==...==`/ `..'..`/bare-`====` separator line becomes: a bare infinite horizontal rule when the line carries no captured label, or (once unblocked — see below) an infinite rule w |
| `CreoleMode.ts` | `CreoleMode` | CreoleMode — the creole-parsing mode `Display#create0`/`SheetBuilder` select per call: how much creole markup a display's text is parsed for. |
| `Display.ts` | `DisplayElement`, `QuarkLike`, `Display` | Display — the value type every diagram element's label/description text flows through: an ordered list of lines (plain `string`, or a `Stereotype`/`MessageNumber` "special" element at certain positions), plus the metadata `create0`'s dispat |
| `DisplayCreole.ts` | `CreoleRenderContext`, `StereotypeFontOverride`, `CreoleMargins`, `CreoleDispatchParams`, `forceFont`, `create0` | DisplayCreole — `Display#create0`'s three-way dispatch (`createStereotype`/`createMessageNumber`/`getCreole`, java:614-713), split out of `Display.ts` (rendering-layer responsibility, needs `SheetBlock1`/`SheetBlock2`/`ISkinSimple`/`AtomOps |
| `DisplayEquality.ts` | `displayEquals`, `displayHashCode` | DisplayEquality — `Display#equals`/`#hashCode` (java:105-115), split out of `Display.ts` to stay under this project's per-file size cap (that file's own module doc comment). |
| `DisplayNewlines.ts` | `JawsWarning`, `jawsWarningToWarning`, `getWithNewlines3`, `ParsedNewlines`, `parseWithNewlines`, `hasSeveralGuideLinesOfAll`, `hasSeveralGuideLinesOfString`, `splitDisplayLines` | DisplayNewlines — the pure, `this`-free half of `klimt/creole/Display.java`: the `\n`/tab/left-align/right-align escape-sequence scanner (`getWithNewlines`/`getWithNewlines3`), the deprecation-warning helper it calls (`addWarning`, `warning |
| `DisplayText.ts` | `replaceBackslashT`, `replace`, `manageGuillemet`, `withPage`, `removeEndingStereotype`, `getEndingStereotype`, `underlined`, `underlinedName`, `addAll`, `addFirst`, `appendFirstLine`, `add`, `addGeneric`, `splitMultiline`, `toTooltipText`, `hasSeveralGuideLines` | DisplayText — `Display`'s "same metadata, new content" list-manipulation family (`add*`/`with*`/`replace*`/`underlined*`/`splitMultiline`/...) plus its two subsystem-blocked seams (`withoutStereotypeIfNeeded`, `hasUrl`). |
| `Emoji.ts` | `EmojiEntry`, `retrieveEmoji`, `emojiCharacter` | Emoji — the `<:name:>` creole emoji name registry. |
| `Fission.ts` | `NeutronType`, `getSplitted` | Fission — word-wrap. |
| `Parser.ts` | `MONOSPACED`, `isLatexStart`, `isLatexEnd`, `isCodeStart`, `isCodeEnd`, `isTreeStart`, `getScale`, `getColor` | Parser — small static line-classification helpers `CreoleParser` (T9a) needs to dispatch a raw display line to the code/latex/tree/table branches, plus two pure `<style>`-attribute readers unrelated to that dispatch but part of the same ups |
| `Position.ts` | `Position` |  |
| `Sea.ts` | `AtomOps`, `Sea` |  |
| `Sheet.ts` | `Sheet` | Sheet — an ordered list of `Stripe`s (one per physical creole display line) plus the `HorizontalAlignment` the sheet as a whole aligns to. |
| `SheetBlock1.ts` | `Atom`, `SheetBlock1` |  |
| `SheetBlock2.ts` | `SheetBlock2` |  |
| `SheetBuilder.ts` | `StereotypeLike`, `MemberLike`, `DisplayLine`, `DisplayLike`, `isNullDisplay`, `SheetBuilder` | SheetBuilder — the single method `Display#getCreole` calls to turn a `Display` into a laid-out `Sheet`. |
| `Stencil.ts` | `Stencil` |  |
| `Stripe.ts` | `StripeAtom`, `Stripe` | Stripe — one physical creole display line's built atom sequence. |
| `StripeStyle.ts` | `StripeStyle` | StripeStyle — the per-line style tag every non-plain `Stripe` producer (`StripeTable`/`StripeTree`/`StripeCode`/`StripeLatex`, all still unported) carries: which `StripeStyleType` the line is, its nesting `order` (list depth / heading level |
| `StripeStyleType.ts` | `StripeStyleType` | StripeStyleType — the per-line creole classification `CreoleStripeSimpleParser`'s regex cascade assigns before a line's atoms are built. |

## `src/core/klimt/creole/atom/`

| Module | Exports | Purpose |
|---|---|---|
| `AbstractAtom.ts` | `AbstractAtom` | AbstractAtom — upstream: klimt/creole/atom/AbstractAtom.java (`abstract class AbstractAtom extends TextBlockMemoized implements Atom`). |
| `Atom.ts` | `CreoleAtomUrl`, `CreoleAtom` | Atom — one drawable/measurable piece of a creole `Stripe` (one physical display line). |
| `AtomEmoji.ts` | `EMOJI_MAGIC`, `EMOJI_BOX_FACTOR`, `EMOJI_ALTITUDE_FACTOR`, `EMOJI_LINE_HEIGHT_FACTOR`, `emojiLineHeightFactor`, `emojiFactor`, `emojiBoxDim`, `emojiSquareDim`, `emojiStartingAltitude`, `emojiRenderRun` | AtomEmoji — sizing constants for one `<:name:>` creole emoji atom. |
| `AtomMath.ts` | `AtomMath` | AtomMath — upstream: klimt/creole/atom/AtomMath.java (`extends AbstractAtom implements Atom`, 107 lines). |
| `AtomTable.ts` | `AtomTable` | AtomTable — the drawable/measurable creole table `StripeTable` builds: a grid of `Atom` cells (each itself a `SheetBlock1` wrapping one cell's own nested `Sheet`), laid out column-width/row-height-first (every cell in a column shares that c |
| `AtomTree.ts` | `AtomTree` | AtomTree — a stack of `Atom` cells, each tagged with an integer nesting `level`, measured/drawn top-to-bottom with a `Skeleton2` bullet/hline/ vline connector drawn beside each cell at its own vertical midpoint. |
| `AtomWithMargin.ts` | `AtomWithMargin` | AtomWithMargin — wraps another `Atom`, adding a fixed top/bottom margin to its measured height (`marginY1`/`marginY2`) and translating it down by `marginY1` at draw time. |
| `Skeleton2.ts` | `Skeleton2` | Skeleton2 — accumulates one `Entry` (level, y-midpoint) per drawn cell of an `AtomTree` and, once every cell has been drawn, renders the bullet + horizontal + vertical connector lines that give the tree its indentation guides. |

## `src/core/klimt/creole/command/`

| Module | Exports | Purpose |
|---|---|---|
| `AddStyle.ts` | `addFontStyle` | AddStyle — applies one `FontStyle` flag to a `FontConfiguration`. |
| `Command.ts` | `StripeBuilder`, `Command` | Command — one inline creole markup recognizer (`**bold**`, `<b>bold</b>`, `<b>bold to end of line`, ...), tried in sequence by `StripeSimple#modifyStripe`'s per-character scan. |
| `CommandCreoleColorAndSizeChange.ts` | `createColorAndSizeChangeCommands` | CommandCreoleColorAndSizeChange — `<font size=N color=X>text</font>` and the EOL (no closing tag) form; `size=`/`color=` attrs may appear in either order, and either may be omitted (but at least one must be present — a bare `<font ...>` wit |
| `CommandCreoleColorChange.ts` | `createColorChangeCommands` | CommandCreoleColorChange — `<color:name-or-hex>text</color>` and the EOL (no closing tag) form. |
| `CommandCreoleEmoji.ts` | `createEmojiCommand` | CommandCreoleEmoji — the `<:name:>` / `<#color:name:>` creole emoji atom. |
| `CommandCreoleExposantChange.ts` | `createExposantChangeCommand` | CommandCreoleExposantChange — `<sup>text</sup>` (EXPOSANT) and `<sub>text</sub>` (INDICE). |
| `CommandCreoleFontFamilyChange.ts` | `createFontFamilyChangeCommands` | CommandCreoleFontFamilyChange — `<font:FamilyName>text</font>` / `<font FamilyName>text</font>` and the EOL (no closing tag) form. |
| `CommandCreoleLatex.ts` | `createLatexCommand` | CommandCreoleLatex — `<latex>expr</latex>`. |
| `CommandCreoleMonospaced.ts` | `createMonospacedCommand` | CommandCreoleMonospaced — the creole `""text""` monospace run. |
| `CommandCreoleSizeChange.ts` | `createSizeChangeCommands` | CommandCreoleSizeChange — `<size:N>text</size>` and `<size:N>text to end of line` (no closing tag needed). |
| `CommandCreoleStyle.ts` | `createStyleCommands`, `createStyleCommandsWithoutCreoleForm`, `createBackcolorCommands` | CommandCreoleStyle — the BOLD/ITALIC/UNDERLINE/STRIKE/WAVE inline style commands: `**text**`/`//text//`/`__text__`/`--text--`/`~~text~~` (pure Creole double-punctuation) and `<b>text</b>`/`<b>text to end of line` (HTML-tag-style, with or wi |
| `CommandCreoleUrl.ts` | `createUrlCommand` | CommandCreoleUrl — `[[url]]` / `[[url label]]` / `[[url {tooltip}]]` / `[[url {tooltip} label]]` link atom-splitting: the jar draws the resolved LABEL as its own text atom, in the hyperlink color (blue, `SkinParamUtils.getFontHyperlinkColor |

## `src/core/klimt/creole/legacy/`

| Module | Exports | Purpose |
|---|---|---|
| `AtomText.ts` | `atomTextStartingAltitude`, `TAB_STOP_FONT_SIZE_FACTOR`, `TAB_STRING`, `BLOCK_E1_REAL_TABULATION`, `hasTabulation`, `tabStopWidth`, `advanceToTabStop`, `atomTextWidth` | AtomText — the TAB-STOP-aware width of one creole text run. |
| `CommandCreoleBuilder.ts` | `CREOLE_COMMANDS`, `CREOLE_COMMANDS_OTHER` | CommandCreoleBuilder — builds the `starter prefix -> Command[]` map `StripeSimple#searchCommand` looks up against. |
| `CreoleParser.ts` | `CreoleTextStyle`, `CreoleParserAdapters`, `CreoleParser` | CreoleParser — the ONLY upstream implementor of `SheetBuilder`: turns a `Display` into a `Sheet` of `Stripe`s, one physical display line at a time, dispatching each line to a table/tree/code/latex/plain-text classifier. |
| `CreoleStripeSimpleParser.ts` | `StripeClassification`, `classifyStripeLine` | CreoleStripeSimpleParser — classifies ONE already-`\n`-split display line into a `StripeStyleType` + its content, per upstream's regex cascade. |
| `StripeCode.ts` | `StripeCode` | StripeCode — one `<code>...</code>` fenced block: a "raw" continuation stripe that accumulates every physical line between `<code>` and `</code>` verbatim (no creole markup parsing inside the fence) and draws them top-to-bottom in one `Font |
| `StripeLatex.ts` | `StripeLatex` | StripeLatex — one `<latex>...</latex>` block: a "raw" continuation stripe that accumulates every physical line between `<latex>` and `</latex>` verbatim, then lazily builds a single `AtomMath` wrapping the whole accumulated formula. |
| `StripeRaw.ts` | `StripeRaw` | StripeRaw — upstream: klimt/creole/legacy/StripeRaw.java (`interface StripeRaw extends Stripe, Atom`). |
| `StripeSimple.ts` | `fontConfigurationForHeading`, `buildStripeAtoms`, `buildLiteralAtoms`, `LineBuildAtoms`, `buildLineAtoms` | StripeSimple — builds one physical creole display line's flat `CreoleAtom` sequence: plain-text runs interleaved with `<img>`/`<$sprite>`/`<latex>` atoms, each text run carrying its own resolved `FontConfiguration` (nested `<b>`/`**`/etc. |
| `StripeTable.ts` | `StripeTable` | StripeTable — the `Stripe` a `\|cell\|cell\|`/`\|=Header\|=Header\|` creole TABLE line (optionally `<#color>`/`<#backcolor,linecolor>`-prefixed, per-cell OR per-line) becomes: parses the line into cells (each its own nested `Sheet` of one-or-more |
| `StripeTree.ts` | `computeLevel`, `StripeTree` | StripeTree — one `\|_`-prefixed tree-list creole block. |

## `src/core/klimt/drawing/`

| Module | Exports | Purpose |
|---|---|---|
| `AbstractUGraphicHorizontalLine.ts` | `AbstractUGraphicHorizontalLine` |  |
| `LimitFinder.ts` | `LimitFinder` |  |
| `UGraphicDelegator.ts` | `UGraphicDelegator` |  |
| `UGraphicNo.ts` | `UGraphicNo` |  |
| `UGraphicStencil.ts` | `UGraphicStencil` |  |

## `src/core/klimt/drawing/hand/`

| Module | Exports | Purpose |
|---|---|---|
| `HandJiggle.ts` | `HandPoint`, `HandCubic`, `HandJiggle` | @see ~/git/plantuml/.../klimt/drawing/hand/HandJiggle.java The wobble every handwritten shape is built from: walk a straight run in ~10-unit segments and push each intermediate point sideways by a random offset, PERPENDICULAR to the run. |
| `JavaRandom.ts` | `JavaRandom` | `java.util.Random`, reproduced bit-for-bit. |
| `shapes.ts` | `rectangleHand`, `lineHand`, `polygonHand`, `ellipseHand`, `HandSegment`, `HandRun`, `pathHand` | The six shape builders `UGraphicHandwritten` dispatches to, ported together because each is a few lines over {@link HandJiggle} and they share one `JavaRandom`. |

## `src/core/klimt/drawing/svg/`

| Module | Exports | Purpose |
|---|---|---|
| `driver-dot-path-svg.ts` | `DriverDotPathSvg` | driver-dot-path-svg.ts — the `DotPath` → SVG `<path>` driver (svek edge splines). |
| `driver-ellipse-svg.ts` | `DriverEllipseSvg` | driver-ellipse-svg.ts — the `UEllipse` → SVG `<ellipse>` (full ellipse) or `<path>` (elliptical arc) driver. |
| `driver-image-svg.ts` | `DriverImageSvg` | driver-image-svg.ts — the `UImage` → SVG `<image>` driver (SI5b+E2r T7, D7). |
| `driver-line-svg.ts` | `DriverLineSvg` | driver-line-svg.ts — the `ULine` → SVG `<line>` driver. |
| `driver-path-svg.ts` | `DriverPathSvg` | driver-path-svg.ts — the `UPath` → SVG `<path>` driver. |
| `driver-polygon-svg.ts` | `DriverPolygonSvg` | driver-polygon-svg.ts — the `UPolygon` → SVG `<polygon>` driver. |
| `driver-rectangle-svg.ts` | `DriverRectangleSvg` | driver-rectangle-svg.ts — the `URectangle` → SVG `<rect>` driver. |
| `driver-svg-stubs.ts` | `DriverImagePng`, `DriverPixelSvg`, `DriverImageSvgSvg`, `DriverTextAsPathSvg`, `DriverCenteredCharacterSvg` | driver-svg-stubs.ts — D3′ throwing stubs for the SVG driver family members this task defers. |
| `driver-text-svg.ts` | `StringBounder`, `DriverTextSvg` | driver-text-svg.ts — the `UText` → SVG `<text>` driver. |
| `svg-graphics-core.ts` | `LengthAdjust`, `TransparentFillBehavior`, `SvgOption`, `basicSvgOption`, `seedOf`, `SvgGraphicsCore` | svg-graphics-core.ts — SvgGraphics's document-lifecycle layer: the options shape, low-level number formatting, fill/stroke state, and gradient-def registration needed by the constructor itself. |
| `svg-graphics-elements.ts` | `TextOptions`, `RectangleGeometry`, `SvgGraphicsElements` | svg-graphics-elements.ts — the shape-drawing methods: every `svg*`-prefixed element-creation call plus the legacy `newpath`/`moveto`/…/`fill` path-builder API. |
| `svg-graphics-shadow.ts` | `SvgGraphicsShadow` | svg-graphics-shadow.ts — the `<filter>` def machinery for drop shadows and text-backcolor filters. |
| `svg-graphics.ts` | `SvgOption`, `basicSvgOption`, `LengthAdjust`, `TransparentFillBehavior`, `TextOptions`, `RectangleGeometry`, `META_HEADER`, `getMetadataHex`, `SvgGraphics`, `UGroupType`, `XmlNode` | svg-graphics.ts — the single upstream-named `SvgGraphics` entry point. |
| `svg-seed.ts` | `getSeed`, `seedOf`, `gradientVector` | UmlSource seed hashing (seedOf/getSeed) + gradient-vector policy for the SVG emitter. |
| `u-graphic-svg.ts` | `UGraphicSvg` | u-graphic-svg.ts — `UGraphicSvg`, the concrete SVG backend that wires every `Driver*Svg` from this task into `AbstractCommonUGraphic`'s driver registry and owns the shared `SvgGraphics` document. |
| `xml-writer.ts` | `XmlContent`, `XmlWriter`, `XmlLeaf`, `XmlNode`, `XmlDocument` | xml-writer.ts — the dependency-free XML/SVG node stack `SvgGraphics` builds its document out of: a streaming text writer (`XmlWriter`) plus a small eager DOM (`XmlDocument`/`XmlNode`/`XmlLeaf`/`XmlContent`). |

## `src/core/klimt/font/`

| Module | Exports | Purpose |
|---|---|---|
| `FontParam.ts` | `ARROW_LABEL_FONT_SIZE`, `NOTE_FONT_SIZE` | `FontParam` — the fixed per-element font sizes upstream declares as enum entries, each independent of the diagram's own default font size. |
| `FontPosition.ts` | `FontPosition`, `fontPositionSpace`, `muteFontSize`, `fontPositionHtmlTag` | FontPosition — where a creole text run sits relative to the normal baseline: NORMAL, EXPOSANT (`<sup>`) or INDICE (`<sub>`). |
| `StringBounder.ts` | `StringBounder` |  |

## `src/core/klimt/geom/`

| Module | Exports | Purpose |
|---|---|---|
| `AbstractPlacementStrategy.ts` | `AbstractPlacementStrategy` |  |
| `BasicEnsureVisible.ts` | `BasicEnsureVisible` |  |
| `ClockwiseTopRightBottomLeft.ts` | `ClockwiseTopRightBottomLeft` |  |
| `CoordinateChange.ts` | `CoordinateChange` |  |
| `EnsureVisible.ts` | `EnsureVisible` | EnsureVisible — the callback surface a clickable region (`Url`) exposes so drivers can report every point they actually painted for it; the accumulated bounding box becomes the image-map/SVG link geometry. |
| `HorizontalAlignment.ts` | `HorizontalAlignment` | HorizontalAlignment — the 3-way text/label alignment `USymbol#asSmall`/ `asBig` (decoration/symbol/USymbol.java) take for the stereotype and, for `asBig`, the label too (see `USymbolRectangle.java`'s `asBig`, which branches on `labelAlignme |
| `MagneticBorder.ts` | `MagneticBorder` |  |
| `MagneticBorderNone.ts` | `MagneticBorderNone` |  |
| `MinMax.ts` | `MinMax` |  |
| `MinMaxMutable.ts` | `MinMaxMutable` |  |
| `Moveable.ts` | `Moveable` | Moveable — anything that can be shifted by a relative (dx, dy) delta, in place. |
| `PlacementStrategy.ts` | `PlacementStrategy` |  |
| `PlacementStrategyVisibility.ts` | `PlacementStrategyVisibility` |  |
| `PlacementStrategyX1X2.ts` | `PlacementStrategyX1X2` |  |
| `PlacementStrategyX1Y2Y3.ts` | `PlacementStrategyX1Y2Y3` |  |
| `PlacementStrategyY1Y2.ts` | `PlacementStrategyY1Y2` |  |
| `PlacementStrategyY1Y2Center.ts` | `PlacementStrategyY1Y2Center` |  |
| `PlacementStrategyY1Y2Left.ts` | `PlacementStrategyY1Y2Left` |  |
| `PlacementStrategyY1Y2Right.ts` | `PlacementStrategyY1Y2Right` |  |
| `Positionable.ts` | `Positionable` |  |
| `PositionableImpl.ts` | `PositionableImpl` |  |
| `PositionableUtils.ts` | `intersect`, `addMargin`, `moveAwayFrom` |  |
| `ULayoutGroup.ts` | `ULayoutGroup` |  |
| `VerticalAlignment.ts` | `VerticalAlignment` | VerticalAlignment — the 3-way alignment `TextBlockHorizontal` uses to position each block within the merged row's height (top/center/bottom). |
| `XDimension2D.ts` | `XDimension2D` |  |
| `XLine2D.ts` | `XLine2D` |  |
| `XPoint2D.ts` | `XPoint2D` | XPoint2D — an immutable (x, y) point. |
| `XRectangle2D.ts` | `XRectangle2D` | XRectangle2D — an immutable (x, y, width, height) axis-aligned rectangle. |

## `src/core/klimt/shape/`

| Module | Exports | Purpose |
|---|---|---|
| `DotPath.ts` | `Bezier`, `DotPath` |  |
| `TextBlock.ts` | `TextBlock`, `textBlockMagneticBorder` |  |
| `TextBlockHorizontal.ts` | `TextBlockHorizontal` |  |
| `TextBlockInEllipse.ts` | `TextBlockInEllipse` |  |
| `TextBlockLineBefore.ts` | `TextBlockLineBefore` |  |
| `TextBlockMarged.ts` | `TextBlockMarged` |  |
| `TextBlockMemoized.ts` | `TextBlockMemoized` |  |
| `TextBlockMinWidth.ts` | `TextBlockMinWidth` |  |
| `TextBlockSprited.ts` | `TextBlockSprited` |  |
| `TextBlockUtils.ts` | `TextBlockUtils` |  |
| `TextBlockVertical.ts` | `TextBlockVertical` |  |
| `TextBlockWithUrl.ts` | `Url`, `TextBlockWithUrl` |  |
| `UComment.ts` | `UComment` |  |
| `UDrawable.ts` | `UDrawable` |  |
| `UEllipse.ts` | `Dimension2D`, `UEllipse` |  |
| `UEmpty.ts` | `UEmpty` |  |
| `UGroup.ts` | `UGroupType`, `getSvgKeyAttributeName`, `UGroup` | UGroupType — the SVG `<g>`/element attribute keys `UGroup` can carry (id, class, title, and various `data-*` bookkeeping keys svek/layout attach for traceability back to source). |
| `UHorizontalLine.ts` | `UHorizontalLine` |  |
| `UImage.ts` | `UImage` |  |
| `ULine.ts` | `ULine` |  |
| `UPath.ts` | `USegmentType`, `USegment`, `UPath` |  |
| `UPolygon.ts` | `UPolygon` |  |
| `URectangle.ts` | `URectangle` |  |
| `UText.ts` | `FontStyle`, `FontConfiguration`, `getFont`, `getSpace`, `UText` |  |

## `src/core/klimt/sprite/`

| Module | Exports | Purpose |
|---|---|---|
| `AsciiEncoder.ts` | `AsciiEncoder` | PlantUML's own 6-bit encoding used for sprite/URL payloads -- NOT base64. |
| `ColorResolver.ts` | `GrayLevelRange`, `ColorResolver`, `colorResolverToSvgHex` | ColorResolver — resolves a raw SVG color token (from a decomposed `<$sprite>` `<path>`'s `fill`/`stroke` attribute) to a concrete color, honouring an optional "forced" override color and the sprite's own grey-level range. |
| `deflate-fixed.ts` | `deflateFixed` | DEFLATE with fixed Huffman codes (BTYPE=01) and LZ77 matching — RFC 1951. |
| `png-encoder.ts` | `RGBA_BYTES_PER_PIXEL`, `crc32`, `adler32`, `encodePng`, `toBase64`, `toBase64DataUri` | Minimal deterministic PNG writer, browser-safe, zero deps, synchronous. |
| `png-ihdr.ts` | `PngIhdr`, `parsePngIhdrFromDataUri` | PNG IHDR chunk reader for `data:image/png;base64,...` data URIs. |
| `sprite-raster.ts` | `SpriteLike`, `spriteMonochromeAsLike`, `RgbaBitmap`, `spriteToRgba`, `SpritePngResult`, `spriteToPngDataUri` | Monochrome-sprite tint + PNG rasterization (T5 of SI5b/decisions.md D7). |
| `Sprite.ts` | `Sprite` | The shared marker every sprite kind implements: pixel dimensions. |
| `SpriteGrayLevel.ts` | `SpriteGrayLevel` |  |
| `SpriteMonochrome.ts` | `SpriteMonochrome` |  |
| `SpriteSvg.ts` | `svgDimension`, `svgInkBox`, `SpriteSvg`, `isSpriteSvg` | `SpriteSvg` — a sprite defined by an inline `<svg>…</svg>` element rather than the encoded grey-level grid `SpriteMonochrome` carries. |
| `svg-nanoparser-shapes.ts` | `DATA_STROKE`, `getFillString`, `applyFillAndStroke`, `drawCircle`, `drawEllipse`, `drawText` | svg-nanoparser-shapes.ts -- the `<circle>`/`<ellipse>`/`<text>` element emitters plus the shared `applyFillAndStroke`/`getFillString` attribute resolution `SvgNanoParser.drawU` dispatches to, split into its own module per this task's comple |
| `svg-nanoparser-transform.ts` | `extract`, `applyTransformAttribute` | svg-nanoparser-transform.ts -- `<g transform="...">`/element `transform=` attribute-string parsing for `SvgNanoParser`, split into its own module per this task's complexity-hook budget (the combined port exceeded the 500-line split threshol |
| `svg-path-bbox.ts` | `PathBox`, `pathBBox` | Bounding box of an SVG path `d`, computed the way `UPath` does. |
| `SvgNanoParser.ts` | `SvgNanoParser` |  |
| `SvgPath.ts` | `parseSvgPath` |  |

## `src/core/math/`

| Module | Exports | Purpose |
|---|---|---|
| `ScientificEquationSafe.ts` | `ScientificEquationSafe` | ScientificEquationSafe — upstream: math/ScientificEquationSafe.java (171 lines). |

## `src/core/plasma/`

| Module | Exports | Purpose |
|---|---|---|
| `PEntry.ts` | `PEntry` |  |
| `Plasma.ts` | `MAGIC_SEPARATOR`, `Plasma` |  |
| `Quark.ts` | `Quark` |  |

## `src/core/sequencediagram/`

| Module | Exports | Purpose |
|---|---|---|
| `MessageNumber.ts` | `MessageNumber`, `isMessageNumber` | `MessageNumber` — the auto-numbered `autonumber`/explicit sequence message index (`1)`, `<b>2)`), and one of the `CharSequence`-typed element kinds a `Display`'s element list can hold (`Display.create0`'s `get(0) instanceof MessageNumber` d |

## `src/core/skin/`

| Module | Exports | Purpose |
|---|---|---|
| `ActorAwesome.ts` | `ActorAwesome` |  |
| `ActorHollow.ts` | `ActorHollow` |  |
| `ActorStickMan.ts` | `ActorStickMan` |  |
| `ActorStyle.ts` | `ActorStyle`, `actorStyleGetTextBlock` |  |
| `ColorParam.ts` | `ColorParam` |  |
| `Pragma.ts` | `Pragma` | Pragma — the resolved `!pragma <key> <value>` table for one diagram, plus the `WarningHandler` capability every pragma-aware command shares. |
| `PragmaKey.ts` | `PragmaKey`, `pragmaKeyDefaultValue`, `pragmaKeyLazyFrom` | PragmaKey — the fixed set of `!pragma <key> <value>` keys `Pragma` stores. |
| `VisibilityModifier.ts` | `ColorParam`, `SName`, `StyleSignatureBasic`, `VisibilityModifier` |  |

## `src/core/stereo/`

| Module | Exports | Purpose |
|---|---|---|
| `Stereotype.ts` | `CircledFont`, `Stereotype`, `isStereotype` | `Stereotype` — a `<<label>>` decoration attached to a classifier/entity, and one of the `CharSequence`-typed element kinds a `Display`'s element list can hold (`Display.create0`'s `get(0) instanceof Stereotype` / `get(size()-1) instanceof S |
| `StereotypeDecoration.ts` | `GuillemetPair`, `GUILLEMET_NONE`, `GUILLEMET_DOUBLE_COMPARATOR`, `StereotypeDecoration`, `cutLabels` | `StereotypeDecoration` — the resolved `<<...>>` blob a {@link Stereotype} wraps: the raw label text plus any circled-character/circled-sprite decoration (`<<(X,red)Foo>>` / `<<($name,red)Foo>>`) folded out of it. |

## `src/core/style/`

| Module | Exports | Purpose |
|---|---|---|
| `ISkinSimple.ts` | `ISkinSimple` | ISkinSimple — the skin-parameter capability interface `Display`/ `CreoleParser` (and, once ported, `StripeTable`/`StripeTree`/ `EmbeddedDiagram`) consume to reach fonts, sprites, guillemets, and a `SheetBuilder`. |
| `StyleSignatureBasic.ts` | `SName`, `StyleSignatureBasic` | SName — minimal consumed slice of the unported style-name enum (ADR-2; `style/SName.java` is a 217-member enum). |

## `src/core/svek/`

| Module | Exports | Purpose |
|---|---|---|
| `Boundary.ts` | `Boundary` |  |
| `CircleInterface2.ts` | `CircleInterface2` |  |
| `Cluster.ts` | `ClusterGeometry`, `ClusterGroupInfo`, `ClusterStyleDefaults`, `ClusterHeaderInfo`, `ClusterSymbolInfo`, `resolveBorderColor`, `resolveRoundCorner`, `getStrokeInternal`, `resolveBackColor`, `Cluster` | Cluster — the DRAWING half of a description/component/usecase-diagram container (a `package`, `frame`, `node`, or component/interface acting as a group): the `<!--cluster X-->` comment, the `<g class="cluster" data-qualified-name="..." id=" |
| `ClusterDecoration.ts` | `ClusterGeometry`, `ClusterDecoration` | ClusterDecoration — resolves a Cluster's `USymbol` (an explicit one, or a `PackageStyle` fallback) and draws its `asBig` chrome (body outline + title + stereotype) at the cluster's own geometry. |
| `Control.ts` | `Control` |  |
| `DecorateEntityImage.ts` | `UGraphicWithGroups`, `DecorateEntityImage`, `EntityDecorationInfo`, `decorateEntityDrawing` |  |
| `EntityDomain.ts` | `EntityDomain` |  |
| `FrontierCalculator.ts` | `RectangleArea`, `Point`, `ENTITY_POSITION_RADIUS`, `FrontierRankdir`, `frontierCalculator`, `ensureMinWidth` | FrontierCalculator — the post-layout box-correction jar applies to a cluster's own graphviz-assigned rectangle before drawing it, whenever the cluster carries `<<entrypoint>>`/`<<exitpoint>>` (port) members alongside or instead of normal-po |
| `IEntityImage.ts` | `ENTITY_IMAGE_MARGIN`, `ENTITY_IMAGE_MARGIN_LINE` | `IEntityImage` — the margins every svek entity image insets its content by. |
| `PackageStyle.ts` | `PackageStyle`, `PackageStyleName`, `packageStyleToUSymbol` | PackageStyle — the container "shape family" a group falls back to when it has no explicit `USymbol` (e.g. |
| `PortGeometry.ts` | `PortGeometry` | PortGeometry — one named port's resolved (position, height) box on its owning entity's left edge, plus the `score` `Ports#add` uses to prefer a higher-confidence match when the same port id is reported twice. |
| `Ports.ts` | `Ports` | Ports — the id-keyed collection of `PortGeometry` a `WithPorts` implementor reports (`SheetBlock2#getPorts`, `MethodsOrFieldsArea`'s member-row port lookups, SI1 scope, not this task) so an edge targeting `entity::portName` can resolve a pr |
| `svek-edge-extremity.ts` | `PlacedExtremity`, `place`, `placeTailExtremity`, `placeHeadExtremity` |  |
| `svek-edge-geometry.ts` | `buildDotPathFromSplinePoints`, `edgeMidpoint` |  |
| `svek-edge-stroke.ts` | `strokeForStyle` |  |
| `SvekEdge.ts` | `SvekLinkStyle`, `SvekEdgeLabel`, `SvekEdgeInput`, `SvekEdge` |  |
| `SvekResult.ts` | `INK_DELTA`, `JAR_INK_MARGIN`, `InkExtent`, `svekDimension`, `svekInkShift` | The two constants `SvekResult#calculateDimension` applies to every svek diagram's ink extent — the single owner for all engines. |
| `WithPorts.ts` | `WithPorts` |  |

## `src/core/svek/extremity/`

| Module | Exports | Purpose |
|---|---|---|
| `draw-line-segment.ts` | `drawLineSegment` |  |
| `Extremity.ts` | `Extremity` |  |
| `ExtremityArrow.ts` | `ExtremityArrow`, `ExtremityFactoryArrow` |  |
| `ExtremityCircle.ts` | `ExtremityCircle`, `ExtremityFactoryCircle` |  |
| `ExtremityCircleConnect.ts` | `ExtremityCircleConnect`, `ExtremityFactoryCircleConnect` |  |
| `ExtremityCircleCrowfoot.ts` | `ExtremityCircleCrowfoot`, `ExtremityFactoryCircleCrowfoot` |  |
| `ExtremityCircleLine.ts` | `ExtremityCircleLine`, `ExtremityFactoryCircleLine` |  |
| `ExtremityCrowfoot.ts` | `ExtremityCrowfoot`, `ExtremityFactoryCrowfoot` |  |
| `ExtremityDiamond.ts` | `ExtremityDiamond`, `ExtremityFactoryDiamond` |  |
| `ExtremityDoubleLine.ts` | `ExtremityDoubleLine`, `ExtremityFactoryDoubleLine` |  |
| `ExtremityExtendsLike.ts` | `ExtremityExtendsLike`, `ExtremityExtendsLikeRedefines`, `ExtremityExtendsLikeDefinedBy`, `ExtremityFactoryExtendsLike` |  |
| `ExtremityFactory.ts` | `ExtremityFactory` |  |
| `ExtremityHalfArrow.ts` | `ExtremityHalfArrow`, `ExtremityFactoryHalfArrow` |  |
| `ExtremityLineCrowfoot.ts` | `ExtremityLineCrowfoot`, `ExtremityFactoryLineCrowfoot` |  |
| `ExtremityNotNavigable.ts` | `ExtremityNotNavigable`, `ExtremityFactoryNotNavigable` |  |
| `ExtremityParenthesis.ts` | `ExtremityParenthesis`, `ExtremityFactoryParenthesis` |  |
| `ExtremityPlus.ts` | `ExtremityPlus`, `ExtremityFactoryPlus` |  |
| `ExtremitySquare.ts` | `ExtremitySquare`, `ExtremityFactorySquare` |  |
| `ExtremityTriangle.ts` | `TriangleGeom`, `ExtremityTriangle`, `ExtremityFactoryTriangle` |  |
| `link-decor.ts` | `LinkDecorName`, `lookupDecors1`, `lookupDecors2`, `isFillDecor`, `buildExtremityFactory`, `looksLikeRevertedForSvg`, `looksLikeNoDecorAtAllSvg`, `getLinkTypeName` |  |
| `rotate-point.ts` | `rotatePoint`, `rotateAndTranslate` |  |
| `Side.ts` | `Side` | Side — the four cardinal sides `ExtremityCrowfoot` clamps its left/right wing endpoints against when the link approaches a node from directly N/E/S/W (see `ExtremityCrowfoot.ts`). |

## `src/core/svek/image/`

| Module | Exports | Purpose |
|---|---|---|
| `Circle.ts` | `Circle` |  |
| `ContainingEllipse.ts` | `ContainingEllipse` |  |
| `creole-sea-line.ts` | `ATOM_TEXT_MIN_HEIGHT`, `SeaLineOps`, `SeaLineLayout`, `creoleAtomStartingAltitude`, `layoutLineThroughSea`, `measurerSeaLineOps` | creole-sea-line — the vertical half of one physical (post-word-wrap) creole line: `Sea` placement, the line's own height, and the per-run baseline offset a `<sup>`/`<sub>` run needs (SI30 `decisions.md#D2`). |
| `creole-text-lines.ts` | `FontStyleFlags`, `CreoleTextRun`, `CreoleTextLine`, `creoleTextLines` | creole-text-lines — the ONE core creole-text seam shared by the state sizer (T6) and the state renderer (T7), per `plans/state-declared-size-fix/ decisions.md#D1`. |
| `EntityImageDescription.ts` | `ShapeType`, `Margins`, `resolveDescriptionUSymbol`, `HexagonPolygon`, `EntityImageDescriptionEntity`, `EntityImageDescriptionSymbol`, `EntityImageDescriptionLabels`, `EntityImageDescriptionStereotypeSprite`, `EntityImageDescriptionPaint`, `EntityImageDescriptionLinkInfo`, `EntityImageDescriptionParams`, `EntityImageDescription` | EntityImageDescription — draws a descriptive/deployment leaf entity (`component`, `usecase`, `database`, `interface`, `rectangle`, ...): the `<!--entity NAME--><g class="entity" ...>` wrapper, the resolved `USymbol`'s `asSmall` chrome, an o |
| `EntityImageDescriptionDelegates.ts` | `buildDesc`, `resolveStereotypeSprite`, `buildStereo`, `hasSomeHorizontalLinkVisible`, `isThereADoubleLink`, `hasSomeHorizontalLinkDoubleDecorated`, `computeShieldMargins`, `hideTextOffsets`, `requireGroups` | EntityImageDescriptionDelegates — every private-instance-method body `EntityImageDescription` delegates to (`buildDesc`, `buildStereo`, the three link-scanning helpers, `computeShieldMargins`, `hideTextOffsets`, `requireGroups`). |
| `EntityImageDescriptionEmoji.ts` | `EmojiAtomLike`, `EmojiArtworkResolver`, `drawEmojiAtom` | The `<:name:>` emoji draw branch of `descAtomOps`, split out of `EntityImageDescriptionDelegates.ts` at the 500-line cap. |
| `EntityImageDescriptionSupport.ts` | `measureLine`, `buildTextBlock`, `ShapeType`, `Margins`, `HexagonPolygon`, `resolveDescriptionUSymbol`, `resolveUSymbol`, `resolveShapeType` | EntityImageDescriptionSupport — module-level helpers for `EntityImageDescription.ts`, extracted purely to stay under this project's 500-line complexity-hook ceiling (see this project's established "500-line splits" workaround — `EntityImage |
| `EntityImageDescriptionTextBlock.ts` | `measureLine`, `buildTextBlock` | EntityImageDescriptionTextBlock — the text-construction seam split out of `EntityImageDescriptionSupport.ts` (E2r/L1's own home for it) purely to stay under this project's 500-line complexity-hook ceiling once T9 (svg-sprite-nanoparser) wid |
| `EntityImageJson.ts` | `JSON_NAME_MARGIN`, `JSON_CELL_MARGIN_X`, `JSON_CELL_MARGIN_Y`, `JSON_X_MARGIN_CIRCLE`, `JSON_EMPTY_HEIGHT_FALLBACK` | `EntityImageJson` / `TextBlockCucaJSon` — the margins a `json` leaf embedded in a cuca diagram insets its cells and title by. |
| `EntityImageNoteLink.ts` | `PureNoteTextDim`, `PureNoteTextMeasurer`, `measureLinkNoteDim` | ONE port of `EntityImageNoteLink`'s dimension -- collapses the FOUR former copies (`class/class-note-link-box.ts:70`, `state/state-dot-graph.ts:172`, `state/state-composite-edge-label.ts:49` -- the last two byte-identical private duplicates |
| `Footprint.ts` | `Footprint` |  |
| `leaf-sizing-consts.ts` | `ComponentStyle`, `BoxSizingOpts`, `ACTOR_WIDTH`, `ACTOR_HEIGHT`, `ACTOR_STICKMAN_WIDTH`, `ACTOR_STICKMAN_HEIGHT`, `USECASE_HEIGHT`, `USECASE_ELLIPSE_BIGGER`, `USECASE_ALPHA_MIN`, `USECASE_ALPHA_MAX`, `BOX_MIN_WIDTH_DEFAULT`, `DEFAULT_SIZING_STROKE_THICKNESS`, `SYMBOL_BOX_MARGIN`, `DEFAULT_BOX_MARGIN`, `SYMBOL_ICON_ALLOWANCE`, `STEREO_MARGIN`, `LINE_HEIGHT_FACTOR`, `PORT_SIZE`, `FOLDER_FAMILY_SHOW_TITLE`, `FOLDER_TAB_WIDTH`, `FOLDER_TAB_HEIGHT`, `INTERFACE_CIRCLE_SIZE`, `NOTE_FONT_SIZE`, `NOTE_MARGIN_H`, `NOTE_MARGIN_V`, `Dim` | Shared constants + context types for description leaf sizing. |
| `leaf-sizing-entity.ts` | `sizingAtomImageResolverFor`, `measureEntityLeaf`, `measureUsecaseOrActorLeaf`, `LeafSymbolInk`, `measureUsecaseOrActorLeafInk` | `EntityImageDescription.calculateDimensionSlow` routing for the description engine's leaf sizer (T6/ADR-6). |
| `leaf-sizing-folder-title.ts` | `measureShownFolderTitle` | The SHOWN folder-family title block (`package`) — the faithful `BodyFactory.create2` → `BodyEnhanced1` route (SI1 T12, ADR-4). |
| `leaf-sizing-folder.ts` | `measureFolderLeaf` | `folder` / `package` leaf sizing — `USymbolFolder(sname, showTitle)`. |
| `leaf-sizing-legacy-fallback.ts` | `hasUnroutedBoxMarkup`, `LegacyBoxFallbackCtx`, `measureLegacyBoxFallback` | Legacy (pre-T6) box-family sizing math, kept ONLY as a fallback for displays this task's `EntityImageDescription` routing (`leaf-sizing.ts`, ADR-6) does not yet reproduce byte-exact: - a `<latex>` atom: the shared svek/ text pipeline (`Enti |
| `leaf-sizing-text.ts` | `lineCount`, `CREOLE_HR_HEIGHT`, `isCreoleHrLine`, `textBlockHeight`, `baseFontConfiguration`, `LeafTextAtomPlacement`, `LeafTextLineLayout`, `leafTextLineLayout`, `creoleVisibleText`, `inlineAtomWidth`, `maxLineWidth`, `atomHeightBonus`, `measureTextBlock` | Shared per-line text measurement for the description engine's leaf sizing. |
| `leaf-sizing.ts` | `BoxSizingOpts`, `ComponentStyle`, `ACTOR_HEIGHT`, `ACTOR_WIDTH`, `INTERFACE_CIRCLE_SIZE`, `PORT_SIZE`, `USECASE_HEIGHT`, `measureUsecaseOrActorLeaf`, `measureUsecaseOrActorLeafInk`, `LeafSymbolInk`, `measureLeafNode`, `NoteBodyOpts`, `buildNoteBody`, `measureUsecase` | Leaf-node box sizing for the description diagram engine. |
| `LeafSizingSubject.ts` | `LeafSizingStereotypeSprite`, `LeafSizingSubject` | Structural subject type for the leaf-sizing family (`leaf-sizing*.ts`, this directory) — the exact fields `measureLeafNode` and its callees read off the description engine's leaf-node AST type (`src/diagrams/description/ast.ts:45`), extract |
| `Opale.ts` | `OPALE_CORNERSIZE`, `OPALE_MARGIN_X1`, `OPALE_MARGIN_X2`, `OPALE_MARGIN_Y`, `OpalePoint`, `OpaleBox`, `OpaleConnector`, `opalePolygonLeft`, `opalePolygonRight`, `opaleCorner`, `opalePolygonUp`, `opalePolygonDown`, `OpaleDirection`, `getOpaleStrategy`, `resolveOpaleConnector` | `Opale` — the note shape's own geometry constants (the folded-corner box svek draws for `note`/`note on link`). |
| `RotatedEllipse.ts` | `RotatedEllipse` |  |
| `SmallestEnclosingCircle.ts` | `SmallestEnclosingCircle` |  |
| `YTransformer.ts` | `YTransformer` |  |

## `src/core/text/`

| Module | Exports | Purpose |
|---|---|---|
| `BackSlash.ts` | `BackSlash` | BackSlash — line-separator/escape constants and the `\n` hide/reveal-via-private-use-block round trip `preproc/Define.java` uses to protect a literal `\n` inside a `!define` macro body from the preprocessor's own line splitting. |
| `Guillemet.ts` | `GuillemetPair`, `GUILLEMET_DEFAULT`, `manageGuillemet` | `Guillemet` — the `<<x>>` -> `«x»` display-text substitution. |

## `src/core/tim/`

| Module | Exports | Purpose |
|---|---|---|
| `DiagramExtractor.ts` | `extractDiagram` | `!include file.puml` where the included file is itself a full `@startuml ... |
| `Eater.ts` | `Eater` | Character-cursor base class for every TIM directive parser (`!procedure`, `!function`, `!if`, `!foreach`, ...). |
| `EaterAffectation.ts` | `EaterAffectation` | `!$var = <expr>` (and `!local`/`!global $var = <expr>`, `!$var ?= <expr>` conditional assignment). |
| `EaterAffectationDefine.ts` | `EaterAffectationDefine` | `!define $var <rest of line>` -- a simple-form global assignment whose value is the rest of the line after functions/variables are applied (distinct from `EaterLegacyDefine`'s multi-arg `!define name(args) body` form). |
| `EaterAssert.ts` | `EaterAssert` | `!assert <expr>` (optionally `: <message>`). |
| `EaterDeclareProcedure.ts` | `EaterDeclareProcedure` | `!procedure` / `!unquoted procedure` / `!final procedure` declaration header line. |
| `EaterDeclareReturnFunction.ts` | `EaterDeclareReturnFunction` | `!function` / `!unquoted function` / `!final function` declaration header line (optionally with the `return <expr>` single-line shorthand). |
| `EaterDumpMemory.ts` | `EaterDumpMemory` | `!dump_memory` diagnostic directive. |
| `EaterElseIf.ts` | `EaterElseIf` | `!elseif <expr>`. |
| `EaterException.ts` | `EaterException` | @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/EaterException.java |
| `EaterForeach.ts` | `size`, `EaterForeach` | `!foreach $var in <expr>`. |
| `EaterFunctionCall.ts` | `EaterFunctionCall` | A call site -- `name(arg1, arg2, ...)` -- found inline in a source line by `TContext#applyFunctionsAndVariables`. |
| `EaterIf.ts` | `EaterIf` | `!if <expr>`. |
| `EaterIfdef.ts` | `EaterIfdef` | `!ifdef <boolean expr over variable/function names>`. |
| `EaterIfndef.ts` | `EaterIfndef` | `!ifndef <varname>`. |
| `EaterImport.ts` | `EaterImport` | `!import <path>`. |
| `EaterInclude.ts` | `PreprocessorIncludeStrategy`, `EaterInclude` | `!include` / `!include_once` / `!include_many` / `!includeurl <path>`. |
| `EaterIncludeDef.ts` | `EaterIncludeDef` | `!includedef <path>`. |
| `EaterIncludeSprites.ts` | `EaterIncludeSprites` | `!include_sprites <path>`. |
| `EaterIncludesub.ts` | `EaterIncludesub` | `!includesub <name>`. |
| `EaterLegacyDefine.ts` | `EaterLegacyDefine` | Legacy `!define name(args) <body>` (single line, unquoted, macro-style substitution) -- distinct from `EaterAffectationDefine`'s `!define $var <rest of line>` simple form. |
| `EaterLegacyDefineLong.ts` | `EaterLegacyDefineLong` | Legacy `!definelong name(args)` / `!enddefinelong` (multi-line macro-style substitution). |
| `EaterLog.ts` | `EaterLog` | `!log <text>` diagnostic directive. |
| `EaterOption.ts` | `OptionKey`, `optionKeyDefaultValue`, `EaterOption` | `!option <key> [<value>]`. |
| `EaterReturn.ts` | `EaterReturn` | `!return <expr>`. |
| `EaterStartsub.ts` | `EaterStartsub` | `!startsub <name>`. |
| `EaterTheme.ts` | `EaterTheme` | `!theme <name>` (optionally `from <path>`). |
| `EaterUndef.ts` | `EaterUndef` | `!undef <varname>`. |
| `EaterWhile.ts` | `EaterWhile` | `!while <expr>`. |
| `FunctionsSet.ts` | `FunctionsSet` | The TIM function registry: every builtin, every `!procedure` / `!function` / legacy `!define` / `!definelong`, plus the pending-function state machine the `CodeIterator*` chain drives while collecting a multi-line body. |
| `IncludeExecutor.ts` | `IncludeExecutor` | `TContext#executeInclude` / `#executeIncludesub` / `#executeIncludeDef` / `#executeImport` -- the four directives that reach OUTSIDE the source being interpreted. |
| `IncludeStore.ts` | `IncludeStore`, `stdlibPathOf`, `stdlibBundleOf`, `MapIncludeStore`, `EMPTY_INCLUDE_STORE`, `IncludeError`, `IncludeNotFoundError`, `StdlibNotBundledError` | The sync include seam. |
| `index.ts` | `LineLocation`, `TLineType`, `StringLocated`, `EaterException`, `TMode`, `TVariableScope`, `lazzyParse`, `TFunctionType`, `isLegacyTFunctionType`, `TFunctionArgument`, `TFunctionSignature`, `Trie`, `TrieImpl`, `ExecutionContexts`, `ExecutionContextIf`, `ExecutionContextWhile`, `ExecutionContextForeach`, `TMemory`, `TMemoryGlobal`, `TMemoryLocal`, `TContext`, `TFunction`, `TWarning`, `TPreprocessingOptionStore`, `TPreprocessingArtifact`, `TFunctionImpl`, `FunctionsSet`, `PreprocessingArtifact`, `TContextImpl`, `PlainLineFilter`, `TContextOptions`, `getFromLineInternal`, `EaterDeclareProcedure`, `EaterFunctionCall`, `Eater`, `StringEater`, `VariableManager`, `EaterAffectation`, `EaterAffectationDefine`, `EaterAssert`, `EaterDeclareReturnFunction`, `EaterDumpMemory`, `EaterElseIf`, `EaterForeach`, `eaterForeachSize`, `EaterIf`, `EaterIfdef`, `EaterIfndef`, `EaterImport`, `EaterInclude`, `PreprocessorIncludeStrategy`, `EaterIncludeDef`, `EaterIncludeSprites`, `EaterIncludesub`, `EaterLegacyDefine`, `EaterLegacyDefineLong`, `EaterLog`, `EaterOption`, `OptionKey`, `optionKeyDefaultValue`, `EaterReturn`, `EaterStartsub`, `EaterTheme`, `EaterUndef`, `EaterWhile`, `* from ./iterator/index.js` | Barrel for `tim/`'s memory / scoping / function model (SI5a batch 2a) and the `CodeIterator` chain + `Eater*` directive parsers (SI5a batch 2b). |
| `LineLocation.ts` | `LineLocation` | Where a line of source came from: its 0-based position, the resource that produced it, and — for a line pulled in by `!include` — the location of the `!include` line that pulled it. |
| `LineLocationImpl.ts` | `LineLocationImpl` | The only `LineLocation` implementation, exactly as upstream: an immutable `(description, parent, position)` triple whose `oneLineRead()` returns the NEXT position rather than mutating. |
| `PreprocessingArtifact.ts` | `PreprocessingArtifact` | `PreprocessingArtifact` + `ConfigurationStore<OptionKey>` -- the two `net.sourceforge.plantuml.preproc` types `EaterOption` (`!option`) needs. |
| `ReadFilterMergeLines.ts` | `mergeEndingBackslashLines` | Trailing-`\` line continuation: a source line ending in a bare `\` merges with the NEXT physical line, before `@start`/`@end` block splitting or command dispatch sees the document. |
| `ReadLineReader.ts` | `SOURCE_STRING_DESCRIPTION`, `readLines` | Raw text -> the `StringLocated` list the interpreter executes. |
| `StartUtils.ts` | `isStartDirective`, `isEndDirective`, `isPauseDirective`, `isUnpauseDirective`, `isExit`, `possibleAppend` | The two directive probes `DiagramExtractor` needs: is this line a `@start...` / `@end...` (or the backslash spelling, `\startuml`)? |
| `stdlib-path.ts` | `StdlibPathParts`, `splitStdlibPath` | `Stdlib.java`'s stdlib-path key transform, in one place. |
| `StdlibRegistry.ts` | `StdlibChunkLoadError`, `StdlibRegistry`, `stdlibRegistry` | Lazy, per-bundle registration for the `<bundle/thing>` stdlib seam. |
| `StdlibRemote.ts` | `StdlibRemoteManifest`, `RemoteBundle`, `StdlibResourceFetchError`, `remoteStdlib` | Per-RESOURCE, fetch-backed stdlib bundle source (si11a T1). |
| `StdlibStore.ts` | `BundleData`, `StdlibStore`, `stdlibStore`, `withStdlib` | The `<bundle/thing>` stdlib resolution seam. |
| `StringEater.ts` | `StringEater` | A throwaway `Eater` used only to feed a bare string through the shared `Eater` character-cursor primitives (`eatAndGetQuotedString`, etc.) without a real source-line context. |
| `StringLocated.ts` | `LineLocation`, `TLineType`, `StringLocated` | Minimal port of the surface this batch's write-set (`tim/` memory, function, and `Eater` primitives) actually calls on `net.sourceforge.plantuml.text.StringLocated` and `net.sourceforge.plantuml.utils.LineLocation`. |
| `TContext.ts` | `PlainLineFilter`, `TContextOptions`, `TContext` | The TIM interpreter: owns the function registry (`FunctionsSet`), builds the `CodeIterator` decorator chain, executes one line at a time, and performs inline `$variable` / `%function()` substitution. |
| `TContextOptions.ts` | `PlainLineFilter`, `TContextOptions` | Construction-time seams for {@link TContext}. |
| `TContextSubstitution.ts` | `TContextSubstitutionHost`, `applyFunctionsAndVariablesImpl`, `getFunctionNameAt` | The inline `%function(...)` / `$variable` substitution engine used by `TContext#applyFunctionsAndVariables`. |
| `TFunction.ts` | `TWarning`, `TPreprocessingOptionStore`, `TPreprocessingArtifact`, `TContext`, `TFunction` | @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/TFunction.java |
| `TFunctionArgument.ts` | `TFunctionArgument` | @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/TFunctionArgument.java |
| `TFunctionImpl.ts` | `TFunctionImpl` | @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/TFunctionImpl.java |
| `TFunctionSignature.ts` | `TFunctionSignature` | @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/TFunctionSignature.java |
| `TFunctionType.ts` | `TFunctionType`, `isLegacyTFunctionType` | @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/TFunctionType.java |
| `TLineType.ts` | `getFromLineInternal`, `isQuote`, `isLatinDigit`, `isLetterOrEmojiOrUnderscoreOrDigit` | The `TLineType` CLASSIFIER -- the regex cascade that decides which TIM directive (if any) a raw source line is. |
| `TMemory.ts` | `ExecutionContextIf`, `ExecutionContextWhile`, `ExecutionContextForeach`, `ExecutionContexts`, `TMemory` | The TIM variable-scoping contract (`TMemory`) plus the shared execution- context stack (`ExecutionContexts`) that both `TMemoryGlobal` and `TMemoryLocal` extend, plus the three `!if` / `!while` / `!foreach` execution-context value classes t |
| `TMemoryGlobal.ts` | `TMemoryGlobal` | @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/TMemoryGlobal.java |
| `TMemoryLocal.ts` | `TMemoryLocal` | @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/TMemoryLocal.java |
| `TMode.ts` | `TMode` | Empty marker class, ported verbatim. |
| `Trie.ts` | `Trie` | @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/Trie.java |
| `TrieImpl.ts` | `TrieImpl` | A character trie used to find the longest declared variable/function name starting at a given position in a source line (`$` sigils and all) -- the "longest match" lookup that lets `!$foo` and `!$foobar` coexist without one shadowing the ot |
| `TVariableScope.ts` | `TVariableScope`, `lazzyParse` | @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/TVariableScope.java |
| `VariableManager.ts` | `VariableManager` | Resolves `$varname` references inline within a source line, including JSON field/index-access suffixes (`$obj.field`, `$arr[0]`). |

## `src/core/tim/builtin/`

| Module | Exports | Purpose |
|---|---|---|
| `AlwaysFalse.ts` | `AlwaysFalse` | `%false()` -- always `false`. |
| `AlwaysTrue.ts` | `AlwaysTrue` | `%true()` -- always `true`. |
| `Backslash.ts` | `Backslash` | `%backslash()` -- returns the private-use "real backslash" sentinel, decoded by the Creole/Display layer later (out of this port's scope). |
| `BoolVal.ts` | `BoolVal` | `%boolval(s)` -- parses `s` (case-insensitive `"true"`/`"1"` or `"false"`/`"0"`) as a boolean, throwing on any other value. |
| `Breakline.ts` | `Breakline` | `%breakline()` -- returns the private-use "breakline" sentinel (distinct from `%newline()`'s sentinel -- see `Jaws#splitLine`, out of this port's scope, for how the two differ downstream). |
| `CallUserFunction.ts` | `CallUserFunction` | `%call_user_func(name, arg1, ...)` -- computes a function name at runtime and dispatches to it as a RETURN function (looked up by signature via `TContext#getFunctionSmart`, unlike `%invoke_procedure`'s name+arity lookup through `FunctionsSe |
| `Chr.ts` | `Chr` | `%chr(codePoint)` -- code point to character. |
| `color-utils.ts` | `RgbColor`, `NoSuchColorError`, `parseColorString`, `requireColor`, `colorToString`, `Hsl`, `rgbToHsl`, `hslToRgb`, `lighten`, `darken`, `grayScale`, `isDark`, `reverseRgb`, `reverseHsluv` | Minimal color-math helpers for the seven color builtins (`Darken`, `Lighten`, `HslColor`, `IsDark`, `IsLight`, `ReverseColor`, `ReverseHsluvColor`). |
| `context-ext.ts` | `WithGetFunctionSmart`, `WithXargs`, `WithResultList` | Local, widened structural extensions of `TContext` (`../TFunction.js`) for the handful of builtins that need one additional lookup upstream's real (36KB) `net.sourceforge.plantuml.tim.TContext` carries but the shared narrow stand-in omits p |
| `Darken.ts` | `Darken` | `%darken(color, ratio)` -- reduces `color`'s HSL luminance by `ratio` percent (relative, not absolute). |
| `date-format.ts` | `formatDate` | A disclosed subset of Java's `SimpleDateFormat` pattern language, used only by `DateFunction` (`%date`). |
| `DateFunction.ts` | `DateFunction` | `%date([pattern[, epochSeconds[, timeZoneId]]])` -- formats a date/time. |
| `Dec2hex.ts` | `Dec2hex` | `%dec2hex(n)` -- decimal to hex string. |
| `Dirpath.ts` | `Dirpath` | `%dirpath()` -- the source file's directory path, resolved once at construction from the injected {@link TimEnvironment} (matching upstream's constructor-injected `Defines#getEnvironmentValue("dirpath")`). |
| `Dollar.ts` | `Dollar` | `%dollar()` -- returns a literal `$`. |
| `Eval.ts` | `Eval` | `%eval(expr)` -- evaluates `expr` as a TIM expression and coerces the result to an integer. |
| `Feature.ts` | `Feature` | `%feature(name)` -- feature-flag probe. |
| `Filedate.ts` | `Filedate` | `%filedate()` -- the source file's modification date, resolved once at construction from the injected {@link TimEnvironment}. |
| `FileExists.ts` | `FileExists` | `%file_exists(path)` -- filesystem probe, routed through the injected {@link TimEnvironment} (never real `fs` access -- see that file's header). |
| `Filename.ts` | `Filename` | `%filename()` -- the source file's name, resolved once at construction from the injected {@link TimEnvironment}. |
| `FilenameNoExtension.ts` | `FilenameNoExtension` | `%filename_no_extension()` -- the source file's name without its extension, resolved once at construction from the injected {@link TimEnvironment}. |
| `FunctionExists.ts` | `FunctionExists` | `%function_exists(name)` -- true iff a function/procedure named `name` is registered. |
| `GetAllStdlib.ts` | `GetAllStdlib` | `%get_all_stdlib()` -- JSON array of stdlib folder names; with one (ignored-value) argument, a JSON object mapping folder name to `{name, version, source}`. |
| `GetAllTheme.ts` | `GetAllTheme` | `%get_all_theme()` -- JSON array of theme names. |
| `GetCurrentTheme.ts` | `GetCurrentTheme` | `%get_current_theme()` -- JSON object describing the active theme. |
| `Getenv.ts` | `Getenv` | `%getenv(name)` -- OS/process environment access, routed through the injected {@link TimEnvironment} (never real `process.env` access; also skips upstream's `SecurityUtils#canWeReadThisEnvironmentVariable` gate -- a host-level policy concer |
| `GetJsonKey.ts` | `GetJsonKey` | `%get_json_keys(x)` -- for a JSON object, its key names; for a JSON array of objects, the concatenated key names of every member object. |
| `GetJsonType.ts` | `GetJsonType` | `%get_json_type(x)` -- `"string"`/`"number"`/`"not_json"` for a plain `TValue`, else the JSON kind of the wrapped value (`"array"`/`"object"`/ `"boolean"`/`"number"`/`"string"`), falling back to `"json"` for a bare JSON `null`. |
| `GetStdlib.ts` | `GetStdlib` | `%get_stdlib([folderName[, key]])` -- with no arguments, a JSON object mapping every stdlib folder name to its metadata entries; with one, the metadata entries for that folder; with two, a single metadata value (key lookup falls back to the |
| `GetVariableValue.ts` | `GetVariableValue` | `%get_variable_value(name)` -- returns `$name`'s value, or `""` if unbound. |
| `GetVersion.ts` | `GetVersion` | `%version()` -- this build's version string. |
| `Hex2dec.ts` | `Hex2dec` | `%hex2dec(s)` -- hex string to decimal. |
| `HslColor.ts` | `HslColor` | `%hsl_color(h, s, l[, aPercent])` -- builds a color from HSL(+alpha) components and returns its `#RRGGBB`/`#AARRGGBB` string form. |
| `index.ts` | `SimpleReturnFunction`, `CallUserFunction`, `StringFunction`, `Dollar`, `Percent`, `Lower`, `Upper`, `Backslash`, `LeftAlign`, `RightAlign`, `Strlen`, `Tabulation`, `Newline`, `NewlineShort`, `Breakline`, `Chr`, `Ord`, `Substr`, `SplitStr`, `SplitStrRegex`, `Strpos`, `Dec2hex`, `Hex2dec`, `IntVal`, `BoolVal`, `GetVersion`, `Eval`, `AlwaysFalse`, `AlwaysTrue`, `LogicalNot`, `LogicalAnd`, `LogicalOr`, `LogicalXor`, `LogicalNand`, `LogicalNor`, `LogicalNxor`, `Modulo`, `FunctionExists`, `VariableExists`, `GetVariableValue`, `SetVariableValue`, `Feature`, `Xargs`, `Size`, `Str2Json`, `GetJsonType`, `GetJsonKey`, `JsonKeyExists`, `JsonAdd`, `JsonRemove`, `JsonMerge`, `JsonSet`, `LoadJson`, `Darken`, `Lighten`, `IsDark`, `IsLight`, `ReverseColor`, `ReverseHsluvColor`, `HslColor`, `Now`, `DateFunction`, `Dirpath`, `Filedate`, `Filename`, `FilenameNoExtension`, `FileExists`, `Getenv`, `RandomFunction`, `GetAllStdlib`, `GetAllTheme`, `GetCurrentTheme`, `GetStdlib`, `InvokeProcedure`, `RetrieveProcedure`, `createDefaultTimEnvironment`, `TimEnvironment`, `TimClock`, `TimRandomSource`, `StdlibFolderMetadata`, `createStandardFunctions` | Barrel for every ported TIM builtin (`net.sourceforge.plantuml.tim.builtin`) -- all 75 upstream classes (verified via `ls .../tim/builtin/*.java \| wc -l`; the mission brief's "76" is off by one against the actual upstream count). |
| `IntVal.ts` | `IntVal` | `%intval(s)` -- parses `s` as a decimal integer, throwing on failure (unlike `%dec2hex`/`%hex2dec`, which swallow errors). |
| `InvokeProcedure.ts` | `InvokeProcedure` | `%invoke_procedure(nameExpr, arg1, arg2, ...)` -- computes a procedure name at runtime (e.g. |
| `IsDark.ts` | `IsDark` | `%is_dark(color)` -- true iff `color`'s YIQ grayscale is `< 128`. |
| `IsLight.ts` | `IsLight` | `%is_light(color)` -- negation of `%is_dark`. |
| `jaws-constants.ts` | `USE_BLOCK_E1_IN_NEWLINE_FUNCTION`, `BLOCK_E1_NEWLINE`, `BLOCK_E1_NEWLINE_LEFT_ALIGN`, `BLOCK_E1_NEWLINE_RIGHT_ALIGN`, `BLOCK_E1_BREAKLINE`, `BLOCK_E1_REAL_BACKSLASH`, `BLOCK_E1_REAL_TABULATION` | Local, minimal stand-in for the private-use Unicode sentinels `net.sourceforge.plantuml.jaws.Jaws` defines for its Creole/Display-layer newline and escape handling. |
| `json-utils.ts` | `JsonObj`, `isJsonObject`, `isJsonArray`, `deepCloneJson`, `shallowMergeObjects`, `deepMergeObjects` | Shared JSON-value helpers for the JSON builtin family (`GetJsonKey`/`GetJsonType`/`JsonAdd`/`JsonKeyExists`/`JsonMerge`/ `JsonRemove`/`JsonSet`/`LoadJson`/`Str2Json`). |
| `JsonAdd.ts` | `JsonAdd` | `%json_add(x, ...)` -- appends to a JSON array (`json_add(arr, value)`) or adds a member to a JSON object (`json_add(obj, name, value)`), returning the mutated clone. |
| `JsonKeyExists.ts` | `JsonKeyExists` | `%json_key_exists(x, key)` -- true iff `x` is a JSON object containing `key`. |
| `JsonMerge.ts` | `JsonMerge` | `%json_merge(x, y)` -- concatenates two JSON arrays, or shallow-merges two JSON objects (`y`'s keys overwrite `x`'s on collision). |
| `JsonRemove.ts` | `JsonRemove` | `%json_remove(x, key)` -- removes an array index or object key from a clone of `x`. |
| `JsonSet.ts` | `JsonSet` | `%json_set(x, ...)` -- with 2 args, deep-merges `y` into JSON object `x` (`json_set(obj, y)`); with 3 args, sets an array index or object key (`json_set(x, keyOrIndex, value)`). |
| `LeftAlign.ts` | `LeftAlign` | `%left_align()` -- returns the private-use "newline, left-align" sentinel. |
| `Lighten.ts` | `Lighten` | `%lighten(color, ratio)` -- increases `color`'s HSL luminance by `ratio` percent (relative, not absolute). |
| `LoadJson.ts` | `LoadJson` | `%load_json(path[, defaultJson[, charset]])` -- loads JSON from a file, `http(s)://` URL, or (via `<name>`/`>name>` bracket syntax) a stdlib resource, falling back to `defaultJson` (default `"{}"`) when the source is unreachable or empty. |
| `LogicalAnd.ts` | `LogicalAnd` | `%and(x, y, ...)` -- variadic logical AND (`>= 2` args). |
| `LogicalNand.ts` | `LogicalNand` | `%nand(x, y, ...)` -- negated `%and`. |
| `LogicalNor.ts` | `LogicalNor` | `%nor(x, y, ...)` -- negated `%or`. |
| `LogicalNot.ts` | `LogicalNot` | `%not(x)` -- logical negation. |
| `LogicalNxor.ts` | `LogicalNxor` | `%nxor(x, y, ...)` -- negated `%xor`. |
| `LogicalOr.ts` | `LogicalOr` | `%or(x, y, ...)` -- variadic logical OR (`>= 2` args). |
| `LogicalXor.ts` | `LogicalXor` | `%xor(x, y, ...)` -- true iff exactly one argument is true. |
| `Lower.ts` | `Lower` | `%lower(s)` -- lowercases `s`. |
| `Modulo.ts` | `Modulo` | `%mod(dividend, divisor)` -- integer remainder; throws on division by zero. |
| `Newline.ts` | `Newline` | `%newline()` -- line break. |
| `NewlineShort.ts` | `NewlineShort` | `%n()` -- short alias for `%newline()`. |
| `Now.ts` | `Now` | `%now()` -- current Unix time in whole seconds. |
| `Ord.ts` | `Ord` | `%ord(s)` -- character to code point (first character of `s`). |
| `Percent.ts` | `Percent` | `%percent()` -- returns a literal `%`. |
| `RandomFunction.ts` | `RandomFunction` | `%random([max])` / `%random(min, max)` -- random integer, sourced from the injected {@link TimEnvironment} RNG, never `Math.random()`. |
| `RetrieveProcedure.ts` | `RetrieveProcedure` | `%retrieve_procedure(nameExpr, arg1, arg2, ...)` -- same call signature as `%invoke_procedure` (first arg is the target procedure name expression, the rest are its positional arguments), but a RETURN function: it runs the target and CAPTURE |
| `ReverseColor.ts` | `ReverseColor` | `%reverse_color(color)` -- per-channel `255 -` complement. |
| `ReverseHsluvColor.ts` | `ReverseHsluvColor` | `%reverse_hsluv_color(color)` -- HSLuv-space reversal (perceptually more balanced than `%reverse_color`'s flat RGB complement). |
| `RightAlign.ts` | `RightAlign` | `%right_align()` -- returns the private-use "newline, right-align" sentinel. |
| `SetVariableValue.ts` | `SetVariableValue` | `%set_variable_value(name, value)` -- sets `$name` globally, returns `""`. |
| `SimpleReturnFunction.ts` | `SimpleReturnFunction` | @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/builtin/SimpleReturnFunction.java |
| `Size.ts` | `Size` | `%size(x)` -- `0` for a number, string length for a string, element/key count for a JSON array/object. |
| `SplitStr.ts` | `SplitStr` | `%splitstr(s, separatorChars)` -- tokenizes `s` on any character in `separatorChars` (`java.util.StringTokenizer` semantics: consecutive separators produce no empty tokens, leading/trailing separators are dropped), returning a JSON array of |
| `SplitStrRegex.ts` | `SplitStrRegex` | `%splitstr_regex(s, regex)` -- `String#split(regex)` equivalent, returning a JSON array of the parts. |
| `Str2Json.ts` | `Str2Json` | `%str2json(s)` -- parses `s` as JSON. |
| `StringFunction.ts` | `StringFunction` | `%string(x)` -- coerces `x` to its string representation. |
| `Strlen.ts` | `Strlen` | `%strlen(s)` -- string length. |
| `Strpos.ts` | `Strpos` | `%strpos(full, searched)` -- index of `searched` within `full`, or `-1`. |
| `Substr.ts` | `Substr` | `%substr(s, pos[, len])` -- substring from `pos` (0-based), optionally clamped to `len` characters. |
| `Tabulation.ts` | `Tabulation` | `%tab()` -- returns the private-use "real tabulation" sentinel. |
| `TimEnvironment.ts` | `TimClock`, `TimRandomSource`, `StdlibFolderMetadata`, `TimEnvironment`, `createDefaultTimEnvironment` | The injected non-determinism / ambient-I/O seam for TIM builtins. |
| `Upper.ts` | `Upper` | `%upper(s)` -- uppercases `s`. |
| `VariableExists.ts` | `VariableExists` | `%variable_exists(name)` -- true iff `$name` is currently bound. |
| `Xargs.ts` | `Xargs` | `%xargs()` -- returns the `-xarg` command-line-equivalent string bound to this render, or `""` if none was supplied. |

## `src/core/tim/expression/`

| Module | Exports | Purpose |
|---|---|---|
| `Expression.ts` | `Expression` | Upstream is an intentionally empty placeholder class with no fields or methods, and no known callers within `tim/expression/`. |
| `index.ts` | `TValue`, `Token`, `JsonValue`, `TokenType`, `eatOneToken`, `Eater`, `TokenIterator`, `TokenStack`, `TokenOperator`, `COMMERCIAL_MINUS_SIGN`, `ShuntingYard`, `ReversePolishInterpretor`, `EaterException`, `TFunctionSignature`, `Knowledge`, `LineLocation`, `StringLocated`, `TContext`, `TMemory`, `TFunction`, `Expression` | Barrel for the TIM expression evaluator — the engine behind `!if` conditions, `!$var` assignment, `!function` return values, and TIM built-in function calls. |
| `Knowledge.ts` | `EaterException`, `LineLocation`, `StringLocated`, `TMemory`, `TContext`, `TFunction`, `TFunctionSignature`, `Knowledge` | The memory-lookup contract the expression evaluator depends on: resolving a bare identifier to a value, and resolving a call signature to a built-in/user function. |
| `ReversePolishInterpretor.ts` | `ReversePolishInterpretor` | Evaluates a reverse-Polish-notation {@link TokenStack} (the {@link ShuntingYard}'s output queue) to a single {@link TValue}. |
| `ShuntingYard.ts` | `ShuntingYard` | https://en.wikipedia.org/wiki/Shunting-yard_algorithm https://en.cppreference.com/w/c/language/operator_precedence @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/expression/ShuntingYard.java |
| `Token.ts` | `JsonValue`, `Token` | A lexical token produced by `TokenType.eatOneToken` and consumed by `ShuntingYard` / `ReversePolishInterpretor`. |
| `TokenIterator.ts` | `TokenIterator` | @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/expression/TokenIterator.java Both `nextToken` and `peekToken` are typed nullable, matching the Java method signatures exactly (Java's type system does not distinguish nullable |
| `TokenOperator.ts` | `COMMERCIAL_MINUS_SIGN`, `TokenOperator` | Binary infix operators recognized by the TIM expression grammar, each carrying its C-style operator precedence and its {@link TValue} evaluation behavior. |
| `TokenStack.ts` | `TokenStack` | An ordered, mutable list of {@link Token}s — the tokenizer's output, the shunting-yard's output queue, and the input to {@link ReversePolishInterpretor}. |
| `TokenType.ts` | `TokenType`, `Eater`, `eatOneToken` | The lexical categories the TIM expression tokenizer (`eatOneToken`) produces, plus the tokenizer itself. |
| `TValue.ts` | `TValue` | The typed value that flows through the TIM expression evaluator: a mutually-exclusive union of int / string / JSON, mirroring upstream's three-field-but-only-one-set representation. |

## `src/core/tim/iterator/`

| Module | Exports | Purpose |
|---|---|---|
| `AbstractCodeIterator.ts` | `AbstractCodeIterator` | Base for every directive-decorator `CodeIterator`: forwards `next()`, `getCodePosition()`, and `jumpToCodePosition()` straight through to the wrapped `source`, leaving only `peek()` for subclasses to override. |
| `buildCodeIterator.ts` | `CodeIteratorChainDeps`, `buildCodeIterator` | `TContext#buildCodeIterator` -- the `CodeIterator` decorator chain, in upstream's exact order. |
| `CodeIterator.ts` | `CodeIterator` | Pull-based line iterator over TIM source. |
| `CodeIteratorAffectation.ts` | `CodeIteratorAffectation` | Interprets `!$var = <expr>` (and `!local`/`!global`/`?=` variants): delegates to `EaterAffectation`, with a multi-line-JSON-literal retry loop -- `!$x = { ... |
| `CodeIteratorForeach.ts` | `CodeIteratorForeach` | Interprets `!foreach $var in <expr>` / `!endforeach`: on `!foreach`, evaluates the collection once and stashes an `ExecutionContextForeach`; on `!endforeach`, advances the loop counter and either jumps back to the top (rebinding `$var` to t |
| `CodeIteratorIf.ts` | `CodeIteratorIf` | Interprets `!if` / `!ifdef` / `!ifndef` / `!elseif` / `!else` / `!endif` inline as it's pulled through: each directive line is consumed and never re-emitted; ordinary lines are skipped (not emitted) while any enclosing `!if` on the stack is |
| `CodeIteratorImpl.ts` | `CodeIteratorImpl` | Base of every `CodeIterator` chain: a flat, pre-split list of `StringLocated` lines with a cursor. |
| `CodeIteratorInnerComment.ts` | `CodeIteratorInnerComment` | Strips `/' ... |
| `CodeIteratorLegacyDefine.ts` | `CodeIteratorLegacyDefine` | Interprets single-line `!define` / opens multi-line `!definelong` (delegating to `FunctionsSet#executeLegacyDefine[Long]`, which internally runs the corresponding `Eater*` and registers the resulting function). |
| `CodeIteratorLongComment.ts` | `CodeIteratorLongComment` | Consumes a `/' ... |
| `CodeIteratorProcedure.ts` | `CodeIteratorProcedure` | Collects a `!procedure` / `!definelong` declaration's multi-line body: while a PROCEDURE or LEGACY_DEFINELONG function is pending, every line up to (not including) `!endprocedure`/`!enddefinelong` is buffered onto it instead of being emitte |
| `CodeIteratorReturnFunction.ts` | `CodeIteratorReturnFunction` | Collects a `!function` declaration's multi-line body, the RETURN_FUNCTION sibling of `CodeIteratorProcedure`. |
| `CodeIteratorShortComment.ts` | `CodeIteratorShortComment` | Consumes single-line `'` comments: a `COMMENT_SIMPLE` line is logged and skipped without being emitted. |
| `CodeIteratorSub.ts` | `CodeIteratorSub` | Interprets `!startsub <name>` / `!endsub`: captures every line between the two markers into a named `Sub` (for later `!includesub` replay, elsewhere) and then, instead of resuming the outer source, replays the captured lines immediately in |
| `CodeIteratorWhile.ts` | `CodeIteratorWhile` | Interprets `!while <expr>` / `!endwhile`: on `!while`, evaluates the condition and stashes an `ExecutionContextWhile`, marking it skip-me if false from the start; on `!endwhile`, re-evaluates the condition and either jumps back to the top o |
| `CodePosition.ts` | `CodePosition` | Opaque bookmark into a `CodeIterator`'s underlying line list, used by `!while` / `!foreach` to jump back to the top of a loop body. |
| `index.ts` | `CodePosition`, `CodeIterator`, `AbstractCodeIterator`, `CodeIteratorImpl`, `Sub`, `buildCodeIterator`, `CodeIteratorChainDeps`, `CodeIteratorIf`, `CodeIteratorForeach`, `CodeIteratorWhile`, `CodeIteratorProcedure`, `CodeIteratorReturnFunction`, `CodeIteratorSub`, `CodeIteratorAffectation`, `CodeIteratorLegacyDefine`, `CodeIteratorInnerComment`, `CodeIteratorLongComment`, `CodeIteratorShortComment` | Barrel for `tim/iterator/` -- the pull-based `CodeIterator` decorator chain, ported in mission SI5a batch 2b. |
| `Sub.ts` | `Sub` | A named `!startsub` / `!endsub` block: the lines captured between the two markers, replayable later via `!includesub`. |

## `src/core/url/`

| Module | Exports | Purpose |
|---|---|---|
| `Check.ts` | `Check` | Check — the url-package junit-mode flag: once `goJunit()` is called, `Url#getCoords` treats an empty visibility box as a hard error instead of silently emitting a degenerate `0,0,0,0` link region. |
| `Url.ts` | `Url`, `eventuallyRemoveStartingAndEndingDoubleQuote` |  |
| `UrlBuilder.ts` | `transform`, `URL_KEY`, `getRegexp`, `UrlBuilder` |  |
| `UrlMode.ts` | `UrlMode` | UrlMode — how `UrlBuilder#getUrl` matches its patterns against the input: `STRICT` requires the whole string to be a `[[...]]` form (`Matcher#matches`), `ANYWHERE` accepts one embedded anywhere in the string (`Matcher#find`). |

## `src/core/utils/`

| Module | Exports | Purpose |
|---|---|---|
| `CharHidder.ts` | `CharHidder` | CharHidder — the '~' tile escape: `~X` (where X is a creole-active character) and `\~` are remapped into the Unicode private-use area (U+E000 + charCode) by {@link CharHidder.hide} so the creole layer never sees them as markup, then restore |
| `SignatureUtils.ts` | `SignatureUtils` | SignatureUtils — hex/MD5/SHA-512 digest helpers upstream shares across `UmlSource`, `klimt/shape/UImageSvg`, `version/Version`, `version/ FutureVersion`, and (license/keygen, out of this port's roadmap) `version/PLSSignature`, `version/Lice |

## `src/core/warning/`

| Module | Exports | Purpose |
|---|---|---|
| `Warning.ts` | `Warning` | Warning — an immutable, possibly multi-line diagnostic message with value equality (two `Warning`s built from the same lines are equal), matching upstream's `equals`/`hashCode` override. |
| `WarningHandler.ts` | `WarningHandler` |  |

## `src/diagrams/activity/`

| Module | Exports | Purpose |
|---|---|---|
| `activity-layout-constants.ts` | `NODE_MARGIN_Y`, `NODE_MARGIN_X`, `START_STOP_RADIUS`, `CONNECTOR_SPOT_RADIUS`, `STOP_OUTER_RADIUS`, `ACTION_HEIGHT`, `ACTION_H_PAD`, `NOTE_FOLD`, `NOTE_SIDE_GAP`, `BAR_HEIGHT`, `SWIMLANE_HEADER_H`, `SWIMLANE_MIN_WIDTH`, `DEFAULT_WIDTH`, `LAYOUT_MARGIN`, `BACK_EDGE_MARGIN`, `DIAMOND_MIN`, `DIAMOND_LABEL_PAD` | Layout constants for the activity diagram layout engine (see `layout.old.ts`). |
| `activity-layout-fork.ts` | `layoutFork`, `layoutSplit` | Fork/split (parallel-branch) layout for the activity diagram layout engine (see `layout.old.ts`). |
| `activity-layout-helpers.ts` | `nextId`, `diamondSize`, `repeatCondSize`, `actionSize`, `parallelogramSize`, `noteSize`, `orthogonalPoints`, `nodeCenterX` | Small geometry/measurement helpers shared across the activity diagram layout engine (see `layout.old.ts`). |
| `activity-layout-if.ts` | `layoutIf` | If/else-if/else layout for the activity diagram layout engine (see `layout.old.ts`). |
| `activity-layout-leaf.ts` | `LayoutActionParams`, `layoutStart`, `layoutStop`, `layoutAction`, `layoutBreak` | Leaf-node layouts (start/stop/end/kill/action/break) for the activity diagram layout engine (see `layout.old.ts`). |
| `activity-layout-measure.ts` | `measureNodeWidth`, `measureSubtreeWidth` | Subtree-width measurement for the activity diagram layout engine. |
| `activity-layout-repeat.ts` | `layoutRepeat` | Repeat-loop layout for the activity diagram layout engine (see `layout.old.ts`). |
| `activity-layout-sequence.ts` | `layoutSequence` | Sequential node-list layout and per-node dispatch for the activity diagram layout engine (see `layout.old.ts`). |
| `activity-layout-swimlane.ts` | `buildSwimlaneCtx`, `buildSwimlaneGeos` | Swimlane context setup for the activity diagram layout engine (see `layout.old.ts`). |
| `activity-layout-types.ts` | `ActivityNodeGeo`, `ActivityEdgeGeo`, `SwimlaneGeo`, `ActivityGeometry`, `BranchResult`, `BranchResultInternal`, `LayoutSequenceFn`, `LayoutCtx` | Shared geometry, context, and result types for the activity diagram layout engine (see `layout.old.ts`). |
| `activity-layout-while.ts` | `layoutWhile` | While-loop layout for the activity diagram layout engine (see `layout.old.ts`). |
| `activity-renderer-shapes.ts` | `renderLabel`, `renderMultilineText`, `ActivityColors`, `actColors`, `renderStart`, `renderStop`, `renderEnd`, `renderAction`, `renderBar`, `renderDiamond`, `renderSignalLabel`, `renderChevronLeft`, `renderChevronRight`, `renderHexagon`, `renderParallelogram`, `renderNote`, `renderNode` | Activity node-shape rendering: per-shape SVG emitters (start/stop/end, action, bar, diamond, chevrons, hexagon, parallelogram, note) plus the renderNode dispatcher and shared label/color helpers. |
| `ast.ts` | `ActivityAction`, `ActivityStart`, `ActivityStop`, `ActivityEnd`, `ActivityKill`, `ActivityDetach`, `ActivityBreak`, `ActivityArrowLabel`, `ActivityElseIf`, `ActivityIf`, `ActivityWhile`, `ActivityRepeat`, `ActivityFork`, `ActivitySplit`, `ActivityNote`, `ActivityNode`, `ActivityDiagramAST` | AST type definitions for PlantUML activity diagrams (new syntax). |
| `dispatch-support.ts` | `RE_SWIMLANE`, `RE_ACTION`, `RE_ACTION_CLOSE`, `RE_IF`, `RE_ELSEIF`, `RE_ELSE`, `RE_WHILE`, `RE_ENDWHILE`, `RE_REPEATWHILE`, `RE_NOTE_SINGLE`, `RE_NOTE_MULTI`, `RE_ARROW_LABEL`, `RE_REPEAT_HEAD`, `RE_REPEAT_INLINE_TERMINATOR`, `RE_ESCAPED_NEWLINE`, `StopKeywords`, `matchesStopKeyword`, `ParseContext`, `setCurrentSwimlane`, `swimlaneSpread`, `ParseResult`, `ParseOutcome`, `isRefusal`, `DispatchResult`, `LineHandler` | Shared regex constants, stop-keyword matching, and the mutable parse context/result shapes for the activity diagram recursive-descent parser. |
| `if-dispatch.ts` | `tryIf` | `if / elseif / else / endif` dispatch for the activity diagram parser. |
| `index.ts` | `activityPlugin` | Activity diagram plugin — wires together parser, layout, and renderer for use with the DiagramRegistry dispatcher. |
| `layout.old.ts` | `ActivityNodeGeo`, `ActivityEdgeGeo`, `SwimlaneGeo`, `ActivityGeometry`, `ActivityArrowLabel`, `layoutActivity` | Activity diagram layout engine. |
| `node-dispatch.ts` | `parseNodes` | Core recursive-descent line dispatch (mission G0b/T6: split out of parser.ts to stay under the 500-line file cap; behavior change limited to the annotation-matcher wiring in `tryAnnotation` below). |
| `parser.ts` | `parseActivity` | Parser for PlantUML activity diagrams (new syntax). |
| `renderer.ts` | `renderActivity` | Activity diagram SVG renderer. |

## `src/diagrams/activity/layout/`

| Module | Exports | Purpose |
|---|---|---|
| `swimlane-context.ts` | `SwimlaneContext`, `buildSwimlaneContexts` |  |
| `tile-coordinates.ts` | `LAYOUT_MARGIN`, `assignCoordinates` |  |
| `tile-layout.ts` | `ActivityGeometry`, `ActivityNodeGeo`, `ActivityEdgeGeo`, `SwimlaneGeo`, `layoutActivity` |  |

## `src/diagrams/activity/routing/`

| Module | Exports | Purpose |
|---|---|---|
| `gconnection-down-then-up.ts` | `GConnectionDownThenUp` |  |
| `gconnection-horizontal.ts` | `GConnectionHorizontal` |  |
| `gconnection-side-then-vertical-then-side.ts` | `GConnectionSideThenVerticalThenSide` |  |
| `gconnection-vertical-down-then-back.ts` | `GConnectionVerticalDownThenBack` |  |
| `gconnection-vertical-down.ts` | `GConnectionVerticalDown` |  |
| `gconnection.ts` | `GConnection` |  |
| `index.ts` | `GConnection`, `GConnectionVerticalDown`, `GConnectionHorizontal`, `GConnectionVerticalDownThenBack`, `GConnectionDownThenUp`, `GConnectionSideThenVerticalThenSide` |  |

## `src/diagrams/activity/tiles/`

| Module | Exports | Purpose |
|---|---|---|
| `gtile-action.ts` | `GtileAction` |  |
| `gtile-break.ts` | `GtileBreak` |  |
| `gtile-diamond.ts` | `GtileDiamond` |  |
| `gtile-end.ts` | `GtileEnd` |  |
| `gtile-fork.ts` | `GtileFork` |  |
| `gtile-group.ts` | `GtileGroup` |  |
| `gtile-if.ts` | `GtileIf` |  |
| `gtile-kill.ts` | `GtileKill` |  |
| `gtile-label.ts` | `GtileLabel` |  |
| `gtile-note.ts` | `GtileNote` |  |
| `gtile-partition.ts` | `GtilePartition` |  |
| `gtile-repeat.ts` | `GtileRepeat` |  |
| `gtile-split.ts` | `GtileSplit` |  |
| `gtile-spot.ts` | `GtileSpot` |  |
| `gtile-start.ts` | `GtileStart` |  |
| `gtile-stop.ts` | `GtileStop` |  |
| `gtile-switch.ts` | `GtileSwitch` |  |
| `gtile-top-down.ts` | `GtileTopDown` |  |
| `gtile-while.ts` | `GtileWhile` |  |
| `index.ts` | `GPoint`, `HookName`, `NORTH_HOOK`, `SOUTH_HOOK`, `EAST_HOOK`, `WEST_HOOK`, `NORTH_BORDER`, `SOUTH_BORDER`, `gpoint`, `StringBounder`, `Tile`, `TileLeaf`, `TileComposite` |  |
| `points.ts` | `GPoint`, `NORTH_HOOK`, `SOUTH_HOOK`, `EAST_HOOK`, `WEST_HOOK`, `NORTH_BORDER`, `SOUTH_BORDER`, `HookName`, `gpoint` |  |
| `tile.ts` | `StringBounder`, `Tile`, `TileLeaf`, `TileComposite` |  |

## `src/diagrams/board/`

| Module | Exports | Purpose |
|---|---|---|
| `ast.ts` | `BoardNode`, `BoardActivity`, `BoardDiagramAST`, `CardGeometry`, `ActivityGeometry`, `BoardGeometry` |  |
| `index.ts` | `boardPlugin` |  |
| `layout.ts` | `layoutBoard` |  |
| `parser.ts` | `parseBoard` |  |
| `renderer.ts` | `renderBoard` |  |

## `src/diagrams/chart/`

| Module | Exports | Purpose |
|---|---|---|
| `ast.ts` | `SeriesType`, `MarkerShape`, `LegendPosition`, `GridMode`, `StackMode`, `Orientation`, `LabelPosition`, `ChartAxisDef`, `ChartSeriesDef`, `ChartAnnotationDef`, `ChartDiagramAST` |  |
| `chart-layout-axes.ts` | `buildCategoricalTicks`, `buildNumericTicks`, `buildVAxisGeometry`, `buildHAxisGeometry` | Chart axis geometry: categorical + numeric tick construction and the vertical/horizontal axis geometry builders. |
| `chart-layout-core.ts` | `CHART_MARGIN`, `TITLE_SPACE`, `LEGEND_MARGIN`, `LEGEND_SYMBOL_SIZE`, `LEGEND_TEXT_SPACING`, `LEGEND_ITEM_SPACING`, `X_AXIS_TITLE_EXTRA`, `BAR_WIDTH_RATIO`, `MIN_PLOT_WIDTH`, `PLOT_HEIGHT`, `AXIS_LABEL_SPACE`, `PlotArea`, `TickMark`, `AxisGeometry`, `BarRect`, `DataPoint`, `BarSeriesGeo`, `LineSeriesGeo`, `AreaSeriesGeo`, `ScatterSeriesGeo`, `SeriesGeo`, `LegendEntry`, `LegendGeometry`, `AnnotationGeometry`, `ChartGeometry`, `PointContext`, `BarSpec`, `LegendSpec`, `AreaBaselineSpec`, `valueToPixel`, `formatAxisValue`, `resolveColor` | Chart layout core vocabulary: plot-area / axis / series / legend geometry interfaces plus the shared value->pixel, axis-value formatting, and series color helpers. |
| `chart-layout-series.ts` | `buildLegendGeometry`, `buildBarRectsGrouped`, `buildBarRectsStacked`, `buildBarRectsHorizontal`, `buildDataPoints`, `buildAreaBaseline` | Chart series geometry: legend layout plus grouped/stacked/horizontal bar rects, scatter/line data points, and area baselines. |
| `chart-renderer-axes.ts` | `TICK_SIZE`, `TICK_LABEL_FONT_SIZE`, `AXIS_TITLE_FONT_SIZE`, `drawHorizontalGridLines`, `drawVerticalGridLines`, `drawHAxis`, `drawVAxis` | Chart axis rendering: grid lines + horizontal/vertical axis drawing (ticks, tick labels, axis titles). |
| `index.ts` | `chartPlugin` |  |
| `layout.ts` | `PlotArea`, `TickMark`, `AxisGeometry`, `BarRect`, `DataPoint`, `BarSeriesGeo`, `LineSeriesGeo`, `AreaSeriesGeo`, `ScatterSeriesGeo`, `SeriesGeo`, `LegendEntry`, `LegendGeometry`, `AnnotationGeometry`, `ChartGeometry`, `layoutChart` | layoutChart() — pixel geometry for chart diagrams. |
| `line-handlers.ts` | `tryV2Axis`, `tryVAxis`, `tryHAxis`, `tryGrid`, `tryBar`, `tryLine`, `tryArea`, `tryScatter`, `tryChartLegend`, `tryStackMode`, `tryOrientation`, `tryChartAnnotation` | Per-line-shape handlers for the chart diagram parser's dispatch chain. |
| `parse-helpers.ts` | `resolveSeriesColor`, `extractStyleMap`, `colorFromStereo`, `markerShapeFromStereo`, `markerSizeFromStereo`, `RE_HAXIS`, `RE_VAXIS`, `RE_V2AXIS`, `RE_BAR`, `RE_LINE`, `RE_AREA`, `RE_SCATTER`, `RE_LEGEND`, `RE_STACKMODE`, `RE_ORIENTATION`, `RE_ANNOTATION`, `RE_GRID`, `makeAxis`, `includeValue`, `parseLabels`, `parseCustomTicks`, `parseCoordinatePairs`, `parseYValues`, `stereoToMarker`, `addSeries` | Shared regex constants, style/color/marker resolution, and per-series parsing helpers for the chart diagram parser. |
| `parser.ts` | `parseChart` | Parser for PlantUML chart diagrams (@startchart / @endchart). |
| `renderer.ts` | `renderChart` | renderChart() — SVG orchestrator for chart diagrams. |

## `src/diagrams/chart/renderers/`

| Module | Exports | Purpose |
|---|---|---|
| `area.ts` | `drawArea` | AreaRenderer — draws an area chart series as an SVG fragment. |
| `bar.ts` | `drawBar` | BarRenderer — SVG fragment generator for bar chart series. |
| `line.ts` | `drawLine` | LineRenderer — draws a line chart series as an SVG fragment. |
| `scatter.ts` | `drawScatter` | ScatterRenderer — draws a scatter chart series as an SVG fragment. |

## `src/diagrams/chronology/`

| Module | Exports | Purpose |
|---|---|---|
| `ast.ts` | `ChronologyEvent`, `ChronologyDiagramAST`, `EventGeometry`, `DayTick`, `ChronologyGeometry` |  |
| `index.ts` | `chronologyPlugin` |  |
| `layout.ts` | `layoutChronology` |  |
| `parser.ts` | `parseChronology` |  |
| `renderer.ts` | `renderChronology` |  |

## `src/diagrams/class/`

| Module | Exports | Purpose |
|---|---|---|
| `ast.ts` | `Member`, `Visibility`, `UrlInfo`, `MAP_POINT_SENTINEL`, `MapRow`, `JsonNode`, `ClassifierKind`, `Classifier`, `RelationshipType`, `LinkDecor`, `Relationship`, `NotePosition`, `ClassNote`, `Namespace`, `HideTarget`, `HideShowDirective`, `HideStereotypeDirective`, `RemoveRestoreDirective`, `HideShowPatternDirective`, `HideShowEntityDirective`, `HideShowKindDirective`, `HideShowVisibilityDirective`, `ClassDiagramAST` | AST type definitions for PlantUML class diagrams. |
| `class-arrow-grammar.ts` | `ArrowInfo`, `ARROW_DIR`, `ARROW_STYLE`, `arrowLength`, `resolveArrow`, `parseArrowDecors`, `parseArrowDecorsRaw`, `extractArrowStyleRaw`, `ArrowStyleOverrides`, `parseArrowStyleOverrides` | Arrow-token decoration/type resolution for PlantUML class-diagram relationships. |
| `class-assoc-couple.ts` | `ASSOC_COUPLE_RE`, `ASSOC_DOUBLE_COUPLE_RE`, `AssocCoupleCounter`, `applyAssocCouple`, `applyDoubleCouple` | Association-class couple: `(A,B) .. |
| `class-assoc-subsume.ts` | `SubsumedLink`, `EMPTY_SUBSUMED`, `subsumeExplicitAssociation` | class-assoc-subsume.ts — the "subsume an explicit A-B association into a couple" mechanism (`Association#createNew`'s `existingLink`/`removeLink` lookup), split out of `class-assoc-couple.ts` to keep that file under the project's 500-line c |
| `class-badge-sized-glyphs.ts` | `lookupSizedGlyph` | G2 N38: per-`circledCharacterFontSize` badge glyph captures. |
| `class-badge.ts` | `BADGE_RADIUS`, `BADGE_LEFT_MARGIN`, `NAME_MARGIN_TOTAL`, `NAME_LEFT_MARGIN`, `BADGE_BOX_WIDTH`, `BADGE_BOX_HEIGHT`, `DEFAULT_CIRCLED_CHARACTER_FONT_SIZE`, `resolveBadgeRadius`, `badgeBoxWidth`, `badgeBoxHeight`, `computeHeaderSlack`, `hasBadge`, `badgeFill`, `resolveBadgeFill`, `resolveBadgeBorder`, `resolveBadgeGlyphColor`, `spotSnameForKind`, `badgeLetter`, `badgeGlyphPath`, `resolveBadgeLetter` | EntityImageClassHeader kind-badge geometry + glyph data (G2/N3). |
| `class-body-blank-filter.ts` | `filterPendingBodyBlanks` | Close-time blank-member filtering for a classic (class/interface/enum/...) body, split out of parser.ts purely to keep that file within the repo's 500-line hook cap -- pure move, no behavior change (same precedent as class-line-merge.ts's o |
| `class-body-enhanced-geometry.ts` | `ELEMENT_DEFAULT_LINE_THICKNESS`, `BODY_ENHANCED_MARGIN_X`, `DecorateHeightOffsets`, `ClassifierBodyGeometry`, `memberLineCount` | class-body-enhanced-geometry.ts — ADR-7's "one owner" bridge: derives `BodyEnhancedAbstract#decorate`'s Y-axis geometry (content top, divider y, total height) for `class-body-enhanced-layout.ts`'s plain/titled divider branches by running th |
| `class-body-enhanced-layout.ts` | `EnhancedLayoutCtx`, `EnhancedDividerPart`, `EnhancedRowsPart`, `EnhancedTreePart`, `EnhancedBodyPart`, `EnhancedBodyGeo`, `measureEnhancedBody` | class-body-enhanced-layout.ts — assembles a classifier's `EnhancedBodyBlock` list (`class-body-enhanced.ts#splitEnhancedBlocks`) into absolute, LOCAL- to-body draw geometry: `ClassifierGeo['rows']`-shaped text rows (reusing the SAME `render |
| `class-body-enhanced.ts` | `BlockSeparatorSpec`, `EnhancedRowsBlock`, `EnhancedTreeCell`, `EnhancedTreeBlock`, `EnhancedBodyBlock`, `isEnhancedBody`, `splitEnhancedBlocks`, `dedentRawLines` | class-body-enhanced.ts — pure raw-line splitting for a classifier's "enhanced body" (upstream `BodyEnhancedAbstract`/`BodyEnhanced1`): the alternate render strategy upstream uses whenever a classifier body contains a `--`/`==`/`..`/`__` blo |
| `class-body-tree.ts` | `TreeCellRow`, `TreeLayout`, `measureTreeCells`, `TreeConnector`, `computeTreeConnectors` | class-body-tree.ts — `AtomTree`/`Skeleton2` port: measures a `\|_` tree-list run's cells (one creole text row per cell, indented by level) and computes the bullet/hline/vline tree-connector geometry that draws beside them. |
| `class-classifier-ast.ts` | `ClassifierKind`, `Classifier` | Class-diagram Classifier AST types. |
| `class-cluster-levels.ts` | `ClusterWrapperLevel`, `clusterWrapperLevel` | Class/object package cluster wrapper level. |
| `class-command-containers.ts` | `CONTAINER_COMMANDS` | Container/creation commands for the class diagram dispatch table (rules 4-5g of the original class-commands.ts COMMANDS array): brace close, `together {`, namespace/package blocks, descriptive containers, the `()` lollipop declaration, diam |
| `class-command-declarations.ts` | `DECLARATION_COMMANDS` | Classifier declaration commands for the class diagram dispatch table (rules 7-7c of the original class-commands.ts COMMANDS array): the `class`/`interface`/`enum`/`annotation`/`entity`/`circle` declaration, plus the already-split `object`/` |
| `class-command-directives.ts` | `DIRECTIVE_COMMANDS` | Directive-style commands for the class diagram dispatch table (rules 1-3b of the original class-commands.ts COMMANDS array): comment/no-op lines, rankdir, skinparam/scale/allowmixing no-ops, `set separator`, `!pragma useIntermediatePackages |
| `class-command-notes.ts` | `NOTE_COMMANDS` | Note-declaration commands for the class diagram dispatch table (rules 6b-6e of the original class-commands.ts COMMANDS array): the attached multi-line note opener, the attached single-line note, and both freestanding-note forms. |
| `class-command-relationships.ts` | `RELATIONSHIP_COMMANDS` | Member and relationship commands for the class diagram dispatch table (rules 6-pre, 6, 6a of the original class-commands.ts COMMANDS array): the standalone-member shorthand, the general relationship dispatch, and the interface-lollipop rela |
| `class-command-types.ts` | `Command` | Shared `Command` shape for the class diagram dispatch table. |
| `class-commands.ts` | `COMMANDS` | Command dispatch table for the class diagram parser. |
| `class-container.ts` | `openNamespaceBlock`, `openTogetherBlock`, `closeBraceScope`, `closeContainer`, `HEADER_STEREO_CAPTURE`, `setNamespaceStereotype`, `NAMESPACE_COMMANDS` | Descriptive-container helpers for the class parser. |
| `class-declaration-extractors.ts` | `extractBody`, `extractDecorations`, `extractInheritance`, `parseIdDisplay` | Classifier-declaration field extractors (body / decorations / inheritance / generic / id-display) for the class parser. |
| `class-declaration-parser.ts` | `ClassifierDecl`, `parseClassifierDecl`, `InheritanceParent`, `resolveInheritance`, `parseTagTokens`, `applyClassifierDecl` | Classifier declaration line parsing for PlantUML class diagrams. |
| `class-descriptive-leaf-command.ts` | `ALLOW_MIXING_ERROR`, `adjudicateAllowMixing`, `DESCRIPTIVE_LEAF_COMMANDS` | Descriptive-element leaf declaration command (`database X`, `mix_actor Y`). |
| `class-descriptive-leaf-keywords.ts` | `DESCRIPTIVE_LEAF_KEYWORDS`, `USECASE_LEAF_KEYWORDS`, `STATE_LEAF_KEYWORD`, `ALL_DESCRIPTIVE_LEAF` | Class-engine descriptive-leaf keyword tables — upstream `CommandCreateElementFull2`'s full leaf set (`(state\|` + descdiagram's shared `CommandCreateElementFull.ALL_TYPES` + `)`). |
| `class-directives-removal.ts` | `directiveAppliesTo`, `applyDirectives`, `foldEffectiveActions`, `computeRemovedIds`, `computeHiddenIds`, `filterRemovedEntities` | Directive APPLICATION + removal/hidden-id computation for class diagrams (applyDirectives, computeRemovedIds/HiddenIds, filterRemovedEntities and their link/pattern helpers). |
| `class-directives.ts` | `parseHideStereotypeDirective`, `applyStereotypeHideShow`, `parseHideShowDirective`, `parseHideShowPatternDirective`, `parseHideShowEntityDirective`, `applyHideShowEntityDirectives`, `parseHideShowKindDirective`, `applyHideShowKindDirectives`, `parseHideShowVisibilityDirective`, `applyVisibilityHideShow`, `applyDirectives`, `computeRemovedIds`, `computeHiddenIds`, `filterRemovedEntities` | Hide/show directive parsing and post-processing for class diagrams. |
| `class-dot-edge-order.ts` | `HIERARCHICAL`, `dotEdgeRunsReversed` | Which direction a relationship's dot edge is emitted in. |
| `class-dot-edges.ts` | `EDGE_DECORATION_MAP`, `ARROW_LABEL_FONT_SIZE`, `buildDotEdges` | Class diagram DOT-edge construction -- split out of ./class-dot-graph.ts (S-A, pure relocation, no logic change) to keep that file under the repo's 500-line-per-file cap, same split rationale as ./class-object-fields.ts's own module doc (sp |
| `class-dot-graph.ts` | `DotGraphParts`, `ThemeGroupInheritance`, `ThemeSameClassWidth`, `applySameClassWidthFloor`, `buildDotGraph` | Class diagram DOT-graph construction. |
| `class-edge-geo.ts` | `EdgeGeoTextContext`, `buildEdgeGeos` | Class-diagram edge geometry: edge-label / magic-arrow / port-label anchors, stroke override, point normalization, and buildEdgeGeos. |
| `class-edge-label-anchor.ts` | `multiLineLabelAnchor`, `LabelAnchorContext`, `LabelLineGeo`, `guideLinesAnchor`, `portLabelAnchor`, `PortLabelContext`, `attachPortLabels` | Edge-label anchoring for the class engine: converting the CENTER points `core/graph-layout.ts` extracts into the left/baseline anchors jar's `<text>` elements carry, and applying the port-label collision pass that sits between the two. |
| `class-edge-label-lines.ts` | `wrapPlainTextLine` | Per-line word-wrap for class-engine edge labels: `wrapPlainTextLine`. |
| `class-geo-builders.ts` | `buildClassifierGeos`, `buildNamespaceGeos`, `buildEdgeGeos`, `degenerateSingleClassifier` | class-geo-builders.ts — pure `ClassifierGeo`/`NamespaceGeo`/`EdgeGeo` builders + the degenerate single-classifier skip, split out of `layout.ts` to keep that file under the project's per-file size cap (mirrors the existing `class-layout-hel |
| `class-geo-types.ts` | `isNoteGeo`, `isClassifierGeo`, `classifierLeaves`, `noteLeaves`, `ClassLeafGeo`, `ClassifierGeo`, `EdgeGeo`, `NamespaceGeo`, `ClassGeometry`, `JsonBodyItem` | Public geometry types for the class-diagram layout engine. |
| `class-hideshow-dispatch.ts` | `executeHideShow` | `hide`/`show` directive dispatch (rule 3 of class-commands.ts's COMMANDS table) — CommandHideShow2 / CommandHideShowByGender / CommandHideShowByVisibility upstream. |
| `class-ink-box.ts` | `InkBox`, `DOCUMENT_MARGIN_TOP`, `DOCUMENT_MARGIN_RIGHT`, `DOCUMENT_MARGIN_BOTTOM`, `DOCUMENT_MARGIN_LEFT`, `INK_DELTA`, `JAR_INK_MARGIN`, `buildInkBox` | Ink-extent accumulation (InkBox + per-shape ink adders + buildInkBox) for class-diagram document sizing. |
| `class-ink-shapes.ts` | `HACK_X_FOR_POLYGON`, `InkBox`, `newInkBox`, `addPoint`, `addRectInk`, `addRectInkEmptyShownBody`, `addEllipseInk`, `addPlainInk`, `addFolderPolygonInk`, `addNamespaceRectInk`, `addClassicRectInk` | `LimitFinder` shape rules for the class ink walk — the primitive `InkBox` and one function per klimt shape the class engine draws, split out of `class-ink-box.ts` when that module passed the 500-line cap. |
| `class-json-commands.ts` | `JSON_COMMANDS` | `json` declaration commands for the class diagram parser — thin adapter over the shared port in `core/command/CommandCreateJson.ts` (mission shared-seam-extraction T9; formerly a 74%-line-identical clone of `state/state-json-commands.ts`, D |
| `class-json-sizing.ts` | `measureJsonClassifier` | `json` classifier sizing — `kind:'json'` leaves in the class diagram layout engine (./layout.ts), mission object-dot-sync Phase L. |
| `class-layout-edge-labels.ts` | `CARDINALITY_FONT_SIZE`, `wrapPlainTextLine`, `NoteBoxContext`, `edgeLabelAttrs` | Relationship (edge) label sizing helpers for the class diagram layout engine (src/diagrams/class/layout.ts). |
| `class-layout-fonts.ts` | `resolveAttributeFont`, `resolveHeaderFont`, `resolveGuillemetOption`, `resolveStereoFont` | Classifier font resolvers for the class sizing pipeline (`class-layout-helpers.ts#measureClassifier`) — attribute (member-row), header, and stereotype fonts, plus the guillemet wrapper option. |
| `class-layout-generic-classifier-types.ts` | `ClassFontSpecs` | Types shared between class-layout-generic-classifier.ts and class-layout-header-geo.ts (a one-way types-leaf so neither file has to import a type back from the other). |
| `class-layout-generic-classifier.ts` | `ClassFontSpecs`, `tryMeasureDescriptionLeaf`, `MeasureGenericClassifierOptions`, `measureGenericClassifier` | Generic name+members classifier box sizing for the class diagram layout engine (src/diagrams/class/layout.ts) -- the member-section half of `measureGenericClassifier`. |
| `class-layout-header-creole.ts` | `computeBadgeSpriteBox`, `buildBadgeCharFields`, `buildHeaderLineMetrics` | class-layout-header-creole.ts — the A2s R2i creole-routing + badge- decoration helpers `class-layout-header-geo.ts#computeHeaderNameGeo` composes. |
| `class-layout-header-geo.ts` | `ClassFontSpecs`, `CommonHeaderFields`, `StereoGeoOptions`, `computeHeaderNameGeo`, `StereoAndTagGeo`, `computeStereoAndTagGeo`, `HeaderGeoBundle`, `computeHeaderRowsGeo` | Generic classifier header geometry: badge decision + header display-text sizing, `<<stereotype>>` block dimensions, `class Foo<T>` generic-tag box, and the resulting stacked stereo/name rows -- the pieces `class-layout-generic-classifier.ts |
| `class-layout-helpers.ts` | `ROW_TEXT_LEFT_MARGIN`, `isMethodMember`, `CARDINALITY_FONT_SIZE`, `wrapPlainTextLine`, `edgeLabelAttrs`, `NoteBoxContext`, `formatMemberText`, `MeasuredClassifier`, `MemberSuppression`, `measureClassifier`, `LIKE_CLASS_KINDS` | Classifier sizing/measurement helpers for the class diagram layout engine (src/diagrams/class/layout.ts). |
| `class-layout-leaf-shapes.ts` | `measureUsecaseOrActor`, `measureLollipop`, `measureAssociationDiamond` | The usecase/actor USymbol box and the lollipop-interface circle+label — the two classifier kinds whose svek box is NOT the generic name+members rect (`class-layout-generic-classifier.ts#measureGenericClassifier`). |
| `class-leaf-geo.ts` | `ClassLeafGeo`, `isNoteGeo`, `isClassifierGeo`, `classifierLeaves`, `noteLeaves` | `ClassGeometry`'s single leaf collection — mission `leaf-draw-order` T3: folds `ClassGeometry.classifiers`/`.notes` into one `leaves` array, mirroring jar's own single leaf collection (`Bibliotekon#allNodes()`, `net/atmp/CucaDiagram.java`) |
| `class-leaf-order.ts` | `computeLeafDrawOrder` | `computeLeafDrawOrder` -- the jar's leaf-print order (D1/D2, `plans/leaf-draw-order/decisions.md`), computed purely from the parsed AST: no geometry, no new parse-time tick. |
| `class-line-merge.ts` | `MergedLines`, `mergeStandaloneBraces` | Standalone-`{` line merging for the class parser's pre-dispatch pass. |
| `class-lollipop.ts` | `LOLLIPOP_SIZE`, `ASSOC_POINT_SIZE`, `LOLLIPOP_RE`, `LollipopCounter`, `applyLollipop` | Interface lollipop shorthand: `Name ()-- Existing` / `Existing --() Name`. |
| `class-magic-arrow.ts` | `MagicArrowDirection`, `MagicArrowLabel`, `parseMagicArrowLabel`, `hasSeveralGuideLines`, `GuideLine`, `splitGuideLines`, `computeGuideLinesBox`, `ARROW_GLYPH_SIZE`, `magicArrowTriSize`, `isBareMagicArrowLabel`, `magicArrowAngle`, `magicArrowGlyphPoints` | class-magic-arrow.ts — G2 item 44 / M4 cause D: the "magic arrow" edge-label glyph (`StringWithArrow.java`, `TextBlockArrow2`, `SvekEdge #getArrowDirectionInRadian`). |
| `class-magma.ts` | `isCollapsedGroup`, `buildClassMagmaEdges` | Class-engine binding for the shared cucadiagram "Magma" standalone-chaining feature (`src/core/magma.ts`). |
| `class-map-commands.ts` | `MAP_MULTILINE_DECL_RE`, `MAP_BARE_DECL_RE`, `applyMapBodyLine`, `MAP_COMMANDS` | `map` declaration command for the class diagram parser (mission object-dot-sync T3 — `CommandCreateMap` + `BodierMap`). |
| `class-map-port-rows.ts` | `mapPortRows`, `mapPortName` | `map`/`json` row-port PRODUCERS -- split out of ./class-port-rows.ts (S-B, pure relocation, no logic change) to keep that file under the repo's 500-line-per-file cap, same split rationale as ./class-object-fields.ts's own module doc (split |
| `class-map-sizing.ts` | `MAP_CELL_MARGIN_X`, `measureMapClassifier` | `map` classifier sizing — `kind:'map'` leaves in the class diagram layout engine (./layout.ts). |
| `class-member-ast.ts` | `Visibility`, `Member` | `Member`/`Visibility` types for class/interface/enum/object leaves. |
| `class-member-atom-resolve.ts` | `ResolvedMemberAtom`, `resolveInlineAtom`, `resolveEmojiAtom`, `resolveOpenIconicAtom` | class-member-atom-resolve.ts — the non-text atom resolvers backing `class-member-creole.ts#resolveOneAtom` (inline img/sprite, OpenIconic vector, emoji). |
| `class-member-creole-sea.ts` | `atomFontSpec`, `mutedAtomFontSpec`, `seaLineHeightAndSpan`, `textAtomDy`, `noteLineAtomDy` | class-member-creole-sea.ts — the `Sea`-placement math `class-member- creole.ts#resolveMemberAtoms` consumes (SI30 `decisions.md#D2/#D3`), split out purely to keep that file under the project's 500-line cap (same precedent as `class-member-d |
| `class-member-creole.ts` | `MemberRenderAtom`, `MemberRowBuild`, `memberBaseFont`, `buildMemberAtoms`, `resolveMemberAtoms`, `buildMemberRow`, `buildWrappedMemberRows`, `splitMemberDisplayLines`, `atomsToPlainText` | class-member-creole.ts — routes ONE classifier member row's display text through the shared creole atom engine (`core/klimt/creole/`, built for description by mission E2r) instead of drawing it as a single plain `<text>` element. |
| `class-member-display.ts` | `splitMemberDisplayLines`, `atomsToPlainText` | class-member-display.ts — the physical-line splitter + plain-text projection for classifier member rows. |
| `class-member-parser.ts` | `parseMemberLine` | Member (attribute/method) line parsing for PlantUML class diagrams. |
| `class-member-rows.ts` | `ROW_TEXT_LEFT_MARGIN`, `rowIconZoneWidth`, `sectionHeight`, `isMethodMember`, `SectionRowContext`, `buildSectionRows`, `sectionWidth`, `FlatMemberRows`, `buildWrappedSectionRowBuilds` | Member-row/compartment sizing helpers for the generic class/interface/ enum/annotation classifier box (`class-layout-helpers.ts# measureGenericClassifier`). |
| `class-monochrome.ts` | `MonochromeMode`, `applyMonochromeHex`, `applyMonochromeToFragment` | class-monochrome.ts -- `skinparam monochrome true\|reverse` (G2 N61). |
| `class-namespace-folder-outline.ts` | `folderPathD`, `folderPolygonPoints`, `renderFolderPolygon` | class-namespace-folder-outline.ts — the folder-tab OUTLINE shape builders (`USymbolFolder#drawFolder`'s two branches: the default rounded-arc `UPath`, and the `skinparam style strictuml` sharp-corner `UPolygon`). |
| `class-namespace-resolve.ts` | `GENERIC_BODY_PATTERN`, `GENERIC_CLAUSE_RE`, `splitTopLevelCommas`, `splitOnSeparator`, `ensureNamespaceChain`, `ResolveInput`, `ResolvedRef`, `qualifiedId`, `countByName`, `firstWithName`, `resolveReference`, `normalizeSameConnectionLengths` | Namespace-qualified id parsing & reference resolution for class diagrams. |
| `class-namespace-shape.ts` | `PACKAGE_ROUND_CORNER`, `PACKAGE_STROKE_WIDTH`, `getHTitle`, `getWTitle`, `getTitleBaselineOffset`, `renderNamespaceFolder`, `renderNamespaceRect`, `renderEmptyPackageIcon`, `EmptyPackageLeafDim`, `measureEmptyPackageLeafDim` | class-namespace-shape.ts — G2 N17: the package/namespace folder-tab outline (`USymbolFolder`'s tab-notch shape, `core/decoration/symbol/ USymbolFolder.ts#folderPath`/`getWTitle`/`getHTitle`) wired into class's plain-SVG-string render path. |
| `class-namespace-title-table.ts` | `namespaceTitleTableDims` | `ClusterHeader`'s title-table sizing for a class/object package cluster -- split out of ./class-dot-graph.ts (T4, namespace-cluster-box mission, 500-line file-cap compliance; pure move, no behavior change from the split itself, mirroring st |
| `class-namespace.ts` | `registerInNamespace`, `makeClassifier`, `collapseEmptyNamespace`, `collapseEmptyNamespacesFinal`, `splitTopLevelCommas`, `splitOnSeparator`, `ensureNamespaceChain`, `qualifiedId`, `countByName`, `firstWithName`, `resolveReference`, `normalizeSameConnectionLengths`, `GENERIC_BODY_PATTERN`, `GENERIC_CLAUSE_RE`, `ResolveInput`, `ResolvedRef` | Namespace-splitting helpers for class diagrams. |
| `class-note-decl-ast.ts` | `NotePosition`, `ClassNote` | Class-diagram Note AST types (NotePosition, ClassNote). |
| `class-note-link-box.ts` | `LinkNoteDim`, `measureLinkNoteDim` | `note on link`'s own note-image dimension -- split out of class-layout-edge-labels.ts purely to keep that file under the project's 500-line cap (T10 addition). |
| `class-notes.ts` | `NOTE_STEREO`, `NOTE_STEREO_CAPTURE`, `NOTE_COLOR`, `NOTE_URL`, `NOTE_TARGET`, `PendingNote`, `isNoteCloser`, `NoteCreationCounter`, `TipGroupSeenSet`, `addNote`, `addFreestandingNote`, `finalizePendingNote`, `isNoteId`, `NOTE_ON_LINK_RE`, `NOTE_ON_LINK_MULTI_RE`, `resolveLinkNotePosition`, `applyNoteOnLink`, `CONSTRAINT_ON_LINKS_RE`, `applyConstraintOnLinks` | Note-block accumulation + note AST construction for the class parser. |
| `class-object-commands.ts` | `parseObjectField`, `OBJECT_COMMANDS` | `object` declaration commands for the class diagram parser. |
| `class-object-display.ts` | `CANONICAL_OBJECT_SEPARATOR`, `objectDisplayText` | An object leaf's DISPLAY text, as the jar draws it. |
| `class-object-fields.ts` | `formatObjectMemberText`, `methodOrFieldHeight`, `measureObjectFields` | Object member-row measurement group -- the field/row math consumed by ./class-object-sizing.ts's field-based `object` leaf branch. |
| `class-object-map-header.ts` | `Dim`, `HeaderRowsOptions`, `baselineOffsetFor`, `titleDimension`, `measureStereo`, `headerRows` | Header-row math (name + optional stereotype, stacked, centered) SHARED by object/map/json (`kind:'object'`) leaves in the class diagram layout engine (./layout.ts). |
| `class-object-map-sizing.ts` | `Dim`, `titleDimension`, `measureStereo`, `headerRows`, `baselineOffsetFor`, `floorAtMinimumWidth`, `objectBodyReportsPorts` | `skinparam minClassWidth` floor — SHARED by object/map/json (`kind:'object'` boxed leaves) in the class diagram layout engine (./layout.ts). |
| `class-object-member-creole.ts` | `ObjectMemberRun`, `ObjectMemberRow`, `buildObjectMemberRow` | An object leaf's member rows, built through the creole engine — with tab stops preserved. |
| `class-object-sizing.ts` | `measureObjectClassifier` | Object classifier sizing — the `kind:'object'`-SPECIFIC field/body math for the class diagram layout engine (./layout.ts). |
| `class-parse-state.ts` | `ParseState` | Mutable class-parser state (local to each `parseClass` call). |
| `class-port-rows.ts` | `edgePortAttrs`, `applyShapeAndPorts`, `PortRowMemberInput`, `PortRowCompartmentInput`, `classPortRows`, `classifierPortShortNames`, `classPortShortNamesById` | `Ports` production for the class engine's `RECTANGLE_HTML_FOR_PORTS` leaves — the DOT-input half of `SvekNode#appendLabelHtmlSpecialForLink`'s `((WithPorts) image).getPorts(stringBounder)` call (svek/SvekNode.java:269). |
| `class-relationship-ast.ts` | `RelationshipType`, `LinkDecor`, `Relationship` | Class-diagram Relationship AST types. |
| `class-relationship-parser.ts` | `CLASS_ID`, `REL_DISPATCH_RE`, `splitEndpointPort`, `idLeaf`, `parseRelationshipLine`, `stripQuotes` | Relationship (arrow) line parsing for PlantUML class diagrams. |
| `class-shadow.ts` | `CLASS_SHADOW_FILTER_ID`, `buildClassShadowFilterDef`, `classShadowFilterUrl` | class-shadow.ts — mission skin-file-loading (deferred D3 item, CLASS- scoped): the `<filter>` def markup for a class diagram's drop shadow, as a plain STRING (class's own renderer emits SVG strings directly, not via klimt's `XmlNode`-based |
| `class-shield-helpers.ts` | `isRowPortKind`, `packageEndpointAnchors`, `shieldedClassifierIds` | Port/qualifier "shield" helpers for the class diagram DOT-graph builder (./class-dot-graph.ts). |
| `class-stereotype-command.ts` | `STEREOTYPE_STATEMENT_RE`, `applyStereotypeStatement` | The standalone `<Name> <<stereotype>>` statement — sets the stereotype of an ALREADY-DECLARED classifier (upstream `CommandStereotype`, G2 N24). |
| `class-stereotype-layout.ts` | `atomTextLineHeight`, `HeaderInfo`, `computeHeaderInfo`, `buildHeaderRows`, `GenericTagDim`, `measureGenericTagDim`, `GenericTagGeo`, `buildGenericTagGeo` | Class header-row + generic type-parameter-tag layout. |
| `class-stereotype.ts` | `CLASS_STEREOTYPE_FONT_SIZE`, `DEFAULT_GUILLEMET`, `wrapGuillemet`, `splitStereotypeLabels`, `splitStereotypeStyleTags`, `parseCircledCharDecoration`, `parseCircledSpriteDecoration`, `GuillemetPair`, `CircledCharDecoration`, `CircledSpriteDecoration`, `measureStereoLabelWidths`, `stereoBlockDim`, `StereoRowsInput`, `buildStereoRows`, `computeHeaderInfo`, `buildHeaderRows`, `measureGenericTagDim`, `buildGenericTagGeo`, `HeaderInfo`, `GenericTagDim`, `GenericTagGeo`, `parseHideStereotypeDirective`, `isStereotypeLabelHidden`, `applyStereotypeHideShow`, `resolveVisibleStereotypeLabels`, `resolveStyleStereotypeTags` | Classifier header stereotype row(s) — `HeaderLayout#getDimension`/`#drawU`'s `stereoDim`/`xStereo`/`yStereo` terms (G2 N24; the mechanism N21/N22/N23 repeatedly named and deferred as an explicit DOT-gate/width-formula risk — N23's own Mecha |
| `class-url-command.ts` | `URL_STATEMENT_RE`, `applyUrlStatement` | The standalone `url [of\|for] <Code> [is] [[url]]` statement — attaches a url to an already-declared classifier (`classdiagram/command/ CommandUrl.java`). |
| `class-url.ts` | `UrlInfo`, `parseUrlBracket`, `URL_BRACKET_RE` | `[[url]]` link grammar — G2 N15 (README item #7, deferred since N6). |
| `class-visibility-icon.ts` | `VISIBILITY_ICON_SIZE`, `iconSizeOf`, `visibilityModifierName`, `renderVisibilityIcon`, `renderVisibilityUrlBackground`, `visibilityIconOriginY` | Member-row visibility icon shape/color (G2 N6). |
| `index.ts` | `classPlugin` | Class diagram plugin — wires together parser, layout, and renderer for use with the DiagramRegistry dispatcher. |
| `layout-ink-extent.ts` | `ClassDocumentDims`, `computeClassBorderRectDims`, `computeClassRawInkDims`, `applyClassDocumentMargin`, `computeClassDocumentDims`, `InkShift`, `computeClassInkShift` | layout-ink-extent.ts — G2/N5: the `SvekResult`/`TextBlockExporter` document-dimension recipe (svek/SvekResult.java:126-133, core/TextBlockExporter.java:200-202,751-753), ported for CLASS's own pure-string layout (no klimt `UGraphic`, so `re |
| `layout.ts` | `formatMemberText`, `ROW_TEXT_LEFT_MARGIN`, `isNoteGeo`, `isClassifierGeo`, `classifierLeaves`, `noteLeaves`, `ClassifierGeo`, `EdgeGeo`, `NamespaceGeo`, `ClassGeometry`, `JsonBodyItem`, `ClassLeafGeo`, `layoutClass` | Class diagram layout engine. |
| `note-freestanding.ts` | `findFreestandingNoteRelationshipIndices`, `findFreestandingNoteConnectors` | note-freestanding.ts — G2/N16 Kind B: a freestanding note (`note "text" as N1`, no host classifier/position) connected to a REAL classifier via a plain relationship line (`N1 .. |
| `note-layout-groups.ts` | `OPALE_Y_SPACING`, `NoteGroup`, `groupNotes`, `buildNoteGraphParts` | Same-side/same-host note grouping + the seam nodes/edges that go into the svek dot graph. |
| `note-layout-measure-rows.ts` | `NoteRow`, `NoteLineBuildContext`, `noteLineHeight`, `buildTableRow`, `consumeEmbeddedRow` | Row builders split out of `note-layout-measure.ts` (500-line module cap): the shared row/context types + per-row height rule, the A12 creole-table grid row (`StripeTable`/`AtomTable` geometry), and the R2b `{{ ... |
| `note-layout-measure.ts` | `NoteMeasurement`, `measureNote` | Note text measurement — a clean leaf of the note-layout module family. |
| `note-layout-tip.ts` | `mapNoteGeos` | Note geo building: maps a completed dot layout back to `NoteGeo[]` for the two draw passes (`mapNoteGeos`, the entry point), one geo per ORIGINAL note, stacked within its group's laid-out box. |
| `note-layout-types.ts` | `NoteLeafType`, `NoteGeo`, `TipRequest`, `ClassifierAnchor` | Shared types for the note-on-entity layout module family (`note-layout.ts` + siblings). |
| `note-layout.ts` | `NoteGeo`, `NoteLeafType`, `TipRequest`, `ClassifierAnchor`, `buildNoteGraphParts`, `mapNoteGeos` | Note-on-entity layout for class diagrams. |
| `note-opale.ts` | `opalePolygonLeft`, `opalePolygonRight`, `opalePolygonUp`, `opalePolygonDown`, `opaleCorner`, `getOpaleStrategy`, `resolveOpaleConnector`, `OpalePoint`, `OpaleBox`, `OpaleConnector`, `OpaleDirection`, `buildOpaleNoteGeo`, `matchScore`, `getBestMatchRow` | The fuzzy member-line matcher and the class engine's own opalisable-note geo builder — `cucadiagram/BodierAbstract.java#getBestMatch`/`matchScore`, used to resolve a member-tip's `::member` against a classifier's rendered row text. |
| `note-tips-resolve.ts` | `TipShape`, `TipResolution`, `resolveTips` | Draw-time resolution of a `'TIPS'` leaf against its host -- the port of `EntityImageTips#drawU`'s per-tip loop as a PURE function of the finished geometry, consumed by both draw passes: `class-ink-box.ts#buildInkBox` (this port's `LimitFind |
| `parser.ts` | `ParseState`, `ensureClassifier`, `startNewPage`, `parseClass` | Parser for PlantUML class diagrams. |
| `renderer-arrowhead.ts` | `decorName`, `EdgeArrowheads`, `buildEdgeArrowheads`, `applyDecorTrim`, `EdgeExtremityInk`, `edgeExtremityInk` | renderer-arrowhead.ts — mission G2 N1, mechanism 2 ("SVG root shell"), part C: replaces `class/renderer.ts`'s SVG-`<marker>`-reference arrowheads (`arrowHeadRef` + `markerEnd`/`markerStart`) with the SAME inline-polygon extremity shapes the |
| `renderer-body-enhanced.ts` | `renderEnhancedBody` | renderer-body-enhanced.ts — draws a classifier's `EnhancedBodyGeo` (`class-body-enhanced-layout.ts`) primitives in EXACT jar draw order — NOT the classic path's Y-sort merge (`renderer-classifier-box.ts #buildBodyPrimitives`'s own doc comme |
| `renderer-classifier-box.ts` | `renderRow`, `renderClassifierBox` | renderer-classifier-box.ts — the generic name+members/rows classifier box (every classifier kind not handled by `renderer.ts#tryRenderUSymbol`). |
| `renderer-classifier-colors.ts` | `classDefaultBackground`, `resolveElementBackground`, `resolveElementFont`, `resolveElementHeaderBackground`, `resolveElementHeaderFont`, `classifierFill`, `classBorder`, `CLASS_BORDER_STROKE_WIDTH_DEFAULT`, `classBorderStrokeWidth`, `MAP_JSON_DIVIDER_STROKE_WIDTH` | Classifier-box color/border resolution: default + element-scoped background and font lookups, classifier fill, and border stroke. |
| `renderer-classifier-rows.ts` | `attributeFontSize`, `renderRow`, `renderRowText`, `memberAtomDecoration`, `renderRowAtoms` | Classifier-box row rendering: attribute font sizing, row + row-text emitters, member atom decoration, and row-atom layout. |
| `renderer-edge.ts` | `linkIdForSvg`, `uniqLinkId`, `renderEdge` | Class-diagram edge SVG rendering (path data, link-id escaping, renderEdge). |
| `renderer-group.ts` | `leafPortion`, `wrapEntity`, `wrapCluster`, `WrapLinkInfo`, `wrapLink` | renderer-group.ts — G2 N2 (mechanism 3): the per-element `<g class= "entity"\|"cluster"\|"link">` wrapper + `<!--...-->` comment every jar class-diagram fixture stamps around each drawn classifier/namespace/ edge (verified against `bedogi-86- |
| `renderer-note.ts` | `renderBulletAtom`, `renderNote`, `renderTipNote`, `renderOpaleNote` | Note rendering — folded-corner box + dashed connector, or the Opale zigzag-notch member-tip shape (G2/N13). |
| `renderer-openiconic.ts` | `renderOpenIconicAtom` | Renders one OpenIconic `<&glyph>` `MemberRenderAtom` (G2 N41) -- split out of `renderer-classifier-box.ts#renderRowAtoms` purely to keep that function's own NLOC under this project's complexity cap and to avoid growing `renderer-classifier- |
| `renderer-uid.ts` | `ClassUidPlan`, `ClassUidPlanInput`, `classUidPlanInputFromAst`, `buildClassUidPlan` | renderer-uid.ts — G2 N2 (mechanism 3): entity/cluster/link uid assignment for the class renderer, mirroring the description engine's `renderer-uid.ts#buildUidPlan` (G1/I3b precedent — same shared-counter scheme, same exact/fallback gate sha |
| `renderer-url.ts` | `UrlTaggedPrimitive`, `wrapClassifierBody` | renderer-url.ts — G2 N15 (README item #7): the classifier-level `[[url]]` `<a>`-wrap render decision. |
| `renderer-usymbol-entity.ts` | `renderUsecaseOrActorEntity` | renderer-usymbol-entity.ts — SI14 T4: draws a class-diagram `usecase`/ `actor` leaf through the SAME faithful `EntityImageDescription.drawU` path the description engine's `renderer-entity.ts#drawEntity` already uses, replacing the hand-roll |
| `renderer.ts` | `renderClass` | Class diagram SVG renderer. |

## `src/diagrams/description/`

| Module | Exports | Purpose |
|---|---|---|
| `ast.ts` | `StereotypeSpriteRef`, `DescriptiveNode`, `DescriptiveLinkStyle`, `DescriptiveLink`, `DescriptionDiagramAST` | AST type definitions for PlantUML descriptive diagrams (component / use-case / deployment). |
| `command-table-containers.ts` | `CONTAINER_COMMANDS` | Bracket/paren shorthand, container-block, and generic keyword-dispatch commands for the descriptive diagram dispatch table (rules 10-15 of the original command-table.ts COMMANDS array): `[Name]` bracket shorthand, `(Name)` use-case shorthan |
| `command-table-directives.ts` | `DIRECTIVE_COMMANDS` | Directive-style commands for the descriptive diagram dispatch table (rules 1-4 of the original command-table.ts COMMANDS array): comment lines, `newpage`, direction directives, `skinparam linetype`, `set separator`, `!pragma kermor`, `scale |
| `command-table-helpers.ts` | `SHORTHAND_TRAILER`, `BRACKET_TRAILER`, `shorthandNode`, `resolveEndpointNamespace` | Shared helpers for the descriptive diagram dispatch table (command-table.ts and its command-group modules). |
| `command-table-links.ts` | `LINK_COMMANDS` | Link-line command for the descriptive diagram dispatch table (rule 9 of the original command-table.ts COMMANDS array). |
| `command-table-shorthand.ts` | `SHORTHAND_COMMANDS` | Bare shorthand declaration commands for the descriptive diagram dispatch table (rules 5-8b of the original command-table.ts COMMANDS array): business-actor `:Name:/`, actor `:Name:`, business-usecase `(Name)/`, interface `()Name`, and the b |
| `command-table-types.ts` | `Command` | Shared `Command` shape for the descriptive diagram dispatch table. |
| `command-table.ts` | `Command`, `COMMANDS` | Command dispatch table for the descriptive diagram parser (component / use-case / deployment). |
| `element-grammar-nosymbol.ts` | `RE_BARE_AS_DECORATED`, `BareAsDecorated`, `parseBareAsDecorated`, `RE_BARE_QUOTED_DECL`, `RE_BARE_DECORATED_DECL`, `RE_CODE_AS_QUOTED_DISPLAY`, `CodeAsQuotedDisplay`, `parseCodeAsQuotedDisplay` | `CommandCreateElementFull`'s declaration alternatives with the leading SYMBOL keyword OMITTED (`getRegexConcat:84`, `(?:(ALL_TYPES\|\(\))[%s]+)?` — the group is optional). |
| `element-grammar.ts` | `BracketDeclaration`, `parseBracketDeclaration`, `removeMatching`, `removeMatchingLinks`, `effectiveRemovedIds`, `effectiveHiddenIds`, `visibleStereotypeLabels`, `nodeWithVisibleStereotype` | Element-declaration helpers split out of parser.ts to stay under 500 lines (CommandCreateElementFull.java, net.sourceforge.plantuml.descdiagram .command) — the bracket-shorthand declaration form and the id/tag-based `remove`/`hide`/`show` ( |
| `frontier-cluster-bbox.ts` | `PortClusterInfo`, `ClusterSpacing`, `computePortClusterBbox` | frontier-cluster-bbox.ts — wires `core/svek/FrontierCalculator.ts` (`Cluster.java#manageEntryExitPoint`/`FrontierCalculator.java`) and `frontier-shadow-layout.ts` (the `initial` rect source) together into one `Bbox` a port cluster's `buildG |
| `frontier-shadow-layout.ts` | `ShadowPortSpec`, `ShadowRankSpec`, `ShadowLayoutInput`, `ShadowLayoutResult`, `computePortClusterInitialRect` | frontier-shadow-layout.ts — obtains the "graphviz-assigned rectangle" `FrontierCalculator`'s `initial` parameter needs (`svek/ FrontierCalculator.java`'s constructor takes `Cluster.getRectangleArea()` — the raw box graphviz allocated the cl |
| `index.ts` | `descriptionPlugin` | Description diagram plugin — the consolidated engine for component, use-case, and deployment diagrams (upstream `DescriptionDiagramFactory`). |
| `layout-dot-tree.ts` | `PortClusterCtx`, `computePortRanksByCluster`, `buildDotNodes`, `buildDotClusters`, `buildDotEdges`, `buildGeoTree` | Description-diagram layout, phases 2-3: `DotInputGraph` node/cluster/edge construction (svek's `ClusterDotString`/`SvekNode` analogs) and the bottom-up geo-tree assembly that maps solved DOT positions back onto `DescriptionNodeGeo`. |
| `layout-geo-post.ts` | `ResultEdge`, `EdgeMapping`, `buildEdgeGeos`, `computeTotalDimensions` | Geo post-processing for the description layout engine (phases 5–6): after the graphviz result is mapped to a raw geo tree, these turn it into final pixel geometry — edge-geo construction (spline clipping at container bboxes + label placemen |
| `layout-helpers-shape-endpoint.ts` | `groupAnchorNodeId`, `resolveEndpoint`, `containerEndpointsInfo`, `symbolBaseShape`, `isInterfaceShielded`, `shapeForNode`, `isPortLabelWide`, `portTablePad` | Link endpoint resolution + DOT node shape resolution for the description diagram layout engine. |
| `layout-helpers-types.ts` | `DescriptionNodeGeo`, `Bbox`, `EdgeContainerEndpoints`, `ResolvedEndpoint`, `DescriptionEdgeGeo`, `DescriptionGeometry`, `CONTAINER_PADDING`, `CONTAINER_TOP_PAD`, `EMPTY_CONTAINER_WIDTH`, `EMPTY_CONTAINER_HEIGHT`, `LAYOUT_MARGIN`, `LAYOUT_MARGIN_LEADING`, `GROUP_ANCHOR_SIZE` | Pure type/const declarations for the description diagram layout engine. |
| `layout-helpers.ts` | `DescriptionNodeGeo`, `Bbox`, `EdgeContainerEndpoints`, `ResolvedEndpoint`, `DescriptionEdgeGeo`, `DescriptionGeometry`, `CONTAINER_PADDING`, `CONTAINER_TOP_PAD`, `EMPTY_CONTAINER_WIDTH`, `EMPTY_CONTAINER_HEIGHT`, `LAYOUT_MARGIN`, `LAYOUT_MARGIN_LEADING`, `GROUP_ANCHOR_SIZE`, `groupAnchorNodeId`, `resolveEndpoint`, `containerEndpointsInfo`, `symbolBaseShape`, `isInterfaceShielded`, `shapeForNode`, `isPortLabelWide`, `portTablePad`, `measureLeafNode`, `ACTOR_WIDTH`, `ACTOR_HEIGHT`, `USECASE_HEIGHT`, `PORT_SIZE`, `measureTitleLabel`, `measureShadowAnchorDims`, `isContainer`, `isClusterNode`, `computeContainerBbox`, `shiftGeo`, `insideBbox`, `buildNodeGeoIndex`, `degenerateSingleLeaf` | Pure, stateless helpers for the description diagram layout engine. |
| `layout-ink-shift.ts` | `InkShift`, `computeInkShift` | layout-ink-shift.ts — G1b/J1 (mechanism C): `SvekResult #calculateDimension`'s `moveDelta` shift (svek/SvekResult.java:125-136), replacing this port's former flat node-box document margin (`layout-geo-post.ts`'s pre-G1b `computeGlobalShift` |
| `layout-types.ts` | `ContainerDesc`, `ClassifyCtx`, `EdgeDotBuildResult` | The layout engine's shared context/result TYPES, split out of `layout.ts` (this project's established "500-line splits" workaround — mechanical move only, no behavior and no upstream divergence). |
| `layout.ts` | `DescriptionNodeGeo`, `DescriptionEdgeGeo`, `DescriptionGeometry`, `ClassifyCtx`, `ContainerDesc`, `EdgeDotBuildResult`, `isEffectiveCluster`, `layoutDescription`, `USymbol` | Unified layout engine for PlantUML descriptive diagrams (component / use-case / deployment). |
| `link-edge-attrs.ts` | `EdgeFontSpecs`, `computeGraphSpacing`, `buildLinkEdgeAttributes` | Link-derived DOT edge attributes + graph spacing for the description engine. |
| `link-grammar-regex.ts` | `DECOR_ESCAPE_RE`, `escapeDecorToken`, `buildDecorAlt`, `DECORS1_TOKENS`, `DECORS2_TOKENS`, `DECORS1_ALT`, `DECORS2_ALT`, `TAIL_TO_HEAD_TOKEN`, `HEAD_TO_TAIL_TOKEN`, `STYLE_KEY1`, `STYLE_KEY2`, `LINE_STYLE`, `LINE_STYLE_MULTIPLES`, `LINK_ENT_ALT`, `COLOR_TOKEN`, `COLOR_KEY_ALT`, `COLOR_PART2`, `COLORS_BODY_ALT`, `LINK_LINE_SOURCE`, `LINK_LINE_RE`, `LinkGroups` | Descriptive link-line regex construction (LINK_LINE_RE + its decor/style/ color/token building blocks). |
| `link-grammar.ts` | `LINK_LINE_RE`, `EndpointShape`, `classifyEndpointShape`, `ParsedLink`, `parseLinkLine` | Link grammar for the descriptive-diagram parser — a faithful port of `CommandLinkElement.java` (`net.sourceforge.plantuml.descdiagram.command`), `LinkDecor.java` (`net.sourceforge.plantuml.decoration`), and `StringUtils.getQueueDirection` ( |
| `link-note-box.ts` | `measureLinkNoteDim` | The `note on link` operand `computeMergedLabelBox` merges into a description-engine edge label -- `EntityImageNoteLink`'s dimension (`svek/SvekEdge.java:309-310`, `new EntityImageNoteLink(note.getDisplay(), note.getColors(), skinParam, link |
| `magma.ts` | `buildMagmaEdges`, `MagmaGroupInput`, `MagmaCtxLike`, `magmaGroups` | Description-engine binding for the shared "Magma" standalone-chaining feature. |
| `namespace-groups.ts` | `splitNamespacePath`, `leafDisplayName`, `QualifiedNodeMatch`, `resolveQualifiedNode`, `SCOPE_KEY_SEP`, `scopedKey`, `bareEntityName`, `findCollidingIds`, `dotKeyFor`, `buildNamespaceGroups` | `set separator`-driven namespace splitting for descriptive diagrams (component / use-case / deployment) — the shared `Quark<Entity>` resolution behind `CucaDiagram#quarkInContext`/`quarkInContextSafe` (net/atmp/CucaDiagram.java:244-283), po |
| `note-grammar.ts` | `NotePosition`, `NoteTerminator`, `isNoteTerminator`, `resolvePosition`, `noteAttachment`, `NoteOpenMatch`, `classifyNoteOpen` | Note-command grammar for the descriptive-diagram parser — a faithful port of `CommandFactoryNote`, `CommandFactoryNoteOnEntity`, and `CommandFactoryNoteOnLink` (`net.sourceforge.plantuml.command.note`), as wired by `DescriptionDiagramFactor |
| `parse-helpers-strings.ts` | `StereotypeSpriteRef`, `StereotypeResult`, `ColorResult`, `LinkStereoResult`, `TagsResult`, `stripFullWrap`, `cleanId`, `resolveTextEscapes`, `resolveNewlineEscapes`, `finalizeDisplay`, `extractNodeStereotype`, `stripUrl`, `splitLeadingQuote`, `stripTrailingUrl`, `resolveInlineLinks`, `extractColor`, `extractTags`, `extractLinkStereotype` | Pure, stateless STRING-LEVEL primitives for the descriptive-diagram parser: quote/wrap stripping, id cleaning, url/link token resolution, and the stereotype/color/tag extractors that operate on a raw remainder string. |
| `parse-helpers.ts` | `stripFullWrap`, `cleanId`, `resolveTextEscapes`, `resolveNewlineEscapes`, `finalizeDisplay`, `extractNodeStereotype`, `stripUrl`, `resolveInlineLinks`, `extractColor`, `extractTags`, `extractLinkStereotype`, `StereotypeResult`, `StereotypeSpriteRef`, `ColorResult`, `LinkStereoResult`, `TagsResult`, `CONTAINER_SYMBOLS`, `NameSection`, `makeNode`, `parseNameSection`, `parseInlineBody`, `CONTAINER_INLINE_RE`, `CONTAINER_OPEN_RE`, `KEYWORD_RE`, `ELEMENT_MULTILINE_OPEN_RE`, `ELEMENT_MULTILINE_OPEN_TYPE0_RE`, `ELEMENT_MULTILINE_END0_RE`, `ELEMENT_MULTILINE_END1_RE`, `trySkinparamBlock` | Pure, stateless helpers for the descriptive-diagram parser. |
| `parse-state.ts` | `NoteOpenMatch`, `ParseState`, `ElementBlockTerminator`, `PendingElementState`, `PendingNoteState`, `makeDefaultAST`, `nextCreationIndex`, `emitNode`, `ensureEndpoint`, `addLink`, `resolveStillUnknown`, `startNewPage`, `executeNoteOpen`, `closePendingNote` | Mutable parse state + entity/note mutation helpers for the descriptive diagram parser (component / use-case / deployment). |
| `parser.ts` | `CONTAINER_SYMBOLS`, `parseDescription` | Parser for PlantUML descriptive diagrams (component / use-case / deployment). |
| `renderer-cluster.ts` | `buildCluster` | renderer-cluster.ts — T17: assembles `Cluster` (T12) for one container `DescriptionNodeGeo` (`children.length > 0`). |
| `renderer-draw-sequence.ts` | `collectByKind`, `drawClusters`, `drawEntities`, `drawEdges` | renderer-draw-sequence.ts — G1b/J1 write-set expansion (journaled, mechanism C): the `SvekResult#drawU` draw-order sequence (cluster, then leaf, then edge), extracted verbatim out of `renderer.ts` so it can be shared with `layout-ink-shift. |
| `renderer-edge.ts` | `drawEdge` | renderer-edge.ts — T17: adapts one `DescriptionEdgeGeo` (this port's layout output) into `SvekEdgeInput` (T13's decoupled drawing-half contract — see `SvekEdge.ts`'s "Adapter boundary" doc comment, which explicitly names this as a later tas |
| `renderer-entity.ts` | `drawEntity` | renderer-entity.ts — T17: assembles `EntityImageDescription` (T14) for one leaf `DescriptionNodeGeo` and draws it through klimt, translated to its absolute layout position (`SvekResult.java:87`'s `image.drawU(ug2.apply(new UTranslate(minX, |
| `renderer-ink-extent.ts` | `runInkWalk`, `driverBounderFor`, `DocumentDimResult`, `computeDocumentDims` | renderer-ink-extent.ts — G0/T3 (LimitFinder mission): the SvekResult document-dimension recipe (svek/SvekResult.java:70-140), lifted out of `renderer.ts` to keep that file under the project's complexity cap. |
| `renderer-uid.ts` | `UidPlan`, `buildUidPlan` | renderer-uid.ts — entity/cluster/link uid assignment for the klimt-backed description renderer. |
| `renderer.ts` | `renderDescription`, `unwrapKlimtSvg` | renderer.ts — T17: klimt-backed public entry point for the description (component/use-case/deployment) diagram engine. |
| `title-label-sizing.ts` | `measureTitleLabel`, `measureShadowAnchorDims` | Title-bar dims for a cluster's own display name — split out of layout-helpers.ts (500-line cap) as its own module, mirroring that file's existing leaf-sizing.js split. |

## `src/diagrams/dot/`

| Module | Exports | Purpose |
|---|---|---|
| `ast.ts` | `DotDiagramAST`, `DotGeometry` |  |
| `index.ts` | `dotPlugin` |  |
| `layout.ts` | `layoutDot` |  |
| `parser.ts` | `parseDot` |  |
| `renderer.ts` | `renderDot` |  |

## `src/diagrams/files/`

| Module | Exports | Purpose |
|---|---|---|
| `ast.ts` | `FileEntryType`, `FileEntry`, `FilesDiagramAST`, `EntryGeometry`, `FilesGeometry` |  |
| `index.ts` | `filesPlugin` |  |
| `layout.ts` | `layoutFiles` |  |
| `parser.ts` | `parseFiles` |  |
| `renderer.ts` | `renderFiles` |  |

## `src/diagrams/hcl/`

| Module | Exports | Purpose |
|---|---|---|
| `index.ts` | `hclPlugin` | HCL diagram plugin — wires together parser, layout, and renderer for use with the DiagramRegistry dispatcher. |
| `parser.ts` | `parseHcl` |  |

## `src/diagrams/json/`

| Module | Exports | Purpose |
|---|---|---|
| `ast.ts` | `HighlightDirective`, `JsonDiagramAST` | AST types for PlantUML JSON diagrams (@startjson / @endjson). |
| `color-form.ts` | `canonicalColor`, `canonicalColorOpt` | The FORM a color takes in the emitted SVG, as distinct from which color it is. |
| `document-dimensions.ts` | `ENSURE_VISIBLE_BUMP`, `DocumentDimensions`, `documentDimensions` | The json document's own width/height. |
| `Fission.ts` | `NeutronType`, `Neutron`, `getNeutrons`, `splitStripe` | Line wrapping, as upstream does it — by splitting a line into ATOMS and breaking between them, not by re-joining words into strings. |
| `index.ts` | `jsonPlugin` | JSON diagram plugin — wires together parser, layout, and renderer for use with the DiagramRegistry dispatcher. |
| `json-layout-prep.ts` | `ValueType`, `DisplayValue`, `getDisplayValue`, `JsonContainer`, `FlatNode`, `containerEntries`, `walkTree`, `EMPTY_MAP`, `buildHighlightMap`, `processStringDisplay`, `splitDisplayLines`, `wordWrapLine`, `BuildRowsOptions` | JSON diagram pre-layout: value display formatting, container tree flattening, highlight-map construction, and string wrapping. |
| `JsonCurve.ts` | `CurvePoint`, `VERY_FIRST_LINE`, `supp`, `veryFirstPoint`, `buildArrowHeadPath`, `buildArrowHeadSegments`, `buildCurveSegments`, `buildCurvePath`, `segmentsToPathData` | @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/JsonCurve.java The path a json edge draws, built from the layout engine's OWN spline rather than re-derived. |
| `layout.ts` | `JsonRowGeo`, `JsonNodeGeo`, `JsonEdgeGeo`, `JsonGeometry`, `layoutJson` | JSON diagram layout engine. |
| `Mirror.ts` | `setMirrorBadValueHandler`, `Mirror` | @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/Mirror.java Upstream lays a json diagram out on a TRANSPOSED graph and rotates the answer back. |
| `parser.ts` | `parseJson` | Parser for PlantUML JSON diagrams (@startjson / @endjson). |
| `renderer-pen.ts` | `PenInk`, `JsonPen`, `penFor` | The seam between "which shapes this diagram draws" and "how they are drawn". |
| `renderer-style.ts` | `HighlightClassStyle`, `BoxStyleJson`, `TextStyleJson`, `NodeStyleJson`, `JSON_SKIN_BLACK`, `SVG_CORNER_DIVISOR`, `resolveNodeStyle` | The resolved `jsonDiagram.node` style — the whole skinparam/style cascade for the json family, collapsed once per diagram into plain values the renderer only reads. |
| `renderer.ts` | `renderJson` | JSON diagram SVG renderer. |
| `scale-geo.ts` | `scaleJsonGeometry`, `scaleNodeStyle` | The `scale …` directive for the json family, applied at the layout→render boundary. |
| `tab-stops.ts` | `tabString`, `tabStopWidth`, `TabToken`, `splitOnTabs`, `hasTab`, `tabAwareWidth`, `TabRun`, `walkTabs` | `\t` inside a drawn cell — tab-stop expansion, ported from `AtomText` (`klimt/creole/legacy/AtomText.java`). |
| `TextBlockJson.ts` | `JsonRowGeo`, `CellAtom`, `MeasuredNode`, `buildRows`, `measureNode`, `recordLabelFor` | Node sizing for the json family — the port of upstream's `TextBlockJson`. |

## `src/diagrams/packetdiag/`

| Module | Exports | Purpose |
|---|---|---|
| `ast.ts` | `ScaleDirection`, `PacketItem`, `PacketBlock`, `PacketIndicator`, `PacketDiagramAST`, `PacketGeometry` |  |
| `index.ts` | `packetdiagPlugin` |  |
| `layout.ts` | `V_LINE_SHORT`, `INDICATOR_HEIGHT`, `V_MARGIN`, `FONT_ASCENT`, `blockRenderedHeight`, `layoutPacket` |  |
| `parser.ts` | `parsePacket` |  |
| `renderer.ts` | `renderPacket` |  |

## `src/diagrams/sequence/`

| Module | Exports | Purpose |
|---|---|---|
| `ast.ts` | `ParticipantType`, `Participant`, `MessageExoType`, `AbstractMessageEvent`, `MessageEvent`, `MessageExoEvent`, `NoteEvent`, `FrameEvent`, `ActivationEvent`, `DividerEvent`, `DelayEvent`, `SpaceEvent`, `NewpageEvent`, `SequenceEvent`, `BoxGroup`, `SequenceDiagramAST`, `ParticipantBadge`, `ParticipantGeo`, `TextRun`, `MessageGeo`, `NoteGeo`, `ActivationGeo`, `FrameGeo`, `DividerGeo`, `SpaceGeo`, `NewpageGeo`, `EventGeo`, `BoxGeo`, `SequenceGeometry` | AST and Geometry type definitions for PlantUML sequence diagrams. |
| `command-arrow.ts` | `returnCommand`, `ARROW_SOURCE`, `UNDRESSED_ARROW_SOURCE`, `DRESSED_ARROW_SOURCE`, `getInclination`, `withPart`, `arrowCommand`, `decoratedArrowCommand` | `CommandArrow` (`SequenceDiagramFactory.java:111`) — ONE upstream command, rebuilt here from the composed named groups of `sequence-arrow-regex.ts` rather than from an enumerated token table (`->`, `-->>`, `->>`, `-->`). |
| `command-autonumber.ts` | `autonumberCommand`, `autonumberStopCommand`, `autonumberResumeCommand`, `autonumberIncrementCommand` | The autonumber block: `CommandAutonumber` (`SequenceDiagramFactory .java:146`), `CommandAutonumberStop` (`:147`), `CommandAutonumberResume` (`:148`) and `CommandAutonumberIncrement` (`:149`), registered as four consecutive entries. |
| `command-common.ts` | `skinParamMessageAlignCommand`, `pragmaCommand`, `rotateCommand`, `hideStereotypeCommand`, `hideUnlinkedCommand`, `scaleCommand` | The `CommonCommands.addCommonCommands1(cmds)` block — the VERY FIRST thing `SequenceDiagramFactory#initCommandsList` registers (`:100`), ahead of every sequence-specific command — plus `CommandHideUnlinked` (`:101`), the single command regi |
| `command-exo-arrow.ts` | `EXO_ARROW_LEFT_SOURCE`, `EXO_ARROW_RIGHT_SOURCE`, `exoArrowLeftCommand`, `exoArrowRightCommand` | `CommandExoArrowLeft` (`SequenceDiagramFactory.java:113`) and `CommandExoArrowRight` (`:114`) over the shared `CommandExoArrowAny` base — an **exogenous** message, one endpoint on a participant and the other on the diagram border: `[-> Bob` |
| `command-grouping.ts` | `boxStartCommand`, `boxEndCommand`, `groupingCommand`, `elseCommand`, `endCommand` | The box/grouping block: `CommandBoxStart` (`:124`), `CommandBoxEnd` (`:125`) and `CommandGrouping` (`:126`), registered consecutively as one group between the single-line note factories and the `CommandActivate2`/`CommandReturn` pair. |
| `command-lifeline.ts` | `activateCommand`, `deactivateCommand`, `destroyCommand`, `deactivateShortCommand` | The life-line block: `CommandActivate` (`SequenceDiagramFactory.java:103`) and `CommandDeactivateShort` (`:104`), registered as their own group immediately after `addCommonCommands1`/`CommandHideUnlinked` and before the participant declarat |
| `command-misc.ts` | `hideFootboxCommand`, `hideEmptyDescriptionCommand`, `dividerCommand`, `delayWithTextCommand`, `bareDelayCommand`, `spaceCommand`, `autoactivateCommand`, `setSeparatorCommand`, `refOverCommand`, `refOverMultilineCommand` | The individually-registered commands of `initCommandsList`'s trailing run that are neither pagination nor autonumber: `CommandDivider` (`:142`), `CommandHSpace` (`:143`), `CommandReferenceOverSeveral` (`:144`), `CommandReferenceMultilinesOv |
| `command-note-factory.ts` | `noteCommand`, `endNoteCommand`, `noteOnArrowCommand`, `styledNoteCommand`, `noteAcrossCommand` | The note-command factories. |
| `command-page.ts` | `newpageCommand`, `minwidthOrPagingCommand` | The pagination block: `CommandNewpage` (`:139`), `CommandIgnoreNewpage` (`:140`) and `CommandAutoNewpage` (`:141`), the three commands that open `initCommandsList`'s trailing run. |
| `command-participant.ts` | `participantCommand`, `createCommand`, `matchParticipantMultilineCommand` | The participant-declaration family: `CommandParticipantA` (`:106`), `CommandParticipantA2` (`:107`), `CommandParticipantA3` (`:108`), `CommandParticipantA4` (`:109`) and `CommandParticipantMultilines` (`:110`) — four single-line arities of |
| `command-sprite.ts` | `matchSpriteBase64Command` | `CommandSpriteBase64` — `sprite $name data:image/png;base64,<payload>`, the inline-image sprite definition. |
| `divider-style.ts` | `DIVIDER_LINE_COLOR`, `DIVIDER_LINE_THICKNESS`, `DIVIDER_BACKGROUND`, `DIVIDER_FONT_SIZE`, `DIVIDER_FONT_BOLD`, `DIVIDER_PADDING`, `DIVIDER_HEIGHT_ALLOWANCE`, `DIVIDER_WIDTH_ALLOWANCE`, `DIVIDER_LABEL_DELTA_X`, `DIVIDER_BAND_HEIGHT`, `dividerFontSpecOf`, `dividerPreferredHeight`, `dividerPreferredWidth` | Style constants for the sequence-diagram divider (`== label ==`, and the empty `====` form). |
| `frame-style.ts` | `GROUP_BACKGROUND`, `GROUP_LINE_COLOR`, `GROUP_LINE_THICKNESS`, `GROUP_FONT_SIZE`, `GROUP_FONT_BOLD`, `HEADER_LINE_THICKNESS`, `HEADER_BACKGROUND`, `HEADER_LINE_COLOR`, `HEADER_FONT_SIZE`, `HEADER_FONT_BOLD`, `HEADER_PADDING`, `CORNER_SIZE`, `groupingHeaderDisplay` | Style constants for the sequence-diagram frame/grouping background pass (`loop`, `alt`, `opt`, `par`, `break`, `critical`, `group`, `ref`). |
| `index.ts` | `sequencePlugin` | Sequence diagram plugin — wires together parser, layout, and renderer for use with the DiagramRegistry dispatcher. |
| `layout.ts` | `layoutSequence` | Sequence diagram layout engine. |
| `newpage-style.ts` | `NEWPAGE_MARGIN_Y`, `NEWPAGE_LINE_HEIGHT`, `NEWPAGE_TILE_HEIGHT`, `NEWPAGE_LINE_COLOR`, `NEWPAGE_LINE_THICKNESS`, `NEWPAGE_DASH_UNIT` | Style and size constants for the sequence-diagram page separator (`newpage`). |
| `parser.ts` | `parseSequence` | Parser for PlantUML sequence diagrams. |
| `renderer-arrowhead-glyph.ts` | `paintOf`, `niceArrowOf`, `ARROW_THICKNESS`, `renderArrowHead` | Arrow-head GLYPH drawing: the paint, the polygon, the async lines and the decoration circle that one arrow END draws. |
| `renderer-arrowhead.ts` | `reverseArrowConfiguration`, `renderFlatMessageArrow`, `renderSelfMessageHead` | renderer-arrowhead.ts — the sequence engine's arrow EMISSION layer. |
| `renderer-frame-blotter.ts` | `renderFrameBlotter` | The grouping-frame BACKGROUND pass -- the coloured band(s) a `loop`/`alt`/ `opt`/`par`/`break`/`critical`/`group`/`ref` frame paints behind its body, split at each `else` branch boundary so each branch can carry its own fill. |
| `renderer-frame-header.ts` | `frameHeaderCornerPath`, `renderGroupingHeaderBackground`, `renderGroupingHeaderForeground` | A grouping frame's type tab -- background pass (the plain outline) and foreground pass (the clipped-corner tab + its text). |
| `renderer-lifeline.ts` | `renderLifeline`, `renderActivation`, `renderLifelinePass` | The two "line" components a sequence participant owns: its lifeline and its activation (livebox) bars. |
| `renderer-message.ts` | `renderMessage` | Sequence diagram message-drawing path. |
| `renderer-participant-shapes.ts` | `renderParticipantBox`, `renderFooterBox` | renderer-participant-shapes.ts — one participant's head or footer BLOCK: its glyph, its label, and the dispatch between them. |
| `renderer-participant-symbol.ts` | `SymbolParticipantType`, `GlyphParticipantType`, `ParticipantSymbolGeo`, `ParticipantSymbolOpts`, `COLLECTIONS_DELTA`, `measureParticipantSymbol`, `renderParticipantSymbol` | renderer-participant-symbol.ts — the sequence engine's participant GLYPH seam: a sequence-local mirror of upstream's `ComponentRose*` family (`skin/rose/Rose.java#createComponentParticipant`, `:137-190`) that drives the SHARED, already-port |
| `renderer.ts` | `renderSequencePage`, `renderSequence` | Sequence diagram SVG renderer. |
| `scale-geo.ts` | `scaleSequenceGeometry`, `ScaledTheme`, `scaleSequenceTheme`, `scaleHeadGeometry`, `scaledDashPattern` | The `scale …` directive for the sequence engine, applied at the layout→render boundary — mirrors `json/scale-geo.ts` exactly (same rationale, same "why scaling inputs equals scaling outputs" argument); see that file's header for the full de |
| `sequence-arrow-regex.ts` | `ANCHOR`, `anchor`, `COLOR_OR_STYLE_PATTERN`, `colorOrStylePattern`, `ARROW_DRESSING1`, `ARROW_DRESSING2`, `ARROW_BODY_OR`, `PART1`, `PART2`, `ARROW_SUPPCIRCLE2_LEFT`, `ARROW_SUPPCIRCLE1_LEFT`, `ARROW_SUPPCIRCLE1_RIGHT`, `ARROW_SUPPCIRCLE2_RIGHT`, `MULTICAST`, `ACTIVATION`, `LIFECOLOR`, `ARROW_SKELETON_SOURCE`, `ARROW_SKELETON_RE` | Shared regex fragments behind the sequence-diagram arrow commands. |
| `sequence-arrowhead.ts` | `ArrowHeadKind`, `ArrowPart`, `ArrowDecoration`, `ArrowDressing`, `ArrowConfiguration`, `ArrowSegment`, `ArrowCircle`, `HeadGeometry`, `ARROW_DELTA_X`, `ARROW_DELTA_Y`, `NICE_ARROW_INSET`, `DIAM_CIRCLE`, `THIN_CIRCLE`, `SPACE_CROSS_X`, `inclination1Of`, `inclination2Of`, `inclinationAngle1`, `inclinationAngle2`, `headGeometryNormalSide`, `headGeometryReverseSide`, `headGeometrySelf` | sequence-arrowhead.ts — the sequence engine's arrow SHAPE vocabulary. |
| `sequence-command-registry.ts` | `SequenceCommand`, `SEQUENCE_COMMANDS` | THE sequence command list — one registration-ordered array, tried top-to-bottom with first match winning, mirroring `PSystemCommandFactory#getCandidate` (`:225-246`), which walks the single `cmds` list `SequenceDiagramFactory#initCommandsLi |
| `sequence-layout-events.ts` | `ActivationStack`, `EventProcessingContext`, `EventCursor`, `processEvents`, `pushActivation`, `openActivation`, `activationLevel`, `flushOpenActivations`, `emitActivation` | Sequence diagram layout — event geometry (Step 2 of layoutSequence). |
| `sequence-layout-exo.ts` | `handleMessageExoEvent`, `exoRightExtent`, `anchorExoBorders` | Sequence diagram layout — EXO message geometry (`[-> Bob`, `Bob ->]`, …). |
| `sequence-layout-message.ts` | `handleMessageEvent` | Sequence diagram layout — message-arrow geometry, split out of sequence-layout-events.ts to keep both files under the size cap. |
| `sequence-layout-participant-sizing.ts` | `symbolPreferredWidth`, `symbolPreferredHeight` | sequence-layout-participant-sizing.ts — one function per participant family's own `getPreferredWidth` / `getPreferredHeight`, split out of `sequence-layout-participants.ts` when the citations pushed that file past the repo's 500-line cap (t |
| `sequence-layout-participants.ts` | `LEFT_MARGIN`, `ParticipantLayoutResult`, `computeParticipantLayout` | Sequence diagram layout — participant column geometry (Step 1 of layoutSequence). |
| `sequence-layout-shared.ts` | `fontSpecOf` | Small shared leaf utilities for sequence diagram layout. |
| `sequence-page.ts` | `newpageTilesOf`, `sequencePageCount`, `paginateSequence`, `sequencePageAst` | `newpage` PAGINATION: one `SequenceGeometry` in, one page's `SequenceGeometry` out. |
| `sequence-parse-helpers.ts` | `ParseState`, `Command`, `makeDefaultAST`, `currentEvents`, `ensureParticipant`, `emit`, `applyAutonumber`, `formatAutonumber`, `ArrowSpec`, `arrowConfigurationOf`, `ParticipantDeclaration`, `parseParticipantDeclaration`, `urlOf`, `autoActivationFlags`, `activationFlags`, `DottedStart`, `parseDottedStart`, `linkedParticipantIds`, `applyHideStereotype`, `applyHideUnlinked` | Mutable parse state and shared helpers for the sequence diagram parser. |
| `text-block-geo.ts` | `TextRun`, `refBodyLines`, `refBodyHeight`, `refBodyWidth`, `MessageLabelBlock`, `messageLabelBlock`, `messageLabelRows` | text-block-geo.ts — how a sequence-diagram `Display` becomes POSITIONED text runs. |

## `src/diagrams/state/`

| Module | Exports | Purpose |
|---|---|---|
| `ast.ts` | `JsonNode`, `StateKind`, `HistoryPseudostate`, `Separator`, `State`, `TransitionDirection`, `Transition`, `NotePosition`, `StateNote`, `RemoveRestoreDirective`, `StateDiagramAST` | AST type definitions for PlantUML state diagrams. |
| `index.ts` | `statePlugin` | State diagram plugin — wires together parser, layout, and renderer for use with the DiagramRegistry dispatcher. |
| `layout-ink-extent.ts` | `StateDocumentDims`, `computeStateDocumentDims`, `StateInkShift`, `computeStateInkShift`, `SvekResultGeometry`, `computeSvekResultGeometry` | layout-ink-extent.ts — mission G4 S1, mechanism 4 ("document-margin / ink-extent computation gap"): the `SvekResult`/`TextBlockExporter` document-dimension recipe (svek/SvekResult.java:126-133, core/ TextBlockExporter.java:200-202,751-753), |
| `layout-ink-transition.ts` | `InkBox`, `newInkBox`, `addPoint`, `addTransitionInk` | layout-ink-transition.ts — the state engine's TRANSITION ink path, plus the `InkBox` accumulator primitives it and `layout-ink-extent.ts`'s per-shape node adders share. |
| `layout.ts` | `StateNodeGeo`, `TransitionGeo`, `StateGeometry`, `layoutState` | State diagram layout engine. |
| `parser.ts` | `parseState` | Parser for PlantUML state diagrams. |
| `renderer-arrowhead.ts` | `TransitionArrowhead`, `buildTransitionArrowhead`, `applyHeadTrim`, `TransitionArrowheadInk`, `transitionArrowheadInk`, `buildCircleEndMarkup`, `buildCrossStartMarkup` | renderer-arrowhead.ts — mission G4 S1, mechanism 3 ("arrowhead-drawing mechanism"): replaces `state/renderer.ts`'s SVG-`<marker>`-reference arrowhead (`markerEnd: 'url(#arrow-dependency)'`) with the SAME inline-`<polygon>` extremity shape t |
| `renderer-border-point.ts` | `renderBorderPoint` | `EntityImageStateBorder` — the image class upstream instantiates for a border point (`<<entrypoint>>`/`<<exitpoint>>`/`<<inputPin>>`/ `<<outputPin>>`), instead of the ordinary state box. |
| `renderer-box.ts` | `renderStateRuns`, `renderStateTable`, `renderStateTextLines`, `renderSdlReceive`, `isOOSymbolStereotype`, `renderOOSymbol`, `renderNormal` | Simple-state (`kind:'normal'`) leaf box renderer — mission G4 S2, mechanism 5. |
| `renderer-composite-box.ts` | `renderComposite` | Composite-state (`children.length > 0`) box renderer — mission G4 S3, mechanism 6. |
| `renderer-group.ts` | `wrapEntity`, `wrapCluster`, `wrapStartEntity`, `wrapEndEntity`, `WrapLinkInfo`, `wrapLink` | renderer-group.ts — mission G4 S1, mechanism 2: the per-element `<g class="entity"\|"start_entity"\|"end_entity"\|"link">` wrapper every jar state-diagram fixture stamps around each drawn state/pseudostate/ transition (verified against `jocela |
| `renderer-note.ts` | `FlatNoteGeoCtx`, `buildFlatNoteGeos`, `renderStateNoteFreestanding`, `renderStateNoteOpale`, `renderStateNote`, `renderNoteOnLink` | State-diagram note materialization + rendering (mission G4 S10 — "notes never render", the largest remaining zero-diff family named in S9's own queue). |
| `renderer-pseudostate.ts` | `renderInitial`, `renderFinal`, `renderForkJoin`, `renderChoiceJunction`, `renderHistory` | Pseudostate shape renderers (initial/final/fork/join/syncBar/choice/ history/deepHistory) — mission G4 S2, mechanism 5. |
| `renderer-uid.ts` | `StateUidPlan`, `buildStateUidPlan` | renderer-uid.ts — mission G4 S1, mechanism 2: node/link uid assignment for the state renderer, mirroring `class/renderer-uid.ts#buildClassUidPlan` (G2 N2 precedent — same `ent%04d`/`lnk%d` shared-counter scheme). |
| `renderer.ts` | `renderState` | State diagram SVG renderer. |
| `state-check-final.ts` | `checkFinalError` | Port of `StateDiagram#checkFinalError` (T8, mission dispatch-by-parse- attempt) — upstream's fourth `PSystemCommandFactory` refusal point. |
| `state-commands-declarations.ts` | `DECLARATION_COMMANDS` | State/frame declaration command rules for the state parser — split out of `state-commands.ts` purely for the project's 500-line file cap (pure move, no logic changes; mission A4 Phase L iter 13). |
| `state-commands-notes.ts` | `NOTE_COMMANDS` | Note-family command rules for the state parser — split out of `state-commands.ts` purely for the project's 500-line file cap (the note family is self-contained: no other rule in `state-commands.ts` reads `NotePosition` or any `state-notes.j |
| `state-commands.ts` | `Command`, `COMMANDS` | Command-dispatch table for the state parser: an array of `{ pattern, passes, execute }` entries tested against each trimmed line in priority order. |
| `state-composite-autonom.ts` | `shiftDotLayoutResult`, `buildPlainAutonomSpec`, `resolveAllAutonomPasses` | Autonom-composite pass building (`resolveAllAutonomPasses`, `buildAutonomSpec`, `buildPlainAutonomSpec`) — split out of ./state-composite-pass.ts (mission G4 S3, 500-line file-cap compliance; pure move, PLUS the mechanism-6 `headerLines`/`b |
| `state-composite-classify.ts` | `CompositeKind`, `FiringUnit`, `ClassifyResult`, `classifyDiagram`, `zaentId`, `resolveEndpoint` | Whole-diagram composite classification (mission A4/T4) — computed ONCE up front so any pass, at any depth, can resolve a transition endpoint without re-walking the tree. |
| `state-composite-cluster.ts` | `tightContentDimension`, `resolveClusterComposite` | Non-autonom `Cluster` composite pass building — split out of ./state-composite-pass.ts (mission A4 Phase L iter 16, 500-line file-cap compliance; pure move, only the CONC-region-leaf mechanism is new — see its own doc below). |
| `state-composite-concurrent.ts` | `ConcurrentRegionPassResult`, `buildConcurrentAutonomSpec`, `buildConcurrentRegionPass` | Concurrent-region (`--` separator) composite pass building — split out of ./state-composite-pass.ts (mission A4 Phase L, 500-line file-cap compliance; pure move, zero behavior change). |
| `state-composite-detect.ts` | `subtreeIds`, `hasLocalContent`, `hasBorderPointDescendant`, `hasDirectBorderPointChild`, `hasNonBorderEeContent`, `collectAllTransitions`, `isAutarkic`, `isGroupTouched` | Autonom ("autarkic") predicate — mission A4/T4, mechanisms.md §3. |
| `state-composite-edge-label.ts` | `buildEdgeAttrs` | Transition edge label/xlabel attribute building — split out of ./state-composite-pass.ts (mission A4 Phase L, 500-line file-cap compliance; pure move, zero behavior change) for its own coherent concern: turning a `Transition`'s guard/action |
| `state-composite-frontier.ts` | `Box`, `Point`, `toRect`, `fromRect`, `frontierCalculator`, `ensureMinWidth` | `Box` ({x,y,width,height}) adapter over `core/svek/FrontierCalculator.ts` for the state engine (mission shared-seam-extraction T5). |
| `state-composite-geo.ts` | `PosMap`, `ClusterPosMap`, `clusterPosMapOf`, `materializeSpecs`, `layoutComposite` | GeoSpec → StateGeometry materialization (mission A4/T4). |
| `state-composite-header.ts` | `measureLines`, `measureClusterTitle`, `titleAndAttributeWidth` | `ClusterHeader`'s title/stereotype/attribute-text sizing formula — split out of ./state-composite-cluster.ts (G7 T11, 500-line file-cap compliance; pure move of the header-measurement primitives, no behavior change from the split itself). |
| `state-composite-pass-edges.ts` | `nextClusterId`, `resetEdgeCounter`, `addScopeNotes`, `addLevelEdges`, `collectRegularTransitions`, `sweepOrphanEdges` | Edge/note accumulation for the composite (non-flat) svek-pass pipeline -- split out of ./state-composite-pass.ts (500-line file-cap compliance; pure move, no behavior change) mirroring that file's OWN established split precedent (state-comp |
| `state-composite-pass-types.ts` | `PassAccumulator`, `DiagramCtx`, `GeoSpec`, `ExtractAutonomSpec` | Shared types for the composite (non-flat) svek-pass pipeline -- split out of ./state-composite-pass.ts (G5 C3, 500-line file-cap compliance; pure move, no behavior change) mirroring this file's OWN established split precedent (state-composi |
| `state-composite-pass.ts` | `scopedPseudoIds`, `sortSpecsByCreationIndex`, `sortSpecsByDocumentOrder`, `addLocalPseudoNodes`, `levelEndpointId`, `addScopeNotes`, `addLevelEdges`, `sweepOrphanEdges`, `nextClusterId`, `resetEdgeCounter`, `DiagramCtx`, `GeoSpec`, `PassAccumulator`, `ANCHOR_SIZE`, `newAccumulator`, `resolveMember`, `runPass`, `buildLevelTransitionGeos`, `buildTopLevelPass` | Svek-pass builder (mission A4/T4) — walks the composite tree, building one `DotInputGraph` per "pass boundary" (the top-level diagram, or an autonom composite). |
| `state-composite-pseudo.ts` | `scopedPseudoIds`, `sortSpecsByCreationIndex`, `sortSpecsByDocumentOrder`, `addLocalPseudoNodes`, `levelEndpointId`, `pushLocalNodesInCreationOrder` | Scope-local `[*]`-pseudostate anchor id resolution + creation-order sibling sorting — split out of `state-composite-pass.ts` (mission G4 S7, 500-line file-cap compliance; pure move, no behavior change). |
| `state-composite-sizing.ts` | `AutonomOffset`, `AutonomWrapper`, `measureAutonomWrapper`, `stackConcurrentRegions` | Sizing formulas for composite-state wrapping (mission A4/T4 — the autonom/cluster split, mechanisms.md §1/§3). |
| `state-directives.ts` | `computeRemovedIds`, `filterRemovedEntities` | `remove`/`restore` directive evaluation for state diagrams — the port's equivalent of upstream's export-time `CucaDiagram#isRemoved()` skip. |
| `state-dot-graph.ts` | `INITIAL_ID`, `FINAL_ID`, `endpointId`, `transitionLabelText`, `buildDotGraph` | Flat state-diagram DOT-graph construction. |
| `state-entity-position.ts` | `EntityPositionKind`, `positionFromStereotype`, `getEntityPosition`, `isBorderPoint`, `usesPortShape`, `PORT_LABEL_WIDE_THRESHOLD`, `PORT_TABLE_PAD_FLOOR`, `isInputPosition`, `isOutputPosition`, `BORDER_POINT_SIZE`, `EXPANSION_POINT_LONG`, `getBorderPointDimension` | EntityPosition classification (border-point leafs) — a property orthogonal to `StateKind`, faithfully mirroring upstream's TWO independent classification systems that both read the SAME `<<stereotype>>` text: - `Stereogroup#getLeafType` pic |
| `state-geo-types.ts` | `StateTextLine`, `StateNodeGeo`, `StateRegionGeo`, `StateSeparatorGeo`, `LabelInkBox`, `TransitionGeo`, `StateGeometry` | Public geometry types for the state-diagram layout engine. |
| `state-json-commands.ts` | `PendingJson`, `isJsonCloser`, `JSON_COMMANDS` | `json` declaration commands for the state diagram parser — thin adapter over the shared port in `core/command/CommandCreateJson.ts` (mission shared-seam-extraction T9; formerly a 74%-line-identical clone of `class/class-json-commands.ts`, D |
| `state-json-sizing.ts` | `MeasuredJsonState`, `measureJsonState` | `json` state sizing — `kind:'json'` leaves in the state diagram layout engine (./state-sizing.ts). |
| `state-leaf-node.ts` | `LeafNodeCtx`, `buildLeafNode` | Leaf-node DOT sizing/shape (mission A4/T4 + Phase L Gap 1) — originally a pure move out of state-composite-pass.ts to keep that file under the repo's 500-line cap (`buildLeafNode` grew past the cap once the Gap 1 border-point plaintext/rect |
| `state-link-add.ts` | `emitTransition` | The state engine's link-add chokepoint (SI1/T11) — `emitTransition`, split out of `state-parse-state.ts` under the 500-line file cap. |
| `state-note-layout.ts` | `measureNote`, `measureNotePureText`, `NoteEdgeCandidate`, `ScopeNoteParts`, `buildNoteGraphPartsByScope`, `NoteEdgeSweepTarget`, `sweepOrphanNoteEdges` | Note-on-entity DOT node + connector-edge construction for state diagrams (mission A4 Phase L iter 9) — shared by both the flat (state-dot-graph.ts) and composite (state-composite-pass.ts) DOT builders. |
| `state-notes.ts` | `NOTE_STEREO`, `NOTE_COLOR`, `NOTE_URL`, `NOTE_COLOR_CAPTURE`, `NOTE_TARGET`, `PendingNote`, `isNoteCloser`, `addNote`, `addFreestandingNote`, `finalizePendingNote`, `NOTE_ON_LINK_RE`, `NOTE_ON_LINK_MULTI_RE`, `applyNoteOnLink` | Note-block accumulation + note AST construction for the state parser. |
| `state-parse-helpers.ts` | `extractDisplayAndId`, `assertConcurrentStateOk`, `assertDottedParentHasData`, `parseLabel` | Grammar-decoding helpers for the state parser's command bodies — split out of `state-parse-state.ts` (which owns the scope-stack/mutation machinery) purely to stay under the file-size cap; `extractDisplayAndId`/ `parseLabel` touch no `Parse |
| `state-parse-resolve.ts` | `ensureState`, `declareState`, `resolveDescriptionTarget` | Name-resolution mechanics for the state parser — split out of `state-parse-state.ts` under the 500-line file cap (mission A4 Phase L iter 10). |
| `state-parse-state.ts` | `Pass`, `PSEUDOSTATE`, `stereotypeToKind`, `pseudoKindForId`, `compoundHistoryKind`, `DEFAULT_SEPARATOR`, `Scope`, `makeScope`, `makeState`, `ParseState`, `nextCreationIndex`, `nextConcurrentGlobalId`, `pseudoTickKey`, `currentScope`, `rootScope`, `currentRegionStates`, `concurrentRegionScopeId`, `noteScopeId`, `scopeOf`, `addDescriptionLine`, `pushScope`, `popScope`, `syncAutoScopes` | Scope-stack machinery and shared mutation helpers for the state parser. |
| `state-pseudokind.ts` | `PSEUDOSTATE`, `stereotypeToKind`, `pseudoKindForId`, `compoundHistoryKind` | Pseudostate marker constants + stereotype/compound-id → `StateKind` classification — split out of `state-parse-state.ts` (mission G4 S7, 500-line file-cap compliance; pure move, no behavior change). |
| `state-render-colors.ts` | `STATE_DEFAULT_BACKGROUND`, `STATE_BORDER_STROKE_WIDTH`, `resolveStateFill`, `resolveStateFillBucketed`, `resolveStateBorder`, `resolveStateFontColor`, `resolveStateFontSize`, `resolveStateArrowLineColor`, `resolveStateArrowHeadColor`, `resolveStateBoxRadius`, `resolveActivityBarForkColor`, `resolveActivityBarJoinColor`, `textAscent`, `textDescent` | Shared state-box color/stroke constants and per-node `#color` override resolution (mission G4 S2, mechanism 5) — used by both renderer-box.ts (normal/json leaf box) and renderer-pseudostate.ts (choice/history/ deepHistory, which jar-verifie |
| `state-renderer-transitions.ts` | `buildPathD`, `renderTransitionWrapped` | State-diagram transition rendering: path building, endpoint id resolution, local scope naming, and the wrapped transition markup. |
| `state-shadow.ts` | `STATE_SHADOW_FILTER_ID`, `buildStateShadowFilterDef`, `stateShadowFilterUrl` | state-shadow.ts — mission skin-file-loading Batch 2 (D3's rendering half, STATE-scoped): the `<filter>` def markup for a state diagram's drop shadow, as a plain STRING (state's own renderer emits SVG strings directly, not via klimt's `XmlNo |
| `state-sizing-creole.ts` | `StateTextRun`, `StateTableCell`, `StateTableGeo`, `StateStyledTextLine`, `StateCreoleBlock`, `StateCreoleOpts`, `stateCreoleOpts`, `toStyledLine`, `stateCreoleBlock`, `styledLines` | state-sizing-creole — the state engine's consumer of the ONE core creole seam (`core/svek/image/creole-text-lines.ts`, mission `state-declared-size-fix` D1). |
| `state-sizing.ts` | `splitStateDisplayLines`, `CIRCLE_START_SIZE`, `CIRCLE_END_SIZE`, `HISTORY_SIZE`, `BRANCH_SIZE`, `SYNCHRO_BAR_LONG`, `SYNCHRO_BAR_SHORT`, `MeasuredState`, `measureState`, `measureTextLines`, `measureBodyTextLines`, `historyLabelText`, `StateGeoTextFields`, `buildStateGeoTextFields` | State-node sizing — svek-faithful dimension formulas for the state diagram layout engine (./layout.ts). |
| `state-transition-clip.ts` | `clusterAnchorRectsOf`, `clipTransitionSpline` | state-transition-clip.ts — this port of the edge loop in `DotStringFactory#solve` (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ DotStringFactory.java:458-459`): ```java for (SvekEdge line : getBibliotekon().allLines()) line. |
| `state-transition-label.ts` | `computeReservedLabelBox`, `transitionLabelAnchor`, `attachTransitionLabel` | Transition label placement — shared by every state-layout pipeline (flat, T3; composite, T4) so antiparallel transitions don't overlap their labels. |
| `state-transitions.ts` | `ParsedTransition`, `parseTransitionLine`, `isSyncBarId`, `stripSyncBarEquals` | Transition (arrow) grammar for the state parser — `A --> B`, the left-pointing reverse form `A <-- B`, and their decorations (cross-start, circle-end, `[style]` brackets, direction abbreviations, `<<stereotype>>`). |

## `src/diagrams/yaml/`

| Module | Exports | Purpose |
|---|---|---|
| `index.ts` | `yamlPlugin` | YAML diagram plugin — wires together parser, layout, and renderer for use with the DiagramRegistry dispatcher. |
| `monomorph.ts` | `MonomorphType`, `Monomorph`, `monomorphToJson` | Monomorph — a single YAML node that can be a scalar, list, or map. |
| `parser.ts` | `parseYaml` |  |
| `yaml-builder.ts` | `YamlBuilder` | YamlBuilder — builds a Monomorph tree from a sequence of YAML parse events. |
| `yaml-line.ts` | `YamlLineType`, `YamlLine`, `build` |  |
| `yaml-parser.ts` | `YamlSyntaxError`, `parseYamlLines` |  |
