/**
 * The single central document-assembly choke point — extracted from
 * `src/index.ts` (mission A5 / T4), which sits at the repo's 500-line hook cap.
 *
 * `assembleSvg` stays exported from `src/index.ts`, the package's only
 * "exports" subpath, so this move is invisible to consumers.
 *
 * T8 (decisions.md D2): upstream assembles every diagram type through ONE
 * shared exporter, `TextBlockExporter.java` — `exportTo` computes the FINAL
 * (fully chrome-composed) dimension (`:199-203`), draws `maybeDrawBorder`
 * (`:215-232`) against it, then hands the already-decorated `TextBlock` to
 * `createUGraphicSVG`, which stamps `data-diagram-type` (`:292-294`) and
 * nothing else per-engine. Before T8, this port re-derived that ONE exporter
 * FOUR times — four separate boolean/string discriminant fields on
 * `RenderFragment`, each routing to a separate `diagrams/<engine>/renderer-
 * shell.ts` function this module statically imported. T8 collapses the
 * fields to ONE (`RenderFragment.diagramType`) and the per-type body work
 * (background/border-rect splice, single-`<g>` wrap) to the finalize
 * functions below — plain data in, plain string out, no `diagrams/**`
 * import, matching decisions.md D1 (upstream single-place code moves to
 * `core`). `assembleDocumentShell` (`core/klimt/document-shell.ts`) itself
 * is unchanged; only the four static-import call sites collapse into a
 * `diagramType`-keyed dispatch here.
 *
 * The border/background-rect splice in particular CANNOT move into the
 * producing engine's own renderer (`renderClass`/`renderState`): both rects
 * must be sized to the FINAL, post-chrome canvas (`documentBackgroundRect`'s
 * own doc comment, jar-verified `xalaco-64-vuzu312` — a title-bearing,
 * non-default-background class fixture) and drawn as the content `<g>`'s
 * first child, which `renderClass` cannot see or produce — chrome
 * composition (`core/annotations/chrome.ts#applyChrome`) runs strictly
 * AFTER the engine returns its fragment and BEFORE this module is reached.
 * Every producer field these finalize functions read (`documentBackgroundRect`,
 * `diagramBorderColor`, `preChromeWidth`/`preChromeHeight`, `bodyWrapped`,
 * `background`) is already generic on `RenderFragment`; the math needed
 * (`core/TextBlockExporter.ts#applyCucaDocumentMargin`, `core/atmp/
 * CucaDiagram.ts`'s margin constants, `core/svg-format.ts#shortenColor` +
 * `core/klimt/color/HColorSet.ts#resolveColorToSvgHex`) was already core,
 * imported by the per-engine shell files only for historical reasons.
 */
import type { AssembledSvg, RenderFragment } from './dispatcher.js';
import { svgRoot, group, rect } from './svg.js';
import { assembleDocumentShell } from './klimt/document-shell.js';
import { resolveColorToSvgHex } from './klimt/color/HColorSet.js';
import { shortenColor } from './svg-format.js';
import { applyCucaDocumentMargin } from './TextBlockExporter.js';
import {
  CUCA_DOCUMENT_MARGIN_TOP,
  CUCA_DOCUMENT_MARGIN_RIGHT,
  CUCA_DOCUMENT_MARGIN_BOTTOM,
  CUCA_DOCUMENT_MARGIN_LEFT,
} from './atmp/CucaDiagram.js';

/** `net.sourceforge.plantuml.core.DiagramType` values this module dispatches
 *  on — each verified against `DiagramType.java:45` and every cached jar
 *  fixture's `data-diagram-type` root attribute (mirrors the identical
 *  per-engine constants `class/renderer.ts`/`state/renderer.ts`/`description
 *  /renderer.ts`/`json/index.ts`/`yaml/index.ts`/`hcl/index.ts` each declare
 *  independently to SET `RenderFragment.diagramType`; this module's own
 *  copies are for DISPATCH, not production). */
