/**
 * document-shell-fragment.ts — the disassembly half of `document-shell.ts`
 * (SVG-fragment extraction and per-drawable klimt emission), split out
 * (CDD T32) purely to keep `document-shell.ts` under the 500-line hook cap
 * after widening `assembleDocumentShell`'s `diagramType` parameter to
 * accept `undefined` (the error/Welcome/Unsupported pages' shape — see that
 * function's own doc comment). A pure move: every symbol here is
 * re-exported from `document-shell.ts` unchanged, so no existing importer's
 * path needed to change.
 *
 * @see ~/git/plantuml/.../klimt/drawing/svg/SvgGraphicsCore.java (getRootNode, getG, createXml)
 * @see plans/si14-usymbol-measurement-sharing/decisions.md (ADR-2, T1)
 */

import {
  CONTENT_G_CLOSE,
  CONTENT_G_OPEN_RE,
  DQUOTE,
  EMPTY_CONTENT_G_RE,
  VERSION_PLACEHOLDER,
} from './document-shell.js';
import { UGraphicSvg } from './drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from './drawing/svg/svg-graphics.js';
import { seedOf } from './drawing/svg/svg-seed.js';
import type { StringBounder as DriverStringBounder } from './drawing/svg/driver-text-svg.js';
import type { UDrawable } from './shape/UDrawable.js';
import type { StringMeasurer } from '../measurer.js';

/**
 * Every root/child attribute value `SvgGraphicsCore#finalizeRootAttributes`/
 * `#format` are known to emit contains no literal `>` character, so the
 * first `>` in a (defs-stripped) klimt document string is reliably the
 * root open tag's own close — see `description/renderer.ts`'s original
 * `unwrapKlimtSvg` doc comment (this module's extraction) for the full
 * rationale. NOT a general SVG parser; scoped exactly to this producer
 * shape (klimt's own `getSvgString()`/`createXml()` output).
 *
 * @see u-graphic-svg.ts#getSvgString @see svg-graphics-core.ts#createXml
 */
export function extractViewBoxDims(svg: string): { width: number; height: number } {
  const marker = 'viewBox=' + DQUOTE + '0 0 ';
  const start = svg.indexOf(marker);
  if (start === -1) {
    throw new Error('extractViewBoxDims: klimt SVG output has no viewBox attribute');
  }
  const afterMarker = start + marker.length;
  const end = svg.indexOf(DQUOTE, afterMarker);
  if (end === -1) {
    throw new Error('extractViewBoxDims: malformed viewBox attribute');
  }
  const [widthStr, heightStr] = svg.slice(afterMarker, end).split(' ');
  const width = Number(widthStr);
  const height = Number(heightStr);
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error('extractViewBoxDims: malformed viewBox dimensions');
  }
  return { width, height };
}

/** Strips the single `<defs>...</defs>` (or self-closing `<defs/>`)
 *  `SvgGraphicsCore`'s constructor always appends, hoisting its inner
 *  markup so the caller can splice it into `svgRoot`'s OWN defs block
 *  (`RenderFragment.extraDefs`) instead of nesting a second `<defs>`. */
export function extractDefs(svg: string): { withoutDefs: string; extraDefs: string } {
  const openTag = '<defs>';
  const closeTag = '</defs>';
  const selfClose = '<defs/>';

  const openIdx = svg.indexOf(openTag);
  if (openIdx !== -1) {
    const closeIdx = svg.indexOf(closeTag, openIdx);
    if (closeIdx === -1) throw new Error('extractDefs: unterminated <defs> element');
    const extraDefs = svg.slice(openIdx + openTag.length, closeIdx);
    const withoutDefs = svg.slice(0, openIdx) + svg.slice(closeIdx + closeTag.length);
    return { withoutDefs, extraDefs };
  }

  const selfIdx = svg.indexOf(selfClose);
  if (selfIdx !== -1) {
    const withoutDefs = svg.slice(0, selfIdx) + svg.slice(selfIdx + selfClose.length);
    return { withoutDefs, extraDefs: '' };
  }

  return { withoutDefs: svg, extraDefs: '' };
}

