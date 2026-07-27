/**
 * Theme system for plantuml-ts.
 *
 * Defines the visual appearance of all diagram types via a single Theme
 * interface. The resolveTheme helper normalises string aliases and deep-merges
 * partial overrides without mutating the built-in theme objects.
 */

import { BUILTIN_THEMES } from './themes-builtin.js';
// mission skin-file-loading: ElementColors/ThemeGraphColors moved to
// theme-graph-colors.ts (re-exported below) to keep this file under the
// project's 500-line file-size cap — see that module's own doc comment.
import type { ElementColors, ThemeGraphColors } from './theme-graph-colors.js';

export type { ElementColors, ThemeGraphColors } from './theme-graph-colors.js';

export interface Theme {
  fontFamily: string;
  fontSize: number;
  /** `skinparam linetype ortho|polyline` — svek routes edge labels through
   *  xlabel and emits splines=ortho under ortho (SvekEdge.java:434-441,
   *  DotStringFactory.java:160-168). Absent = default splines. */
  linetype?: 'ortho' | 'polyline';
  /** `skinparam fixCircleLabelOverlapping` — when true, disables the shield
   *  suppression on interfaces that have a horizontal visible link
   *  (EntityImageDescription.getShield: `fixCircleLabelOverlapping == false
   *  && hasSomeHorizontalLinkVisible`). Default false. */
  fixCircleLabelOverlapping?: boolean;
  /** `skinparam componentStyle uml2|uml1|rectangle` (SkinParam.componentStyle).
   *  Default `uml2` draws the corner component icon; `uml1`/`rectangle` render
   *  components as plain boxes (changes node sizing). Absent = uml2. */
  componentStyle?: 'uml2' | 'uml1' | 'rectangle';
  /** `skinparam minClassWidth` (mapped to `PName.MinimumWidth`) — floors the
   *  leaf-box text-block content width. Absent = 0 (no floor). */
  minimumWidth?: number;
  /** G2 N18: `skinparam style strictuml` — a global sharp-corner style flag
   *  (`SkinParam.java`'s `getStyle() == UmlDiagramType.STRICT`... actually
   *  a bare boolean toggle checked by `USymbolFolder#drawFolder`'s
   *  `roundCorner=0` `UPolygon` branch, jar-verified via
   *  `jinibe-02-tebi269`'s own `<polygon points="...">` package outline —
   *  a plain `<path>` with rounded arcs otherwise). Class is this field's
   *  first consumer this iteration (`class-namespace-shape.ts`); scope
   *  limited to the package/namespace folder-tab corner style, matching
   *  this iteration's own write-set — NOT threaded into classifier-box
   *  rounding or any other strictuml-affected shape. */
  /** G2 N61: `skinparam monochrome true|reverse` -- `TitledDiagram.java
   *  #muteColorMapper` swaps in `ColorMapper.MONOCHROME`/`MONOCHROME_REVERSE`
   *  for the diagram's ENTIRE draw pass (`klimt/color/ColorMapper.java:
   *  80-91`), a uniform YIQ grayscale transform applied to every drawn
   *  color, LAST, regardless of where that color's own value came from.
   *  Class has no single terminal draw call to hook this into (unlike jar's
   *  `UGraphic`) -- consumed as a single post-processing pass over the
   *  ASSEMBLED SVG fragment instead (`class-monochrome.ts
   *  #applyMonochromeToFragment`, `renderer.ts#renderClass`'s own return
   *  point). Class is this field's first consumer this iteration; NOT
   *  wired into description/other diagram types (no corpus sample exercised
   *  this iteration -- same "no evidence it's wrong elsewhere" scoping this
   *  file's other fields already establish, e.g. `strictUml`'s doc comment).
   *  `SkinParam.isDark(...)`'s own DARK_MODE branch (jar's FIRST check,
   *  ahead of `monochrome`) is unmodeled -- `!theme dark`-interaction
   *  untraced this iteration, named remainder. */
  monochrome?: 'true' | 'reverse';
  strictUml?: boolean;
  /**
   * mission skin-file-loading Batch 1 (D3): `skin <name>` /
   * `<style> root { Shadowing N } }` / `<style> element { Shadowing N } }`
   * -- upstream `EntityImageState`/`InnerStateAutonom`/`Cluster`'s shared
   * `getShadowing()` read (`style.getShadowing()`), resolved ONCE for every
   * diagram type via the SAME cascade (not state-only). Populated by
   * `style-map-theme.ts#applyStyleMap`'s own bare `"root"`/`"element"`
   * selector reader -- the LAST Shadowing declaration registered under
   * EITHER bare selector wins (textual/insertion-order merge, mirrors
   * `style-map-element.ts#resolveStyleCascade`'s own "no specificity,
   * last-registered-wins" algorithm), matching upstream's compound
   * `StyleSignatureBasic` subset-match semantics for the common case where
   * only the two UNIVERSAL selectors (root, element) are in play. A
   * per-bucket-type Shadowing override (`<style> node { Shadowing 2.0 } }`)
   * is NOT modeled here -- out of this batch's scope (D3), a later
   * increment if a fixture needs it. Absent = 0 (no shadow) -- Batch 2
   * consumes this value to draw the shadow filter + reserve ink; this
   * batch only resolves it.
   */
  shadowing?: number;
  /** G2 N59: `skinparam packageStyle rect|rectangle` -- selects the plain
   *  `<rect>` package/namespace outline (`svek/PackageStyle.java
   *  #RECTANGLE`) instead of the default folder-tab notch shape, jar-
   *  verified via `mucuxi-36-beku683`'s own childCount-2 `<rect>`+`<text>`
   *  output (no hline, centered title -- `USymbolRectangle#asBig`, NOT
   *  `USymbolFolder#asBig`). Other `PackageStyle` enum values (NODE/FRAME/
   *  CLOUD/DATABASE/COMPONENT1/COMPONENT2/STORAGE/AGENT/ARTIFACT/CARD) are
   *  NOT modeled -- absent/any other value falls back to the pre-existing
   *  FOLDER default, matching this port's minimal-scope convention (no
   *  corpus sample exercises them for class diagrams yet). */
  packageStyle?: 'rect';
  /** `skinparam nodesep N` (px) — when set (nonzero), unconditionally
   *  replaces the clamped default DOT nodesep (SkinParam.java:847-851
   *  getAsInt("nodesep",0); DotStringFactory.java:117-124). Absent = engine
   *  default (min-clamped dzeta). */
  nodeSep?: number;
  /** `skinparam ranksep N` (px) — same override semantics as nodeSep
   *  (SkinParam.java:852-856; DotStringFactory.java:125-133). */
  rankSep?: number;
  /** `skinparam wrapWidth N` (px) — `style.wrapWidth()`'s
   *  `PName.MaximumWidth` (`FromSkinparamToStyle.java:250`). Threaded ONLY
   *  to a descdiagram entity's `desc`/note body text block
   *  (`EntityImageDescription.java`'s `desc`, `EntityImageNote.java`'s
   *  `textBlock` — NOT the title/stereotype text blocks, which upstream
   *  never passes `wrapWidth()` to). E2r/L3, `Fission.ts#getSplitted`.
   *  Absent/0 = no default (upstream sets none anywhere — jar-verified,
   *  `Fission.ts`'s doc comment) — word-wrap is a no-op unless a diagram
   *  explicitly sets this skinparam. */
  wrapWidth?: number;
  /** `skinparam tabSize N` -- `SkinParam#getTabSize()` (default 8, no style
   *  cascade). Threaded to object-field text runs containing a literal
   *  `\t` (`AtomText#getTabSize`/`drawU`'s tab-stop expansion) -- G3/O4.
   *  Absent = upstream default (8). */
  tabSize?: number;
  colors: {
    background: string;
    /** Default fill for action/node shapes (separate from canvas background). */
    nodeBackground: string;
    border: string;
    text: string;
    arrow: string;
    note: string;
    // NOTE: upstream default is '#FBFB77' (HColors.COL_FBFB77 in ColorParam.java).
    // This value intentionally diverges. Tracked in plans/skinparam/decision-journal.md.
    noteBackground: string;
    lifeline: string;
    activation: string;
    frame: string;
    divider: string;
    error: string;
    /** Per-element (SName) color buckets — decision D4. Populated by skinparam
     *  (T4) and element-scoped style blocks (T5); read via
     *  {@link resolveElementPaint}, which cascades element-specific → root
     *  default. This is where gradient (Paint) colors live — the flat fields
     *  below stay `string` (widening them ripples into ~20 not-yet-Paint-aware
     *  renderers with no gradient need; see decision-journal.md T3). */
    elements?: Partial<Record<string, ElementColors>>;
    /** G2 N37: the SAME `.tagname` stereotype-name style-cascade
     *  sub-selector as `graph.classTagCascade` above, applied to the NOTE
     *  bucket (`note { .faint { BackgroundColor red } } }`,
     *  `xokipa-29-rafu481`/`fabuje-68-gona310`/`neruke-07-ruce381`) --
     *  keyed by the SAME cleaned tag name; `renderer-note.ts
     *  #resolveNoteBackground` reads `.background` between a note's own
     *  explicit `#color` override and the bare `elements.note` bucket. */
    noteTagCascade?: Readonly<Record<string, ElementColors>>;
    graph: ThemeGraphColors;
  };
  sequence: {
    /** Horizontal padding inside a participant box */
    participantPadding: number;
    /** Minimum participant box width */
    participantMinWidth: number;
    /** Horizontal gap between adjacent participant boxes */
    participantGap: number;
    /** Vertical gap between messages */
    messageSpacing: number;
    /** Width of the activation box drawn on a lifeline */
    activationWidth: number;
    /** Gap between a note and the nearest participant */
    noteMargin: number;
    /** Height of the frame label area */
    frameHeaderHeight: number;
    /** Extra lifeline length below the last message */
    lifelineExtension: number;
  };
}