const DIAGRAM_TYPE_CLASS = 'CLASS';
const DIAGRAM_TYPE_STATE = 'STATE';
const DIAGRAM_TYPE_JSON = 'JSON';
const DIAGRAM_TYPE_YAML = 'YAML';
const DIAGRAM_TYPE_HCL = 'HCL';
const DIAGRAM_TYPE_SEQUENCE = 'SEQUENCE';
const DIAGRAM_TYPE_ACTIVITY = 'ACTIVITY';

// ---------------------------------------------------------------------------
// class finalize (formerly class/renderer-shell.ts#assembleClassShell)
// ---------------------------------------------------------------------------

/** `UStroke.simple()`'s default thickness -- jar's `TextBlockExporter
 *  #maybeDrawBorder` falls back to this whenever `LineParam.diagramBorder`
 *  has no explicit override, which is every corpus fixture found so far
 *  (`theme.ts#diagramBorderColor`'s own doc comment). */
const DIAGRAM_BORDER_THICKNESS = 1;

/** The outer `<g>`'s open tag, bare (`<g>`) or attributed
 *  (`core/svg.ts#ROOT_GROUP_OPEN`, which `document-shell.ts
 *  #withRootGroupAttributes` upgrades it to further down the pipeline).
 *  Matched structurally rather than against a literal so a splice cannot
 *  start silently no-op'ing the day the root attribute list changes again.
 *  Built from a string, not a regex literal (the complexity hook miscounts
 *  `<`/`>`). Shared by class's `spliceAsFirstChild` and json's
 *  `spliceIntoContentGroup` below -- both need "find the content `<g>`'s
 *  own open tag", just with a different fallback when it is absent. */
const CONTENT_G_OPEN_RE = new RegExp('^<g(?:\\s[^>]*)?>');

/** Splices `child` in as the FIRST child of `body`'s outer `<g>` --
 *  equivalent to, but avoiding re-parsing/re-serializing, a full XML
 *  insert. THROWS rather than returning `body` unchanged when there is no
 *  outer `<g>`: every caller here has already guaranteed one (class's own
 *  wrap-if-needed below, or `chrome.ts#applyChrome`'s), so a miss means the
 *  guarantee broke, and a silently-dropped background/border rect is far
 *  harder to notice than a thrown error. */
function spliceAsFirstChild(body: string, child: string): string {
  const openTag = CONTENT_G_OPEN_RE.exec(body)?.[0];
  if (openTag === undefined) {
    throw new Error('finalizeClassBody: fragment body is not wrapped in an outer <g> element');
  }
  return openTag + child + body.slice(openTag.length);
}

/** `CucaDiagram`-family margined dims minus the border stroke thickness --
 *  jar's `TextBlockExporter#maybeDrawBorder` draws the border rect at the
 *  PRE-`ensureVisible`-floor margined dims (`core/TextBlockExporter.java:
 *  227-228`), NOT what {@link applyCucaDocumentMargin} returns (which also
 *  applies the truncating `ensureVisible` quirk) -- `x`/`y` are always
 *  `(0,0)`, the border is the OUTERMOST draw, at no prior translate.
 *  Jar-verified byte-exact against `vinujo-78-kapo329` (`rawWidth=109.7875`
 *  -> rect width `113.7875`; `rawHeight=62` -> rect height `66`). */
function computeBorderRectDims(rawDims: { width: number; height: number }, thickness: number) {
  return {
    width: rawDims.width + CUCA_DOCUMENT_MARGIN_LEFT + CUCA_DOCUMENT_MARGIN_RIGHT - thickness,
    height: rawDims.height + CUCA_DOCUMENT_MARGIN_TOP + CUCA_DOCUMENT_MARGIN_BOTTOM - thickness,
  };
}

