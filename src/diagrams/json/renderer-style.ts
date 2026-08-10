/**
 * The resolved `jsonDiagram.node` style — the whole skinparam/style cascade
 * for the json family, collapsed once per diagram into plain values the
 * renderer only reads.
 *
 * Split out of `renderer.ts` for two reasons, both structural: that file sits
 * against this repo's 500-line cap, and upstream draws with a `Style` object
 * resolved BEFORE `drawU` runs (`TextBlockJson.java:269-288` resolves
 * `styleNode` and `styleSeparator` up front, then walks the rows), so
 * resolution and drawing are separate stages there too.
 *
 * Each resolver stays narrow deliberately: a `??` fallback chain is a branch,
 * and one function carrying the whole cascade trips this repo's
 * cyclomatic-complexity gate.
 *
 * @see .../jsondiagram/TextBlockJson.java#drawU
 */

import type { Theme } from '../../core/theme.js';
import { canonicalColor, canonicalColorOpt } from './color-form.js';

type JsonColors = Theme['colors']['graph']['json'];

/** One named `#highlight` style class's overrides (e.g. `.h1 { … }`). */
export interface HighlightClassStyle {
  background?: string;
  fontColor?: string;
  fontBold?: boolean;
  fontItalic?: boolean;
}

/** The resolved box values — everything drawn as a shape. */
export interface BoxStyleJson {
  bg: string;
  border: string;
  borderWidth: number;
  borderDash: string | undefined;
  /** Already halved for SVG — see {@link SVG_CORNER_DIVISOR}. */
  rx: number;
  sepColor: string;
  sepThickness: number;
  sepDash: string | undefined;
  hlBg: string;
  highlightClasses: Record<string, HighlightClassStyle> | undefined;
}

/** The resolved text values. */
export interface TextStyleJson {
  fontFamily: string;
  fontSize: number;
  fontColor: string | undefined;
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
  keyColor: string;
  headerBold: boolean;
  hlFontColor: string | undefined;
  hlFontBold: boolean;
  hlFontItalic: boolean;
  /**
   * Whether the `highlight` block DECLARED a `FontStyle` at all.
   *
   * `FontStyle` is a single style property, not a set of flags, so a
   * `highlight { FontStyle italic }` REPLACES an enclosing
   * `node { FontStyle bold }` rather than adding to it — `getStyleToUse`
   * (`TextBlockJson.java:138-153`) resolves one merged style per cell and
   * `StyleStorage#computeMergedStyle` gives the last writer the whole
   * property. A highlight that declares nothing must leave the surrounding
   * bold intact, which is why the distinction has to be carried rather than
   * inferred from `hlFontBold === false`.
   */
  hlFontStyleDeclared: boolean;
}

export interface NodeStyleJson {
  box: BoxStyleJson;
  text: TextStyleJson;
  json: JsonColors;
  /**
   * The resolved `scale …` factor (`scale-geo.ts#scaleNodeStyle`), carried on
   * the style so the renderer's own literal constants — the highlight rect's
   * inset, width reduction and corner radius — can be scaled at their single
   * use site without widening four call signatures past this repo's 5-param
   * cap. 1 when the diagram is unscaled.
   */
  scale: number;
}

/**
 * `skin/plantuml.skin`'s `yamlDiagram,jsonDiagram { FontColor black; LineColor
 * black }` (the block at :446). This family does NOT inherit the global
 * `#181818` default the other diagram types use — a distinction this port
 * previously missed, emitting `#181818` for both key text and node borders
 * where every cached golden has `#000`.
 *
 * Value text is the deliberate exception: see DIVERGENCES.md, "Value text —
 * per-type colors (aesthetic)".
 */
export const JSON_SKIN_BLACK = '#000000';

/**
 * `URectangle#rounded(round)` stores `round` on both axes, and
 * `DriverRectangleSvg.java:78` emits `rx/2`, `ry/2`. So the skin's
 * `node { RoundCorner 10 }` reaches the SVG as `rx="5" ry="5"` — which is what
 * every cached golden shows, and what this port previously emitted as `rx="10"`.
 */
export const SVG_CORNER_DIVISOR = 2;

/** `node { LineThickness 1.5 }`. */
const NODE_LINE_THICKNESS = 1.5;
/** `node { separator { LineThickness 1 } }` — was an unsourced 0.5 here. */
const SEPARATOR_LINE_THICKNESS = 1;
/** `node { RoundCorner 10 }`. */
const NODE_ROUND_CORNER = 10;
/** `node { highlight { BackGroundColor #ccff02 } }`. */
const HIGHLIGHT_BACKGROUND = '#CCFF02';

/**
 * Every resolver below takes an already-defaulted `j` rather than the optional
 * `json` itself. Optional chaining is a branch to this repo's complexity gate
 * exactly as `??` is, so `json?.a ?? x` costs two per field and a resolver of
 * any useful width trips the cap; defaulting once costs one for the whole
 * function.
 */
