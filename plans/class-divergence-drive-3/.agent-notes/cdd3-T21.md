# cdd3-T21 — package skinparams + empty-package leaf (E3-1/2/4/5/6)

## Observation: packageBorderColor also reaches every USymbol group
- **Context**: gigoru-88-naze087 (unknown bucket) moved under this task.
- **Finding**: `FromSkinparamToStyle.java:127-128` registers
  `packageBorderColor`/`packageBackgroundColor` on `{group}` as well as
  (via `addMagic`, `:129`) on `{package_}`. A `rectangle X {}` group's
  style `{..., group, rectangle}` therefore takes `packageBorderColor`
  (jar gigoru-88: `rect stroke #F00`), while `packageFontColor` /
  `packageStereotypeFontColor` (`{package_}` only) do NOT reach it (jar
  `#000` title and stereo). This task fixed the font half
  (`renderer.ts` fallback, `class-cluster-header.ts#stereoFontColor`); the
  border half (`renderer.ts#renderNamespace`'s `borderColor:
  theme.colors.border`) is left open -- gigoru's remaining `g[3]/rect/@stroke`.
- **Impact**: follow-on; check whether `theme.colors.graph.packageBorder` is
  fed only by the skinparam key before routing it to USymbol groups.
- **Confidence**: High (Java + jar SVG).

## Observation: the empty-package leaf ignores strictuml
- **Context**: porting `EntityImageEmptyPackage#drawU` whole (E3-6).
- **Finding**: the leaf's `roundCorner` is its style value
  (`EntityImageEmptyPackage.java:104`); unlike `Cluster.java:323-324` there
  is no `strictUmlStyle()` zeroing, so `USymbolFolder#drawFolder` always
  takes the `UPath` branch for the leaf. The port previously drew the
  strictuml polygon; now it passes `strictUml: false`. No corpus fixture
  combines strictuml with an empty package (jinibe-02 / mucuxi-36 have
  none), so this is unmeasured against a jar.
- **Impact**: author a fixture if strictuml + empty package ever matters.
- **Confidence**: High on the Java; unmeasured output.

## Observation: the leaf stereo is the LEGACY FontParam route
- **Context**: dojanu-92 p3 «Dummy».
- **Finding**: `EntityImageEmptyPackage.java:134-135` builds the stereo with
  `FontConfiguration.create(skinParam, FontParam.PACKAGE_STEREOTYPE,
  stereotype)` -> `SkinParam#getFontHtmlColor` (`:484-505`):
  `packageStereotypeFontColor<<label>>`, `packageStereotypeFontColor`,
  `defaultFontColor`, black. It never reads `packageFontColor` and its
  family is `packageStereotypeFontName`/default, never `packageFontName`.
  The CLUSTER stereo instead goes through the style merge
  (`ClusterHeader.java:209-215`, `forStereotypeItself`), where
  `packageFontColor`/`packageFontName` DO apply as a lower tier.
  `defaultFontColor` and `packageStereotypeFontName/Size` are unmodeled
  for the leaf (no fixture).
- **Impact**: the two stereo blocks resolve colour differently by design.
- **Confidence**: High.

## Observation: transparent colours -- two upstream rules
- **Context**: dojanu-92 p2 `<<Layout>>` (all Transparent).
- **Finding**: `SvgGraphics.java:539-540` `fixColor` maps `#00000000` to
  `none` for every stroke/fill; `DriverPathSvg.java:62-70` draws a path
  whose stroke EQUALS its back with an empty stroke and width 0 (jar
  `<path d=... fill="none"/>`, no style); `DriverTextSvg.java:92-94`
  emits no `<text>` for a transparent font. Only the path-equality rule is
  `UPath`-specific; the port applies it in
  `class-namespace-folder-outline.ts#folderPath` only.
- **Impact**: the same rules probably matter wherever class draws a
  transparent border through plain SVG strings.
- **Confidence**: High.

## Observation: packageFontStyle vs the stereotype italic is unmodeled
- **Context**: E3-5.
- **Finding**: `packageFontStyle` is a skinparam-priority `FontStyle` on
  `{package_}`; the cluster stereo merge also matches `plantuml.skin:79-82`
  `stereotype { FontStyle italic }`. Which wins depends on value priority;
  not verified against a jar, so the port applies `packageFontStyle` to
  titles only (nijeli-04 has no stereo).
- **Confidence**: Medium.

## Observation: survey rows carry no S/N counts
- **Context**: reporting non-class movers.
- **Finding**: `svg:survey` JSON rows hold verdict/firstDiff/maxDelta only.
  `diagnosis/scratch/T21-bucket-diff.mts <bucket> <slug...>` renders a
  fixture from `test-results/dot-cache/<bucket>/` and prints S/N diffs
  (render-diff only reads the class cache).
- **Confidence**: High.