/** Everything between the root `<svg ...>` open tag's own `>` and the final
 *  `</svg>` — see {@link extractViewBoxDims}'s doc comment for why the FIRST
 *  `>` in a defs-stripped klimt document is always that boundary. Includes
 *  the leading `<?plantuml ...?>` PI and klimt's own content `<g>...</g>`
 *  wrapper — {@link unwrapContentG} strips both. */
export function extractBody(svgWithoutDefs: string): string {
  const openTagEnd = svgWithoutDefs.indexOf('>');
  const closeTagStart = svgWithoutDefs.lastIndexOf('</svg>');
  if (openTagEnd === -1 || closeTagStart === -1 || closeTagStart < openTagEnd) {
    throw new Error('extractBody: malformed klimt SVG output (missing <svg>/</svg> boundary)');
  }
  return svgWithoutDefs.slice(openTagEnd + 1, closeTagStart);
}

/**
 * Strips klimt's own leading `<?plantuml ...?>` processing instruction
 * (`SvgGraphicsCore#getRootNode`, always the first child of `<svg>`) and
 * its single content `<g>...</g>` wrapper (`SvgGraphicsCore#getG`'s
 * `gRoot`), leaving JUST the flat markup {@link extractBody} bracketed
 * with them.
 *
 * `gRoot`'s open tag carries rule 3's hoisted `font-family`/`lengthAdjust`
 * since the SVG-size-reduction port, so this accepts an ATTRIBUTED open tag
 * as well as a bare one ({@link CONTENT_G_OPEN_RE}) — but nothing looser:
 * a body that is not `<g …>`-wrapped still throws, because a malformed
 * klimt document that slips through here fails far downstream instead.
 *
 * cdd-T28: an EMPTY `gRoot` — a drawable that painted no ink at all — is
 * serialized SELF-CLOSING by the XML writer (`<g font-family="sans-serif"
 * lengthAdjust="spacing"/>`, no `</g>` to end with), which is a perfectly
 * well-formed klimt document carrying zero content, not a malformed one.
 * It reaches here the moment any caller renders a drawable that can
 * legitimately draw nothing: chrome text whose only atom is an
 * unresolvable sprite, or a `{{ }}` embedded diagram whose renderer is
 * absent (`annotations/blocks-creole.ts`). Flattening it to `''` is the
 * SAME answer the non-empty path gives for `<g …></g>`; the throw stays
 * for every other shape.
 *
 * @see svg-graphics-core.ts#getRootNode @see svg-graphics-core.ts#getG
 */
export function unwrapContentG(bodyWithPiAndG: string): string {
  const withoutPi = bodyWithPiAndG.replace(/^<\?plantuml[^>]*\?>/, '');
  if (EMPTY_CONTENT_G_RE.test(withoutPi)) return '';
  const openTag = CONTENT_G_OPEN_RE.exec(withoutPi)?.[0];
  if (openTag === undefined || !withoutPi.endsWith(CONTENT_G_CLOSE)) {
    throw new Error('unwrapContentG: malformed klimt SVG output (missing content <g> wrapper)');
  }
  return withoutPi.slice(openTag.length, -CONTENT_G_CLOSE.length);
}

/**
 * Convenience composition of {@link extractDefs} + {@link extractBody} +
 * {@link unwrapContentG}: turns a complete klimt document string (as
 * produced by `UGraphicSvg#getSvgString`) into its flat, unwrapped content
 * markup plus any non-empty `<defs>` payload (gradients, etc.) — the shape
 * every `RenderFragment.body`/`.extraDefs` pair expects.
 */
export function extractFlatContent(svg: string): { body: string; extraDefs: string } {
  const { withoutDefs, extraDefs } = extractDefs(svg);
  const body = unwrapContentG(extractBody(withoutDefs));
  return { body, extraDefs };
}

// ---------------------------------------------------------------------------
// SI14 T1 -- per-drawable klimt fragment emission (decisions.md ADR-2)
// ---------------------------------------------------------------------------