/**
 * G2 N66 (near-zero harvest, `vinujo-78-kapo329`): `fragment
 * .diagramBorderColor`'s whole-canvas `<rect fill="none">` border, spliced
 * in as the outer `<g>`'s FIRST child -- BEFORE the background-rect splice
 * (matching jar's `TextBlockExporter#maybeDrawBorder` running OUTSIDE/
 * BEFORE the diagram's own draw, which includes ITS OWN
 * `documentBackgroundRect`, an entirely separate mechanism, N48).
 *
 * Requires `fragment.width`/`fragment.height` (FINAL, post-chrome) to
 * exactly equal what {@link applyCucaDocumentMargin} computes from
 * `fragment.preChromeWidth`/`preChromeHeight` -- i.e., chrome did NOT
 * inflate the canvas beyond the class body's own bounds. A chrome-present
 * (title/caption/legend/header/footer) fixture combined with `skinparam
 * diagramBorderColor` has ZERO corpus reach (grepped the full 718-fixture
 * class corpus) and would need the CHROME-INCLUSIVE raw dims (not
 * currently threaded anywhere) to compute jar's exact PRE-floor border-rect
 * formula correctly -- rather than draw a possibly-wrong-sized rect, this
 * guard silently no-ops for that case.
 */
function withDiagramBorderRect(body: string, fragment: RenderFragment, colorHex: string): string {
  if (fragment.preChromeWidth === undefined || fragment.preChromeHeight === undefined) return body;
  const rawDims = { width: fragment.preChromeWidth, height: fragment.preChromeHeight };
  const expectedFinal = applyCucaDocumentMargin(rawDims);
  if (expectedFinal.width !== fragment.width || expectedFinal.height !== fragment.height) return body;
  const rectDims = computeBorderRectDims(rawDims, DIAGRAM_BORDER_THICKNESS);
  const borderRect = rect(0, 0, rectDims.width, rectDims.height, {
    fill: 'none', stroke: colorHex, strokeWidth: DIAGRAM_BORDER_THICKNESS,
  });
  return spliceAsFirstChild(body, borderRect);
}

/**
 * `class/renderer.ts#renderClass`'s per-diagram body finalization: exactly
 * one top-level content `<g>` (part B of G2 N1, mechanism 2 -- class has no
 * `CompleteSvg` escape hatch, so this is the ONE place that must guarantee
 * the shape for both the annotated and unannotated case), then N48's
 * document-background rect, then N66's border rect (drawn first among the
 * two, per {@link withDiagramBorderRect}'s own doc comment).
 */
function finalizeClassBody(fragment: RenderFragment): string {
  const body = fragment.bodyWrapped === true ? fragment.body : group(fragment.body);
  const withBackground =
    fragment.documentBackgroundRect !== undefined
      ? spliceAsFirstChild(
          body,
          rect(0, 0, fragment.width, fragment.height, {
            fill: fragment.documentBackgroundRect, stroke: 'none', strokeWidth: 1,
          }),
        )
      : body;
  return fragment.diagramBorderColor !== undefined
    ? withDiagramBorderRect(withBackground, fragment, fragment.diagramBorderColor)
    : withBackground;
}

// ---------------------------------------------------------------------------
// state finalize (formerly state/renderer-shell.ts#assembleStateShell)
// ---------------------------------------------------------------------------

/** The default (unset) diagram background -- matches `theme.ts`'s own
 *  `colors.background: '#FFFFFF'` default. */
const STATE_DEFAULT_BACKGROUND = '#FFFFFF';

/** mission G4 S5: the explicit content-level background rect jar draws (the
 *  FIRST child of the content `<g>`) whenever the resolved background is
 *  non-default, on top of (not instead of) the root `style="...background:
 *  ...;"` attribute `assembleDocumentShell` already handles. Deliberately
 *  SIMPLER than class's version: this mission's sampled corpus showed no
 *  `bodyWrapped` (chrome-present) + non-default-background combination, so
 *  unlike json (below) state does not attempt the chrome-present case. */
