/**
 * Theme resolution -- extracted out of `src/index.ts` (this repo's
 * `check-complexity.py` 500-line file cap; a MECHANICAL move, no behavior
 * change beyond skin-reddress-variants Fix 2, documented below).
 */

import type { RenderOptions } from '../index.js';
import type { PreprocessorResult } from './preprocessor.js';
import { resolveTheme, deepMergeTheme } from './theme.js';
import type { Theme } from './theme.js';
import { resolveSkinparam } from './skinparam.js';
import type { StyleMap } from './skinparam.js';
import { applyStyleMap } from './style-map-theme.js';
import { applySkinLayer } from './skin-loader.js';
import { computeClassTagCascadeGenerations } from './style-cascade-class.js';
import { styleSkinparamSegments, type StyleSkinparamSegment } from './style-skinparam-segments.js';
import { dropRootShadowed, rootColoursOf } from './style-root-shadowing.js';
import { cleanForKeySlow } from './style/mindmap-style-builder.js';
import { parseConditionalColor } from './klimt/color/HColorSet.js';
import { parseClockwise } from './annotations/annotation-clockwise.js';
import { withActivityCircleStyle } from './activity-circle-style.js';
import { withSequenceFrameShadowing } from './sequence-frame-shadow.js';

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
 * Stages 2-3 — Apply the source's skinparam directives and <style> blocks in
 *   DECLARATION order (cdd4-T7b): consecutive skinparams as one run through
 *   resolveSkinparam; consecutive style blocks merged as one run, whose
 *   top-level bare declarations ("" key) flow through resolveSkinparam and
 *   whose element-scoped entries (e.g. "actor", "class") go through
 *   applyStyleMap. A document whose styles all follow its skinparams sees
 *   exactly the former two stages. Then the merged `root`/`document`
 *   declarations reach `styleOverrides` / `diagramMargin`.
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
  const themeName = typeof options?.theme === 'string' ? options.theme : (preprocessed.theme ?? 'default');
  const base = resolveTheme(themeName);

  // Stage 1.5: apply a `skin <name>` directive's own base layer (D6,
  // skin-file-loading mission Batch 1) -- BELOW the document's own
  // skinparam/`<style>` application below, so a diagram combining
  // `skin rose` with an explicit `skinparam` still lets the document's
  // own skinparam win. No-op when `preprocessed.skin` is absent or names
  // an unrecognized/preprocessor-grammar skin (D1).
  const withSkin = applySkinLayer(preprocessed, base, documentRawSourceLines);

  // Stages 2-3: skinparam directives and <style> blocks, in declaration order
  // (cdd4-T7b -- see `style-skinparam-segments.ts`).
  // unwind2-S5: minus what a later `root` colour shadows (`style-root-shadowing.ts`).
  const segments = dropRootShadowed(styleSkinparamSegments(preprocessed)).flatMap(withRootStyleRun);
  const withDeclarations = segments.reduce(applySegment, withSkin);
  const styleMap = mergedStyleMap(segments);
  // add4-T3f: the activity circles' priority-ordered merged style -- see
  // `activity-circle-style.ts`; read only by the activity renderer.
  // unwind2-S9: the sequence frames' merged-style Shadowing -- see
  // `sequence-frame-shadow.ts`; read only by the sequence engine.
  const withStyleMap = withSequenceFrameShadowing(
    withActivityCircleStyle(withDocumentStyle(withDeclarations, styleMap), preprocessed),
    preprocessed,
  );

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

/**
 * A skinparam run, followed by the `root` style run its root colours ARE
 * (unwind2-S5): `skinparam defaultFontColor` converts to exactly
 * `root { FontColor }` (`FromSkinparamToStyle.java:157`), whose only effect
 * upstream is that style, so it reaches every resolver a `<style> root`
 * block reaches, at the skinparam's position.
 */
function withRootStyleRun(segment: StyleSkinparamSegment): StyleSkinparamSegment[] {
  if (segment.kind === 'style') return [segment];
  const root = rootColoursOf(segment.entries);
  return root.size === 0 ? [segment] : [segment, { kind: 'style', styleMap: new Map([['root', root]]) }];
}

/** Every `<style>` run merged: last writer per selector+property. */
function mergedStyleMap(segments: readonly StyleSkinparamSegment[]): StyleMap {
  return segments.reduce<StyleMap>((acc, segment) => {
    if (segment.kind === 'skinparam') return acc;
    segment.styleMap.forEach((props, selector) => {
      const existing = acc.get(selector) ?? new Map<string, string>();
      props.forEach((v, k) => existing.set(k, v));
      acc.set(selector, existing);
    });
    return acc;
  }, new Map());
}

/**
 * One run of declarations onto the theme. A skinparam run goes through
 * `resolveSkinparam`; a `<style>` run sends its top-level bare declarations
 * (the `""` key) through `resolveSkinparam` too, then its element-scoped
 * selectors through `applyStyleMap`.
 */
function applySegment(theme: Theme, segment: StyleSkinparamSegment): Theme {
  if (segment.kind === 'skinparam')
    return withoutSupersededArrowCascade(resolveSkinparam(segment.entries, theme).theme, segment.entries);
  const flatRoot = new Map([
    ...rootCascadeSkinparams(segment.styleMap.get('root')),
    ...(segment.styleMap.get('') ?? new Map<string, string>()),
  ]);
  return applyStyleMap(segment.styleMap, resolveSkinparam(flatRoot, theme).theme);
}

