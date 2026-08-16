/**
 * Selector → Theme field mapping (element-scoped <style> blocks).
 *
 * Extracted verbatim from src/index.ts to keep that entry module under the
 * line cap. Mirrors upstream StyleSignature resolution: selector paths map to
 * specific Theme color fields. `applyStyleMap` itself is a composition of
 * several table-driven sub-resolvers (`style-map-simple-fields.ts`,
 * `style-map-json-diagram.ts`, `style-map-element.ts`,
 * `style-cascade-class.ts`) split out purely to satisfy per-file/per-function
 * size limits — the field mappings, cascade/priority order, and defaults are
 * unchanged from the original single-function version (see .agent-notes).
 */

import type { Theme, ElementColors } from './theme.js';
import type { StyleMap } from './skinparam.js';
import { deepMergeTheme } from './theme.js';
import { resolveColor } from './skinparam.js';
import {
  collectElementStyleBuckets,
  resolveDocumentBackground,
  computeNoteStyleTagCascade,
  resolveGlobalShadowing,
  resolveGlobalBackground,
  resolveGlobalBorder,
} from './style-map-element.js';
import {
  computeClassStyleCascadeOverrides,
  computeCardinalityFontOverride,
} from './style-cascade-class.js';
import { computeSimpleSelectorOverrides } from './style-map-simple-fields.js';
import {
  computeJsonFamilyOverride,
  computeYamlFamilyOverride,
  computeHclFamilyOverride,
  computeHighlightClassesOverride,
} from './style-map-json-diagram.js';

type GraphColors = Theme['colors']['graph'];
type JsonGraphOverride = Partial<NonNullable<GraphColors['json']>>;

/**
 * JSON diagram: element / element.header / element.highlight /
 * jsondiagram.node (from jsonDiagram { node { … } } style block), plus the
 * yamlDiagram/hclDiagram siblings sharing the same "json" graph bucket —
 * see `style-map-json-diagram.ts`'s own head doc comment. Each family is
 * merged in the SAME order the original if-chain processed them (json, then
 * yaml, then hcl) so a fixture combining more than one family resolves
 * identically to before. Returns `undefined` when no family (nor any
 * `.tagname` highlight class) contributed anything — matching the original
 * "only assign `graphOverride.json` when non-empty" gate.
 */
function computeJsonGraphOverride(styleMap: StyleMap, jsonBase: JsonGraphOverride): JsonGraphOverride | undefined {
  const jsonOverride: JsonGraphOverride = {
    ...computeJsonFamilyOverride(styleMap),
    ...computeYamlFamilyOverride(styleMap),
    ...computeHclFamilyOverride(styleMap),
  };
  const highlightClasses = computeHighlightClassesOverride(styleMap);
  if (highlightClasses !== undefined) jsonOverride.highlightClasses = highlightClasses;
  return Object.keys(jsonOverride).length > 0 ? { ...jsonBase, ...jsonOverride } : undefined;
}

/**
 * Every `Theme.colors.graph` override reachable from `styleMap` alone
 * (i.e. everything except the document/elements/shadowing/border extras
 * handled by {@link computeStyleMapExtras}): the simple single-selector
 * table, the json/yaml/hcl diagram family, the class-cascade ancestor
 * overrides (G2 N36), and the bare root/element BackgroundColor cascade
 * (D3).
 */