/** {@link renderDrawableToFragment}'s options. `uid` is the ONLY id-collision
 *  control: it seeds the per-fragment `UGraphicSvg` document (via
 *  {@link seedOf}, the same string->bigint hash `UmlSource#seed()` uses),
 *  which is what `SvgGraphicsCore`'s constructor derives `gradientId`/
 *  `shadowId`/`filterUid` from (`svg-graphics-core.ts:173-175`) -- two
 *  fragments built with two different `uid`s get two different id
 *  namespaces. Callers MUST pass a `uid` that is unique per drawable within
 *  a diagram (mirroring `renderer-uid.ts`'s per-node uid plan for the
 *  description engine) for {@link renderDrawableToFragment}'s own
 *  determinism guarantee to translate into cross-fragment non-collision. */
export interface RenderDrawableToFragmentOptions {
  /** Floor dimensions for the fragment's own `UGraphicSvg` document --
   *  `SvgOption#minDim`, matching `basicSvgOption`'s own floor-not-final
   *  semantics (see `renderer.ts`'s doc comment: real drawn ink can exceed
   *  this via `ensureVisible`). */
  readonly width: number;
  readonly height: number;
  /** The SAME `StringMeasurer` the caller used to size `drawable` during
   *  layout -- threaded to BOTH `UGraphicSvg.build`'s `stringBounder`
   *  (draw-time `textLength`) and its `measurer` param (draw-time
   *  `getStringBounder()` width/height/descent), matching
   *  `renderDescription`'s own single-measurer-two-seams pattern
   *  (`renderer.ts`'s module doc comment). */
  readonly measurer: StringMeasurer;
  /** Per-drawable id-namespace seed -- see this interface's own doc
   *  comment above for the exact mechanism. */
  readonly uid: string;
}

/** {@link renderDrawableToFragment}'s return shape -- the exact contract
 *  batch 3 (T4) consumes. `extraDefs` is OMITTED (not empty-string) when
 *  there are none, matching `unwrapKlimtSvg`'s own convention
 *  (`description/renderer.ts:271`). */
export interface DrawableFragment {
  readonly body: string;
  readonly extraDefs?: string;
  readonly width: number;
  readonly height: number;
}

/** Local adapter from this task's `StringMeasurer` to `UGraphicSvg.build`'s
 *  `DriverStringBounder` param -- the width-only half of the SAME
 *  dual-measurer wiring `renderer-ink-extent.ts#driverBounderFor`
 *  (description engine) and every klimt conformance test independently
 *  define for the identical reason (that module's own doc comment: "Local
 *  adapter, not a new shared module"). Kept local here rather than
 *  imported from `renderer-ink-extent.ts` because that module lives under
 *  `diagrams/description/` -- importing a diagram-engine-scoped module
 *  from this shared `core/klimt/` seam would invert the dependency
 *  direction every other diagram engine (class, state, ...) relies on. */
function driverBounderFor(measurer: StringMeasurer): DriverStringBounder {
  return {
    calculateDimension(font, text) {
      return { width: measurer.measure(text, font).width };
    },
  };
}

/**
 * Draws a single `UDrawable` into its own per-drawable `UGraphicSvg`
 * document and unwraps it to a `DrawableFragment` -- ADR-2's sanctioned
 * mechanism for giving klimt a fragment-emission seam without touching
 * `SvgGraphicsCore`'s own document-rooting behavior (stop condition 5;
 * see this module's own doc comment and `description/renderer.ts
 * #unwrapKlimtSvg`'s doc comment for the full rationale klimt has no
 * "emit body without document" mode to call instead).
 *
 * Reuses {@link extractViewBoxDims} + {@link extractFlatContent} -- the
 * SAME extraction `unwrapKlimtSvg` itself calls -- rather than a third,
 * divergent unwrap implementation.
 *
 * Pure and deterministic (T1 AC3): every id `SvgGraphicsCore` emits is
 * derived from `seedOf(opts.uid)` (a pure string hash, `svg-seed.ts`) --
 * no `Date.now()`, no `Math.random()`, matching this library's
 * project-wide no-DOM/no-async/no-wall-clock rendering-path constraint.
 *
 * @see plans/si14-usymbol-measurement-sharing/decisions.md (ADR-2)
 */