function maybeStateBackgroundRect(fragment: RenderFragment): string {
  const background = fragment.background ?? STATE_DEFAULT_BACKGROUND;
  if (background === STATE_DEFAULT_BACKGROUND) return '';
  return rect(0, 0, Math.trunc(fragment.width), Math.trunc(fragment.height), {
    fill: background, stroke: 'none', strokeWidth: 1,
  });
}

function finalizeStateBody(fragment: RenderFragment): string {
  const backgroundRect = fragment.bodyWrapped === true ? '' : maybeStateBackgroundRect(fragment);
  return fragment.bodyWrapped === true ? fragment.body : group(backgroundRect + fragment.body);
}

// ---------------------------------------------------------------------------
// json/yaml/hcl finalize (formerly json/renderer-shell.ts#assembleJsonShell)
// ---------------------------------------------------------------------------

/** The default (unset) diagram background -- matches `theme.ts`'s own
 *  `colors.background: '#FFFFFF'` default. */
const JSON_DEFAULT_BACKGROUND = '#FFFFFF';

/** A color reduced to the exact form the SVG will carry, so two spellings of
 *  one color compare equal -- `resolveColorToSvgHex` maps a NAMED color to
 *  hex (`!theme plain` leaves the background as the literal `"white"`,
 *  `json/vogeku-38-soxe333`), then `shortenColor` collapses `#FFFFFF` to
 *  `#FFF` (the form a theme may supply directly). Was `json/color-form.ts
 *  #canonicalColor` -- a thin composition of two already-core primitives,
 *  moved here with the rest of the finalize logic (no diagrams/** import). */
function canonicalColor(color: string): string {
  return shortenColor(resolveColorToSvgHex(color));
}

/** Whether the resolved background warrants the explicit content-level rect
 *  below. Two ways a background can fail to warrant one: (1) it is not
 *  solid (`transparent`/`none`/canonical `#00000000` -- jar draws no rect,
 *  `json/sevaji-38-xita618`); (2) it IS the default white, spelled
 *  differently (`json/vogeku-38-soxe333`, `!theme plain` -> `"white"`). */
function isSolidNonDefault(background: string): boolean {
  if (background === 'transparent' || background === 'none' || background === '#00000000') return false;
  return canonicalColor(background) !== canonicalColor(JSON_DEFAULT_BACKGROUND);
}

/** The identical mechanism {@link maybeStateBackgroundRect} carries for
 *  state diagrams -- jar-verified against all five non-default-background
 *  fixtures in this family's cached corpus. Note the emitted style is
 *  `stroke:none;` ALONE (no `stroke-width`), matching `core/svg.ts
 *  #strokeDecorationOf`'s own `stroke:none` handling. */
function maybeJsonBackgroundRect(fragment: RenderFragment): string {
  const background = fragment.background ?? JSON_DEFAULT_BACKGROUND;
  if (!isSolidNonDefault(background)) return '';
  return rect(0, 0, Math.trunc(fragment.width), Math.trunc(fragment.height), {
    fill: background, stroke: 'none',
  });
}

/**
 * Put `markup` immediately after the already-wrapped body's opening `<g>`.
 * An ANNOTATED diagram arrives here pre-wrapped by `applyChrome`; unlike
 * state (above), json still draws the background rect for this case
 * (`yaml/tadari-70-nare798`, `!theme amiga` + `title foo`, jar draws the
 * rect as the FIRST child of the content group, ahead of the title's own
 * `<g class="title">`). Falls back to prefixing if the body is not a `<g>`
 * at all, which keeps the rect in the document rather than silently
 * dropping it.
 */
function spliceIntoContentGroup(body: string, markup: string): string {
  if (markup === '') return body;
  const openTag = CONTENT_G_OPEN_RE.exec(body)?.[0];
  if (openTag === undefined) return markup + body;
  return openTag + markup + body.slice(openTag.length);
}

