/**
 * skinparam overrides — FromSkinparamToStyle.java:87-176.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/FromSkinparamToStyle.java:87-176
 *   (authoritative skinparam key list — `addConFont("title"/"header"/
 *   "footer"/"caption"/"legend", ...)` for Font{Size,Style,Color,Name}, plus
 *   title/legend-only `*BorderColor`/`*BackgroundColor`/`*BorderRoundCorner`.
 *   No `mainframe*` entries exist upstream — mainframe has no skinparam keys.)
 */

import { resolveConditionalColor } from '../klimt/color/HColorSet.js';
import type { AnnotationBoxStyle, AnnotationElement } from './annotation-style-types.js';
import { expandGrayShorthand, resolveChromeColor } from './annotation-color.js';

/**
 * Normalize a raw skinparam key for annotation-key matching: trim, lowercase,
 * strip underscores/dots. This is a deliberate scoped subset of upstream
 * `SkinParam.cleanForKeySlow` (ported in full as `skinparam.ts`'s private
 * `normaliseKey`) — none of Title/Header/Footer/Caption/Legend's key names
 * hit the sequence-prefix / arrow-prefix / align-suffix special cases that
 * function also handles, so this local subset is sufficient and avoids
 * exporting a private symbol from that (CCN-flagged) module.
 */
function normaliseAnnotationKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/[_.]/g, '');
}

type FontSuffix = 'fontsize' | 'fontstyle' | 'fontcolor' | 'fontname';
const FONT_SUFFIXES: readonly FontSuffix[] = ['fontsize', 'fontstyle', 'fontcolor', 'fontname'];

// Table-dispatch equivalent of upstream's per-suffix switch: each handler
// receives the same (style, value, documentBackgroundHex) signature as the
// original `applyFontSuffix` switch cases (a handler may ignore trailing
// arguments it doesn't need — TS structurally permits a narrower function
// where the wider signature is expected).
type FontSuffixHandler = (style: AnnotationBoxStyle, value: string, documentBackgroundHex: string) => void;

const FONT_SUFFIX_HANDLERS: Record<FontSuffix, FontSuffixHandler> = {
  fontsize: (style, value) => {
    const n = Number.parseInt(value.trim(), 10);
    if (Number.isFinite(n)) style.fontSize = n;
  },
  fontstyle: (style, value) => {
    const v = value.trim().toLowerCase();
    if (v === 'plain' || v === 'bold' || v === 'italic') style.fontStyle = v;
  },
  // G2 N48 (item 29): `#?light:dark[:transparent]` (`HColorScheme`) -- see
  // `resolveConditionalColor`'s own doc comment for the local-background
  // semantics; every chrome element sits directly on the document canvas,
  // so that IS the local paint background here.
  fontcolor: (style, value, documentBackgroundHex) => {
    const trimmed = value.trim();
    style.fontColor = resolveConditionalColor(trimmed, documentBackgroundHex) ?? expandGrayShorthand(trimmed);
  },
  fontname: (style, value) => {
    style.fontFamily = value.trim();
  },
};

function applyFontSuffix(
  style: AnnotationBoxStyle,
  suffix: FontSuffix,
  value: string,
  documentBackgroundHex: string,
): void {
  FONT_SUFFIX_HANDLERS[suffix](style, value, documentBackgroundHex);
}

// title/legend additionally expose Border*/Background* skinparam keys
// (FromSkinparamToStyle.java:166-176); header/footer/caption do not.
const BOX_KEY_ELEMENTS: ReadonlySet<AnnotationElement> = new Set(['title', 'legend']);

function applyBoxSuffix(style: AnnotationBoxStyle, suffix: string, value: string): boolean {
  switch (suffix) {
    case 'bordercolor':
      style.lineColor = resolveChromeColor(value);
      return true;
    case 'backgroundcolor':
      style.backgroundColor = resolveChromeColor(value);
      return true;
    case 'borderroundcorner': {
      const n = Number.parseInt(value.trim(), 10);
      if (Number.isFinite(n)) style.roundCorner = n;
      return true;
    }
    case 'borderthickness': {
      // G2 N50: `titleBorderThickness`/`legendBorderThickness` ->
      // `PName.LineThickness` (`FromSkinparamToStyle.java:166,172`) --
      // `parseFloat` (not `parseInt`) since the jar accepts fractional
      // values (`BorderThickness 5.0`, jar-verified `cifeta-62-xodi576`).
      const n = Number.parseFloat(value.trim());
      if (Number.isFinite(n)) style.lineThickness = n;
      return true;
    }
    default:
      return false;
  }
}

// Every annotation element except `mainframe` has upstream skinparam keys
// named after itself (`titleFontSize`, `headerFontColor`, ...). `mainframe`
// has none — confirmed absent from FromSkinparamToStyle.java's knowledge
// table (CommandMainframe parses its own inline args instead, per D9).
const SKINPARAM_PREFIXES: Partial<Record<AnnotationElement, string>> = {
  title: 'title',
  header: 'header',
  footer: 'footer',
  caption: 'caption',
  legend: 'legend',
};

export function applySkinparamOverrides(
  element: AnnotationElement,
  style: AnnotationBoxStyle,
  skinparam: ReadonlyMap<string, string>,
  documentBackgroundHex: string,
): void {
  const prefix = SKINPARAM_PREFIXES[element];
  if (prefix === undefined) return;

  for (const [rawKey, value] of skinparam) {
    const key = normaliseAnnotationKey(rawKey);
    if (!key.startsWith(prefix)) continue;
    const suffix = key.slice(prefix.length);

    if ((FONT_SUFFIXES as readonly string[]).includes(suffix)) {
      applyFontSuffix(style, suffix as FontSuffix, value, documentBackgroundHex);
      continue;
    }
    if (BOX_KEY_ELEMENTS.has(element)) applyBoxSuffix(style, suffix, value);
  }
}
