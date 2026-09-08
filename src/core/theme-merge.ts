/**
 * `deepMergeTheme` and its helpers — split out of `theme.ts` (mechanical
 * extraction to keep that file under the project's 500-line cap, same
 * rationale as `theme-graph-colors.ts`/`theme-element-resolve.ts`; a pure
 * move, no behavior change). Re-exported from `theme.ts` so every existing
 * `from './theme.js'` call site is unaffected.
 */
import type { Theme, ThemeOverride } from './theme.js';

/** Merge the nested `colors.graph` block (activity/json one level deep). */
function mergeGraphColors(base: Theme, partial: ThemeOverride): Theme['colors']['graph'] {
  const pg = partial.colors?.graph;
  return {
    ...base.colors.graph,
    ...(pg ?? {}),
    activity: {
      ...(base.colors.graph.activity ?? {}),
      ...(pg?.activity ?? {}),
    },
    json: {
      ...(base.colors.graph.json ?? {}),
      ...(pg?.json ?? {}),
    },
  };
}

/** Top-level optional scalar fields copied verbatim during a merge. */
const OPTIONAL_SCALAR_KEYS = [
  'defaultFontSize',
  'linetype',
  'fixCircleLabelOverlapping',
  'componentStyle',
  'actorStyle',
  'minimumWidth',
  'strictUml',
  'monochrome',
  'shadowing',
  'packageStyle',
  'nodeSep',
  'rankSep',
  'wrapWidth',
  'maxMessageSize',
  'sameClassWidth',
  'classAttributeIconSize',
  'groupInheritance',
  'tabSize',
  'cardinalityFontSize',
  'cardinalityFontFamily', // T1 (edge-label-box-backlog, D3)
  'cardinalityFontColor', // SI26 T1 (D5)
  // `diagramMargin` is the one non-scalar here. It rides this list because the
  // merge is a whole-value replacement, which is exactly right for a margin:
  // a theme that sets one replaces all four sides, it does not blend with the
  // default. Omitting it silently dropped every theme's margin.
  'diagramMargin',
  'handwritten',
  'styleOverrides',
] as const;

/** Copy the top-level optional scalars, preferring `partial` then `base`. */
function applyOptionalScalars(merged: Theme, base: Theme, partial: ThemeOverride): void {
  for (const key of OPTIONAL_SCALAR_KEYS) {
    const value = partial[key] ?? base[key];
    if (value !== undefined) {
      (merged as Record<typeof key, unknown>)[key] = value;
    }
  }
}

/**
 * Deep-merge a partial Theme on top of a base Theme.
 * Returns a new Theme object — neither `base` nor `partial` is mutated.
 * Nested objects (`colors`, `colors.graph`, `colors.graph.activity`,
 * `colors.graph.json`, `sequence`) are merged one level deep; scalar fields
 * use nullish coalescing so that explicit `undefined` falls through to the
 * base value.
 */
export function deepMergeTheme(base: Theme, partial: ThemeOverride): Theme {
  const merged: Theme = {
    fontFamily: partial.fontFamily ?? base.fontFamily,
    fontSize: partial.fontSize ?? base.fontSize,
    colors: {
      ...base.colors,
      ...(partial.colors ?? {}),
      graph: mergeGraphColors(base, partial),
    },
    sequence: {
      ...base.sequence,
      ...(partial.sequence ?? {}),
    },
  };
  applyOptionalScalars(merged, base, partial);
  return merged;
}
