/**
 * Per-element (SName) resolution helpers for {@link Theme} — the color,
 * font-size, and shadowing cascades each element's renderer reads. Split out
 * of `theme.ts` (at the project's 500-line file-size cap) as a mechanical,
 * no-behavior-change extraction; every function is pure over a {@link Theme}
 * and re-exported from `theme.ts` for backward-compatible call sites.
 */
import type { Theme } from './theme.js';
import type { Paint } from './paint.js';
import { resolveColorToSvgHex } from './klimt/color/HColorSet.js';

/**
 * Resolve the {@link Paint} for one element's color role, cascading
 * element-specific (SName) bucket → root default (decision D4). Never throws on
 * an unrecognized `sname` — it falls through to the root default.
 *
 * `background` resolves to the root node fill (`nodeBackground`, `#F1F1F1` by
 * default), NOT the class-specific `classBackground`, so a `database` (or any
 * non-`class` element) is not tinted with the class color.
 */
export function resolveElementPaint(
  theme: Theme,
  sname: string,
  role: 'background' | 'border' | 'font',
): Paint {
  const specific = theme.colors.elements?.[sname]?.[role];
  if (specific !== undefined) return specific;
  switch (role) {
    case 'background': {
      // `root`/`element { BackGroundColor }` (universal SName) cascades a
      // skin's fill (`skin rose` #FEFECE) below the per-bucket tier above and
      // above the `nodeBackground` default -- mirrors state's
      // `resolveStateRootElementBackground` (D3 second consumer, see the
      // `rootElementBackground` field doc).
      const rootEl = theme.colors.graph.rootElementBackground;
      return rootEl !== undefined ? resolveColorToSvgHex(rootEl) : theme.colors.nodeBackground;
    }
    case 'border':
      return theme.colors.border;
    case 'font':
      return theme.colors.text;
  }
}

/**
 * `StyleSignatureBasic#clean` (java) — lowercase every char, DROPPING `_` and
 * `.` entirely. Duplicated from `style-map-element.ts#cleanStereotypeToken`
 * rather than imported: that module reaches this one through
 * `skinparam.ts` → `theme.ts` (which re-exports every `resolveElement*` here),
 * so importing it back would close an ESM import cycle. Six lines, one
 * upstream rule, and the two copies are named for each other.
 */
function cleanStereoKey(name: string): string {
  let out = '';
  for (const ch of name) {
    if (ch !== '_' && ch !== '.') out += ch.toLowerCase();
  }
  return out;
}

/**
 * Resolve the entity/cluster text FONT SIZE override for one element's
 * `sname` and text role, cascading per-stereotype-NAME → STEREOTYPE-specific
 * → the element's own plain override → `undefined` (caller applies its own
 * `theme.fontSize + sizeDelta` default — G1 I4b,
 * `renderer-symbol.ts#textFont`). Mirrors `resolveElementPaint`'s cascade
 * shape but returns `undefined` rather than a hard default, since the numeric
 * default varies by caller (title vs stereotype vs a role-specific
 * `sizeDelta`).
 *
 * `stereotypes` (S1L-tail G4 tier 2): the element's OWN stereotype label(s),
 * raw as parsed. Supplied ONLY by callers that have them in scope; when
 * omitted the name-scoped tier is skipped and the cascade is exactly what it
 * was before that tier existed. See
 * {@link import('./theme-graph-colors.js').ElementColors.stereotypeFontSizeByStereo}
 * for why one CLEANED map serves both the `<style>` and `skinparam`
 * front-ends.
 */
export function resolveElementFontSize(
  theme: Theme,
  sname: string,
  role: 'title' | 'stereotype',
  stereotypes?: readonly string[],
): number | undefined {
  const bucket = theme.colors.elements?.[sname];
  if (bucket === undefined) return undefined;
  if (role === 'stereotype') {
    const byStereo = bucket.stereotypeFontSizeByStereo;
    if (byStereo !== undefined && stereotypes !== undefined) {
      // First matching label wins, in source order -- upstream builds the
      // element's style signature one label at a time (`withTOBECHANGED`),
      // so a diagram declaring two labels that BOTH carry a name-scoped
      // FontSize is already ambiguous upstream; no corpus fixture does.
      for (const label of stereotypes) {
        const scoped = byStereo[cleanStereoKey(label)];
        if (scoped !== undefined) return scoped;
      }
    }
    if (bucket.stereotypeFontSize !== undefined) return bucket.stereotypeFontSize;
  }
  return bucket.fontSize;
}

/**
 * mission skin-file-loading (deferred D3 item): resolve one element's own
 * `getStyle().getShadowing()` — cascades `theme.colors.elements[sname]
 * .shadowing` (`ElementColors.shadowing`'s doc comment) over the
 * diagram-wide `theme.shadowing` (bare `root`/`element`, Batch 1). Mirrors
 * `resolveElementPaint`'s two-tier cascade; always returns a number (never
 * `undefined`), matching `Style#getShadowing()`'s "absent -> 0" default.
 */
export function resolveElementShadowing(theme: Theme, sname: string): number {
  const specific = theme.colors.elements?.[sname]?.shadowing;
  if (specific !== undefined) return specific;
  return theme.shadowing ?? 0;
}

/**
 * Resolve one element's own border/line THICKNESS override
 * (`<style> <sname> { LineThickness N }`, e.g. `skin rose`'s
 * `componentDiagram { node, rectangle { LineThickness 1.5 } }`). Returns
 * `undefined` when the element declares none, letting each renderer apply
 * its own built-in default (description leaves: `ENTITY_STROKE_WIDTH` 0.5) --
 * mirroring `resolveElementFontSize`'s "absent -> caller default" shape,
 * since the numeric default varies by element kind. See
 * `ElementColors.lineThickness`'s doc comment.
 */
export function resolveElementLineThickness(theme: Theme, sname: string): number | undefined {
  return theme.colors.elements?.[sname]?.lineThickness;
}

/**
 * Resolve one element's own `MinimumWidth` content-width floor
 * (`<style> <sname> { MinimumWidth N }`, `PName.MinimumWidth`), cascading the
 * element-specific (SName) bucket over the diagram-wide `theme.minimumWidth`
 * (bare `skinparam minClassWidth`) — S1L-b T5, ADR-3. So `<style> package {
 * MinimumWidth 300 }` floors package boxes while a sibling `card` (no scoped
 * override, no global floor) falls through to `undefined` and the box default.
 * Returns `undefined` when neither tier is set, letting `measureBox` apply its
 * own `BOX_MIN_WIDTH_DEFAULT` — mirrors `resolveElementLineThickness`'s
 * "absent -> caller default" shape.
 */
export function resolveElementMinimumWidth(theme: Theme, sname: string): number | undefined {
  return theme.colors.elements?.[sname]?.minimumWidth ?? theme.minimumWidth;
}
