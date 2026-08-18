/**
 * Classifier-box color/border resolution: default + element-scoped
 * background and font lookups, classifier fill, and border stroke. Split out
 * of `renderer-classifier-box.ts` (line cap); a leaf consumed by row and
 * body rendering.
 */

import type { ClassifierGeo } from './layout.js';
import {} from './layout.js';
import type { Theme } from '../../core/theme.js';
import {} from '../../core/svg.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import { resolveBareOrBackColor } from '../../core/color-override.js';
import {} from './class-map-sizing.js';
import {} from './class-badge.js';
import {} from './class-visibility-icon.js';
import {} from './renderer-url.js';
import {} from '../../core/svg.js';
import {} from '../../core/klimt/shape/UText.js';
import type {} from './class-member-creole.js';
import { resolveClassTagCascadeEntry } from '../../core/style-cascade-class.js';
import {} from './renderer-openiconic.js';
import {} from './renderer-body-enhanced.js';
import {} from './class-shadow.js';

/** `theme.colors.graph.classCascadeBackground ?? classBackground` -- the
 *  terminal class-family default every kind falls back to when no
 *  higher-priority override applies (shared because object/map/json
 *  coincidentally default to the SAME jar hex, `#F1F1F1`, as class --
 *  see `classifierFill`'s own doc comment for why this is NOT the same as
 *  object/map/json sharing class's CASCADE). */
export function classDefaultBackground(theme: Theme): string {
  return theme.colors.graph.classCascadeBackground ?? theme.colors.graph.classBackground;
}

/** G3/O1: `theme.colors.elements[sname].background` -- resolves the SAME
 *  raw-`parseColor` value the generic `ELEMENT_BUCKET_SNAMES` bucket
 *  populates for every other element kind (`note`, `spot<Kind>`). A plain
 *  color NAME still needs HColorSet resolution (`resolveColorToSvgHex`,
 *  mirroring `renderer-note.ts#resolveNoteBackground`'s identical branch).
 *  Gradient `Paint`s are NOT supported here (unlike that note precedent) --
 *  `classifierFill`'s return type is `string`, shared with two other
 *  callers (`renderEnhancedBody`/`renderVisibilityUrlBackground`) that
 *  don't accept a `Paint`; widening all three for a feature no fixture in
 *  the corpus exercises is out of this iteration's scope -- falls through
 *  to the class default in that (currently unencountered) case, same as
 *  "unset". */
export function resolveElementBackground(
  theme: Theme,
  sname: string,
  // B13/M22: the classifier's own `<<stereo>>` label(s). A
  // stereotype-qualified `skinparam <sname>BackgroundColor<<label>>` wins
  // over the bare bucket, because upstream registers it at +1000 priority
  // (`style/StyleLoader.java:178-186`, via `FromSkinparamToStyle#addStyle`'s
  // `addPriorityForStereotype`). Optional so every existing caller keeps its
  // pre-B13 behavior.
  stereotypeLabels?: readonly string[],
): string | undefined {
  const byStereo = theme.colors.elements?.[sname]?.backgroundColorByStereo;
  if (byStereo !== undefined && stereotypeLabels !== undefined) {
    // Last label wins, mirroring the merge's own last-registered-wins rule.
    let hit: string | undefined;
    for (const label of stereotypeLabels) {
      const v = byStereo[label];
      if (v !== undefined) hit = v;
    }
    if (hit !== undefined) return resolveColorToSvgHex(hit);
  }
  const bucket = theme.colors.elements?.[sname]?.background;
  if (typeof bucket === 'string') return resolveColorToSvgHex(bucket);
  return undefined;
}

/** G3/O2: `theme.colors.elements[sname].font` -- the SAME generic
 *  `ELEMENT_BUCKET_SNAMES` bucket {@link resolveElementBackground} reads,
 *  for the `fontcolor` field `collectElementStyleBuckets` already extracts
 *  (unchanged there; only THIS consumption was missing). Jar-verified
 *  `figeze-77-fozi735`: `<style> objectDiagram { object { FontColor blue }
 *  } </style>` tints every object-kind row's text, independent of a `root
 *  { FontColor Red }` block that would otherwise apply. */
export function resolveElementFont(theme: Theme, sname: string): string | undefined {
  const bucket = theme.colors.elements?.[sname]?.font;
  if (typeof bucket === 'string') return resolveColorToSvgHex(bucket);
  return undefined;
}

