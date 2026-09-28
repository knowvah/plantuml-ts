/**
 * Element-scoped `<style>` block routing — decision D4.
 *
 * Split out of `style-map-theme.ts` (which is at the module-size limit): this
 * holds the per-element bucket collection (T5) plus the document-background
 * resolver relocated from `applyStyleMap` to make room. Both are pure
 * functions over a {@link StyleMap}.
 */

import type { ElementColors } from './theme.js';
import type { StyleMap } from './skinparam.js';
import { resolveColor, ELEMENT_BUCKET_SNAMES } from './skinparam.js';
import { parseColor } from './paint.js';
import { lineStyleDash } from './style-line-style.js';
import { cleanStereotypeToken } from './style-map-tag-cascade.js';

/** `<sname>.stereotype` selector suffix (`<style> <sname> { stereotype {
 *  FontSize N } } }`) — G1 I4b. The per-stereotype-NAME sub-selector nested
 *  one level deeper is {@link STEREOTYPE_TAG_SELECTOR_INFIX} — no longer
 *  deferred (S1L-tail G4 tier 2, `loroto-06-fano471`). */
const STEREOTYPE_SELECTOR_SUFFIX = '.stereotype';

/** `<sname>.stereotype..<tag>` (`<style> <sname> { stereotype { .bar {
 *  FontSize N } } } }`) — S1L-tail G4 tier 2. `parseStyleBlock` keeps a
 *  dot-led token's leading dot, so the flattened key carries a DOUBLE dot
 *  before the tag (`style-map-tag-cascade.ts#parseTagSelector`'s own shape). Feeds
 *  `ElementColors.stereotypeFontSizeByStereo`. */
const STEREOTYPE_TAG_SELECTOR_INFIX = `${STEREOTYPE_SELECTOR_SUFFIX}..`;

/** `<sname>.header` selector suffix (`<style> <sname> { header {
 *  BackgroundColor/FontColor/FontSize } } }`) -- G3/O4, `EntityImage
 *  Object`/`Map`/`Json`'s own `getStyleHeader()` nested selector
 *  (`theme.ts#ElementColors`'s `headerBackground`/`headerFont`/
 *  `headerFontSize` field doc comment). Mirrors {@link
 *  STEREOTYPE_SELECTOR_SUFFIX}'s exact shape -- a distinct suffix (not
 *  merged with it) since the two populate DIFFERENT fields and the
 *  underlying upstream selectors are independent nested tokens. */
const HEADER_SELECTOR_SUFFIX = '.header';

/** `<sname>.title` (`<style> <sname> { title { FontColor X } } }`) -- cdd6
 *  T1a. The cluster header's own signature ends in `title`
 *  (`ClusterHeader.java:151-165`: `{..., <usymbol>, composite, title}` /
 *  `{..., package_, title}`), as do the empty-package leaf
 *  (`EntityImageEmptyPackage.java:88`) and a description leaf's name
 *  (`EntityImageDescription.java:146-149`). Feeds `ElementColors.titleFont`. */
const TITLE_SELECTOR_SUFFIX = '.title';

/** `<sname>..<tag>` (`<style> <sname> { .tag { FontColor X } } }`) -- cdd6
 *  T1a. Same double-dot shape as {@link STEREOTYPE_TAG_SELECTOR_INFIX}
 *  (`style-map-tag-cascade.ts#parseTagSelector`). */
const TAG_SELECTOR_INFIX = '..';

/** SNames that exist only as a CLUSTER signature member, never as a
 *  skinparam `addMagic` bucket: `group` (`Cluster.java:286-296`
 *  `getDefaultStyleDefinition` puts `SName.group` in every non-state cluster
 *  signature). Admitted to the `<style>` bucket routing only, so a bare
 *  `group { LineStyle 2 }` lands in `elements.group` (jar: every cluster
 *  draws `stroke-dasharray:2,2`). cdd6 T1a. */
const CLUSTER_BUCKET_SNAMES: ReadonlySet<string> = new Set(['group']);

/**
 * Diagram-type style-selector names (`SName` values PlantUML's style engine
 * registers per diagram type, e.g. `classDiagram`/`componentDiagram` —
 * `net/sourceforge/plantuml/style/SName.java`) that a bare `<style>` block
 * may target directly (`classDiagram { BackGroundColor ... }`) or nest a
 * `document { ... }` selector under (`classDiagram { document { ... } }`).
 * Covers every diagram type this mission's DOT gate spans (G2 N7); the
 * `json`/`yaml`/`hcl` entries below predate this list and are kept as their
 * own tier for the same reason (untouched, no fixture forced reordering
 * them). G3/O2: also the recognized PREFIX for a diagram-type-nested
 * element bucket (`objectDiagram { object { ... } }` -> selector path
 * "objectdiagram.object") -- see {@link collectElementStyleBuckets}'s own
 * doc comment for the jar-verified mechanism.
 */