/**
 * json/yaml/hcl's per-diagram body finalization -- also canonicalizes
 * `fragment.background` itself (not just the body), since
 * `assembleDocumentShell` writes it verbatim into the root `style` and a
 * themed `"white"` would otherwise reach the document as
 * `background:white` where the jar writes `background:#FFFFFF`
 * (`json/vogeku-38-soxe333`, `!theme plain`) -- matching class's own
 * resolve-before-shell convention (N4).
 */
function finalizeJsonFragment(fragment: RenderFragment): RenderFragment {
  const canonical =
    fragment.background === undefined
      ? fragment
      : { ...fragment, background: resolveColorToSvgHex(fragment.background) };
  const backgroundRect = maybeJsonBackgroundRect(canonical);
  const body =
    fragment.bodyWrapped === true
      ? spliceIntoContentGroup(fragment.body, backgroundRect)
      : group(backgroundRect + fragment.body);
  return { ...canonical, body };
}

// ---------------------------------------------------------------------------
// sequence finalize (decisions.md D1)
// ---------------------------------------------------------------------------

/** The default (unset) diagram background -- jar's own `TextBlockExporter
 *  .Builder` field initializer, `HColors.WHITE.withDark(HColors.BLACK)`
 *  (`core/TextBlockExporter.java:413`), which reaches `SvgGraphics` as
 *  `#FFFFFF` and so takes the no-rect branch of
 *  {@link SEQUENCE_UNPAINTED_BACKGROUNDS}. Same value as state's and json's
 *  sibling constants above, declared separately so a per-engine correction
 *  to one cannot silently move the other four. */
const SEQUENCE_DEFAULT_BACKGROUND = '#FFFFFF';

/**
 * Every resolved background for which the jar draws NO content-level rect.
 * `SvgGraphics`'s constructor guards its `paintBackcolor(color)` call with
 * `color.equals("#00000000") == false && color.equals("#000000") == false
 * && color.equals("#FFFFFF") == false` (`klimt/drawing/svg/SvgGraphics.java:
 * 189-191`) -- note BLACK is excluded alongside white and transparent, which
 * neither {@link maybeStateBackgroundRect} nor {@link isSolidNonDefault}
 * models. Jar-verified across the whole cached sequence corpus: of the 19
 * goldens whose root style carries a non-`#FFFFFF` `background:`, the 18
 * non-black ones all open their content `<g>` with the rect, and the single
 * black one (`sequence/zuravu-52-mike252`, `background:#000000;`) does not.
 * `transparent`/`none` are this port's un-resolved spellings of jar's
 * `#00000000` -- the same pair `document-shell.ts#assembleDocumentShell`'s
 * own `isSolid` test already accepts.
 */
const SEQUENCE_UNPAINTED_BACKGROUNDS: ReadonlySet<string> = new Set([
  SEQUENCE_DEFAULT_BACKGROUND,
  '#000000',
  '#00000000',
  'transparent',
  'none',
]);

/**
 * The whole-canvas rect `SvgGraphics#paintBackcolor` appends to the root
 * `<g>` (`:207-212`), later resized to the FINAL `maxX`/`maxY` (`:817-819`)
 * -- hence `fragment.width`/`height`, post-chrome, truncated the way
 * `assembleDocumentShell` truncates the root's own `width`/`height` (every
 * one of the 17 painted goldens carries integral dims, so the two agree).
 */
function maybeSequenceBackgroundRect(fragment: RenderFragment): string {
  const background = fragment.background ?? SEQUENCE_DEFAULT_BACKGROUND;
  if (SEQUENCE_UNPAINTED_BACKGROUNDS.has(background)) return '';
  return rect(0, 0, Math.trunc(fragment.width), Math.trunc(fragment.height), {
    fill: background, stroke: 'none', strokeWidth: 1,
  });
}

