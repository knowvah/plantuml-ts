/**
 * `<style>` overrides — parseStyleBlock's already-parsed StyleMap.
 */

import type { StyleMap } from '../skinparam.js';
import { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import { resolveConditionalColor } from '../klimt/color/HColorSet.js';
import type { AnnotationBoxStyle, AnnotationElement } from './annotation-style-types.js';
import { expandGrayShorthand, resolveChromeColor } from './annotation-color.js';
import { parseClockwise } from './annotation-clockwise.js';
import { lineStyleDash } from '../style-line-style.js';

type StyleSetter = (style: AnnotationBoxStyle, value: string) => void;

const STYLE_PROPERTY_SETTERS: ReadonlyArray<readonly [key: string, apply: StyleSetter]> = [
  [
    'fontsize',
    (s, v) => {
      const n = Number.parseInt(v.trim(), 10);
      if (Number.isFinite(n)) s.fontSize = n;
    },
  ],
  [
    'fontstyle',
    (s, v) => {
      const val = v.trim().toLowerCase();
      if (val === 'plain' || val === 'bold' || val === 'italic') s.fontStyle = val;
    },
  ],
  [
    'fontcolor',
    (s, v) => {
      s.fontColor = expandGrayShorthand(v.trim());
    },
  ],
  [
    // cdd6 T3g (D3): `PName.HyperLinkColor` -- `Style.java:265` /
    // `FontConfiguration.java:213-219` build the element's FontConfiguration
    // with it; `StripeSimple.java:224-225` (`addUrl`) draws the `[[url]]`
    // atom from that FontConfiguration. Stored like `fontcolor`; a `#?`
    // conditional value is re-resolved in `applyDeclarations`.
    'hyperlinkcolor',
    (s, v) => {
      s.hyperlinkColor = expandGrayShorthand(v.trim());
    },
  ],
  [
    'fontname',
    (s, v) => {
      s.fontFamily = v.trim();
    },
  ],
  [
    'linecolor',
    (s, v) => {
      s.lineColor = resolveChromeColor(v);
    },
  ],
  [
    // Absent from this table until now, so `<style> … { LineThickness N }`
    // never reached chrome at all -- only the `titleBorderThickness` /
    // `legendBorderThickness` skinparams did (`annotation-skinparam.ts`).
    // Every bundled theme sets `document { title { LineThickness 0 } }`, which
    // `TextBlockBordered#noBorder()` turns into "draw no border box".
    'linethickness',
    (s, v) => {
      const n = Number.parseFloat(v.trim());
      if (Number.isFinite(n)) s.lineThickness = n;
    },
  ],
  [
    // lgm-T1a: `PName.LineStyle`, parsed the way `Style#getStroke` does.
    'linestyle',
    (s, v) => {
      s.lineStyle = lineStyleDash(v.trim());
    },
  ],
  [
    'backgroundcolor',
    (s, v) => {
      s.backgroundColor = resolveChromeColor(v);
    },
  ],
  [
    'roundcorner',
    (s, v) => {
      const n = Number.parseInt(v.trim(), 10);
      if (Number.isFinite(n)) s.roundCorner = n;
    },
  ],
  [
    'padding',
    (s, v) => {
      s.padding = parseClockwise(v);
    },
  ],
  [
    'margin',
    (s, v) => {
      s.margin = parseClockwise(v);
    },
  ],
  [
    'horizontalalignment',
    (s, v) => {
      const val = v.trim().toUpperCase();
      if (val === HorizontalAlignment.LEFT || val === HorizontalAlignment.CENTER || val === HorizontalAlignment.RIGHT) {
        s.horizontalAlignment = val;
      }
    },
  ],
  [
    // cdd5-T4e (legend-style-maximumwidth-ignored): `PName.MaximumWidth`
    // (`Style.java:330-333`) -- only `<style>` sets it, no skin selector or
    // skinparam key does (`AnnotationBoxStyle.maximumWidth`'s own doc
    // comment); only `legend`'s draw call site consumes it.
    'maximumwidth',
    (s, v) => {
      const n = Number.parseInt(v.trim(), 10);
      if (Number.isFinite(n)) s.maximumWidth = n;
    },
  ],
];

function applyDeclarations(
  style: AnnotationBoxStyle,
  declarations: ReadonlyMap<string, string>,
  documentBackgroundHex: string,
): void {
  for (const [key, apply] of STYLE_PROPERTY_SETTERS) {
    const value = declarations.get(key);
    if (value !== undefined) apply(style, value);
  }
  // G2 N48 (item 29): `<style> ... { FontColor #?light:dark[:transparent] }
  // }` -- STYLE_PROPERTY_SETTERS' plain 'fontcolor' setter above already
  // ran (and stored the raw, un-resolved literal); re-resolve it here now
  // that every declaration for THIS selector has been applied, so a later
  // conditional spec in the SAME block still wins over an earlier one
  // (matching every other property's own last-wins order). A no-op for a
  // plain (non-`#?`) FontColor value (`resolveConditionalColor` returns
  // `undefined`, `style.fontColor` is left as the plain setter's own
  // result).
  const fontColorRaw = declarations.get('fontcolor');
  if (fontColorRaw !== undefined) {
    const conditional = resolveConditionalColor(fontColorRaw.trim(), documentBackgroundHex);
    if (conditional !== undefined) style.fontColor = conditional;
  }
  // cdd6 T3g: the same `#?light:dark` re-resolution for HyperLinkColor --
  // `Style.java:265` resolves it through the same `asColor(set)` as FontColor.
  const hyperlinkRaw = declarations.get('hyperlinkcolor');
  if (hyperlinkRaw !== undefined) {
    const conditional = resolveConditionalColor(hyperlinkRaw.trim(), documentBackgroundHex);
    if (conditional !== undefined) style.hyperlinkColor = conditional;
  }
}

/**
 * D7: `legend`'s upstream style signature is diagram-type-scoped
 * (`root,root,document,<styleName>,legend`, EntityImageLegend.java:49-51);
 * title/caption/header/footer/mainframe are bare (`root,document,<element>`
 * — confirmed for mainframe via `DiagramChromeFactory.java:263`).
 *
 * wep-T5b: with the diagram's `styleName` (`DiagramType#getStyleName`,
 * `style.ts#getStyleName`) the legend takes every further selector whose
 * names all belong to that signature (`StyleSignatureBasic#matchAll`, pure
 * set containment, java:194-220) -- the bare `<styleName>` block and
 * `<styleName>.legend` among them, another diagram type's `.legend` not --
 * in the map's order, after the fixed `root`/`document`/`legend`/
 * `document.legend` steps above. Without one (a producer that sets no
 * `RenderFragment.diagramType`, or the agnostic `.legend` field), every
 * `<type>.legend` selector is applied regardless of the diagram, as before.
 */
export function applyStyleOverrides(
  element: AnnotationElement,
  style: AnnotationBoxStyle,
  styleMap: StyleMap,
  documentBackgroundHex: string,
  diagramStyleName?: string,
): void {
  // G2 N48: `root` is the LOWEST-priority member of the `root,document,
  // <element>` style signature (this function's own D7 doc comment) --
  // never checked here before (a pre-existing gap, not something T7's own
  // `document.<element>` fix addressed) -- applied FIRST so the
  // more-specific selectors below still win when a source sets both.
  const root = styleMap.get('root');
  if (root !== undefined) applyDeclarations(style, root, documentBackgroundHex);

  // G2 N51: a BARE `<style> document { ... } }` block (NO nested element
  // selector) is a genuine member of every chrome element's `{root,
  // document,<element>}` style signature -- `StyleStorage#computeMergedStyle`
  // matches by pure SET-CONTAINMENT (`StyleSignatureBasic#matchAll`, java),
  // not ancestor-path specificity, so it applies to EVERY element unless a
  // more specific selector below overwrites the SAME property -- jar-
  // verified via direct `StyleStorage` instrumentation (`plans/g2-class-svg/
  // ledger.md` N51, mumefa-23-xoxe715 trace) confirming the bare `document`
  // entry wins over the skin-default `BASE_DEFAULTS` (`annotation-defaults.ts`'s
  // own `#D` legend default, etc.) exactly like `root` above, and is in turn
  // overwritten by the more-specific `bare`/`documentScoped`/type-scoped
  // selectors that follow -- their existing precedence already matches
  // jar's real "last write wins per-property" merge order (a NESTED user
  // override is always inserted/merged AFTER its own enclosing bare block
  // reaches this same property, `majoge-68-zuji574` jar-verified: `document
  // { BackGroundColor orange; legend { BackgroundColor green } }` renders
  // the legend green, not orange).
  const documentBare = styleMap.get('document');
  if (documentBare !== undefined) applyDeclarations(style, documentBare, documentBackgroundHex);

  const bare = styleMap.get(element);
  if (bare !== undefined) applyDeclarations(style, bare, documentBackgroundHex);

  // T7 bug fix (jar-verified against tests/corpus/class/A0005_Test.puml's
  // `document { title { BackGroundColor yellow } } }` -- the jar's SVG
  // contains `fill=\x22#FFFF00\x22` on the title rect): the upstream style
  // signature for every chrome element is `root,document,<element>` (this
  // function's own D7 doc comment, above) -- `parseStyleBlock`'s dot-joined
  // selector for a `document { <element> { ... } } }` block is literally
  // \x22document.<element>\x22, which was never checked here (only the bare,
  // un-nested `<element>` key was). Applied AFTER the bare form so the more
  // path-specific selector wins when a source carries both.
  const documentScoped = styleMap.get('document.' + element);
  if (documentScoped !== undefined) applyDeclarations(style, documentScoped, documentBackgroundHex);

  if (element !== 'legend') return;
  const matches = legendSelectorMatcher(diagramStyleName);
  for (const [selector, declarations] of styleMap) {
    if (matches(selector)) applyDeclarations(style, declarations, documentBackgroundHex);
  }
}

/** The four selectors {@link applyStyleOverrides} applies before its loop,
 *  skipped there so none is applied a second time. */
const LEGEND_FIXED_SELECTORS: ReadonlySet<string> = new Set(['root', 'document', 'legend', 'document.legend']);

/**
 * Which remaining selectors reach the legend: with a style name, those whose
 * every name is one of `root`, `document`, `<styleName>`, `legend`
 * (`StyleSignatureBasic.of(root, root, document, styleName, legend)`,
 * EntityImageLegend.java:49-51, under `matchAll`); without, any `*.legend`.
 */
function legendSelectorMatcher(diagramStyleName: string | undefined): (selector: string) => boolean {
  if (diagramStyleName === undefined) {
    return (selector) => !LEGEND_FIXED_SELECTORS.has(selector) && selector.endsWith('.legend');
  }
  const names = new Set(['root', 'document', diagramStyleName.toLowerCase(), 'legend']);
  return (selector) => !LEGEND_FIXED_SELECTORS.has(selector) && selector.split('.').every((name) => names.has(name));
}