const DIAGRAM_TYPE_SELECTOR_NAMES = [
  'classdiagram',
  'componentdiagram',
  'usecasediagram',
  'statediagram',
  'objectdiagram',
  // mission activity-style-defaults T1: `activitydiagram3`'s own style
  // signatures are diagram-scoped in exactly this shape --
  // `StyleSignatureBasic.of(root, element, activityDiagram, <sname>)` at
  // `activitydiagram3/ftile/vertical/FtileBox.java:98` (activity),
  // `ftile/FtileFactoryDelegator.java:84` (arrow),
  // `ftile/Swimlanes.java:127` + `ftile/LaneDivider.java:72` (swimlane) and
  // `ftile/vcompact/FtileWithNoteOpale.java:89` (note) -- and `plantuml.skin
  // :358-385` writes the built-in defaults as an `activityDiagram { <sname>
  // { ... } }` block, the same nesting every entry above already covers.
  // Without this entry `<style> activityDiagram { activity { FontSize 20 } }`
  // produced the selector "activitydiagram.activity", matched neither a bare
  // bucket name nor a recognized prefix, and was silently dropped.
  //
  // This DOES widen the shared buckets: `activityDiagram { note { ... } }`
  // now feeds the same `note` bucket a class diagram's `note { ... }` feeds,
  // and `activityDiagram { arrow { ... } }` would feed `arrow` if `arrow`
  // were ever admitted to ELEMENT_BUCKET_SNAMES (it is not -- D3). That
  // widening is upstream's own behavior, not a side effect: `note` under
  // `activityDiagram` IS `SName.note` upstream (FtileWithNoteOpale above),
  // and our bucket map being FLAT (this function collapses the prefix) is
  // the reason activity's own DEFAULTS live in
  // `diagrams/activity/activity-style-defaults.ts` instead (D2). A user who
  // writes the nested selector is asking for the nested selector's upstream
  // meaning; only the DEFAULT tier is the one a flat map cannot express.
  'activitydiagram',
] as const;

/**
 * Resolves a StyleMap selector path to the {@link ELEMENT_BUCKET_SNAMES}
 * bucket it feeds, or `undefined` if it targets neither a bare bucket name
 * nor a `<diagramType>.<bucket>` nesting. G3/O2: `EntityImageObject`'s own
 * StyleSignature chain is `root -> element -> objectDiagram -> object`
 * (`EntityImageObject#getStyleSignature`, upstream Java) -- a `<style>`
 * block may write the `object`/`map`/`json` bucket bare OR nested under its
 * owning diagram-type selector (`objectDiagram { object { BackgroundColor
 * ... } } }`), and both forms feed the SAME bucket. Jar-verified
 * `figeze-77-fozi735`: `objectDiagram { object { FontColor blue;
 * BackgroundColor yellow } }` wins over a `root { FontColor Red;
 * BackgroundColor palegreen }` block for every object-kind classifier's
 * fill/text color -- the nested form was previously unrecognized entirely
 * (fell through to `applyStyleMap`'s generic/class handling, which has no
 * rule for it either, so it was silently dropped).
 */
function resolveElementBucketSelector(selector: string): string | undefined {
  if (isBucketSName(selector)) return selector;
  for (const diagramType of DIAGRAM_TYPE_SELECTOR_NAMES) {
    const prefix = `${diagramType}.`;
    if (!selector.startsWith(prefix)) continue;
    const sname = selector.slice(prefix.length);
    if (isBucketSName(sname)) return sname;
  }
  return undefined;
}

function isBucketSName(sname: string): boolean {
  return ELEMENT_BUCKET_SNAMES.has(sname) || CLUSTER_BUCKET_SNAMES.has(sname);
}

/**
 * cdd6 T1a: `<sname> { .tag { FontColor X } } }` -- the stereotype-re-signed
 * FontColor (`StyleSignatureBasic#withTOBECHANGED` matching the tag against
 * the element's own stereotype, `Cluster.java:388-389`), merged into
 * `elements[sname].fontByStereo` under the CLEANED tag -- the same map the
 * skinparam `<sname>FontColor<<label>>` front-end writes. The caller has
 * already claimed `<sname>.stereotype..<tag>`. Returns whether `selector`
 * was a tag sub-selector.
 */
