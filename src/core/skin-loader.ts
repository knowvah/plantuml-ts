/**
 * `skin <name>` directive resolution — skin-file-loading mission, Batch 1
 * (decisions D1/D2/D6).
 *
 * Applies an embedded `<style>`-grammar skin ({@link BUILTIN_SKINS} --
 * `rose`/`debug`/`strictuml`) as the theme cascade's BASE layer, between
 * `resolveTheme` and the document's OWN `skinparam`/inline `<style>`
 * application (D6) -- a diagram combining `skin rose` with an explicit
 * `skinparam BackgroundColor` still lets the document's own skinparam win,
 * because the caller applies this BEFORE Stage 2/3 of its own cascade, not
 * after.
 *
 * Reuses the SAME `parseStyleBlock` + `resolveSkinparam` + `applyStyleMap`
 * machinery an inline `<style>` block already goes through — a `.skin`
 * file's `root { ... }` block is the flat top-level-bare-declarations layer
 * (mirrors an inline `<style>` block's `""` key, `resolveSkinparam`'s
 * Stage 3b in `src/index.ts#buildTheme`), and every other selector
 * (including the `element { Shadowing 4.0 }` universal fallback, D3) goes
 * through `applyStyleMap` exactly like an inline `<style>` block's Stage 3c.
 *
 * Unknown or preprocessor-grammar skin names (`reddress`/`sonyxperiadev` --
 * D1, Batch 4 later increment) are simply absent from {@link BUILTIN_SKINS},
 * so lookup fails and this is a no-op — matching the pre-existing lenient
 * behavior (a `skin` directive this port can't resolve renders unaffected,
 * never throws).
 */
import type { PreprocessorResult } from './preprocessor.js';
import type { Theme } from './theme.js';
import { resolveSkinparam, parseStyleBlock } from './skinparam.js';
import { applyStyleMap } from './style-map-theme.js';
import { BUILTIN_SKINS } from './skins-builtin.js';

/**
 * A skin whose text opens with a TIM preprocessor directive (`!ifndef`,
 * `!define`, ...) is the OTHER grammar family (D1) — feeding it to
 * `parseStyleBlock` would silently mis-parse it into a bogus one-selector
 * map instead of the intended macro expansion. Never true for anything
 * actually in {@link BUILTIN_SKINS} today (only `<style>`-grammar skins are
 * embedded, verified by inspection) — this is defense in depth against a
 * future miscategorized registry entry, not a live code path.
 */
function isStyleGrammarSkin(text: string): boolean {
  return !text.trimStart().startsWith('!');
}

/**
 * Resolve `preprocessed.skin` (the `skin <name>` directive, case-
 * insensitive per upstream's `SkinLoader`/`CommandSkin` — already
 * lowercased by `preprocessor.ts`'s own collector) onto `base`. Returns
 * `base` unchanged when the name is absent, unrecognized, or not a
 * `<style>`-grammar skin.
 */
export function applySkinLayer(
  preprocessed: Pick<PreprocessorResult, 'skin'>,
  base: Theme,
): Theme {
  const name = preprocessed.skin;
  if (name === undefined) return base;

  const text = BUILTIN_SKINS[name];
  if (text === undefined || !isStyleGrammarSkin(text)) return base;

  const skinStyleMap = parseStyleBlock(text);

  // `root { ... }` -- mirrors Stage 3b's flat "" bare-declarations layer.
  const rootDeclarations = skinStyleMap.get('root') ?? new Map<string, string>();
  const withRoot = resolveSkinparam(rootDeclarations, base).theme;

  // Every other selector -- mirrors Stage 3c, including the bare
  // "element" universal-fallback selector applyStyleMap now reads for
  // Shadowing (D3).
  return applyStyleMap(skinStyleMap, withRoot);
}
