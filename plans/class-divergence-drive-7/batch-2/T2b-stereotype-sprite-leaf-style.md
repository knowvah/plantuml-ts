# T2b: classifier stereotype sprite, usymbol-leaf style keys, edge-label word-wrap

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

Created at the b1 close (journal rows 13, 14, 19; push-forward: re-slot to a
better owner). Three families batch 1 could not carry because their files were
T1a's / T1d's for that batch or were unowned; all are free now.

## Task (TDD)
1. **dezobu (`embedded-skinparam-hoisted`, corrected mechanism, journal row 14).**
   Upstream `EntityImageDescription.java:192-194` + `Stereotype.java:108-117`: a
   stereotype whose `$sprite` resolves REPLACES the stereo block, drawn as `<path>`s
   through `Sprite.asTextBlock` (not an `<image>`). The core already ports this
   (`core/svek/image/EntityImageDescriptionDelegates.ts:416 resolveStereotypeSprite`,
   `EntityImageDescriptionLabels.stereotypeSprite`; `description/renderer-entity.ts:196-199`
   is the consumer precedent). The class engine drops the sprite before the geo:
   producer `class-multiline-element.ts:82-83` keeps only `sr.stereotypes.join(', ')`;
   the single-line path `class-declaration-parser.ts:364` keeps raw text;
   `Classifier` (`class-classifier-ast.ts:178`) has no sprite field; sizer
   `class-layout-generic-classifier.ts:90-94` builds the `LeafSizingSubject` without
   `stereotypeSprite` (the 20 px height gap, jar 96 vs 76). Thread a
   `LeafSizingStereotypeSprite` `{ name, scale, color? }` (`LeafSizingSubject.ts:59-63`)
   from parse → `Classifier` → `stereotypeLabelFields` (`class-stereotype.ts:325`) →
   `ClassifierGeo.stereotypeSprite` (`class-geo-types.ts:177`) → sizer → the stereo
   block draw in `renderer-usymbol-entity.ts`, resolved at draw time via
   `resolveStereotypeSprite(ref, spriteDimsLookupFor(sprites))`. dezobu 1/9 → 0/0.
2. **xuloxo leaf style (journal row 13).** (a) RoundCorner: C4's
   `skinparam rectangle<<person|container|system>> { RoundCorner 0 }` →
   `rectangleRoundCorner` re-signed at +1000 (`FromSkinparamToStyle.java:275,292-302`),
   read at `EntityImageDescription.java:168`. Add a `roundcorner` (and
   `diagonalcorner`) role to `GROUP_BY_STEREO_RE` (`skinparam-stereo-keys.ts:188-191`),
   an `ElementColors.roundCornerByStereo` (`theme-graph-colors.ts:153-193`), and read it
   where `renderer-usymbol-entity.ts:300` hard-codes `ELEMENT_ROUND_CORNER`. (b) Title
   alignment: `skinparam defaultTextAlignment center` → root `HorizontalAlignment`
   (`FromSkinparamToStyle.java:155`), read at `EntityImageDescription.java:175`. Add
   the accumulator/Theme field (`skinparam-key-handlers-table-b.ts` reusing
   `parseHorizontalAlignment`, `skinparam-accumulator.ts`, `skinparam-theme-builder.ts`,
   `theme.ts`) and consume it in `titleAlignmentFor` (`renderer-usymbol-entity.ts:165-173`),
   keeping usecase CENTER (`plantuml.skin:452-454`, the more specific selector). A
   scratch probe with both forced removed every leaf diff (T1c).
3. **xuloxo edge-label word-wrap (journal row 19).** The jar wraps
   `//[Optional Technology]//` into two physical lines (`Display#create8` →
   Fission/`LineBreakStrategy`, the arrow style's `wrapWidth` / `maxMessageSize`,
   `SvekEdge.java:290-299`). The port's `class-edge-label-lines.ts#wrapPlainTextLine`
   is wired only for classifier headers; wire it into the edge-label multi-line path
   (`class-edge-label-measure.ts`, `class-edge-label-anchor.ts`) AND the DOT box
   reservation (`class-layout-edge-labels.ts`) so the reserved box and the ink agree.
   Report the per-atom diff after each of 1–3.

## Rows
- `unknown/dezobu-62-vuzu421` (1/9)
- `unknown/xuloxo-85-vibu502` (44/35 after b1; leaf rx/ry + `@x`, edge-label wrap)

## Write-set
- `src/diagrams/class/{class-classifier-ast,class-multiline-element,class-declaration-parser,class-layout-generic-classifier,class-stereotype,class-geo-types,renderer-usymbol-entity}.ts`
- `src/core/{skinparam-stereo-keys,theme-graph-colors,skinparam-key-handlers-table-b,skinparam-accumulator,skinparam-theme-builder,theme}.ts`
- `src/diagrams/class/{class-edge-label-lines,class-edge-label-measure,class-edge-label-anchor,class-layout-edge-labels}.ts`
- their unit tests under `tests/unit/{class,core}/`
- NOT `class-geo-builders.ts`, `class-entity-port.ts`, `renderer.ts` (T2a's).

## Read-set
Journal rows 13, 14, 19; cdd6 rows 39, 67, 71; `EntityImageDescription.java:100-210`;
`Stereotype.java:100-120`; `FromSkinparamToStyle.java:150-160,270-305`;
`SvekEdge.java:285-300`; `Display.java` (`create8`), `Fission.java`;
`EntityImageDescriptionDelegates.ts:400-430`; `LeafSizingSubject.ts:50-70`.

## Interface contracts
Out: `ClassifierGeo.stereotypeSprite?: LeafSizingStereotypeSprite` (replaces T1c's
`{ name, width, height }` contract, journal row 14). T2a's `class-geo-builders.ts`
spreads it through `stereotypeLabelFields` — no T2a edit expected.

## Acceptance
- Given `rectangle X <<$archimate/business-actor>>` with the sprite in the asset
  store, then the stereo block is the sprite `<path>`s at the jar's size and position;
  dezobu 1/9 → 0/0.
- Given C4's RoundCorner 0 and `defaultTextAlignment center`, then the usymbol leaves'
  `rect/@rx,@ry` and text `@x` match the jar.
- Given xuloxo's technology line, then the reserved label box and the drawn lines both
  wrap as the jar's, and the row → 0/0 or every residual carries a mechanism.
- Given the state/description/usecase/component surveys (shared skinparam files),
  then 0 conformant losses; movers reported with mechanisms.

## Architecture decisions (locked)
D1, D11; cdd6 D2 (one style path). Upstream names.