function collectTagFontColor(
  selector: string,
  props: ReadonlyMap<string, string>,
  elements: Record<string, ElementColors>,
): boolean {
  const idx = selector.indexOf(TAG_SELECTOR_INFIX);
  if (idx <= 0) return false;
  const sname = resolveElementBucketSelector(selector.slice(0, idx));
  const tag = cleanStereotypeToken(selector.slice(idx + TAG_SELECTOR_INFIX.length));
  const fc = props.get('fontcolor');
  if (sname === undefined || tag === '' || fc === undefined) return true;
  const prev = elements[sname]?.fontByStereo;
  elements[sname] = { ...elements[sname], fontByStereo: { ...prev, [tag]: resolveColor(fc) } };
  return true;
}

/**
 * `<sname>.stereotype` -- G1 I4b's `FontSize`, and (cdd6 T1a) `FontColor`:
 * the cluster stereotype block's own style is `getDefaultStyleDefinition(...)
 * .forStereotypeItself(stereotype)` (`ClusterHeader.java:209-215`), whose
 * FontColor this carries as `stereotypeFont`. Resolved through
 * `resolveColor`, the same form the `packageStereotypeFontColor` skinparam
 * stores in that field.
 */
function collectStereotypeSubSelector(
  sname: string,
  props: ReadonlyMap<string, string>,
  elements: Record<string, ElementColors>,
): void {
  if (!ELEMENT_BUCKET_SNAMES.has(sname)) return;
  const bucket: Partial<ElementColors> = {};
  const fs = props.get('fontsize');
  const size = fs === undefined ? Number.NaN : Number(fs);
  if (Number.isFinite(size)) bucket.stereotypeFontSize = size;
  const fc = props.get('fontcolor');
  if (fc !== undefined) bucket.stereotypeFont = resolveColor(fc);
  if (Object.keys(bucket).length > 0) elements[sname] = { ...elements[sname], ...bucket };
}

/** cdd6 T1a: `<sname>.title { FontColor X }` -> `titleFont` (see
 *  {@link TITLE_SELECTOR_SUFFIX}). Parsed like `headerFont`. */
function collectTitleSubSelector(
  sname: string,
  props: ReadonlyMap<string, string>,
  elements: Record<string, ElementColors>,
): void {
  const fc = props.get('fontcolor');
  if (!ELEMENT_BUCKET_SNAMES.has(sname) || fc === undefined) return;
  elements[sname] = { ...elements[sname], titleFont: parseColor(fc) };
}

/**
 * S1L-tail G4 tier 2: the `<sname> { stereotype { .tag { FontSize N } } }`
 * per-stereotype-NAME font size, merged into `elements[sname]
 * .stereotypeFontSizeByStereo` under its CLEANED tag token. Returns whether
 * `selector` was this shape (so the caller can skip its other branches).
 * Split out rather than inlined as {@link collectElementStyleBuckets}'s
 * fourth branch — that function already carries a `#lizard forgives`. */
function collectStereotypeTagFontSize(
  selector: string,
  props: ReadonlyMap<string, string>,
  elements: Record<string, ElementColors>,
): boolean {
  const idx = selector.indexOf(STEREOTYPE_TAG_SELECTOR_INFIX);
  if (idx === -1) return false;
  const sname = selector.slice(0, idx);
  const tag = cleanStereotypeToken(selector.slice(idx + STEREOTYPE_TAG_SELECTOR_INFIX.length));
  const raw = props.get('fontsize');
  const size = raw === undefined ? Number.NaN : Number(raw);
  if (!ELEMENT_BUCKET_SNAMES.has(sname) || tag === '' || !Number.isFinite(size)) return true;
  const prev = elements[sname]?.stereotypeFontSizeByStereo;
  elements[sname] = { ...elements[sname], stereotypeFontSizeByStereo: { ...prev, [tag]: size } };
  return true;
}

/**
 * Collect per-element (SName) color/font-size buckets from element-scoped
 * style blocks (e.g. `database { BackgroundColor X }`, G1 I4b: `component {
 * FontSize N }` / `component { stereotype { FontSize N } }`). Color values
 * run through `parseColor` so a gradient becomes a
 * {@link import('./paint.js').Gradient} Paint, consistent with the
 * skinparam path (T4). Selectors are resolved via {@link
 * resolveElementBucketSelector} (bare bucket name, `<diagramType>.<bucket>`
 * nesting, or `<sname>.stereotype`); all others are left for
 * `applyStyleMap`'s existing generic/class handling.
 */