export const defaultTheme: Theme = {
  fontFamily: 'sans-serif',
  fontSize: 14,
  colors: {
    background: '#FFFFFF',
    nodeBackground: '#F1F1F1',
    border: '#181818',
    text: '#181818',
    arrow: '#181818',
    note: '#FEFECE',
    noteBackground: '#FEFECE',
    lifeline: '#181818',
    activation: '#DDDDDD',
    frame: '#999999',
    divider: '#999999',
    error: '#CC0000',
    graph: {
      // D2: upstream's authoritative Style-system default fill is #F1F1F1
      // (resources/skin/plantuml.skin), superseding the legacy ColorParam
      // yellow (#FEFECE). See DIVERGENCES.md and decisions.md#D2.
      classBackground: '#F1F1F1',
      interfaceBackground: '#B4D7ED',
      enumBackground: '#F1F1F1',
      actorStroke: '#181818',
      packageBackground: 'none',
      // G2 N17: jar-verified '#000000' for the class-diagram folder-tab
      // border (finono-05-cuvu171, jinibe-02-tebi269, ...) -- was an
      // unverified #999999. Class is this field's ONLY consumer
      // (description deliberately avoids it -- renderer-cluster.ts's own
      // doc comment), so the default is safe to correct here.
      packageBorder: '#000000',
      edgeLabel: '#444444',
      actorFill: 'none',
      usecaseFill: '#FFFFFF',
      businessActorFill: 'none',
      businessUsecaseFill: '#FFFFFF',
      json: {
        // keyText is intentionally absent so the renderer's fallback chain
        // reaches nodeFontColor (from jsonDiagram.node.FontColor style blocks).
        // Themes that want an explicit key color set it directly (e.g. darkTheme).
        stringValue:         '#3A6E96',
        numberValue:         '#A67F52',
        booleanValue:        '#BE5D47',
        nullValue:           '#767676',
        // plantuml.skin sets jsonDiagram.node.BackGroundColor #F1F1F1 as the default.
        // Named themes override this via their compiled graph.json entry.
        background:          '#F1F1F1',
        border:              '#181818',
        highlightBackground: '#CCFF02',
        arrowColor:          '#181818',
      },
    },
  },
  sequence: {
    participantPadding: 10,
    participantMinWidth: 80,
    participantGap: 20,
    messageSpacing: 20,
    activationWidth: 10,
    noteMargin: 5,
    frameHeaderHeight: 20,
    lifelineExtension: 20,
  },
};