export function renderDrawableToFragment(drawable: UDrawable, opts: RenderDrawableToFragmentOptions): DrawableFragment {
  const seed = seedOf(opts.uid);
  const option = basicSvgOption({ minDim: { width: opts.width, height: opts.height } });
  const stringBounder = driverBounderFor(opts.measurer);
  const ug = UGraphicSvg.build(seed, option, VERSION_PLACEHOLDER, stringBounder, opts.measurer);

  drawable.drawU(ug);

  const svg = ug.getSvgString();
  const { width, height } = extractViewBoxDims(svg);
  const { body, extraDefs } = extractFlatContent(svg);
  return extraDefs.length > 0 ? { body, extraDefs, width, height } : { body, width, height };
}

/**
 * Splits a concatenated `<defs>` payload (as produced by
 * {@link extractFlatContent}'s `extraDefs`) into its top-level sibling
 * elements (`<linearGradient>...</linearGradient>`, `<filter>...
 * </filter>`, ...), using open/close-tag depth tracking rather than a
 * full XML parser -- scoped exactly to the shape `SvgGraphicsCore`'s own
 * `XmlWriter` is known to emit (real `"`-quoted attributes, no literal
 * `>` inside an attribute value -- the SAME producer-shape assumption
 * {@link extractViewBoxDims}'s doc comment already documents for this
 * module), never a general-purpose XML fragment.
 */
function splitTopLevelElements(xml: string): string[] {
  const tagPattern = /<\/?[^>]+>/g;
  const elements: string[] = [];
  let depth = 0;
  let start = 0;
  let match: RegExpExecArray | null;
  while ((match = tagPattern.exec(xml)) !== null) {
    const tag = match[0];
    if (tag.startsWith('</')) depth--;
    else if (!tag.endsWith('/>')) depth++;
    if (depth === 0) {
      elements.push(xml.slice(start, tagPattern.lastIndex));
      start = tagPattern.lastIndex;
    }
  }
  return elements;
}

/** First `id="..."` attribute value on a top-level defs element, or
 *  `undefined` if it carries none (e.g. a `<style>` block). */
function extractIdAttribute(element: string): string | undefined {
  return /\bid="([^"]*)"/.exec(element)?.[1];
}

/**
 * Merges the `extraDefs` of N {@link DrawableFragment}s (or any object
 * carrying an optional `extraDefs` string) into one `<defs>` payload with
 * each distinct def appearing exactly once -- the counterpart to
 * {@link renderDrawableToFragment} a caller drawing N nodes needs: every
 * node's own per-fragment `UGraphicSvg` document independently de-dups
 * REPEATED defs within itself (`SvgGraphicsCore#createSvgGradient`'s own
 * `gradients` cache), but has no way to know about a SIBLING fragment's
 * defs -- this function is that missing cross-fragment de-dup step.
 *
 * De-dup key is the def's own `id` attribute when present (the common
 * case -- every `<linearGradient>`/`<filter>` def `SvgGraphicsCore` emits
 * carries one); a def with no `id` (there are none today, but nothing
 * upstream guarantees this stays true) falls back to its full markup, so
 * two textually-identical id-less defs still collapse to one and two
 * different id-less defs both survive.
 *
 * Returns `undefined` (not `''`) when no fragment carries any defs,
 * matching {@link renderDrawableToFragment}'s own `extraDefs`-omission
 * convention (T1 interface contract).
 */
export function mergeFragmentDefs(fragments: readonly { readonly extraDefs?: string }[]): string | undefined {
  const merged = new Map<string, string>();
  for (const fragment of fragments) {
    const defs = fragment.extraDefs;
    if (defs === undefined || defs.length === 0) continue;
    for (const element of splitTopLevelElements(defs)) {
      const key = extractIdAttribute(element) ?? element;
      if (!merged.has(key)) merged.set(key, element);
    }
  }
  return merged.size > 0 ? [...merged.values()].join('') : undefined;
}