export function collectElementStyleBuckets(styleMap: StyleMap): Record<string, ElementColors> {
  const elements: Record<string, ElementColors> = {};
  for (const [selector, props] of styleMap.entries()) {
    if (collectStereotypeTagFontSize(selector, props, elements)) continue;
    if (collectTagFontColor(selector, props, elements)) continue;
    const bucketName = resolveElementBucketSelector(selector);
    if (bucketName !== undefined) {
      const bucket: ElementColors = {};
      const bg = props.get('backgroundcolor');
      if (bg !== undefined) bucket.background = parseColor(bg);
      const bd = props.get('bordercolor');
      if (bd !== undefined) bucket.border = parseColor(bd);
      // `LineColor` is the canonical `<style>`-block border/line color PName
      // (`BorderColor` above is the skinparam-side alias); read last so an
      // explicit LineColor wins. `skin rose`'s `componentDiagram { node,
      // rectangle { LineColor black } }` tints deployment node/rectangle
      // borders black, overriding root's own #A80036 (a more-specific SName).
      const lc = props.get('linecolor');
      if (lc !== undefined) bucket.border = parseColor(lc);
      const fc = props.get('fontcolor');
      if (fc !== undefined) bucket.font = parseColor(fc);
      const lt = props.get('linethickness');
      if (lt !== undefined) {
        const thickness = Number.parseFloat(lt);
        if (Number.isFinite(thickness)) bucket.lineThickness = thickness;
      }
      // S1L-b T5: the per-element `MinimumWidth` content-width floor
      // (`PName.MinimumWidth`), scoped to this bucket's SName --
      // `resolveElementMinimumWidth` cascades it over the global
      // `theme.minimumWidth` (bare `skinparam minClassWidth`). zotiru-33's
      // `<style> package { MinimumWidth 300 }` floors packages but not a
      // sibling card (ADR-3). Parsed with `parseFloat` like `linethickness`.
      const mw = props.get('minimumwidth');
      if (mw !== undefined) {
        const minWidth = Number.parseFloat(mw);
        if (Number.isFinite(minWidth)) bucket.minimumWidth = minWidth;
      }
      // mission activity-style-defaults T1 (D4): the per-element
      // `RoundCorner` corner radius (`PName.RoundCorner`), scoped to this
      // bucket's SName -- `activityDiagram { activity { RoundCorner 25 } }`
      // (`plantuml.skin:361`). Stored RAW/UNHALVED, exactly as
      // `classCascadeRoundCorner` stores the class-diagram ancestor tier;
      // consumers emit `rx` = `ry` = value / 2 (`URectangle.ts#build()
      // .rounded()`'s halving convention). Parsed with `parseFloat` like
      // `linethickness` and `minimumwidth` -- a `RoundCorner 12.5` is legal.
      const rc = props.get('roundcorner');
      if (rc !== undefined) {
        const radius = Number.parseFloat(rc);
        if (Number.isFinite(radius)) bucket.roundCorner = radius;
      }
      const fs = props.get('fontsize');
      if (fs !== undefined) {
        const size = Number(fs);
        if (Number.isFinite(size)) bucket.fontSize = size;
      }
      // mission skin-file-loading follow-on (README deferred #3, `element {}`
      // general subset matcher): the PER-BUCKET `Shadowing` override -- rose's
      // `node { Shadowing 2.0 }` / `rectangle { Shadowing 3.0 }` / ... each
      // beat the bare `element { Shadowing 4.0 }` universal default for their
      // own USymbol kind. `resolveElementShadowing` (`theme.ts`) already
      // cascades `elements[sname].shadowing` over the global
      // `theme.shadowing` (bare root/element, {@link resolveGlobalShadowing}),
      // so populating the per-bucket field here is the only missing wire.
      // Parsed with `parseFloat` to match `resolveGlobalShadowing`'s own
      // convention (values are `2.0`/`4.0`).
      const sh = props.get('shadowing');
      if (sh !== undefined) {
        const shadow = Number.parseFloat(sh);
        if (Number.isFinite(shadow)) bucket.shadowing = shadow;
      }
      // cdd6 T1a: `PName.LineStyle`, parsed as `Style#getStroke` does.
      const ls = props.get('linestyle');
      if (ls !== undefined) bucket.lineStyle = lineStyleDash(ls);
      if (Object.keys(bucket).length > 0) {
        elements[bucketName] = { ...elements[bucketName], ...bucket };
      }
      continue;
    }

    if (selector.endsWith(STEREOTYPE_SELECTOR_SUFFIX)) {
      collectStereotypeSubSelector(selector.slice(0, -STEREOTYPE_SELECTOR_SUFFIX.length), props, elements);
      continue;
    }

    if (selector.endsWith(TITLE_SELECTOR_SUFFIX)) {
      collectTitleSubSelector(selector.slice(0, -TITLE_SELECTOR_SUFFIX.length), props, elements);
      continue;
    }

    if (selector.endsWith(HEADER_SELECTOR_SUFFIX)) {
      const sname = selector.slice(0, -HEADER_SELECTOR_SUFFIX.length);
      if (!ELEMENT_BUCKET_SNAMES.has(sname)) continue;
      const bucket: Partial<ElementColors> = {};
      const bg = props.get('backgroundcolor');
      if (bg !== undefined) bucket.headerBackground = parseColor(bg);
      const fc = props.get('fontcolor');
      if (fc !== undefined) bucket.headerFont = parseColor(fc);
      const fs = props.get('fontsize');
      if (fs !== undefined) {
        const size = Number(fs);
        if (Number.isFinite(size)) bucket.headerFontSize = size;
      }
      if (Object.keys(bucket).length > 0) {
        elements[sname] = { ...elements[sname], ...bucket };
      }
    }
  }
  // #lizard forgives -- pre-existing (unchanged by G2 N7); THREE independent
  // bucket-collection branches (bare/nested SName + `.stereotype` suffix +
  // G3/O4's `.header` suffix) push this over the CCN/NLOC threshold.
  return elements;
}