export const darkTheme: Theme = {
  fontFamily: defaultTheme.fontFamily,
  fontSize: defaultTheme.fontSize,
  colors: {
    background: '#1E1E1E',
    nodeBackground: '#2D2D2D',
    border: '#CCCCCC',
    text: '#CCCCCC',
    arrow: '#CCCCCC',
    note: '#3C3C3C',
    noteBackground: '#2D2D2D',
    lifeline: '#888888',
    activation: '#444444',
    frame: '#666666',
    divider: '#555555',
    error: defaultTheme.colors.error,
    graph: {
      ...defaultTheme.colors.graph,
      usecaseFill: '#1E1E1E',
      businessUsecaseFill: '#1E1E1E',
      json: {
        keyText:             '#CCCCCC',
        stringValue:         '#6A9FBF',
        numberValue:         '#C9985A',
        booleanValue:        '#D47070',
        nullValue:           '#999999',
        background:          '#2D2D2D',
        border:              '#CCCCCC',
        headerBackground:    '#3C3C3C',
        highlightBackground: '#555500',
        arrowColor:          '#CCCCCC',
      },
    },
  },
  sequence: { ...defaultTheme.sequence },
};

export const sketchyTheme: Theme = {
  ...defaultTheme,
};

export const monochromeTheme: Theme = {
  ...defaultTheme,
};