function computeGraphOverride(styleMap: StyleMap, base: Theme): Partial<GraphColors> {
  const graphOverride: Partial<GraphColors> = { ...computeSimpleSelectorOverrides(styleMap) };
  const json = computeJsonGraphOverride(styleMap, base.colors.graph.json ?? {});
  if (json !== undefined) graphOverride.json = json;
  // G2 N36: classDiagram/root/nested-class-selector ancestor cascade (box
  // background/border/font, badge root-fallback, edge stroke) -- merged
  // into graphOverride BEFORE the early-return check below so a fixture
  // with ONLY a cascade-shaped <style> block (no bare `class {}`/
  // `database {}` selector) still produces a non-base Theme.
  // B4 (A2s): `skinparam wrapWidth` seeds the MaximumWidth cascade defaults;
  // an explicit <style> MaximumWidth still wins (per-field ??= inside).
  Object.assign(graphOverride, computeClassStyleCascadeOverrides(styleMap, base.wrapWidth));
  // mission skin-file-loading Batch 1 (D3): see `style-map-element.ts
  // #resolveGlobalBackground`'s own doc comment for the bare root/element
  // selector precedence this resolves.
  const rootElementBackground = resolveGlobalBackground(styleMap);
  if (rootElementBackground !== undefined) graphOverride.rootElementBackground = rootElementBackground;
  return graphOverride;
}

/** The non-`graph` StyleMap-derived Theme overrides, computed once and
 *  threaded through {@link applyStyleMapHasNoOverrides} and {@link
 *  buildStyleMapPartialTheme}. */
interface StyleMapExtras {
  readonly documentBg: string | undefined;
  readonly elements: Record<string, ElementColors>;
  readonly hasElements: boolean;
  readonly noteTagCascade: Readonly<Record<string, ElementColors>>;
  readonly hasNoteTagCascade: boolean;
  readonly shadowing: number | undefined;
  readonly rootElementBorderRaw: string | undefined;
  /** T14/D3: `computeCardinalityFontOverride`'s result -- the ONLY two
   *  `StyleMap`-derived fields that live at the TOP of `Theme` rather than
   *  under `colors.graph` (`theme.ts:21-22`), so they ride the partial's
   *  own top level in {@link buildStyleMapPartialTheme} instead of
   *  `graphOverride`. Empty (`{}`) for a StyleMap that never touches
   *  `arrow`/`arrow.cardinality` -- the caller keeps `base`'s own value via
   *  `deepMergeTheme`'s `partial[key] ?? base[key]` (`theme.ts:491`), which
   *  is how the "fallthrough through arrow, not a literal" behavior this
   *  task requires falls out for free. */
  readonly cardinalityFont: ReturnType<typeof computeCardinalityFontOverride>;
}

/**
 * document { BackgroundColor } canvas bg; database { … } → per-element
 * buckets (D4); the `.tagname` note-bucket cascade (G2 N37); the bare
 * root/element Shadowing/LineColor cascade (D3); and the D3 cardinality-font
 * cascade (T14).
 */
function computeStyleMapExtras(styleMap: StyleMap): StyleMapExtras {
  const elements = collectElementStyleBuckets(styleMap);
  const noteTagCascade = computeNoteStyleTagCascade(styleMap);
  return {
    documentBg: resolveDocumentBackground(styleMap),
    elements,
    hasElements: Object.keys(elements).length > 0,
    noteTagCascade,
    hasNoteTagCascade: Object.keys(noteTagCascade).length > 0,
    shadowing: resolveGlobalShadowing(styleMap),
    rootElementBorderRaw: resolveGlobalBorder(styleMap),
    cardinalityFont: computeCardinalityFontOverride(styleMap),
  };
}

/** True when neither `graphOverride` nor any extra resolved to anything —
 *  `applyStyleMap` returns `base` unchanged in that case. */
function styleMapHasNoOverrides(graphOverride: Partial<GraphColors>, extras: StyleMapExtras): boolean {
  return (
    Object.keys(graphOverride).length === 0 &&
    extras.documentBg === undefined &&
    !extras.hasElements &&
    !extras.hasNoteTagCascade &&
    extras.shadowing === undefined &&
    extras.rootElementBorderRaw === undefined &&
    Object.keys(extras.cardinalityFont).length === 0
  );
}

