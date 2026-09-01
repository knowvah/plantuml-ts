/**
 * Theme system for plantuml-ts.
 * Defines the visual appearance of all diagram types via a single Theme
 * interface. The resolveTheme helper normalises string aliases and deep-merges
 * partial overrides without mutating the built-in theme objects.
 */

import { BUILTIN_THEMES } from './themes-builtin.js';
// mission skin-file-loading: ElementColors/ThemeGraphColors moved to
// theme-graph-colors.ts (re-exported below) to keep this file under the
// project's 500-line file-size cap — see that module's own doc comment.
import type { ElementColors, ThemeGraphColors } from './theme-graph-colors.js';
import type { ActorStyle } from './skin/ActorStyle.js';

export type { ElementColors, ThemeGraphColors } from './theme-graph-colors.js';

export interface Theme {
  fontFamily: string;
  fontSize: number;
  /** GraphvizImageBuilder.java:124-126 cascade font (`getStyleArrowCardinality`); default 13 = plantuml.skin:307 arrow FontSize, family = root's SansSerif (plantuml.skin:6, arrow sets no FontName). Optional so pre-existing hand-built `Theme` literals elsewhere stay valid; `defaultTheme`/`darkTheme` always set both. No consumer yet — T5/T6, decisions.md#D3. */
  cardinalityFontSize?: number;
  cardinalityFontFamily?: string;
  /** SI26 D5: `<style> arrow { cardinality { FontColor } }`, resolved hex. Absent = inherit the arrow label colour (`GraphvizImageBuilder.java:124-126` signature `{root,element,<diagram>,arrow,cardinality}`; `plantuml.skin` has no `cardinality` block). Read by `arrow-label-font.ts#resolveCardinalityFontColor`. */
  cardinalityFontColor?: string;
  /** R2j: EXPLICIT `skinparam defaultFontSize` marker (set only when the key
   *  was seen) — `SkinParam#getFontSize`'s middle tier between per-param
   *  skinparams and each FontParam's own default (SkinParam.java:441-448),
   *  so explicit 14 != unset (CIRCLED_CHARACTER 17->14: radius 11->10,
   *  jar-verified R2c pm14/). Unlike the ambient {@link fontSize}. */
  defaultFontSize?: number;
  /**
   * The diagram's own outer margin, when a theme declares one.
   * `TextBlockExporter#calculateMargin` (`:510-516`) reads the merged style
   * for `root.document` and falls back to `TitledDiagram#getDefaultMargins()`
   * — `same(10)` — only when that style carries no `Margin`. 28 built-in
   * themes declare one; 21 restate the default 10 and 7 set 5.
   * Four-sided because upstream's value is (`ClockwiseTopRightBottomLeft`,
   * CSS-shaped 1/2/3/4 numbers); only the uniform form occurs at this scope
   * today. Absent means "use the engine's default".
   */
  diagramMargin?: { top: number; right: number; bottom: number; left: number };
  /**
   * The theme's own `<style> document { … }` declarations, as
   * `selector -> { property: value }` with lowercase keys — the same shape
   * `parseStyleBlock` produces.
   * `document` and `document.<element>` are genuine members of every chrome
   * element's `{root, document, <element>}` signature, and
   * `StyleStorage#computeMergedStyle` matches by set containment, so a theme's
   * `document { title { FontSize 22 } }` reaches the title exactly as a user
   * `<style>` block would. Everything else in a theme is compiled to the
   * scalar fields above; these have no scalar home and were simply lost, which
   * is why `!theme amiga` drew a 14px title where the jar draws 22px.
   */
  styleOverrides?: Record<string, Record<string, string>>;

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
  /** `skinparam actorStyle awesome|hollow|stickman` (`SkinParam.java:1209-
   *  1218`'s `actorStyle()`: case-insensitive `getValue("actorstyle")`,
   *  `"awesome"` → `ActorStyle.AWESOME`, `"hollow"` → `ActorStyle.HOLLOW`,
   *  anything else (including absent/unrecognized) → `ActorStyle.STICKMAN`.
   *  Consumed by both the leaf RENDERER (`renderer-entity.ts#buildEntityParams`)
   *  and the SIZER (`leaf-sizing.ts#buildSizingEntityParams`, threaded via
   *  `ClassifyCtx.actorStyle`/`BoxSizingOpts.actorStyle`) — the single shared
   *  read this field exists to provide (T7, description-leaf-sizing-audit:
   *  before this field existed, both call sites independently hardcoded
   *  `ActorStyle.STICKMAN`, the defect this field closes). `STICKMAN_BUSINESS`
   *  is never resolved from this field — it is reachable only via the
   *  `actor/` keyword spelling (`USymbols.java:162`). */
  actorStyle?: ActorStyle;
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
   *  point). Class is this field's first consumer; NOT wired into
   *  description/other diagram types (no corpus sample exercised it -- same
   *  scoping as `strictUml`'s doc comment). `SkinParam.isDark(...)`'s own
   *  DARK_MODE branch (jar's FIRST check, ahead of `monochrome`) is
   *  unmodeled -- `!theme dark`-interaction untraced, named remainder. */
  monochrome?: 'true' | 'reverse';
  strictUml?: boolean;
  /** `skinparam footbox hide|show`; see `SequenceDiagram#isShowFootbox`. */
  footbox?: string;
  /**
   * `skinparam handwritten true` — draw every primitive through the sketchy
   * renderer (`core/klimt/drawing/hand/`).
   * `JsonDiagram#drawU` and its siblings open with
   * `if (handwritten) ug = new UGraphicHandwritten(ug)`, a decorator that
   * turns rectangles and ellipses into jiggled polygons and lines and paths
   * into jiggled polylines. Deterministic: the jitter comes from a single
   * `new Random(424242L)` per diagram.
   * Honoured by the json family so far; other engines need their draw order
   * confirmed against the jar before it can be switched on there, because the
   * random stream is shared and sequential across every shape.
   */
  handwritten?: boolean;
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
   * is NOT modeled here (D3, a later increment if a fixture needs it).
   * Absent = 0 (no shadow); Batch 2 draws the shadow filter + reserves ink.
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
  /** `skinparam sameClassWidth true` — floors every class-like node's width
   *  to the widest one's (`SkinParam.java:994` sameClassWidth();
   *  `GraphvizImageBuilder.java:371-375` setParamSameClassWidth;
   *  `EntityImageClass.java:108-110`). A2s B7; consumed by
   *  `class-dot-graph.ts#applySameClassWidthFloor`. */
  sameClassWidth?: boolean;
  /** `skinparam classAttributeIconSize N` — `SkinParam#classAttributeIconSize()`
   *  (`getAsInt("classAttributeIconSize", 10)`, SkinParam.java:554-556).
   *  `0` IS meaningful (icons OFF, visibility char kept in the member text —
   *  `MethodsOrFieldsArea#hasSmallIcon` java:125-127 / `#createTextBlock`
   *  java:244-246); absent = upstream default 10 (icons on). A2s F-G A13;
   *  consumed by `class-layout-helpers.ts#measureClassifier` →
   *  `class-layout-generic-classifier.ts#computeMemberSectionsGeo`. */
  classAttributeIconSize?: number;
  /** `skinparam groupInheritance N` — a class that is the shared tail of
   *  >= N triangle-decor links gets `EntityImageProtected(border=20)`
   *  (`DotData.java:136-151`; `getAsInt("groupInheritance", ...)`). A2s
   *  A10/B3; consumed by
   *  `class-dot-graph.ts#computeGroupInheritanceProtectedIds` (values <= 1
   *  are treated as unset there). */
  groupInheritance?: number;
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
    /** `PName.ShowStereotype` per `.tagname` -- see
     *  `style-map-element.ts#computeShowStereotypeByTag`. An ABSENT entry
     *  means show, mirroring upstream's `ValueNull` branch
     *  (`Display.java:131-133`); only an explicit `false` lands here. */
    showStereotypeByTag?: Readonly<Record<string, boolean>>;
    graph: ThemeGraphColors;
  };
  sequence: {
    /**
     * Padding inside a participant box, on every side.
     *
     * `plantuml.skin:186-190` sets `Padding 7` for
     * `participant,actor,boundary,control,entity,queue,database,collections`,
     * and `ClockwiseTopRightBottomLeft.read` expands a scalar to all four
     * sides. `AbstractTextualComponent#getTextWidth` adds
     * `padding.getLeft() + padding.getRight()` to the raw text block
     * (`:106-108`) and `getTextHeight` adds top + bottom (`:110-114`), and
     * `ComponentRoseParticipant#drawInternalU:100-104` draws a rectangle of
     * exactly those two. So the drawn box is `text + 2 * this` on both axes.
     *
     * There is deliberately NO minimum-width companion to this. Upstream's
     * floor is `Rose#getMinClassWidth` = `style.value(PName.MinimumWidth)`
     * (`Rose.java:275-278`), `MinimumWidth` is declared in no skin file, and
     * `ValueNull#asDouble()` returns 0 (`ValueNull.java:57-59`) — so
     * upstream's floor is zero. See
     * `plans/sequence-coordinate-convergence/findings/participant-width.md`.
     */
    participantPadding: number;
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
  cardinalityFontSize: 13, // plantuml.skin:307
  cardinalityFontFamily: 'sans-serif', // plantuml.skin:6 root default; arrow sets no FontName
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
    frame: '#000000', // plantuml.skin:117 (sequenceDiagram.group LineColor)
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
        // All four default to the skin's black (`plantuml.skin:446`), as
        // upstream draws every value cell in the node's own FontColor. The
        // per-type palette that used to be here was retired 2026-08-09 — see
        // DIVERGENCES.md, "Value text — per-type colors".
        stringValue:         '#000000',
        numberValue:         '#000000',
        booleanValue:        '#000000',
        nullValue:           '#000000',
        // plantuml.skin sets jsonDiagram.node.BackGroundColor #F1F1F1 as the default.
        // Named themes override this via their compiled graph.json entry.
        background:          '#F1F1F1',
        // `skin/plantuml.skin`'s `yamlDiagram,jsonDiagram { LineColor black }`
        // (:446) — this family does NOT take the global `#181818` default.
        // Every cached golden draws its node borders, separators and edges in
        // `#000`; these two were `#181818`, unsourced.
        border:              '#000000',
        highlightBackground: '#CCFF02',
        arrowColor:          '#000000',
      },
    },
  },
  sequence: {
    participantPadding: 7,
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
  cardinalityFontSize: 13, // plantuml.skin:307; same default as defaultTheme's
  cardinalityFontFamily: 'sans-serif',
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
    frame: '#000000', // plantuml.skin:117 (sequenceDiagram.group LineColor)
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
 * Unlike Partial<Theme> (which is only one level deep), colors and its nested
 * fields may each be partially specified. deepMergeTheme accepts this type and
 * fills missing fields from the base.
 */
export type ThemeOverride = {
  fontFamily?: string;
  fontSize?: number;
  cardinalityFontSize?: number;
  cardinalityFontFamily?: string;
  cardinalityFontColor?: string;
  diagramMargin?: { top: number; right: number; bottom: number; left: number };
  /** See {@link Theme.styleOverrides}. */
  styleOverrides?: Record<string, Record<string, string>>;
  /** See `Theme.defaultFontSize`'s own doc comment (R2j). */
  defaultFontSize?: number;
  linetype?: 'ortho' | 'polyline';
  fixCircleLabelOverlapping?: boolean;
  componentStyle?: 'uml2' | 'uml1' | 'rectangle';
  actorStyle?: ActorStyle;
  minimumWidth?: number;
  strictUml?: boolean;
  /**
   * `skinparam handwritten true` — draw every primitive through the sketchy
   * renderer (`core/klimt/drawing/hand/`).
   * `JsonDiagram#drawU` and its siblings open with
   * `if (handwritten) ug = new UGraphicHandwritten(ug)`, a decorator that
   * turns rectangles and ellipses into jiggled polygons and lines and paths
   * into jiggled polylines. Deterministic: the jitter comes from a single
   * `new Random(424242L)` per diagram.
   * Honoured by the json family so far; other engines need their draw order
   * confirmed against the jar before it can be switched on there, because the
   * random stream is shared and sequential across every shape.
   */
  handwritten?: boolean;
  monochrome?: 'true' | 'reverse';
  /** See `Theme.shadowing`'s own doc comment. */
  shadowing?: number;
  packageStyle?: 'rect';
  nodeSep?: number;
  rankSep?: number;
  wrapWidth?: number;
  sameClassWidth?: boolean;
  classAttributeIconSize?: number;
  groupInheritance?: number;
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
  'defaultFontSize', 'linetype', 'fixCircleLabelOverlapping',
  'componentStyle', 'actorStyle', 'minimumWidth', 'strictUml', 'monochrome',
  'shadowing', 'packageStyle', 'nodeSep', 'rankSep', 'wrapWidth',
  'sameClassWidth', 'classAttributeIconSize', 'groupInheritance', 'tabSize',
  'cardinalityFontSize', 'cardinalityFontFamily', // T1 (edge-label-box-backlog, D3)
  'cardinalityFontColor', // SI26 T1 (D5)
  // `diagramMargin` is the one non-scalar here. It rides this list because the
  // merge is a whole-value replacement, which is exactly right for a margin:
  // a theme that sets one replaces all four sides, it does not blend with the
  // default. Omitting it silently dropped every theme's margin.
  'diagramMargin', 'handwritten', 'styleOverrides',
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
  resolveElementMinimumWidth,
} from './theme-element-resolve.js';
