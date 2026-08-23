# SI33 / T2 — the document background rect (`SvgGraphics#paintBackcolor`)

## Observation: jar skips the background rect for BLACK, not just white/transparent
- **Context**: Porting `finalizeSequenceBody` in `src/core/assemble-svg.ts`,
  mirroring `maybeStateBackgroundRect`.
- **Finding**: The rect is drawn by `SvgGraphics`'s constructor, guarded by
  `klimt/drawing/svg/SvgGraphics.java:189-191`:
  `if (color.equals("#00000000") == false && color.equals("#000000") == false
  && color.equals("#FFFFFF") == false) this.paintBackcolor(color);`
  BLACK is excluded alongside white and transparent. Corpus-verified: of the
  18 cached sequence goldens whose root style carries a non-`#FFFFFF`
  `background:`, the 17 non-black ones all open their content `<g>` with the
  rect; `sequence/zuravu-52-mike252` (`background:#000000;`) does not.
  Neither `maybeStateBackgroundRect` nor json's `isSolidNonDefault` models
  the black case — both would emit a rect a black-background jar omits.
- **Impact**: A latent divergence for STATE/JSON/YAML/HCL whenever a fixture
  sets a pure-black background. Not fixed by T2 (those functions are outside
  its write-set and the boundary forbids altering them).
- **Confidence**: High

## Observation: `paintBackcolor` runs BEFORE chrome, so the rect always leads
- **Context**: Deciding whether to copy state's `bodyWrapped ? '' : …`
  carve-out for sequence.
- **Finding**: `SvgGraphics.java:207-212` appends the rect to `getG()` in the
  CONSTRUCTOR (as a 0x0 placeholder, resized to the final `maxX`/`maxY` at
  `:817-819`), i.e. before any diagram or chrome draw. So it is the content
  group's first child whether or not chrome wrapped the body. State's
  carve-out records that *state's corpus* had no chrome+non-default-background
  combination — it is not upstream behaviour. Sequence's corpus has six
  (`fazaba-22-nusi829`, `ganefo-61-leka777`, `jogeto-89-zaco078`,
  `solivu-37-vika919`, `taxude-25-lamo370`, `zerovu-57-cumo773`), each with a
  0,0 rect ahead of a `<g class="header">`/`<g class="title">`.
- **Impact**: `finalizeSequenceBody` follows json's splice shape, not state's.
  If a chrome+non-default-background state fixture ever appears, state's
  carve-out is the bug.
- **Confidence**: High

## Observation: 8-digit hex backgrounds are not split into fill + fill-opacity
- **Context**: Surveying every non-white background in the sequence corpus.
- **Finding**: `sequence/gadiva-05-pogi376` has `background:#803D1414;` on the
  root and `<rect … fill="#803D14" fill-opacity="0.078" …/>` as the content
  rect — the jar splits the alpha byte out. This port's `core/svg-shapes.ts
  #rect` passes `fill` through `core/svg.ts#formatAttrValue` ->
  `svg-format.ts#shortenColor`, which returns any non-7-char string
  unchanged, so the port would emit `fill="#803D1414"` with no
  `fill-opacity`. Affects every engine's background rect, not just sequence.
- **Impact**: One known sequence fixture will diff on this attribute after T3
  wires the renderer. Fixing it means touching `shortenColor`/`rect`, shared
  by every engine — a separate, cross-engine change.
- **Confidence**: High