/**
 * sequence's per-diagram body finalization. Sequence reaches this module
 * with `bodyWrapped` unset in the common case -- unlike description it has
 * no `CompleteSvg` escape hatch and unlike class no wrap of its own -- so
 * this is the ONE place that guarantees the single content `<g>`
 * `document-shell.ts#withRootGroupAttributes` then upgrades to
 * `ROOT_GROUP_OPEN`.
 *
 * Follows json's shape rather than state's for the chrome-present case:
 * `paintBackcolor` runs in `SvgGraphics`'s CONSTRUCTOR, before any diagram
 * or chrome draw, so the rect is the content group's first child whether or
 * not chrome wrapped the body. State's `bodyWrapped ? '' : ...` carve-out
 * records that state's corpus had no such combination; sequence's has six
 * (`fazaba-22-nusi829`, `ganefo-61-leka777`, `jogeto-89-zaco078`,
 * `solivu-37-vika919`, `taxude-25-lamo370`, `zerovu-57-cumo773` -- all
 * `<g class="header">`/`<g class="title">` behind a 0,0 background rect).
 */
function finalizeSequenceBody(fragment: RenderFragment): string {
  const backgroundRect = maybeSequenceBackgroundRect(fragment);
  return fragment.bodyWrapped === true
    ? spliceIntoContentGroup(fragment.body, backgroundRect)
    : group(backgroundRect + fragment.body);
}

// ---------------------------------------------------------------------------
// activity finalize (activity-oracle-harness D6/D7)
// ---------------------------------------------------------------------------

/** The default (unset) diagram background -- `theme.ts`'s own
 *  `colors.background: '#FFFFFF'`. Declared separately from the four sibling
 *  constants above for the same reason they are declared separately from each
 *  other: a per-engine correction to one must not silently move the rest. */
const ACTIVITY_DEFAULT_BACKGROUND = '#FFFFFF';

/**
 * The three resolved backgrounds for which the jar paints NO content-level
 * rect -- `SvgGraphics`'s constructor, `klimt/drawing/svg/SvgGraphics.java:
 * 186-192`, verbatim:
 *
 *   if (color.equals("#00000000") == false && color.equals("#000000") == false
 *           && color.equals("#FFFFFF") == false)
 *       this.paintBackcolor(color);
 *
 * `ActivityDiagram3 extends TitledDiagram` and declares no `backcolor`/
 * exporter member of its own, so activity inherits this shared
 * `TextBlockExporter#createUGraphicSVG` path unchanged -- there is no
 * activity-specific background mechanism. Same guard the sequence sibling
 * carries ({@link SEQUENCE_UNPAINTED_BACKGROUNDS}); unlike that one this set
 * holds ONLY resolved hex, because {@link finalizeActivityFragment}
 * canonicalizes before testing (activity's theme reaches here holding raw
 * spellings -- `grey`, `transparent`, lowercase `#f1f1f1`).
 */
const ACTIVITY_UNPAINTED_BACKGROUNDS: ReadonlySet<string> = new Set([
  ACTIVITY_DEFAULT_BACKGROUND,
  '#000000',
  '#00000000',
]);

/** The whole-canvas rect `SvgGraphics#paintBackcolor` appends to the root
 *  `<g>` (`:207-212`), resized to the final `maxX`/`maxY` (`:819-822`) --
 *  hence `fragment.width`/`height`, post-chrome. Jar-verified byte-for-byte
 *  against `activity/poraji-17-goke817` and `activity/labala-74-juki864`,
 *  whose goldens open their content `<g>` with exactly
 *  `<rect x="0" y="0" width="…" height="…" fill="…" style="stroke:none;"/>`. */
function maybeActivityBackgroundRect(fragment: RenderFragment): string {
  const background = fragment.background ?? ACTIVITY_DEFAULT_BACKGROUND;
  if (ACTIVITY_UNPAINTED_BACKGROUNDS.has(background)) return '';
  return rect(0, 0, Math.trunc(fragment.width), Math.trunc(fragment.height), {
    fill: background, stroke: 'none', strokeWidth: 1,
  });
}