/**
 * Merge the `<style>`-derived element buckets onto `base.colors.elements`
 * **per SName**, mirroring `StyleBuilder#muteStyle`
 * (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/
 * StyleBuilder.java:86-104`): the incoming styles are merged into a COPY of
 * the existing storage one `StyleSignatureBasic` at a time — absent
 * signature → `put`, present signature → `orig.mergeWith(modifiedStyle,
 * MergeStrategy.OVERWRITE_EXISTING_VALUE)`. So the incoming block wins
 * FIELD-BY-FIELD inside its own signature, and can never evict a signature
 * it does not name.
 *
 * S1L-tail F4-e (M1, `plans/s1l-tail-fix/findings/fariba-82-residual.md`):
 * `deepMergeTheme`'s `colors: { ...base.colors, ...partial.colors }` spread
 * is shallow, so handing it a bare `elements` key REPLACED the whole map.
 * Any element-scoped `<style>` selector therefore deleted every
 * skinparam-derived bucket built by stage 2 — in `fariba-82-xolu802`, a
 * `<style> file { … }` block deleted `elements.rectangle`'s
 * `stereotypeFontSize: 12` (from awslib's `skinparam rectangle {
 * StereotypeFontSize 12 }`), forcing the `«User»` row to 14pt and +2px of
 * node height. Upstream cannot express that: `file` and `rectangle` are
 * distinct signatures.
 *
 * `stereotypeFontSizeByStereo` merges one level deeper for the same reason:
 * its keys are per-stereotype-NAME rules that upstream registers as their
 * OWN (more specific) signatures, so a `<style>` rule for one tag must not
 * evict a skinparam-derived rule for a different tag either.
 */
function mergeElementBuckets(base: Theme, incoming: Record<string, ElementColors>): Partial<Record<string, ElementColors>> {
  const merged: Partial<Record<string, ElementColors>> = { ...base.colors.elements };
  for (const [sname, style] of Object.entries(incoming)) {
    const orig = merged[sname];
    if (orig === undefined) {
      merged[sname] = style;
      continue;
    }
    const byStereo = { ...orig.stereotypeFontSizeByStereo, ...style.stereotypeFontSizeByStereo };
    merged[sname] = {
      ...orig,
      ...style,
      ...(Object.keys(byStereo).length > 0 ? { stereotypeFontSizeByStereo: byStereo } : {}),
    };
  }
  return merged;
}

/** Assemble the `Partial<Theme>` passed to `deepMergeTheme`. */
function buildStyleMapPartialTheme(base: Theme, graphOverride: Partial<GraphColors>, extras: StyleMapExtras): Partial<Theme> {
  return {
    ...(extras.shadowing !== undefined ? { shadowing: extras.shadowing } : {}),
    // T14/D3: top-level fold -- see StyleMapExtras#cardinalityFont's own
    // doc comment for why this rides the partial's top level rather than
    // graphOverride.
    ...extras.cardinalityFont,
    colors: {
      ...base.colors,
      ...(extras.documentBg !== undefined ? { background: extras.documentBg } : {}),
      ...(extras.rootElementBorderRaw !== undefined ? { border: resolveColor(extras.rootElementBorderRaw) } : {}),
      ...(extras.hasElements ? { elements: mergeElementBuckets(base, extras.elements) } : {}),
      ...(extras.hasNoteTagCascade ? { noteTagCascade: extras.noteTagCascade } : {}),
      graph: { ...base.colors.graph, ...graphOverride },
    },
  };
}

/**
 * Apply element-scoped StyleMap entries to a base Theme.
 *
 * Reads selector-keyed entries from the merged StyleMap and maps them to
 * their corresponding Theme fields. The top-level bare key ("") is handled
 * separately via resolveSkinparam and is not processed here.
 *
 * Returns a new Theme — neither `base` nor the StyleMap is mutated.
 */
export function applyStyleMap(styleMap: StyleMap, base: Theme): Theme {
  const graphOverride = computeGraphOverride(styleMap, base);
  const extras = computeStyleMapExtras(styleMap);
  if (styleMapHasNoOverrides(graphOverride, extras)) return base;
  return deepMergeTheme(base, buildStyleMapPartialTheme(base, graphOverride, extras));
}