/** G3/O4: `theme.colors.elements[sname].headerBackground` -- the
 *  `<style> <sname> { header { BackgroundColor ... } } }` nested-selector
 *  override (`theme.ts#ElementColors`'s own field doc comment). Read by
 *  `buildHeaderPrimitive`'s own header-background-split gate, NEVER by
 *  `classifierFill` (the body rect's fill stays the bare bucket's
 *  `background`, unaffected). */
export function resolveElementHeaderBackground(theme: Theme, sname: string): string | undefined {
  const bucket = theme.colors.elements?.[sname]?.headerBackground;
  if (typeof bucket === 'string') return resolveColorToSvgHex(bucket);
  return undefined;
}

/** G3/O4: `theme.colors.elements[sname].headerFont` -- the SAME nested
 *  `header { FontColor ... } }` override, for the NAME row's text color
 *  (member rows keep {@link resolveElementFont}'s bare-bucket value). */
export function resolveElementHeaderFont(theme: Theme, sname: string): string | undefined {
  const bucket = theme.colors.elements?.[sname]?.headerFont;
  if (typeof bucket === 'string') return resolveColorToSvgHex(bucket);
  return undefined;
}

export function classifierFill(geo: ClassifierGeo, theme: Theme): string {
  // Upstream has no `enum`/`interface` StyleSignature for the box fill --
  // `EntityImageClassHeader#getStyleSignature` (and the lollipop-interface
  // eye's own `ColorParam.classBackground` read) both key on `SName.class_`
  // UNCONDITIONALLY for every leaf kind; only the small spot-badge circle
  // varies per-LeafType (`spotClass`/`spotEnum`/`spotInterface`, already
  // ported separately in class-badge.ts#badgeFill). `theme.colors.graph.
  // enumBackground`/`interfaceBackground` are readable-but-dead skinparam/
  // `<style>` slots this port invented with no upstream target -- jar-
  // verified (`pijoji-10-tazo455`: `skinparam enum { BackgroundColor blue }`
  // + `skinparam class { BackgroundColor LightBlue }`, the enum's own box
  // fill is LightBlue, the CLASS color, not blue). G2 N12.
  // G2 N31: `geo.color` is the RAW space-joined `COLOR [LINECOLOR]` capture
  // from `class-declaration-parser.ts#extractDecorations`; `resolveBareOr
  // BackColor` reads only the COLOR half's background component (G2 N34:
  // moved to `core/color-override.ts` (T4, SI27) so `renderer-note.ts` AND
  // state's `state-render-colors.ts` can reuse the SAME grammar for a
  // note's/state's own `#color` override -- see that module's doc comment
  // for the full extraction rule).
  const override = resolveBareOrBackColor(geo.color);
  if (override !== undefined) return resolveColorToSvgHex(override);
  // G3/O1: `object`/`map`/`json` each carry their OWN StyleSignature
  // upstream (`SName.object`/`map`/`json` under `SName.objectDiagram`),
  // independent of class's `SName.class_` (`EntityImageObject`/`Map`/
  // `Json#getStyleSignature`) -- so they read their OWN `skinparam
  // {object,map,json}BackgroundColor` bucket instead of the class
  // `.tagname`/ancestor cascade below, which is genuinely class-only
  // upstream (jar-verified: `skinparam objectBackgroundColor` never tints a
  // PLAIN `class`, and vice versa -- majake-62-pero492). Falls through to
  // the SAME terminal class default ONLY because object/map/json have no
  // distinct default color of their own upstream (all three coincidentally
  // default to jar's shared `#F1F1F1`), not because they share class's
  // cascade. B13/M22: `<<tag>>`-scoped `objectBackgroundColor<<X>>` now
  // resolves here too -- the note that called it "a SEPARATE, larger,
  // deferred mechanism" was written before `babcfa94` landed the same shape
  // for FontSize, and is retired. (The GENERIC rewrite -- upstream needs no
  // per-key matcher at all -- remains tracked; see the ledger's M22 row.)
  if (geo.kind === 'object' || geo.kind === 'map' || geo.kind === 'json') {
    return resolveElementBackground(theme, geo.kind, geo.stereotypeLabels)
      ?? classDefaultBackground(theme);
  }
  // G2 N37: the `.tagname` sub-selector cascade (`class { .mystyle {
  // BackgroundColor cyan } } }`) wins over the plain ancestor cascade below
  // when the classifier carries a matching stereotype -- see
  // `style-cascade-class.ts#resolveClassTagCascadeEntry`'s own doc comment.
  const tagBackground = resolveClassTagCascadeEntry(theme, geo.stereotypeLabels, geo.styleGeneration)?.background;
  if (tagBackground !== undefined) return tagBackground;
  // G2 N36: `classCascadeBackground` is a STRICT SUPERSET of what the
  // pre-existing bare `class {}` bucket (`classBackground`, `style-map-
  // theme.ts`) could ever populate from the SAME StyleMap -- it additionally
  // covers the `classDiagram`/`root` ancestor layer and nested `classDiagram
  // .class {}` -- see `theme.ts`'s own field doc comment.
  return classDefaultBackground(theme);
}

