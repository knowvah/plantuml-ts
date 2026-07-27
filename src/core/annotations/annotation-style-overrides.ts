/**
 * `<style>` overrides — parseStyleBlock's already-parsed StyleMap.
 */

import type { StyleMap } from '../skinparam.js';
import { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import { resolveConditionalColor } from '../klimt/color/HColorSet.js';
import type { AnnotationBoxStyle, AnnotationElement } from './annotation-style-types.js';
import { expandGrayShorthand, resolveChromeColor } from './annotation-color.js';
import { parseClockwise } from './annotation-clockwise.js';

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
  ['fontcolor', (s, v) => { s.fontColor = expandGrayShorthand(v.trim()); }],
  ['fontname', (s, v) => { s.fontFamily = v.trim(); }],
  ['linecolor', (s, v) => { s.lineColor = resolveChromeColor(v); }],
  ['backgroundcolor', (s, v) => { s.backgroundColor = resolveChromeColor(v); }],
  [
    'roundcorner',
    (s, v) => {
      const n = Number.parseInt(v.trim(), 10);
      if (Number.isFinite(n)) s.roundCorner = n;
    },
  ],
  ['padding', (s, v) => { s.padding = parseClockwise(v); }],
  ['margin', (s, v) => { s.margin = parseClockwise(v); }],
  [
    'horizontalalignment',
    (s, v) => {
      const val = v.trim().toUpperCase();
      if (val === HorizontalAlignment.LEFT || val === HorizontalAlignment.CENTER || val === HorizontalAlignment.RIGHT) {
        s.horizontalAlignment = val;
      }
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
}

/**
 * D7: `legend`'s upstream style signature is diagram-type-scoped
 * (`root,document,<type>,legend`); title/caption/header/footer/mainframe are
 * bare (`root,document,<element>` — confirmed for mainframe via
 * `DiagramChromeFactory.java:263`). `resolveAnnotationStyles` has no
 * `diagramType` parameter (locked T2 interface: theme/skinparam/styleMap
 * only), so every `<type>.legend` selector `parseStyleBlock` can produce
 * (its 2-level nesting cap fits `sequenceDiagram { legend { ... } }` exactly)
 * is applied regardless of the diagram actually being rendered. Flagged for
 * T4/orchestrator: threading a `diagramType` parameter through is the correct
 * fix once available.
 */
export function applyStyleOverrides(
  element: AnnotationElement,
  style: AnnotationBoxStyle,
  styleMap: StyleMap,
  documentBackgroundHex: string,
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
  for (const [selector, declarations] of styleMap) {
    // \x22document.legend\x22 is already applied above (documentScoped); skip
    // it here so it is not re-applied a second, redundant time.
    if (selector !== 'legend' && selector !== 'document.legend' && selector.endsWith('.legend')) {
      applyDeclarations(style, declarations, documentBackgroundHex);
    }
  }
}
