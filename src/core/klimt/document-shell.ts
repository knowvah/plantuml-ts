/**
 * document-shell.ts — shared klimt-document-shell assembly/disassembly
 * helpers. Extracted from `diagrams/description/renderer.ts` (G1 I1's
 * `assembleKlimtShell`/`unwrapKlimtSvg`) during mission G2 N1 so a second
 * engine (class) can reuse the SAME literal-constant root-attribute
 * assembly instead of duplicating it — see `plans/g2-class-svg/ledger.md`
 * N1 ("the class path may be able to share the same shell machinery
 * rather than duplicating it").
 *
 * `description/renderer.ts` keeps `unwrapKlimtSvg`/`assembleKlimtShell` as
 * its own thin, description-scoped wrappers around the functions here
 * (`DIAGRAM_TYPE_DESCRIPTION` baked in) — this module carries no
 * per-engine defaults, only the diagram-type-parameterized mechanics.
 *
 * @see ~/git/plantuml/.../klimt/drawing/svg/SvgGraphicsCore.java (getRootNode, getG, createXml)
 * @see plans/g1-description-svg/decision-journal.md (I1)
 * @see plans/g2-class-svg/ledger.md (N1)
 * @see plans/si14-usymbol-measurement-sharing/decisions.md (ADR-2, T1)
 */

import { collectDocumentDefs } from '../svg-defs.js';
import { ROOT_GROUP_OPEN } from '../svg.js';
import { escapeAttribute } from '../svg-format.js';

/**
 * A literal double-quote, via unicode escape so this file contains zero raw
 * double-quote glyphs — mirrors `description/renderer.ts`'s DQUOTE
 * convention (project complexity-hook rule).
 */
export const DQUOTE = '\x22';

/** D4′ preamble conformance — every cached jar fixture carries this
 *  literal placeholder token, not a real version string (see
 *  `svg-graphics-core.ts`'s own doc comment). */
export const VERSION_PLACEHOLDER = '$version$';

/** `data-diagram-type` — the root attribute name every klimt-shaped
 *  document shell carries (verified against `DiagramType.java:45` and
 *  every cached jar fixture's root `<svg>`). */
export const DIAGRAM_TYPE_ATTR = 'data-diagram-type';

/**
 * Everything `assembleDocumentShell` needs from a `RenderFragment`-shaped
 * object: pre-composed body content, final document dimensions, and the
 * optional background/extraDefs `svgRoot` would otherwise consume. `body`
 * MUST already be wrapped exactly the way the caller wants it to appear
 * inside the root `<g>` slot — this function performs no wrapping of its
 * own (see `class/renderer-shell.ts`'s doc comment for why the wrap
 * decision lives at the call site, not here).
 */
export interface ShellFragment {
  readonly body: string;
  readonly width: number;
  readonly height: number;
  readonly background?: string;
  readonly extraDefs?: string;
}

/**
 * The content `<g>`'s open tag, bare (`<g>`) OR carrying attributes
 * (`<g font-family="sans-serif" lengthAdjust="spacing">`, which is what
 * `SvgGraphicsCore#getG` emits since the SVG-size-reduction port hoisted
 * rule 3's text attributes onto `gRoot`). Anchored at the start and
 * requiring whitespace before any attribute list, so it still rejects
 * everything that is NOT a `<g>` open tag — a `<rect .../>`, a stray text
 * node, a `<g2>`-like element name, or a body that lost its wrapper
 * entirely. Built from a string, not a regex literal: the complexity hook
 * miscounts `<`/`>` inside literals (see `svg.ts#GRADIENT_DEF_RE`).
 */
export const CONTENT_G_OPEN_RE = new RegExp('^<g(?:\\s[^>]*)?>');

/** The matching close tag `document-shell-fragment.ts#unwrapContentG` strips. */
export const CONTENT_G_CLOSE = '</g>';

/** The self-closing spelling of an EMPTY content `<g>` — see
 *  `document-shell-fragment.ts#unwrapContentG`'s doc comment for when
 *  klimt emits it. */