/**
 * Deep-partial theme override, safe to compose onto a base Theme.
 *
 * Unlike Partial<Theme> (which is only one level deep), colors and its nested
 * fields may each be partially specified. deepMergeTheme accepts this type and
 * fills missing fields from the base.
 */
export type ThemeOverride = {
  fontFamily?: string;
  fontSize?: number;
  linetype?: 'ortho' | 'polyline';
  fixCircleLabelOverlapping?: boolean;
  componentStyle?: 'uml2' | 'uml1' | 'rectangle';
  minimumWidth?: number;
  strictUml?: boolean;
  monochrome?: 'true' | 'reverse';
  /** See `Theme.shadowing`'s own doc comment. */
  shadowing?: number;
  packageStyle?: 'rect';
  nodeSep?: number;
  rankSep?: number;
  wrapWidth?: number;
  tabSize?: number;
  colors?: {
    background?: string;
    nodeBackground?: string;
    border?: string;
    text?: string;
    arrow?: string;
    note?: string;
    noteBackground?: string;
    lifeline?: string;
    activation?: string;
    frame?: string;
    divider?: string;
    error?: string;
    elements?: Partial<Record<string, ElementColors>>;
    graph?: Partial<Theme['colors']['graph']> & {
      activity?: Partial<NonNullable<Theme['colors']['graph']['activity']>>;
      json?: Partial<NonNullable<Theme['colors']['graph']['json']>>;
    };
  };
  sequence?: Partial<Theme['sequence']>;
};

/**
 * Deep-merge a partial Theme on top of a base Theme.
 *
 * Returns a new Theme object — neither `base` nor `partial` is mutated.
 * Nested objects (`colors`, `colors.graph`, `colors.graph.activity`,
 * `colors.graph.json`, `sequence`) are merged one level deep; scalar fields
 * use nullish coalescing so that explicit `undefined` falls through to the
 * base value.
 */
/** Merge the nested `colors.graph` block (activity/json one level deep). */
function mergeGraphColors(
  base: Theme,
  partial: ThemeOverride,
): Theme['colors']['graph'] {
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
  'linetype',
  'fixCircleLabelOverlapping',
  'componentStyle',
  'minimumWidth',
  'strictUml',
  'monochrome',
  'shadowing',
  'packageStyle',
  'nodeSep',
  'rankSep',
  'wrapWidth',
  'tabSize',
] as const;

/** Copy the top-level optional scalars, preferring `partial` then `base`. */
function applyOptionalScalars(
  merged: Theme,
  base: Theme,
  partial: ThemeOverride,
): void {
  for (const key of OPTIONAL_SCALAR_KEYS) {
    const value = partial[key] ?? base[key];
    if (value !== undefined) {
      (merged as Record<typeof key, unknown>)[key] = value;
    }
  }
}

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

/**
 * Resolve a theme option to a concrete Theme object.
 *
 * - String aliases: 'default' → defaultTheme, 'dark' → darkTheme,
 *   'sketchy' → sketchyTheme, 'monochrome' → monochromeTheme.
 * - Any other string: looked up in BUILTIN_THEMES, merged onto defaultTheme.
 *   Unknown names fall back to defaultTheme.
 * - ThemeOverride object: deep-merged on top of defaultTheme. The original
 *   defaultTheme is never mutated.
 * - undefined / omitted: returns defaultTheme.
 */
export function resolveTheme(
  option?: ThemeOverride | string,
): Theme {
  if (option === undefined || option === 'default') {
    return defaultTheme;
  }

  if (option === 'dark') {
    return darkTheme;
  }

  if (option === 'sketchy') {
    return sketchyTheme;
  }

  if (option === 'monochrome') {
    return monochromeTheme;
  }

  if (typeof option === 'string') {
    const builtin = BUILTIN_THEMES[option];
    if (builtin !== undefined) return deepMergeTheme(defaultTheme, builtin);
    return defaultTheme;
  }

  // Partial<Theme> deep-merge — produce a new object, never mutate defaultTheme
  return deepMergeTheme(defaultTheme, option);
}

// Per-element (SName) resolution helpers moved to `theme-element-resolve.ts`
// (mechanical extraction to keep this file under the 500-line cap) and
// re-exported here so existing `from './theme.js'` call sites are unaffected.
export {
  resolveElementPaint,
  resolveElementFontSize,
  resolveElementShadowing,
  resolveElementLineThickness,
} from './theme-element-resolve.js';