/**
 * `document { BackgroundColor }` canvas-background selector precedence,
 * broadest first ("last wins" in `resolveDocumentBackground`'s scan) —
 * mirrors upstream's style-cascade specificity rule (a more-scoped selector
 * always outranks a broader one): bare `root` < bare `document` < a
 * diagram-type-scoped `document` variant < a bare diagram-type selector <
 * that diagram type's OWN nested `document` selector (jar-verified:
 * `bikuka-40-pezi068` — `classDiagram { BackGroundColor Green }` beats
 * `root { BackGroundColor Red }`; `cilaba-36-zogi212` — `classDiagram {
 * document { BackGroundColor Yellow } }` beats `classDiagram { BackGroundColor
 * Green }`, G2 N7).
 */
const DOCUMENT_BACKGROUND_SELECTOR_PRECEDENCE: readonly string[] = [
  'root',
  'document',
  'jsondiagram.document',
  'yamldiagram.document',
  'hcldiagram.document',
  ...DIAGRAM_TYPE_SELECTOR_NAMES,
  ...DIAGRAM_TYPE_SELECTOR_NAMES.map((name) => `${name}.document`),
];

/**
 * Resolve the `document { BackgroundColor }` canvas background from a
 * StyleMap. Checks the bare `document` selector then diagram-type-scoped
 * variants (last wins). Relocated verbatim from `applyStyleMap`; G2 N7
 * widened the precedence list from `document`/json`/yaml`/hcl only to also
 * cover a bare `root` selector and every DOT-gate diagram type's bare +
 * nested `document` selector (`bikuka-40-pezi068`/`cilaba-36-zogi212`).
 */
export function resolveDocumentBackground(styleMap: StyleMap): string | undefined {
  let documentBg: string | undefined;
  for (const sel of DOCUMENT_BACKGROUND_SELECTOR_PRECEDENCE) {
    const doc = styleMap.get(sel);
    if (doc !== undefined) {
      const bg = doc.get('backgroundcolor');
      if (bg !== undefined) documentBg = resolveColor(bg);
    }
  }
  return documentBg;
}

// cdd6 T1a: pure file-cap moves -- see `style-map-tag-cascade.ts` and
// `style-map-global.ts`.
export {
  cleanStereotypeToken,
  collectStyleTagNames,
  resolveStyleCascade,
  computeShowStereotypeByTag,
  computeNoteStyleTagCascade,
} from './style-map-tag-cascade.js';
export { resolveGlobalShadowing, resolveGlobalBackground, resolveGlobalBorder } from './style-map-global.js';
