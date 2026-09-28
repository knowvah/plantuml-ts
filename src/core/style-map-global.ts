/**
 * Bare `root`/`element` universal-selector resolvers (the diagram-wide
 * Shadowing / BackgroundColor / LineColor defaults), moved verbatim out of
 * `style-map-element.ts` to keep that module under the 500-line cap (cdd6
 * T1a, a pure file-cap move; `style-map-element.ts` re-exports all three
 * public functions so every importer is unchanged).
 */

import type { StyleMap } from './skinparam.js';

/**
 * mission skin-file-loading Batch 1 (D3): the GLOBAL `theme.shadowing`
 * default -- the LAST `Shadowing` declaration registered under EITHER bare
 * "root" or bare "element" (in textual/insertion order, mirroring
 * {@link resolveStyleCascade}'s own "no specificity, last-registered-wins"
 * algorithm above). Both selectors are UNIVERSAL fallbacks in upstream's
 * compound `StyleSignatureBasic` (every entity kind's own style signature
 * includes both `root` and `element` as member SNames, per
 * `EntityImageStateCommon`/`EntityImageObject`'s own signature chains --
 * this module's head doc comment), so a bare declaration under either one
 * cascades to EVERY entity kind. This resolves ONLY the diagram-wide
 * default; a per-bucket-type Shadowing override (`<style> node { Shadowing
 * 2.0 } }`) is captured separately by {@link collectElementStyleBuckets}
 * into `elements[sname].shadowing` and layered on top by
 * `theme.ts#resolveElementShadowing`'s two-tier cascade (specific bucket
 * beats this global) -- the README-deferred `element {}` general subset
 * matcher, closed as a follow-on. `element` is declared LATER than `root`
 * in every sampled skin
 * (`rose.skin`: root's `Shadowing 0.0` then element's `Shadowing 4.0`), so
 * it naturally wins there; `debug.skin`'s `element {}` block sets no
 * Shadowing at all, so root's `Shadowing 0.0` stands unchanged. Returns
 * `undefined` when neither bare selector declares Shadowing (the
 * overwhelmingly common case -- zero-cost for every non-skin fixture).
 */
/**
 * Generic bare "root"/"element" universal-selector last-registered-wins
 * lookup — the shared scan {@link resolveGlobalShadowing} (and its color
 * siblings below) specialize to a single property. Returns the RAW
 * (unresolved) property value string, or `undefined` when neither bare
 * selector declares `property` -- zero-cost for every non-skin fixture.
 */
function resolveRootElementProperty(styleMap: StyleMap, property: string): string | undefined {
  let result: string | undefined;
  for (const [selector, props] of styleMap.entries()) {
    if (selector !== 'root' && selector !== 'element') continue;
    const value = props.get(property);
    if (value !== undefined) result = value;
  }
  return result;
}

export function resolveGlobalShadowing(styleMap: StyleMap): number | undefined {
  const raw = resolveRootElementProperty(styleMap, 'shadowing');
  if (raw === undefined) return undefined;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * mission skin-file-loading Batch 1 (D3): the GLOBAL root/element
 * universal-selector BackgroundColor cascade (same precedence as {@link
 * resolveGlobalShadowing}, applied to BackgroundColor instead of
 * Shadowing) -- feeds `theme.colors.graph.rootElementBackground`, a
 * DEDICATED field, NOT `theme.colors.background`. `theme.colors.background`
 * is already claimed by the document/canvas-background cascade
 * ({@link resolveDocumentBackground}), which uses a DIFFERENT precedence
 * rule (a fixed broadest-first tier list, not insertion order) -- and a
 * skin can set the two to genuinely DIFFERENT values (`rose.skin`:
 * `document { BackGroundColor white }` (canvas) vs `root { BackGroundColor
 * #FEFECE }` (entity-fill default) -- jar-verified `nimana-36-veco708`:
 * canvas stays `#FFFFFF`, state box fill is `#FEFECE`). Returns the RAW
 * value (unresolved) -- consumers resolve via `resolveColorToSvgHex`,
 * matching `stateArrowLineColor`'s own storage convention.
 */
export function resolveGlobalBackground(styleMap: StyleMap): string | undefined {
  return resolveRootElementProperty(styleMap, 'backgroundcolor');
}

/**
 * mission skin-file-loading Batch 1 (D3): the GLOBAL root/element
 * universal-selector LineColor cascade -- same mechanism as {@link
 * resolveGlobalBackground}, applied to LineColor. Unlike BackgroundColor,
 * this has NO existing overload conflict (no skin/style block sets a
 * document-level LineColor) -- `applyStyleMap` feeds this straight into
 * `theme.colors.border`, the PRE-EXISTING generic border fallback
 * `state-render-colors.ts#resolveStateBorder` already reads, so no new
 * Theme field or renderer-side wiring is needed for the border half.
 * Returns the RAW value (unresolved) -- `applyStyleMap` resolves it via
 * `resolveColor` before storing, matching `theme.colors.border`'s own
 * pre-existing resolved-value convention.
 */
export function resolveGlobalBorder(styleMap: StyleMap): string | undefined {
  return resolveRootElementProperty(styleMap, 'linecolor');
}
