/**
 * nested-previous.ts -- sdd3-T8h: the skinparams a nested `{{ }}` diagram
 * inherits from the diagram that embeds it (upstream's `Previous`).
 *
 * `EmbeddedDiagram`'s private constructor builds `Previous.createFrom(
 * skinParam.values())` from the ENCLOSING diagram's skin parameters and hands
 * it to the nested `BlockUml` (`EmbeddedDiagram.java:88-90`).
 * `TitledDiagram`'s constructor creates the nested `SkinParam` from the nested
 * source, THEN `copyAllFrom(previous)` (`TitledDiagram.java:106-109`), which is
 * `params.putAll(previous.values())` (`SkinParam.java:217-219`). The nested
 * diagram's own commands run after that constructor, and
 * `SkinParam#setParam`'s `params.put` (`SkinParam.java:242`) overwrites an
 * inherited key -- so the nested diagram's own skinparam wins.
 *
 * `Previous` is the skinparam map only: a `<style>` block of the enclosing
 * diagram does not reach the nested one (the style builder is not copied).
 *
 * The port's nested render is `renderSync(source, options)`, registered per
 * enclosing diagram (`src/index.ts#prepareBlock`), so the enclosing diagram's
 * skinparams are carried by that registration and handed to the nested
 * diagram's preprocessed result here -- no public API (`RenderOptions`,
 * `render*`) changes.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/Previous.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/EmbeddedDiagram.java:88-90
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/TitledDiagram.java:106-109
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/SkinParam.java:217-219
 */
import type { PreprocessorResult } from './preprocessor.js';
import { normaliseKey } from './skinparam-key-normalize.js';

/** `Previous#values()`: the enclosing diagram's skinparams. */
export type Previous = ReadonlyMap<string, string>;

/**
 * Inherited keys that change nothing in the jar, because the only reader of
 * the nested diagram's value is a `Style` -- and `copyAllFrom` puts a key in
 * `params` WITHOUT the `FromSkinparamToStyle` conversion `setParam` runs
 * (`SkinParam.java:242-246` vs `:217-219`), so the nested style builder never
 * sees it. The port's theme is flat (one field serves the style reader and the
 * legacy one alike), so such a key must be left out here:
 *
 *  - `backgroundcolor`: the page background is `calculateBackColor`, which reads
 *    the merged `root`/`document` style's `BackGroundColor` only
 *    (`TitledDiagram.java:280-289`, drawn at `UgDiagram.java:130-132`);
 *    `addConvert("BackgroundColor", ..., SName.document)` is the only way in
 *    (`FromSkinparamToStyle.java:180`). The golden of an activity diagram whose
 *    middle level sets `skinparam backgroundColor #f1f1f1` draws no background
 *    rect in the `{{ }}` it embeds (`activity/mufixi-71-koma752`).
 *
 * Audited, not exhaustive: a key joins this set only with the Java that shows
 * its style-only reader. `defaulttextalignment` is converted too, but the
 * activity text still reads it through `getValue` (the same golden draws the
 * nested text centred), so it stays inherited.
 */
const STYLE_ONLY_KEYS: ReadonlySet<string> = new Set(['backgroundcolor']);

/**
 * The nested diagram's skinparams after `copyAllFrom(previous)`: every
 * inherited key, then the nested diagram's own on top (same key: own value).
 *
 * An inherited key the nested diagram does not set has no place on the
 * declaration counter (`declarationOrder.skinparam`), which
 * `style-skinparam-segments.ts` reads as "before everything": it is applied
 * first, so the nested diagram's own declarations, being later, beat it -- the
 * order `copyAllFrom` then `setParam` gives. A key both set keeps the nested
 * diagram's own value and its own place on the counter (`Map` takes the last
 * value of a repeated key).
 */
export function withPrevious(preprocessed: PreprocessorResult, previous: Previous | undefined): PreprocessorResult {
  const inherited = [...(previous ?? [])].filter(([key]) => !STYLE_ONLY_KEYS.has(normaliseKey(key)));
  if (inherited.length === 0) return preprocessed;
  return { ...preprocessed, skinparam: new Map([...inherited, ...preprocessed.skinparam]) };
}

/**
 * The enclosing diagram's skinparams for the NEXT render only: set by
 * {@link inheritingRenderFn} immediately around the nested render call and
 * consumed (cleared) by {@link takePendingPrevious} when that render's
 * `prepareBlock` starts. A render is one synchronous call chain (no await
 * between the set and the take), and the `finally` clears it even when the
 * nested render never reaches `prepareBlock`, so it cannot leak into an
 * unrelated render. It is the carrier that keeps `renderSync`/`render*`
 * signatures untouched.
 */
let pending: Previous | undefined;

/** Consumed once by `prepareBlock`: the skinparams this render inherits. */
export function takePendingPrevious(): Previous | undefined {
  const previous = pending;
  pending = undefined;
  return previous;
}

/**
 * The nested-diagram render function an enclosing diagram registers
 * (`registerNestedDiagramRenderers`): `render` (a `renderSync` of the nested
 * source) run with `enclosing` -- the enclosing diagram's skinparams, inherited
 * ones included (`EmbeddedDiagram.java:88-90`) -- as the nested diagram's
 * {@link Previous}. `src/index.ts#prepareBlock` and every conformance harness
 * register through this one function, so a harness measures what production
 * renders.
 */
export function inheritingRenderFn(
  enclosing: Previous,
  render: (source: string) => string,
): (source: string) => string {
  return (source) => {
    pending = enclosing;
    try {
      return render(source);
    } finally {
      pending = undefined;
    }
  };
}
