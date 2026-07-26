/**
 * Theme resolution -- extracted out of `src/index.ts` (this repo's
 * `check-complexity.py` 500-line file cap; a MECHANICAL move, no behavior
 * change beyond skin-reddress-variants Fix 2, documented below).
 */

import type { RenderOptions } from '../index.js';
import type { PreprocessorResult } from './preprocessor.js';
import { resolveTheme, deepMergeTheme } from './theme.js';
import type { Theme } from './theme.js';
import { resolveSkinparam, parseStyleBlock } from './skinparam.js';
import type { StyleMap } from './skinparam.js';
import { applyStyleMap } from './style-map-theme.js';
import { applySkinLayer } from './skin-loader.js';
import { computeClassTagCascadeGenerations } from './style-cascade-class.js';

/**
 * Five-stage theme resolution:
 *
 * Stage 1 — Named base theme.
 *   String options.theme overrides !theme from source (existing behavior).
 *
 * Stage 1.5 — Apply a `skin <name>` directive's own base layer (D6,
 *   skin-file-loading mission Batch 1). BELOW Stage 2/3 so the document's
 *   own skinparam/`<style>` always wins over the loaded skin.
 *
 * Stage 2 — Apply skinparam directives from source on top of the base theme.
 *
 * Stage 3 — Apply <style> blocks from source.
 *   3a. Merge all StyleMaps from all style blocks.
 *   3b. Top-level bare declarations ("" key) flow through resolveSkinparam.
 *   3c. Element-scoped entries (e.g. "actor", "class") go through applyStyleMap.
 *
 * Stage 4 — Caller Partial<Theme> wins over everything.
 *
 * Resolution order confirmed against upstream TContext.java:executeTheme().
 */
export interface ResolvedThemeAndStyles {
  readonly theme: Theme;
  /** The SAME merged `StyleMap` used to build `theme` (Stage 3a) -- T7
   *  threads it back out so `resolveAnnotationStyles` (D6) sees the
   *  identical `<style>` overrides `buildTheme` itself already applied,
   *  instead of re-deriving a second copy from `preprocessed.styles`. */
  readonly styleMap: StyleMap;
}

/**
 * `documentRawSourceLines` (skin-reddress-variants Fix 2): the block's own
 * raw source lines (`BlockUmlOk.rawSource`, mapped to plain strings),
 * threaded into Stage 1.5's `applySkinLayer` call. Without this, a document
 * combining `!define DARKBLUE` with `skin reddress` never fires reddress's
 * `!ifdef DARKBLUE` gate in production `renderSync`/`render` -- previously
 * provable only via the test harness (`render-fixture-state.ts`), a gap
 * flagged in `plans/skin-file-loading/decision-journal.md` (B4, 2026-07-25).
 * Optional: omitted callers (there are none left in this file, but the test
 * harness constructs its own equivalent directly) see identical behavior to
 * before -- `applySkinLayer`'s 3rd param was already optional.
 */
export function buildTheme(
  preprocessed: PreprocessorResult,
  options?: RenderOptions,
  documentRawSourceLines?: readonly string[],
): ResolvedThemeAndStyles {
  // Stage 1: named base theme
  const themeName =
    typeof options?.theme === 'string'
      ? options.theme
      : (preprocessed.theme ?? 'default');
  const base = resolveTheme(themeName);

  // Stage 1.5: apply a `skin <name>` directive's own base layer (D6,
  // skin-file-loading mission Batch 1) -- BELOW the document's own
  // skinparam/`<style>` application below, so a diagram combining
  // `skin rose` with an explicit `skinparam` still lets the document's
  // own skinparam win. No-op when `preprocessed.skin` is absent or names
  // an unrecognized/preprocessor-grammar skin (D1).
  const withSkin = applySkinLayer(preprocessed, base, documentRawSourceLines);

  // Stage 2: apply skinparam directives from source
  const withSkinparam = resolveSkinparam(preprocessed.skinparam, withSkin).theme;

  // Stage 3: apply <style> blocks from source
  // 3a. Merge all StyleMaps (last writer wins per selector+property)
  const styleMap = preprocessed.styles
    .map(parseStyleBlock)
    .reduce<StyleMap>((acc, m) => {
      m.forEach((props, selector) => {
        const existing = acc.get(selector) ?? new Map<string, string>();
        props.forEach((v, k) => existing.set(k, v));
        acc.set(selector, existing);
      });
      return acc;
    }, new Map());

  // 3b. Top-level bare declarations ("" key) → resolveSkinparam (existing behavior)
  const flatRoot = styleMap.get('') ?? new Map<string, string>();
  const withStyles = resolveSkinparam(flatRoot, withSkinparam).theme;

  // 3c. Element-scoped entries → applyStyleMap
  const withStyleMap = applyStyleMap(styleMap, withStyles);

  // G2 N39: position-scoped classifier `.tagname` cascade generations --
  // see `preprocessed.stylePositions`'s doc comment for the mechanism.
  // `computeClassTagCascadeGenerations` itself no-ops (returns undefined)
  // for the overwhelmingly common 0-or-1-`<style>`-block case, so this is
  // zero-cost for every fixture that does not exercise the mechanism.
  const classTagCascadeGenerations = computeClassTagCascadeGenerations(preprocessed.styles);
  const withGenerations =
    classTagCascadeGenerations === undefined
      ? withStyleMap
      : {
          ...withStyleMap,
          colors: {
            ...withStyleMap.colors,
            graph: { ...withStyleMap.colors.graph, classTagCascadeGenerations },
          },
        };

  // Stage 4: caller Partial<Theme> wins over everything
  const theme =
    options?.theme !== undefined && typeof options.theme === 'object'
      ? deepMergeTheme(withGenerations, options.theme)
      : withGenerations;
  // #lizard forgives -- mechanical extraction of index.ts's own pre-existing
  // `buildTheme` (unchanged five-stage structure, +1 param for Fix 2); was
  // never flagged in index.ts because that file's 500-line gate short-
  // circuited the per-function check first.
  return { theme, styleMap };
}