/**
 * `skinparam ArrowColor` (and every `<type>ArrowColor`, which `cleanForKey`
 * collapses to it, `SkinParam.java:277-283`) converts to `arrow { LineColor }`
 * (`FromSkinparamToStyle.java:151`). Being later than whatever `<style>` run
 * set the class arrow cascade (`root`/`classDiagram`/`arrow` LineColor,
 * `style-cascade-class.ts`), its counter wins on the class edge's
 * `{root, element, classDiagram, arrow}` signature (`Style.java:121-134`), so
 * the cascade value it supersedes is dropped and `colors.arrow` -- which it
 * just set -- is what the edge draws (unwind2-S5).
 */
function withoutSupersededArrowCascade(theme: Theme, entries: ReadonlyMap<string, string>): Theme {
  const graph = theme.colors.graph;
  if (graph.classCascadeArrowColor === undefined) return theme;
  if (![...entries.keys()].some((key) => cleanForKeySlow(key).includes('arrowcolor'))) return theme;
  const { classCascadeArrowColor: _superseded, ...rest } = graph;
  return { ...theme, colors: { ...theme.colors, graph: rest } };
}

/**
 * A `<style> root { FontColor; LineColor }`, AT ITS POSITION in the run order
 * (unwind2-S5). Every style signature contains `root`, and upstream merges
 * values by declaration counter, not by selector depth: `Style#mergeWith`
 * (`style/Style.java:121-134`) keeps the higher-priority value
 * (`DarkString#mergeWith`, `DarkString.java:50-66`), and every value's
 * priority is `StyleBuilder#getNextInt` (`ValueImpl.java:51-55`,
 * `StyleBuilder.java:119-122`) -- so a later `root` beats an earlier
 * `skinparam ArrowColor`, and a later `ArrowColor` beats an earlier `root`.
 *
 * - `FontColor` IS `skinparam defaultFontColor`: that skinparam converts to
 *   exactly `root { FontColor }` (`FromSkinparamToStyle.java:157`), so it
 *   runs through the same handler.
 * - `LineColor` has no skinparam twin; it reaches the two theme fields every
 *   element and arrow inherits it through, `colors.border` (`borderColor`'s
 *   handler) and `colors.arrow` (`arrowColor`'s handler).
 *
 * These two fields used to come from a precompiled summary of the theme
 * applied below every document line, so the theme's value could neither beat
 * an earlier document line nor be beaten by a later document `root` block.
 *
 * A conditional `#?light:dark` colour (`HColorScheme`) is not routed: upstream
 * resolves it per drawn element against that element's own background
 * (`HColorScheme#getAppropriateColor`), and these flat fields would carry the
 * raw token into the SVG.
 */
function rootCascadeSkinparams(root: ReadonlyMap<string, string> | undefined): Map<string, string> {
  const out = new Map<string, string>();
  const plain = (key: string): string | undefined => {
    const value = root?.get(key);
    return value === undefined || parseConditionalColor(value) !== undefined ? undefined : value;
  };
  const fontColor = plain('fontcolor');
  if (fontColor !== undefined) out.set('defaultfontcolor', fontColor);
  const lineColor = plain('linecolor');
  if (lineColor !== undefined) {
    out.set('bordercolor', lineColor);
    out.set('arrowcolor', lineColor);
  }
  return out;
}

/** A top-level `root` / `document` selector, or one nested under them. */
function isRootOrDocumentSelector(selector: string): boolean {
  return ['root', 'document'].some((name) => selector === name || selector.startsWith(`${name}.`));
}

/**
 * The merged `<style>` map's `root` / `document` declarations, routed to the
 * two `Theme` fields that carry them (cdd4-T7b; both were filled only by the
 * precompiled theme summary before, so a document's own `root { Margin 5 }`
 * never reached them either):
 *
 * - `styleOverrides` -- the selectors themselves. `root` and `document` are
 *   members of every chrome element's `{root, document, <element>}` signature
 *   (`StyleStorage#computeMergedStyle` matches by containment), which is what
 *   `annotations/style.ts` and the activity text/line resolvers read.
 * - `diagramMargin` -- `TextBlockExporter#calculateMargin`
 *   (`core/TextBlockExporter.java:510-516`): the merged `{root, document}`
 *   style's `Margin` when it has one, else `getDefaultMargins()` (left to the
 *   engine). `document` is declared after `root` in every bundled theme, and
 *   `computeMergedStyle` overwrites in declaration order, so it wins.
 */
function withDocumentStyle(theme: Theme, styleMap: StyleMap): Theme {
  const picked = [...styleMap].filter(([selector]) => isRootOrDocumentSelector(selector));
  if (picked.length === 0) return theme;
  const styleOverrides = { ...theme.styleOverrides };
  for (const [selector, props] of picked)
    styleOverrides[selector] = { ...styleOverrides[selector], ...Object.fromEntries(props) };
  const margin = styleMap.get('document')?.get('margin') ?? styleMap.get('root')?.get('margin');
  return {
    ...theme,
    styleOverrides,
    ...(margin !== undefined ? { diagramMargin: parseClockwise(margin) } : {}),
  };
}