/**
 * activity's per-diagram finalization. Canonicalizes `fragment.background`
 * itself as well as the body, for json's reason (N4's resolve-before-shell
 * convention): the jar's root `style` carries the value
 * `backcolor.toSvg(colorMapper)` returns (`SvgGraphics.java:805-806`), which
 * is always resolved hex -- `poraji-17-goke817`'s golden writes
 * `background:#808080;` where this port's theme still holds the literal
 * `grey`.
 *
 * Follows json's/sequence's shape rather than state's for the chrome-present
 * case: `paintBackcolor` runs in `SvgGraphics`'s CONSTRUCTOR, before any
 * diagram or chrome draw, so the rect is the content group's first child
 * whether or not `applyChrome` wrapped the body.
 */
function finalizeActivityFragment(fragment: RenderFragment): RenderFragment {
  const canonical =
    fragment.background === undefined
      ? fragment
      : { ...fragment, background: resolveColorToSvgHex(fragment.background) };
  const backgroundRect = maybeActivityBackgroundRect(canonical);
  const body =
    fragment.bodyWrapped === true
      ? spliceIntoContentGroup(fragment.body, backgroundRect)
      : group(backgroundRect + fragment.body);
  return { ...canonical, body };
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

/**
 * Per-`diagramType` body finalization -- the work each of the four former
 * `diagrams/<engine>/renderer-shell.ts` files did to `fragment.body` (and,
 * for json, `fragment.background`) before handing off to
 * `assembleDocumentShell`.
 * The description engine has none: `unwrapKlimtSvg`'s only caller path
 * (`applyAnnotationChrome`, `src/index.ts`) already guarantees `bodyWrapped`
 * by construction (every reachable fragment is annotated, so `applyChrome`
 * always decorates), so `DESCRIPTION` -- and any other `diagramType` with no
 * finalize entry -- falls through unchanged (the identity `assembleKlimtShell`
 * used to perform, verbatim).
 */
function finalizeShellFragment(fragment: RenderFragment): RenderFragment {
  switch (fragment.diagramType) {
    case DIAGRAM_TYPE_CLASS: return { ...fragment, body: finalizeClassBody(fragment) };
    case DIAGRAM_TYPE_STATE: return { ...fragment, body: finalizeStateBody(fragment) };
    case DIAGRAM_TYPE_SEQUENCE: return { ...fragment, body: finalizeSequenceBody(fragment) };
    case DIAGRAM_TYPE_ACTIVITY: return finalizeActivityFragment(fragment);
    case DIAGRAM_TYPE_JSON:
    case DIAGRAM_TYPE_YAML:
    case DIAGRAM_TYPE_HCL:
      return finalizeJsonFragment(fragment);
    default:
      return fragment;
  }
}

/**
 * The single central `svgRoot` call site (decisions.md D2): every plugin
 * hands back an `AssembledSvg` -- either a `RenderFragment` (the common
 * case) or a `CompleteSvg` escape hatch for engines that already emit a
 * full document themselves (klimt/description's annotation-free path;
 * chart's inline error path; `@startdot`'s graphviz passthrough) and must
 * not be re-wrapped.
 *
 * A `RenderFragment` carrying `diagramType` is finalized (see
 * {@link finalizeShellFragment}) and reassembled via `core/klimt/document-
 * shell.ts#assembleDocumentShell` -- jar's shared root-attribute/prolog/
 * defs shell (`TextBlockExporter.java:292-294`). Everything else falls
 * through to the generic `svgRoot` (`core/svg.ts`).
 */
export function assembleSvg(fragment: AssembledSvg): string {
  if ('completeSvg' in fragment) return fragment.completeSvg;
  if (fragment.diagramType !== undefined) {
    return assembleDocumentShell(finalizeShellFragment(fragment), fragment.diagramType);
  }
  return svgRoot(fragment.width, fragment.height, [fragment.body], fragment.background, fragment.extraDefs);
}