export const EMPTY_CONTENT_G_RE = new RegExp('^<g(?:\\s[^>]*)?/>$');

/** The attribute-less `<g>` open tag `core/svg.ts#group` emits. */
const BARE_G_OPEN = '<g>';

/**
 * Guarantees the single top-level `<g>` a document shell is handed carries
 * the root text attributes the jar puts there — `core/svg.ts
 * #ROOT_GROUP_OPEN`, THE one definition of that markup (see its own doc
 * comment for the jar evidence).
 *
 * The three klimt-shaped shells (`class/renderer-shell.ts
 * #assembleClassShell`, `state/renderer-shell.ts#assembleStateShell`,
 * `description/renderer.ts#assembleKlimtShell`) all hand
 * {@link assembleDocumentShell} a body wrapped by `core/svg.ts#group` —
 * either their own `group(fragment.body)` or `annotations/chrome.ts
 * #applyChrome`'s (`bodyWrapped: true`), both a bare `<g>`. Upgrading it
 * HERE, once, is what keeps that markup from being restated per shell.
 *
 * An ALREADY-attributed root `<g>` is left as-is (its caller has said what
 * it wants on the root group). A body with no `<g>` wrapper at all is also
 * left as-is rather than rejected: that is the pre-existing annotated-but-
 * not-decorated description case (`index.ts#applyAnnotationChrome` ->
 * `applyChrome` returns the unwrapped fragment verbatim for a mainframe-
 * only diagram, D9), whose missing wrapper predates this change.
 */
function withRootGroupAttributes(body: string): string {
  const openTag = CONTENT_G_OPEN_RE.exec(body)?.[0];
  if (openTag !== BARE_G_OPEN || !body.endsWith(CONTENT_G_CLOSE)) return body;
  return ROOT_GROUP_OPEN + body.slice(openTag.length);
}

/** The `data-diagram-type="…"` root attribute, or `''` when `diagramType`
 *  is `undefined` -- see {@link assembleDocumentShell}'s own doc comment. */
function diagramTypeAttrOf(diagramType: string | undefined): string {
  return diagramType === undefined
    ? ''
    : ' ' + DIAGRAM_TYPE_ATTR + '=' + DQUOTE + escapeAttribute(diagramType) + DQUOTE;
}

/**
 * Reassembles a `ShellFragment` using klimt's OWN root-attribute/prolog/
 * defs conventions (`SvgGraphicsCore#getRootNode`/`#finalizeRootAttributes`,
 * `svg-graphics-core.ts:311-336,456-479`) instead of the generic `svgRoot`
 * (`core/svg.ts`) every non-klimt-shaped engine uses.
 *
 * `xmlns:xlink`/`version="1.1"`/`zoomAndPan="magnify"`/
 * `preserveAspectRatio="none"`/`contentStyleType="text/css"` are ALL
 * diagram-type-wide constants, never per-fixture data — reproduced
 * directly rather than parsed back out of a klimt string. No
 * `ALL_ARROW_TYPES` marker-def injection (every klimt-shaped engine draws
 * its own arrowheads as inline polygons/paths, never an SVG `<marker>`)
 * and no separate background `<rect>` (background is folded into the
 * root `style` attribute, matching `finalizeRootAttributes`).
 *
 * @param fragment    - pre-composed body + dimensions (see {@link ShellFragment}).
 * @param diagramType - the `data-diagram-type` root attribute value (e.g.
 *   `'DESCRIPTION'`, `'CLASS'`). `undefined` OMITS the attribute entirely --
 *   the shape `error/error-renderer.ts`'s error/Welcome/Unsupported pages
 *   need: the jar's own error page carries no `data-diagram-type` at all
 *   (`TextBlockExporter.java:292-294` only stamps it for a real diagram;
 *   verified against every cached error-page golden -- CDD T32).
 */
