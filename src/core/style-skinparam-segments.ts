/**
 * The `skinparam` and `<style>` declarations of one block, back in the ONE
 * order upstream applies them (cdd4-T7b).
 *
 * Upstream has a single style store: `SkinParam#setParam` converts each
 * skinparam to style declarations and mutes the store on the spot
 * (`SkinParam.java:227-234`), and a `<style>` block mutes it where it is
 * dispatched (`CommandStyleMultilinesCSS`), so the LATER declaration of a
 * property wins whichever form it took. The port keeps the two apart (a
 * skinparam map, a list of style blocks) and used to apply every skinparam
 * before every style block. That is exact only while no `<style>` precedes a
 * skinparam -- and `!theme` puts the theme's `<style>` at the directive's
 * position (`TContext.java:737-743`), ahead of the document's own
 * `skinparam backgroundColor` (`sequence/zuravu-52-mike252`).
 *
 * A segment is a maximal run of one kind, in declaration order. A key
 * assigned more than once sits at its LAST assignment -- the only one that
 * can still win.
 */

import type { PreprocessorResult } from './preprocessor.js';
import { parseStyleBlock, type StyleMap } from './skinparam.js';

export type StyleSkinparamSegment =
  | { readonly kind: 'skinparam'; readonly entries: ReadonlyMap<string, string> }
  | { readonly kind: 'style'; readonly styleMap: StyleMap };

type Declaration = { readonly at: number; readonly key: string } | { readonly at: number; readonly style: string };

/** What the segments are read from: a `PreprocessorResult` suffices. */
export type StyleSkinparamSource = Pick<PreprocessorResult, 'skinparam' | 'styles' | 'declarationOrder'>;

/** Every skinparam key and style block, placed on the declaration counter. */
function declarationsOf(source: StyleSkinparamSource): Declaration[] {
  const order = source.declarationOrder;
  // A hand-built result has no order: every skinparam, then every block.
  const keyAt = (key: string): number => order?.skinparam.get(key) ?? -1;
  const styleAt = (i: number): number => order?.styles[i] ?? Number.MAX_SAFE_INTEGER;
  return [
    ...[...source.skinparam.keys()].map((key) => ({ at: keyAt(key), key })),
    ...source.styles.map((style, i) => ({ at: styleAt(i), style })),
  ].sort((a, b) => a.at - b.at);
}

/** Fold one more `<style>` block into a run: last writer per selector+property. */
function mergeInto(acc: StyleMap, block: StyleMap): void {
  block.forEach((props, selector) => {
    const existing = acc.get(selector) ?? new Map<string, string>();
    props.forEach((v, k) => existing.set(k, v));
    acc.set(selector, existing);
  });
}

/**
 * The block's declarations as ordered runs (see the module doc). Consecutive
 * `<style>` blocks share one run, merged as `build-theme.ts` always merged
 * them, so a document whose styles all follow its skinparams keeps the
 * two-stage order it had.
 */
export function styleSkinparamSegments(source: StyleSkinparamSource): StyleSkinparamSegment[] {
  // Always open with a skinparam run, empty or not: the former Stage 2 ran
  // `resolveSkinparam` unconditionally, and its normalisation is not a no-op.
  let skinparams: Map<string, string> | undefined = new Map();
  const segments: StyleSkinparamSegment[] = [{ kind: 'skinparam', entries: skinparams }];
  let styles: StyleMap | undefined;
  for (const declaration of declarationsOf(source)) {
    if ('style' in declaration) {
      skinparams = undefined;
      if (styles === undefined) {
        styles = new Map();
        segments.push({ kind: 'style', styleMap: styles });
      }
      mergeInto(styles, parseStyleBlock(declaration.style));
      continue;
    }
    styles = undefined;
    if (skinparams === undefined) {
      skinparams = new Map();
      segments.push({ kind: 'skinparam', entries: skinparams });
    }
    skinparams.set(declaration.key, source.skinparam.get(declaration.key)!);
  }
  // ...and close with a `<style>` run, empty or not: the former Stage 3 ran
  // after every skinparam, and its pass is where `skinparam wrapWidth` seeds
  // the MaximumWidth cascade (`style-map-theme.ts#computeGraphOverride`;
  // upstream converts it at its own position, `FromSkinparamToStyle.java:250`).
  if (styles === undefined) segments.push({ kind: 'style', styleMap: new Map() });
  return segments;
}