type JsonColorsResolved = NonNullable<JsonColors>;

function resolveBoxPaint(j: JsonColorsResolved, theme: Theme) {
  return {
    // Inherit from global theme colors when no explicit JSON override is set,
    // so built-in themes colorize JSON nodes without per-theme json overrides.
    bg: j.background ?? theme.colors.background,
    border: j.border ?? JSON_SKIN_BLACK,
    borderWidth: j.nodeLineThickness ?? NODE_LINE_THICKNESS,
    borderDash: j.nodeLineDasharray,
    rx: (j.roundCorner ?? NODE_ROUND_CORNER) / SVG_CORNER_DIVISOR,
  };
}

function resolveBoxSeparator(j: JsonColorsResolved) {
  return {
    sepColor: j.separatorColor ?? j.border ?? JSON_SKIN_BLACK,
    sepThickness: j.separatorThickness ?? SEPARATOR_LINE_THICKNESS,
    sepDash: j.separatorDasharray,
    hlBg: j.highlightBackground ?? HIGHLIGHT_BACKGROUND,
    highlightClasses: j.highlightClasses,
  };
}

function resolveFontFace(j: JsonColorsResolved, theme: Theme) {
  return {
    fontFamily: j.nodeFontFamily ?? theme.fontFamily,
    fontSize: j.nodeFontSize ?? theme.fontSize,
    fontColor: j.nodeFontColor,
  };
}

function resolveFontStyle(j: JsonColorsResolved) {
  return {
    bold: j.nodeFontBold ?? false,
    italic: j.nodeFontItalic ?? false,
    align: j.textAlign ?? 'left',
  };
}

function resolveTextHighlight(j: JsonColorsResolved) {
  return {
    // `node { header { FontStyle bold } }`; overridable to plain.
    headerBold: j.headerFontBold !== false,
    hlFontColor: j.highlightFontColor,
    hlFontBold: j.highlightFontBold ?? false,
    hlFontItalic: j.highlightFontItalic ?? false,
    // Both flags are written together by `style-map-json-diagram.ts:174-178`,
    // and only when a `FontStyle` line is present — so one being defined is
    // exactly "the block declared FontStyle".
    hlFontStyleDeclared: j.highlightFontBold !== undefined,
  };
}

/**
 * Every color the resolved style carries, in the jar's emitted form.
 * Centralised here so the renderer cannot emit a raw theme string by omission
 * — see `color-form.ts` for why the form matters.
 */
function canonicalizeColors(style: NodeStyleJson): NodeStyleJson {
  const { box, text } = style;
  return {
    ...style,
    box: {
      ...box,
      bg: canonicalColor(box.bg),
      border: canonicalColor(box.border),
      sepColor: canonicalColor(box.sepColor),
      hlBg: canonicalColor(box.hlBg),
      ...(box.highlightClasses === undefined
        ? {}
        : { highlightClasses: canonicalizeClasses(box.highlightClasses) }),
    },
    text: {
      ...text,
      keyColor: canonicalColor(text.keyColor),
      ...opt('fontColor', text.fontColor),
      ...opt('hlFontColor', text.hlFontColor),
    },
  };
}

/** Absent must stay absent under `exactOptionalPropertyTypes`. */
function opt(key: 'fontColor' | 'hlFontColor', v: string | undefined) {
  const c = canonicalColorOpt(v);
  return c === undefined ? {} : { [key]: c };
}

function canonicalizeClasses(
  classes: Record<string, HighlightClassStyle>,
): Record<string, HighlightClassStyle> {
  const out: Record<string, HighlightClassStyle> = {};
  for (const [name, cls] of Object.entries(classes)) {
    const bg = canonicalColorOpt(cls.background);
    const fc = canonicalColorOpt(cls.fontColor);
    out[name] = {
      ...cls,
      ...(bg === undefined ? {} : { background: bg }),
      ...(fc === undefined ? {} : { fontColor: fc }),
    };
  }
  return out;
}

/** Resolve the whole cascade once per diagram. */
export function resolveNodeStyle(theme: Theme): NodeStyleJson {
  const json = theme.colors.graph.json;
  const j: JsonColorsResolved = json ?? {};
  const font = resolveFontFace(j, theme);
  return canonicalizeColors({
    scale: 1,
    box: { ...resolveBoxPaint(j, theme), ...resolveBoxSeparator(j) },
    text: {
      ...font,
      ...resolveFontStyle(j),
      // Key text inherits node-level FontColor/FontName/FontSize (Java style
      // cascade), then falls back to this family's own black.
      keyColor: j.keyText ?? font.fontColor ?? JSON_SKIN_BLACK,
      ...resolveTextHighlight(j),
    },
    json,
  });
}