export function assembleDocumentShell(fragment: ShellFragment, diagramType?: string): string {
  const width = Math.trunc(fragment.width);
  const height = Math.trunc(fragment.height);
  const background = fragment.background ?? '#FFFFFF';
  const extraDefs = fragment.extraDefs ?? '';
  // G2 N4: also excludes the CANONICAL transparent hex `#00000000` --
  // `svg-graphics-core.ts#finalizeRootAttributes`'s own exact rule
  // (`this.backcolorString !== '#00000000'`). Class's `renderClass` now
  // passes an already-`resolveColorToSvgHex`-canonicalized value (G2 N4,
  // "canonicalBackground"), so a literal `'transparent'`/`'none'` string
  // never reaches here for class -- only the additive `#00000000` check
  // catches it; the original two literal-string checks are kept for any
  // caller that still passes a raw, un-resolved value.
  const isSolid = background !== 'transparent' && background !== 'none' && background !== '#00000000';
  // `escapeAttribute` for the same reason `svg.ts#svgRoot`'s background rect
  // escapes its `fill`: an unparseable skinparam color arrives verbatim.
  const style = `width:${String(width)}px;height:${String(height)}px;${isSolid ? `background:${escapeAttribute(background)};` : ''}`;
  const lifted = collectDocumentDefs(fragment.body, extraDefs);
  const defsBody = lifted.defs;
  const diagramTypeAttr = diagramTypeAttrOf(diagramType);
  return (
    '<svg xmlns=' +
    DQUOTE +
    'http://www.w3.org/2000/svg' +
    DQUOTE +
    ' xmlns:xlink=' +
    DQUOTE +
    'http://www.w3.org/1999/xlink' +
    DQUOTE +
    ' version=' +
    DQUOTE +
    '1.1' +
    DQUOTE +
    diagramTypeAttr +
    ' style=' +
    DQUOTE +
    style +
    DQUOTE +
    ' width=' +
    DQUOTE +
    String(width) +
    'px' +
    DQUOTE +
    ' height=' +
    DQUOTE +
    String(height) +
    'px' +
    DQUOTE +
    ' viewBox=' +
    DQUOTE +
    `0 0 ${String(width)} ${String(height)}` +
    DQUOTE +
    ' zoomAndPan=' +
    DQUOTE +
    'magnify' +
    DQUOTE +
    ' preserveAspectRatio=' +
    DQUOTE +
    'none' +
    DQUOTE +
    ' contentStyleType=' +
    DQUOTE +
    'text/css' +
    DQUOTE +
    '>' +
    '<?plantuml ' +
    VERSION_PLACEHOLDER +
    '?>' +
    // Self-closing when empty, which is how the jar writes it: 973 of the 992
    // cached class/state goldens carry a bare `<defs/>`, and the 19 that use
    // the open/close form all have children. `createXml` serializes an
    // empty element self-closed; this port was emitting `<defs></defs>`
    // unconditionally.
    // Gradients are lifted out of the body into this same `<defs>`, deduped
    // by id -- `SvgGraphics#createSvgGradient` emits ONE per distinct
    // (color1, color2, policy) and appends it to `defs` (`:363-405`), where
    // this port's shape emitters each prepended their own copy inline.
    (defsBody === '' ? '<defs/>' : `<defs>${defsBody}</defs>`) +
    withRootGroupAttributes(lifted.body) +
    '</svg>'
  );
}

/**
 * The disassembly half (SVG-fragment extraction, per-drawable klimt
 * emission) lives in `document-shell-fragment.ts` (CDD T32 split, pure
 * move -- see that file's own header). Re-exported here so every existing
 * importer of `document-shell.js` is unaffected.
 */
export {
  extractViewBoxDims,
  extractDefs,
  extractBody,
  unwrapContentG,
  extractFlatContent,
  renderDrawableToFragment,
  mergeFragmentDefs,
  type RenderDrawableToFragmentOptions,
  type DrawableFragment,
} from './document-shell-fragment.js';