/**
 * G2 N36: box/divider/map-divider stroke color -- the SAME `classDiagram
 * {}`/`root {}`/nested `classDiagram { class {...} } }` LineColor ancestor
 * cascade `classifierFill` reads for BackGroundColor above
 * (`EntityImageClass.java`'s single `getStyle().value(PName.LineColor)`
 * call feeds BOTH the box rect's stroke AND -- via the shared `ug.apply
 * (borderColor)` drawing-context color -- every divider line jar draws
 * inside it, jar-verified `bikuka-40-pezi068`/`tolavi-09-jovu646`). No
 * PER-CLASSIFIER inline `##linecolor` override is threaded here (unlike
 * `classifierFill`'s `resolveBareOrBackColor` -- `Classifier.color`'s own
 * line-color half is a SEPARATE, unsurveyed mechanism, out of this
 * iteration's scope).
 */
export function classBorder(geo: ClassifierGeo, theme: Theme): string {
  // G2 N37: the `.tagname` sub-selector cascade wins over the plain
  // ancestor cascade -- see `classifierFill`'s identical precedent above.
  const tagBorder = resolveClassTagCascadeEntry(theme, geo.stereotypeLabels, geo.styleGeneration)?.border;
  // G2 N51: `skinparam classBorderColor #X` -- the bare (non-`<style>`,
  // non-tag) fallback tier, mirroring `classifierFill`'s identical
  // `classCascadeBackground ?? classBackground` two-tier precedent -- see
  // `theme.ts#classBorder`'s own doc comment.
  return tagBorder ?? theme.colors.graph.classCascadeBorder ?? theme.colors.graph.classBorder ?? theme.colors.border;
}

/**
 * G2 N51: box/divider stroke WIDTH -- the classifier box outline's and
 * every divider line's own `stroke-width`, jar default `0.5`
 * (`EntityImageClass.java`'s `getStyle().value(PName.LineThickness)`, the
 * SAME `element.class_` StyleSignature `classBorder` above reads for
 * LineColor). Per-stereotype `classBorderThickness<<X>>` wins over the
 * plain `classBorderThickness` skinparam, which wins over the `0.5`
 * default -- see `theme.ts#classBorderThicknessByStereo`'s own doc
 * comment for why this is a DIRECT skinparam-value lookup, not a
 * `<style>`/`.tagname` cascade (so it does NOT consult
 * `resolveClassTagCascadeEntry`, unlike `classBorder`/`classifierFill`
 * above).
 */
export const CLASS_BORDER_STROKE_WIDTH_DEFAULT = 0.5;
export function classBorderStrokeWidth(geo: ClassifierGeo, theme: Theme): number {
  const byStereo = theme.colors.graph.classBorderThicknessByStereo;
  if (byStereo !== undefined && geo.stereotypeLabels !== undefined) {
    for (const label of geo.stereotypeLabels) {
      const hit = byStereo[label.toLowerCase()];
      if (hit !== undefined) return hit;
    }
  }
  return theme.colors.graph.classBorderThickness ?? CLASS_BORDER_STROKE_WIDTH_DEFAULT;
}

/**
 * G3/O3: `map`/`json` row dividers (`TextBlockMap#drawU`/
 * `TextBlockCucaJSon`'s `ULine.hline`/`vline`) draw on a UGraphic derived
 * from `UGraphicStencil.create(ug, this, stroke)` -- built from the OUTER
 * `ug`, taken BEFORE `EntityImageMap/Json#drawU` applies `ug.apply(stroke)`
 * for the box's own outline -- so these lines never inherit the
 * classifier's own border stroke width (`classBorderStrokeWidth` above,
 * which class/interface/enum's OWN body dividers correctly DO use --
 * `EntityImageClass`'s different draw path, proven exact since G2's
 * 292/718 census). Jar-verified: `stroke-width:1` on every sampled map/json
 * divider regardless of `skinparam classBorderThickness`. Also unlike
 * class/interface/enum's own dividers, map/json dividers span the FULL box
 * width (no 1px inset) -- see `buildBodyPrimitives`'s own doc comment.
 * @see ~/git/plantuml/.../svek/image/EntityImageMap.java#drawU (ug2 derivation)
 */
export const MAP_JSON_DIVIDER_STROKE_WIDTH = 1;
