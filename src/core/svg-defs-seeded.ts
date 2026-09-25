/**
 * svg-defs-seeded.ts — the seeded def-id pass over an assembled document.
 * Split out of `svg-defs.ts` (line cap, cdd3-T27); `svg-defs.ts` keeps the
 * def scanning primitives this pass reads.
 *
 * @see ~/git/plantuml/.../klimt/drawing/svg/SvgGraphics.java:160-162,285-287,393,766,1076
 */

import { getSeed } from './klimt/drawing/svg/svg-seed.js';
import { ANY_ID_RE, DQUOTE, INLINE_DEF_OPENS, idOfElement, nextDef } from './svg-defs.js';

// ---------------------------------------------------------------------------
// Seeded def ids -- SvgGraphics.java:120-122,160-162,285-287,365-394,763-767
// ---------------------------------------------------------------------------

/**
 * Upstream mints every def id from the DIAGRAM's seed plus a per-kind,
 * per-document, first-use-order counter:
 *
 * ```java
 * this.filterUid  = "b" + getSeed(seed);   // :160
 * this.shadowId   = "f" + getSeed(seed);   // :161
 * this.gradientId = "g" + getSeed(seed);   // :162
 * private static String getSeed(long seed) {          // :285-287
 *   return Long.toString(Math.abs(seed), 36);
 * }
 * id = gradientId + gradients.size();                 // :393 and :431
 * result = filterUid + filterBackColor.size();        // :766
 * filter.setAttribute("id", shadowId);                // :1076 -- NO index
 * ```
 *
 * Three facts that decide the rule below, each read off those lines:
 * 1. gradients and back-colour filters have SEPARATE counters (two maps,
 *    `gradients` :365 and `filterBackColor` :761), so a document's first
 *    gradient is `g<uid>0` even when a filter was created before it.
 * 2. BOTH `createSvgGradient` overloads share the ONE `gradients` map
 *    (:393, :431), so the counter spans the plain and `HColorLinearGradient`
 *    forms.
 * 3. the drop shadow has NO index at all — one per document (`withShadow`
 *    is a boolean, :1074-1086).
 *
 * The index is assignment order, which for upstream is creation order, which
 * is also `defs` child order (every branch does `defs.appendChild(elt)` right
 * after minting the id). So renumbering this port's already-assembled
 * `<defs>` in child order reproduces it exactly, without any emitter needing
 * to know the seed.
 */
const SEEDED_KIND_PREFIX = { gradient: 'g', backColor: 'b', shadow: 'f' } as const;

/** `SvgGraphics#getSeed(long)` (java:285-287) -- `Math.abs` in base 36.
 *  Re-exported from the klimt seed module rather than re-derived. */
export { getSeed } from './klimt/drawing/svg/svg-seed.js';

/** Which upstream counter a `<defs>` child belongs to, or `undefined` for a
 *  def upstream does not seed (an arrow `<marker>`, a hover style). */
function seededKind(element: string): keyof typeof SEEDED_KIND_PREFIX | undefined {
  if (element.startsWith('<linearGradient')) return 'gradient';
  if (!element.startsWith('<filter')) return undefined;
  // `feFlood` is `getFilterBackColor`'s own first child (java:784); the
  // shadow filter's is `feGaussianBlur` (java:1081). Nothing else in
  // `SvgGraphics` creates a filter.
  if (element.includes('<feFlood')) return 'backColor';
  return element.includes('<feGaussianBlur') ? 'shadow' : undefined;
}

/** The id upstream would mint for the `n`-th def of `kind`. */
function seededId(kind: keyof typeof SEEDED_KIND_PREFIX, uid: string, index: number): string {
  // The shadow filter carries no index (java:1076).
  return kind === 'shadow' ? SEEDED_KIND_PREFIX[kind] + uid : SEEDED_KIND_PREFIX[kind] + uid + String(index);
}

/**
 * The old -> new id map upstream's counters would produce for an assembled
 * `<defs>` payload. Separated from the rewrite so the numbering rule is
 * testable on its own.
 *
 * Scanned once per KIND, which is exactly what the per-kind counters need:
 * each kind's own relative order in `<defs>` is its creation order, and
 * upstream's two counters never interleave (`gradients` and
 * `filterBackColor` are separate maps, java:365,761).
 */
export function seededDefIdRenames(defs: string, uid: string): Map<string, string> {
  const renames = new Map<string, string>();
  const counters = { gradient: 0, backColor: 0, shadow: 0 };
  for (const [open, close] of INLINE_DEF_OPENS) {
    let cursor = 0;
    for (let span = nextDef(defs, cursor, open, close, ANY_ID_RE); span !== undefined;) {
      cursor = span.end;
      const element = defs.substring(span.at, span.end);
      const kind = seededKind(element);
      const id = idOfElement(element);
      if (kind !== undefined && id !== undefined) {
        renames.set(id, seededId(kind, uid, counters[kind]));
        counters[kind] += 1;
      }
      span = nextDef(defs, cursor, open, close, ANY_ID_RE);
    }
  }
  return renames;
}

/**
 * Rewrites every seeded def id in a FINISHED SVG document to the id upstream
 * would have minted for this diagram's seed, references included.
 *
 * Applied once, at the single central assembly point (`assemble-svg.ts
 * #assembleSvg`), rather than inside each emitter: the id is a property of
 * the DOCUMENT (one `SvgGraphics`, one seed, one counter per kind), and no
 * emitter in this port -- the class string renderer, the chrome klimt
 * fragments, `paint.ts#paintToSvg` -- can see the document it will end up
 * in. Every emitter therefore keeps minting its own content-derived id and
 * this pass renames them, which also makes the pass a no-op-by-construction
 * for a document whose ids are ALREADY jar-shaped (the description engine
 * seeds its own klimt document, `diagrams/description/index.ts:69`: same uid,
 * same order, same result).
 *
 * `seed` is the diagram's `UmlSource#seed()` (`UmlSource.java:222-234`),
 * computed by `klimt/drawing/svg/svg-seed.ts#seedOf`.
 */
export function applySeededDefIds(document: string, seed: bigint): string {
  const defsStart = document.indexOf('<defs');
  if (defsStart === -1) return document;
  const defsEnd = document.indexOf('</defs>', defsStart);
  if (defsEnd === -1) return document;
  const renames = seededDefIdRenames(document.substring(defsStart, defsEnd), getSeed(seed));
  if (renames.size === 0) return document;
  return document.replace(SEEDED_REF_RE, (match, idAttr: string | undefined, urlRef: string | undefined) => {
    const old = idAttr ?? urlRef;
    const next = old === undefined ? undefined : renames.get(old);
    if (next === undefined) return match;
    // Concatenated, not a template literal whose text ends in `id="` before
    // an interpolation (D5's ESLint selector shape) -- `paint.ts#paintToSvg`
    // does the same for the same reason. Nothing to escape: `next` is
    // `getSeed`'s base-36 digits plus a decimal index, by construction.
    return idAttr === undefined ? 'url(#' + next + ')' : 'id=' + DQUOTE + next + DQUOTE;
  });
}

/** One pass over both spellings a def id appears in: its own `id="…"` and
 *  every `url(#…)` reference. Single pass so a renamed id can never be
 *  renamed a second time by a later entry of the map. The reference body
 *  also stops at `(` -- no minted id contains one, and diagram text reaches
 *  this document verbatim, so `[^)]*` rescanned an unterminated `url(#(`
 *  run from every start (CodeQL js/polynomial-redos, quadratic). */
const SEEDED_REF_RE = /id="([^"]*)"|url\(#([^()]*)\)/g;
